import {
  isValidTransactionStatus,
  isValidStatusReasonCode
} from './types.js';
import {
  validateEndToEndId,
  validateOrgnlInstrId,
  validateISODate,
  validateUTCDateTime
} from './utils.js';
import { validateAll } from '../validation/validator.js';
import { parseCommonAppHdrFields } from '../validation/commonParsers.js';
import { validateCommonAppHdrFields as validateCommonFields } from '../validation/commonValidators.js';

function parseXMLFields(xml) {
  const fields = parseCommonAppHdrFields(xml);
  
  // Extract OrgnlInstrId
  const orgnlInstrIdMatch = xml.match(/<OrgnlInstrId>([^<]+)<\/OrgnlInstrId>/);
  fields.orgnlInstrId = orgnlInstrIdMatch ? orgnlInstrIdMatch[1] : null;
  
  // Extract OrgnlEndToEndId
  const orgnlEndToEndIdMatch = xml.match(/<OrgnlEndToEndId>([^<]+)<\/OrgnlEndToEndId>/);
  fields.orgnlEndToEndId = orgnlEndToEndIdMatch ? orgnlEndToEndIdMatch[1] : null;
  
  // Extract TxSts
  const txStsMatch = xml.match(/<TxSts>([^<]+)<\/TxSts>/);
  fields.txSts = txStsMatch ? txStsMatch[1] : null;
  
  // Extract Status Reason Code
  const stsRsnCdMatch = xml.match(/<StsRsnInf>[\s\S]*?<Cd>([^<]+)<\/Cd>/);
  fields.stsRsnCd = stsRsnCdMatch ? stsRsnCdMatch[1] : null;
  
  // Extract Settlement Date
  const fctvDtTmMatch = xml.match(/<FctvIntrBkSttlmDt>[\s\S]*?<DtTm>([^<]+)<\/DtTm>/);
  fields.fctvDtTm = fctvDtTmMatch ? fctvDtTmMatch[1] : null;
  
  // Extract Accounting Date
  const intrBkSttlmDtMatch = xml.match(/<IntrBkSttlmDt>([^<]+)<\/IntrBkSttlmDt>/);
  fields.intrBkSttlmDt = intrBkSttlmDtMatch ? intrBkSttlmDtMatch[1] : null;
  
  return fields;
}

function validateBusinessRules(fields) {
  const errors = validateCommonFields(fields, 'pacs.002.spi.1.14');
  
  // Validate OrgnlInstrId
  if (!fields.orgnlInstrId) {
    errors.push('Missing OrgnlInstrId');
  } else if (!validateOrgnlInstrId(fields.orgnlInstrId)) {
    errors.push(`Invalid OrgnlInstrId format: ${fields.orgnlInstrId}. Must follow pattern [E|D]xxxxxxxxyyyymmddhhmmkkkkkkkkkkk`);
  }
  
  // Validate OrgnlEndToEndId
  if (!fields.orgnlEndToEndId) {
    errors.push('Missing OrgnlEndToEndId');
  } else if (!validateEndToEndId(fields.orgnlEndToEndId)) {
    errors.push(`Invalid OrgnlEndToEndId format: ${fields.orgnlEndToEndId}. Must follow pattern Exxxxxxxxyyyymmddhhmmkkkkkkkkkkk`);
  }
  
  // Validate TxSts
  if (!fields.txSts) {
    errors.push('Missing TxSts');
  } else if (!isValidTransactionStatus(fields.txSts)) {
    errors.push(`Invalid TxSts: ${fields.txSts}. Must be one of: ACSP, ACCC, ACSC, RJCT`);
  }
  
  // Validate Status Reason Code (if present)
  if (fields.stsRsnCd && !isValidStatusReasonCode(fields.stsRsnCd)) {
    errors.push(`Invalid Status Reason Code: ${fields.stsRsnCd}. Must be a valid error code`);
  }
  
  // Validate that RJCT status has a reason code
  if (fields.txSts === 'RJCT' && !fields.stsRsnCd) {
    errors.push('RJCT status requires a Status Reason Code');
  }
  
  // Validate Settlement Date format (if present)
  if (fields.fctvDtTm && !validateUTCDateTime(fields.fctvDtTm)) {
    errors.push(`Invalid FctvIntrBkSttlmDt format: ${fields.fctvDtTm}. Must be in UTC format YYYY-MM-DDTHH:mm:ss.sssZ`);
  }
  
  // Validate Accounting Date format (if present)
  if (fields.intrBkSttlmDt && !validateISODate(fields.intrBkSttlmDt)) {
    errors.push(`Invalid IntrBkSttlmDt format: ${fields.intrBkSttlmDt}. Must be in ISO date format YYYY-MM-DD`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export async function validatePacs002(xml, options = {}) {
  const {
    xsd = true,
    signature = true,
    businessRules = true,
    preprocess = true,
    resolveCertificateByIssuerSerial = undefined
  } = options;

  const result = {
    valid: true,
    errors: [],
    xsd: null,
    signature: null,
    businessRules: null,
    detected: null
  };
  
  // Validação de regras de negócio (sempre executada se habilitada)
  if (businessRules) {
    const fields = parseXMLFields(xml);
    const businessValidation = validateBusinessRules(fields);
    if (!businessValidation.valid) {
      result.valid = false;
      result.errors.push(...businessValidation.errors.map(e => `Business Rule: ${e}`));
    }
    result.businessRules = businessValidation;
  }

  // Validação XSD e Assinatura usando módulo consolidado
  if (xsd || signature) {
    try {
      const validationResult = await validateAll(xml, {
        xsd,
        signature,
        businessRules: false, // já validamos acima
        preprocess,
        resolveCertificateByIssuerSerial
      });

      result.xsd = validationResult.xsd;
      result.signature = validationResult.signature;
      result.detected = validationResult.detected;

      if (result.xsd && !result.xsd.ok) {
        result.valid = false;
        result.errors.push(...result.xsd.errors.map(e => `XSD: ${e.message || e}`));
      }

      if (result.signature && !result.signature.ok) {
        result.valid = false;
        result.errors.push(...result.signature.errors.map(e => `Signature: ${e.message || e}`));
      }
    } catch (error) {
      result.valid = false;
      result.errors.push(`Validation error: ${error.message}`);
    }
  }
  
  return result;
}

