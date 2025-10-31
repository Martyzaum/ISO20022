import { preprocessXml } from "./xmlPreprocessor.js";
import { validate as validateXsd } from "./xsdValidator.js";
import { validate as validateSig } from "./xmldsigValidator.js";

const DEFAULT_OPTS = {
  xsd: true, 
  signature: true, 
  businessRules: true, 
  preprocess: true,
  resolveCertificateByIssuerSerial: undefined,
};

export async function validateAll(xml, opts = {}) {
  const options = { ...DEFAULT_OPTS, ...opts };
  const input = options.preprocess ? preprocessXml(xml) : xml;

  const result = { 
    valid: true, 
    xsd: null, 
    signature: null, 
    businessRules: null, 
    detected: null 
  };

  if (options.xsd) {
    const xsdRes = validateXsd(input);
    result.xsd = xsdRes;
    result.detected = xsdRes.detected;
    result.valid &&= xsdRes.ok;
  }

  if (options.signature) {
    const sigRes = await validateSig(input, { 
      resolveCertificateByIssuerSerial: options.resolveCertificateByIssuerSerial 
    });
    result.signature = sigRes;
    result.valid &&= sigRes.ok;
  }

  if (options.businessRules) {
    const businessErrors = [];
    
    result.businessRules = {
      ok: businessErrors.length === 0,
      errors: businessErrors
    };
    result.valid &&= result.businessRules.ok;
  }

  return result;
}

export { preprocessXml } from "./xmlPreprocessor.js";
export { validate as validateXsd, detect } from "./xsdValidator.js";
export { validate as validateSignature } from "./xmldsigValidator.js";

