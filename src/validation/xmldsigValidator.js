import { DOMParser } from "@xmldom/xmldom";
import { SignedXml } from "xml-crypto";

const EXPECT = {
  C14N: "http://www.w3.org/2001/10/xml-exc-c14n#",
  SIG: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
  DIG: "http://www.w3.org/2001/04/xmlenc#sha256",
  ENV: "http://www.w3.org/2000/09/xmldsig#enveloped-signature"
};

const XMLDSIG_NS = "http://www.w3.org/2000/09/xmldsig#";

function findSignatureNode(doc) {
  const sig = doc.getElementsByTagNameNS(XMLDSIG_NS, "Signature");
  if (!sig?.length) return null;

  const node = sig[0];
  let p = node.parentNode;
  let okPath = false;
  while (p) {
    const ln = p.localName || p.nodeName;
    if (ln === "Sgntr") okPath = true;
    if (ln === "AppHdr") break;
    p = p.parentNode;
  }
  return okPath ? node : null;
}

function parseIssuerSerial(doc) {
  const xi = doc.getElementsByTagNameNS(XMLDSIG_NS, "X509IssuerSerial")[0];
  if (!xi) return { present: false };
  const issuer = xi.getElementsByTagNameNS(XMLDSIG_NS, "X509IssuerName")[0]?.textContent?.trim();
  const serial = xi.getElementsByTagNameNS(XMLDSIG_NS, "X509SerialNumber")[0]?.textContent?.trim();
  return { present: true, issuerDN: issuer, serialNumber: serial };
}

function getAlgorithm(sigNode, qname) {
  return sigNode.getElementsByTagNameNS(XMLDSIG_NS, qname)[0]?.getAttribute("Algorithm");
}

function validateAlgorithms(sigNode, errors) {
  const canonicalization = getAlgorithm(sigNode, "CanonicalizationMethod");
  const signature = getAlgorithm(sigNode, "SignatureMethod");

  if (canonicalization !== EXPECT.C14N) {
    errors.push({ message: "CanonicalizationMethod inválido", expected: EXPECT.C14N, found: canonicalization });
  }
  if (signature !== EXPECT.SIG) {
    errors.push({ message: "SignatureMethod inválido", expected: EXPECT.SIG, found: signature });
  }

  return { canonicalization, signature };
}

function transformsOf(ref) {
  return Array.from(ref.getElementsByTagNameNS(XMLDSIG_NS, "Transform"))
    .map(t => t.getAttribute("Algorithm"));
}

function processReference(ref, details, errors) {
  const uri = ref.getAttribute("URI") || "";
  const tr = transformsOf(ref);
  const hasEnv = tr.includes(EXPECT.ENV);
  const hasC14N = tr.includes(EXPECT.C14N);
  const dig = ref.getElementsByTagNameNS(XMLDSIG_NS, "DigestMethod")[0]?.getAttribute("Algorithm");

  if (!hasC14N) {
    errors.push({ message: "Falta Exclusive C14N em uma <Reference>", expected: EXPECT.C14N });
  }
  if (dig !== EXPECT.DIG) {
    errors.push({ message: "DigestMethod inválido", expected: EXPECT.DIG, found: dig });
  }

  const isValid = hasC14N && dig === EXPECT.DIG;

  if (uri.startsWith("#")) {
    details.references.keyInfo = { present: true, id: uri.slice(1), transforms: tr, valid: isValid };
  } else if (hasEnv) {
    details.references.appHdr = { present: true, transforms: tr, valid: isValid };
  } else {
    details.references.document = { present: true, transforms: tr, valid: isValid };
  }
}

function validateReferences(sigNode, details, errors) {
  const refs = sigNode.getElementsByTagNameNS(XMLDSIG_NS, "Reference");
  const refsArray = Array.from(refs || []);

  if (refsArray.length === 3) {
    for (const ref of refsArray) {
      processReference(ref, details, errors);
    }
  } else {
    errors.push({ message: "SPI exige 3 referências (KeyInfo, AppHdr, Document)", expected: 3, found: refsArray.length });
  }
}

async function verifyCertificateSignature(sigNode, xml, certPem, errors) {
  try {
    const verifier = new SignedXml();
    verifier.loadSignature(sigNode);
    const okSig = verifier.checkSignature(xml, certPem);
    if (!okSig) {
      errors.push({ message: "Assinatura inválida", found: verifier.validationErrors?.join("; ") || "Verificação criptográfica falhou" });
    }
  } catch (e) {
    errors.push({ message: `Erro ao verificar assinatura: ${e.message}` });
  }
}

async function validateCertificateKeyInfo(keyInfo, sigNode, xml, resolveCertificateByIssuerSerial, errors) {
  if (!keyInfo.present) {
    errors.push({ message: "KeyInfo sem X509IssuerSerial (requerido pelo SPI)." });
    return;
  }

  if (typeof resolveCertificateByIssuerSerial !== "function") {
    return;
  }

  try {
    const certPem = await resolveCertificateByIssuerSerial(keyInfo.issuerDN, keyInfo.serialNumber);
    if (certPem) {
      await verifyCertificateSignature(sigNode, xml, certPem, errors);
    } else {
      errors.push({ message: "Não foi possível resolver certificado pelo Issuer/Serial do KeyInfo." });
    }
  } catch (e) {
    errors.push({ message: `Erro ao verificar assinatura: ${e.message}` });
  }
}

export async function validate(xml, { resolveCertificateByIssuerSerial } = {}) {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const sigNode = findSignatureNode(doc);
  const details = {
    signaturePresent: !!sigNode,
    signatureCount: doc.getElementsByTagNameNS(XMLDSIG_NS, "Signature")?.length || 0,
    location: "AppHdr.Sgntr",
    algorithms: {},
    references: { keyInfo: {}, appHdr: {}, document: {} },
    keyInfo: { x509IssuerSerial: parseIssuerSerial(doc) }
  };
  const errors = [];

  if (!sigNode) {
    return { ok: false, errors: [{ message: "Assinatura não encontrada em <AppHdr><Sgntr>." }], details };
  }

  details.algorithms = validateAlgorithms(sigNode, errors);
  validateReferences(sigNode, details, errors);
  await validateCertificateKeyInfo(details.keyInfo.x509IssuerSerial, sigNode, xml, resolveCertificateByIssuerSerial, errors);

  return { ok: errors.length === 0, errors, details };
}

