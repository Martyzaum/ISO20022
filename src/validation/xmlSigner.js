import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { SignedXml } from "xml-crypto";
import { X509Certificate } from "node:crypto";

const XMLDSIG_NS = "http://www.w3.org/2000/09/xmldsig#";
const C14N_ALG = "http://www.w3.org/2001/10/xml-exc-c14n#";
const SIG_ALG = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
const DIG_ALG = "http://www.w3.org/2001/04/xmlenc#sha256";
const ENV_TRANSFORM = "http://www.w3.org/2000/09/xmldsig#enveloped-signature";

export function signXml(xml, { privateKeyPEM, certificatePEM, keyInfoId = "key-info-id" }) {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  
  // Find AppHdr and Document elements
  const appHdr = doc.getElementsByTagName("AppHdr")[0] || doc.getElementsByTagNameNS("*", "AppHdr")[0];
  if (!appHdr) {
    throw new Error("AppHdr element not found");
  }
  
  const document = doc.getElementsByTagName("Document")[0] || doc.getElementsByTagNameNS("*", "Document")[0];
  if (!document) {
    throw new Error("Document element not found");
  }
  
  // Add required IDs to elements
  appHdr.setAttribute("Id", "_0");
  document.setAttribute("Id", "document-id");
  
  // Find or create Sgntr element
  let sgntr = appHdr.getElementsByTagName("Sgntr")[0] || appHdr.getElementsByTagNameNS("*", "Sgntr")[0];
  if (sgntr) {
    // Clear existing Sgntr content
    while (sgntr.firstChild) {
      sgntr.removeChild(sgntr.firstChild);
    }
  } else {
    sgntr = doc.createElement("Sgntr");
    appHdr.appendChild(sgntr);
  }
  
  // Extract certificate info
  const certBase64 = certificatePEM
    .replaceAll("-----BEGIN CERTIFICATE-----", "")
    .replaceAll("-----END CERTIFICATE-----", "")
    .replaceAll(/\s/g, "");
  
  let issuerDN = "";
  let serialNumber = "";
  try {
    const cert = new X509Certificate(certificatePEM);
    issuerDN = cert.issuer;
    serialNumber = cert.serialNumber;
  } catch (e) {
    throw new Error(`Failed to parse certificate: ${e.message}`);
  }
  
  // Use xml-crypto to compute signature
  const signer = new SignedXml();
  signer.privateKey = privateKeyPEM;
  signer.canonicalizationAlgorithm = C14N_ALG;
  signer.signatureAlgorithm = SIG_ALG;
  
  // Set keyInfoAttributes to include Id
  signer.keyInfoAttributes = { Id: keyInfoId };
  
  // Override getKeyInfoContent to return our custom KeyInfo with X509IssuerSerial
  signer.getKeyInfoContent = function() {
    return `<X509Data>
      <X509Certificate>${certBase64}</X509Certificate>
      <X509IssuerSerial>
        <X509IssuerName>${issuerDN}</X509IssuerName>
        <X509SerialNumber>${serialNumber}</X509SerialNumber>
      </X509IssuerSerial>
    </X509Data>`;
  };
  
  // Create temporary KeyInfo element for reference
  const tempKeyInfo = doc.createElementNS(XMLDSIG_NS, "ds:KeyInfo");
  tempKeyInfo.setAttribute("Id", keyInfoId);
  const tempX509Data = doc.createElementNS(XMLDSIG_NS, "ds:X509Data");
  const tempCert = doc.createElementNS(XMLDSIG_NS, "ds:X509Certificate");
  tempCert.textContent = certBase64;
  tempX509Data.appendChild(tempCert);
  const tempIssuerSerial = doc.createElementNS(XMLDSIG_NS, "ds:X509IssuerSerial");
  const tempIssuerName = doc.createElementNS(XMLDSIG_NS, "ds:X509IssuerName");
  tempIssuerName.textContent = issuerDN;
  tempIssuerSerial.appendChild(tempIssuerName);
  const tempSerialNumber = doc.createElementNS(XMLDSIG_NS, "ds:X509SerialNumber");
  tempSerialNumber.textContent = serialNumber;
  tempIssuerSerial.appendChild(tempSerialNumber);
  tempX509Data.appendChild(tempIssuerSerial);
  tempKeyInfo.appendChild(tempX509Data);
  sgntr.appendChild(tempKeyInfo);
  
  // Re-serialize with temp KeyInfo
  const xmlWithKeyInfo = new XMLSerializer().serializeToString(doc);
  
  // Add 3 references as required by SPI
  // Reference 1: KeyInfo
  signer.addReference({
    xpath: `//*[@Id="${keyInfoId}"]`,
    transforms: [C14N_ALG],
    digestAlgorithm: DIG_ALG
  });
  
  // Reference 2: AppHdr (with enveloped-signature + C14N)
  signer.addReference({
    xpath: "//*[@Id='_0']",
    transforms: [ENV_TRANSFORM, C14N_ALG],
    digestAlgorithm: DIG_ALG
  });
  
  // Reference 3: Document (with C14N)
  signer.addReference({
    xpath: "//*[@Id='document-id']",
    transforms: [C14N_ALG],
    digestAlgorithm: DIG_ALG
  });
  
  // Compute signature
  signer.computeSignature(xmlWithKeyInfo);
  
  // Get the complete signature XML
  const signatureXml = signer.getSignedXml();
  
  // Remove temp KeyInfo
  sgntr.removeChild(tempKeyInfo);
  
  // Parse and insert the complete signature
  const signatureDoc = new DOMParser().parseFromString(signatureXml, "text/xml");
  const signatureNode = signatureDoc.getElementsByTagNameNS(XMLDSIG_NS, "Signature")[0];
  
  if (!signatureNode) {
    throw new Error("Failed to generate signature - Signature node not found");
  }
  
  // Import and insert the complete signature
  const importedSignature = doc.importNode(signatureNode, true);
  sgntr.appendChild(importedSignature);
  
  // Return the signed XML
  return new XMLSerializer().serializeToString(doc);
}
