// Validação XSD manual usando @xmldom/xmldom para parsing e validação baseada em XSD
import { DOMParser } from "@xmldom/xmldom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMA_DIR = path.resolve(__dirname, "../../docs");

const parsedSchemaCache = new Map();

export function detect(xml) {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const envelopeNs = doc?.documentElement?.namespaceURI || "";
  const nsRegex = /pi\/([a-z]+\.\d{3})\/([\d.]+)/i;
  const nsMatch = nsRegex.exec(envelopeNs);
  const message = nsMatch?.[1] ?? null;
  const spiVersionFromNs = nsMatch?.[2] ?? null;

  const msgDefIdrNode = doc.getElementsByTagName("MsgDefIdr")[0]
    || doc.getElementsByTagNameNS("*", "MsgDefIdr")[0];

  const msgDefIdr = msgDefIdrNode?.textContent?.trim() || null;
  const spiVersionFromHdr = msgDefIdr?.split(".spi.")[1] || null;

  const spiVersion = spiVersionFromHdr || spiVersionFromNs;

  let xsdFile = null;
  if (message && spiVersion) {
    const messageDir = message.replaceAll(".", "");
    const fileName = `${message}.spi.${spiVersion}.xsd`;
    const expectedPath = path.join(SCHEMA_DIR, messageDir, fileName);
    if (fs.existsSync(expectedPath)) {
      xsdFile = path.relative(process.cwd(), expectedPath);
    }
  }

  return {
    message, 
    spiVersion, 
    namespace: envelopeNs,
    msgDefIdr,
    isoType: null,
    xsdFile
  };
}

function parseSimpleType(st, xs) {
  const name = st.getAttribute("name");
  if (!name) return null;

  const restriction = st.getElementsByTagNameNS(xs, "restriction")[0];
  if (!restriction) return null;

  const rules = {
    base: restriction.getAttribute("base") || "xs:string",
    pattern: null,
    maxLength: null,
    minLength: null,
    enumeration: []
  };

  const pattern = restriction.getElementsByTagNameNS(xs, "pattern")[0];
  if (pattern) {
    rules.pattern = pattern.getAttribute("value");
  }

  const maxLength = restriction.getElementsByTagNameNS(xs, "maxLength")[0];
  if (maxLength) {
    rules.maxLength = Number.parseInt(maxLength.getAttribute("value"), 10);
  }

  const minLength = restriction.getElementsByTagNameNS(xs, "minLength")[0];
  if (minLength) {
    rules.minLength = Number.parseInt(minLength.getAttribute("value"), 10);
  }

  const enums = restriction.getElementsByTagNameNS(xs, "enumeration");
  for (const enumEl of Array.from(enums)) {
    const enumValue = enumEl.getAttribute("value");
    if (enumValue) {
      rules.enumeration.push(enumValue);
    }
  }

  return { name, rules };
}

function parseComplexType(ct, xs) {
  const name = ct.getAttribute("name");
  if (!name) return null;

  const sequence = ct.getElementsByTagNameNS(xs, "sequence")[0];
  if (!sequence) return null;

  const elements = [];
  const seqElements = sequence.getElementsByTagNameNS(xs, "element");
  for (const el of Array.from(seqElements)) {
    const elName = el.getAttribute("name");
    const ref = el.getAttribute("ref");
    
    const elementName = ref || elName;
    if (!elementName) continue;
    
    elements.push({
      name: elementName,
      type: el.getAttribute("type"),
      minOccurs: el.getAttribute("minOccurs") || "1",
      maxOccurs: el.getAttribute("maxOccurs") || "1"
    });
  }

  return { name, elements };
}

function parseRootElements(doc, xs, schema) {
  const rootElements = doc.getElementsByTagNameNS(xs, "element");
  for (const el of Array.from(rootElements)) {
    const name = el.getAttribute("name");
    const type = el.getAttribute("type");
    
    if (name) {
      schema.elements.set(name, { 
        type: type || (el.getElementsByTagNameNS(xs, "complexType")[0] ? "complex" : null)
      });
    }
  }
}

function parseXsdSchema(xsdContent) {
  const doc = new DOMParser().parseFromString(xsdContent, "text/xml");
  const schema = {
    simpleTypes: new Map(),
    complexTypes: new Map(),
    elements: new Map(),
    targetNamespace: doc.documentElement.getAttribute("targetNamespace") || ""
  };

  const xs = "http://www.w3.org/2001/XMLSchema";

  const simpleTypes = doc.getElementsByTagNameNS(xs, "simpleType");
  for (const st of Array.from(simpleTypes)) {
    const parsed = parseSimpleType(st, xs);
    if (parsed) {
      schema.simpleTypes.set(parsed.name, parsed.rules);
    }
  }

  const complexTypes = doc.getElementsByTagNameNS(xs, "complexType");
  for (const ct of Array.from(complexTypes)) {
    const parsed = parseComplexType(ct, xs);
    if (parsed) {
      schema.complexTypes.set(parsed.name, { elements: parsed.elements });
    }
  }

  parseRootElements(doc, xs, schema);

  return schema;
}

function validateSimpleType(value, typeName, schema, errors, context) {
  if (!value && value !== "") return true;

  const type = schema.simpleTypes.get(typeName);
  if (!type) {
    return true;
  }

  if (type.minLength !== null && value.length < type.minLength) {
    errors.push({
      message: `Valor muito curto para tipo ${typeName}. Mínimo: ${type.minLength} caracteres`,
      line: context.line,
      column: context.column,
      xpath: context.xpath
    });
    return false;
  }

  if (type.maxLength !== null && value.length > type.maxLength) {
    errors.push({
      message: `Valor muito longo para tipo ${typeName}. Máximo: ${type.maxLength} caracteres, encontrado: ${value.length}`,
      line: context.line,
      column: context.column,
      xpath: context.xpath
    });
    return false;
  }

  if (type.pattern) {
    const regex = new RegExp(`^${type.pattern}$`);
    if (!regex.test(value)) {
      errors.push({
        message: `Valor não corresponde ao padrão esperado para tipo ${typeName}. Padrão: ${type.pattern}`,
        line: context.line,
        column: context.column,
        xpath: context.xpath
      });
      return false;
    }
  }

  if (type.enumeration.length > 0 && !type.enumeration.includes(value)) {
    errors.push({
      message: `Valor "${value}" não está na lista de valores permitidos para tipo ${typeName}. Valores permitidos: ${type.enumeration.join(", ")}`,
      line: context.line,
      column: context.column,
      xpath: context.xpath
    });
    return false;
  }

  return true;
}

function collectChildElements(element) {
  const children = {};
  const childNodes = element.childNodes || [];
  for (const child of Array.from(childNodes)) {
    if (child.nodeType === 1) {
      const localName = child.localName || child.nodeName;
      if (!children[localName]) {
        children[localName] = [];
      }
      children[localName].push(child);
    }
  }
  return children;
}

function collectChildElementsInOrder(element) {
  const orderedChildren = [];
  const childNodes = element.childNodes || [];
  for (const child of Array.from(childNodes)) {
    if (child.nodeType === 1) {
      const localName = child.localName || child.nodeName;
      orderedChildren.push({ name: localName, element: child });
    }
  }
  return orderedChildren;
}

function validateElementOrder(orderedChildren, expectedElements, ctx, errors) {
  const xmlDsigElements = new Set(["KeyInfo", "Signature", "SignedInfo", "CanonicalizationMethod", 
                           "SignatureMethod", "Reference", "Transforms", "Transform",
                           "DigestMethod", "DigestValue", "SignatureValue", "X509Data",
                           "X509Certificate", "X509IssuerSerial", "X509IssuerName",
                           "X509SerialNumber"]);
  
  // Filtra elementos XMLDSig da lista ordenada
  const nonDsigChildren = orderedChildren.filter(child => {
    const namespaceURI = child.element?.namespaceURI || "";
    return !(namespaceURI === "http://www.w3.org/2000/09/xmldsig#" || 
             xmlDsigElements.has(child.name));
  });

  // Cria um mapa de posição esperada para cada elemento
  const expectedPositions = new Map();
  for (const [idx, el] of expectedElements.entries()) {
    if (!expectedPositions.has(el.name)) {
      expectedPositions.set(el.name, idx);
    }
  }

  // Verifica a ordem relativa dos elementos encontrados
  for (let i = 0; i < nonDsigChildren.length; i++) {
    const currentName = nonDsigChildren[i].name;
    const currentPos = expectedPositions.get(currentName);
    
    if (currentPos === undefined) {
      // Elemento inesperado - será capturado por checkUnexpectedElements
      continue;
    }

    // Verifica se algum elemento que deveria aparecer depois já apareceu antes
    for (let j = i + 1; j < nonDsigChildren.length; j++) {
      const nextName = nonDsigChildren[j].name;
      const nextPos = expectedPositions.get(nextName);
      
      if (nextPos !== undefined && nextPos < currentPos) {
        // Elemento fora de ordem encontrado!
        // nextName deveria aparecer antes de currentName, mas aparece depois
        // Encontra qual elemento deveria aparecer logo antes de nextName na ordem esperada
        let shouldBeAfterStr = "";
        if (nextPos > 0) {
          // Elemento que deveria aparecer logo antes de nextName
          const shouldBeAfter = expectedElements[nextPos - 1].name;
          shouldBeAfterStr = shouldBeAfter;
        } else {
          shouldBeAfterStr = "o início";
        }
        errors.push({
          message: `Elemento "${nextName}" aparece fora de ordem. Deveria aparecer após "${shouldBeAfterStr}"`,
          line: nonDsigChildren[j].element.lineNumber || ctx.line,
          column: nonDsigChildren[j].element.columnNumber || ctx.column,
          xpath: `${ctx.xpath}/${nextName}`
        });
        return false;
      }
    }
  }

  return true;
}

function validateElementOccurrences(expectedEl, found, ctx, errors) {
  const minOccurs = Number.parseInt(expectedEl.minOccurs, 10);
  const maxOccurs = expectedEl.maxOccurs === "unbounded" ? Infinity : Number.parseInt(expectedEl.maxOccurs, 10);

  if (found.length < minOccurs) {
    errors.push({
      message: `Elemento obrigatório "${expectedEl.name}" não encontrado ou insuficiente (esperado: ${minOccurs}, encontrado: ${found.length})`,
      line: ctx.line,
      column: ctx.column,
      xpath: `${ctx.xpath}/${expectedEl.name}`
    });
    return false;
  }

  if (found.length > maxOccurs) {
    errors.push({
      message: `Elemento "${expectedEl.name}" aparece mais vezes que o permitido (máximo: ${maxOccurs}, encontrado: ${found.length})`,
      line: found[maxOccurs].lineNumber || ctx.line,
      column: found[maxOccurs].columnNumber || ctx.column,
      xpath: `${ctx.xpath}/${expectedEl.name}`
    });
    return false;
  }

  return true;
}

function validateElementTypes(expectedEl, found, schema, errors, ctx) {
  for (const el of found) {
    const textContent = el.textContent?.trim() || "";
    const newContext = {
      xpath: `${ctx.xpath}/${expectedEl.name}`,
      line: el.lineNumber || ctx.line,
      column: el.columnNumber || ctx.column
    };

    if (expectedEl.type && !expectedEl.type.startsWith("xs:")) {
      const elTypeName = expectedEl.type.split(":").pop();
      const complexType = schema.complexTypes.get(elTypeName);
      
      if (complexType) {
        validateComplexType(el, elTypeName, schema, errors, newContext);
      } else {
        validateSimpleType(textContent, elTypeName, schema, errors, newContext);
      }
    }
  }
}

function checkUnexpectedElements(children, type, ctx, errors) {
  const xmlDsigElements = new Set(["KeyInfo", "Signature", "SignedInfo", "CanonicalizationMethod", 
                           "SignatureMethod", "Reference", "Transforms", "Transform",
                           "DigestMethod", "DigestValue", "SignatureValue", "X509Data",
                           "X509Certificate", "X509IssuerSerial", "X509IssuerName",
                           "X509SerialNumber"]);

  for (const foundName of Object.keys(children)) {
    const expected = type.elements.find(el => el.name === foundName);
    if (!expected) {
      const firstChild = children[foundName][0];
      const namespaceURI = firstChild?.namespaceURI || "";
      
      if (namespaceURI === "http://www.w3.org/2000/09/xmldsig#" || 
          xmlDsigElements.has(foundName)) {
        continue;
      }
      
      errors.push({
        message: `Elemento inesperado "${foundName}" encontrado. Elementos permitidos: ${type.elements.map(e => e.name).join(", ")}`,
        line: children[foundName][0].lineNumber || ctx.line,
        column: children[foundName][0].columnNumber || ctx.column,
        xpath: `${ctx.xpath}/${foundName}`
      });
    }
  }
}

function validateComplexType(element, typeName, schema, errors, context) {
  const ctx = context || { xpath: "", line: null, column: null };
  const type = schema.complexTypes.get(typeName);
  if (!type) {
    return true;
  }

  const children = collectChildElements(element);
  const orderedChildren = collectChildElementsInOrder(element);

  // Valida ordem dos elementos primeiro
  validateElementOrder(orderedChildren, type.elements, ctx, errors);

  for (const expectedEl of type.elements) {
    const found = children[expectedEl.name] || [];
    
    if (!validateElementOccurrences(expectedEl, found, ctx, errors)) {
      continue;
    }

    validateElementTypes(expectedEl, found, schema, errors, ctx);
  }

  checkUnexpectedElements(children, type, ctx, errors);

  return errors.length === 0;
}

function validateAgainstSchema(xmlDoc, schema) {
  const errors = [];
  const targetNs = schema.targetNamespace;

  const envelope = xmlDoc.documentElement;
  if (!envelope || envelope?.localName !== "Envelope") {
    errors.push({
      message: "Elemento raiz deve ser 'Envelope'",
      line: null,
      column: null,
      xpath: "/"
    });
    return { ok: false, errors };
  }

  const envelopeNs = envelope?.namespaceURI || "";
  if (envelopeNs !== targetNs) {
    errors.push({
      message: `Namespace incorreto. Esperado: ${targetNs}, encontrado: ${envelopeNs}`,
      line: null,
      column: null,
      xpath: "/Envelope"
    });
  }

  const envelopeType = schema.complexTypes.get("SPIEnvelopeMessage");
  if (envelopeType) {
    validateComplexType(envelope, "SPIEnvelopeMessage", schema, errors, {
      xpath: "/Envelope",
      line: envelope.lineNumber || null,
      column: envelope.columnNumber || null
    });
  }

  return { ok: errors.length === 0, errors };
}

function loadXsdSchema(message, spiVersion) {
  const key = `${message}:${spiVersion}`;
  if (parsedSchemaCache.has(key)) {
    return parsedSchemaCache.get(key);
  }

  const messageDir = message.replaceAll(".", "");
  const fileName = `${message}.spi.${spiVersion}.xsd`;
  const filePath = path.join(SCHEMA_DIR, messageDir, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`XSD não encontrado: ${filePath}`);
  }

  const xsdContent = fs.readFileSync(filePath, "utf8");
  const schema = parseXsdSchema(xsdContent);
  parsedSchemaCache.set(key, schema);

  return schema;
}

export function validate(xml) {
  const detected = detect(xml);

  if (!detected.message || !detected.spiVersion) {
    return {
      ok: false,
      errors: [{
        message: "Não foi possível detectar mensagem/versão SPI",
        line: null,
        column: null,
        xpath: null
      }],
      detected
    };
  }

  try {
    const xmlDoc = new DOMParser().parseFromString(xml, "text/xml");
    
    const parseErrors = xmlDoc.getElementsByTagName("parsererror");
    if (parseErrors.length > 0) {
      return {
        ok: false,
        errors: [{
          message: "XML malformado",
          line: null,
          column: null,
          xpath: null
        }],
        detected
      };
    }

    const schema = loadXsdSchema(detected.message, detected.spiVersion);
    const result = validateAgainstSchema(xmlDoc, schema);

    return {
      ok: result.ok,
      errors: result.errors,
      detected: {
        ...detected,
        xsdFile: `docs/${detected.message.replaceAll(".", "")}/${detected.message}.spi.${detected.spiVersion}.xsd`
      }
    };
  } catch (error) {
    return {
      ok: false,
      errors: [{
        message: `Erro na validação: ${error.message}`,
        line: null,
        column: null,
        xpath: null
      }],
      detected
    };
  }
}
