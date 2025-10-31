import {
  isValidReturnReasonCode,
  isValidSettlementPriority
} from './types.js';
import {
  validateEndToEndId,
  validateRtrId
} from './utils.js';
import { validateAll } from '../validation/validator.js';
import { parseCommonAppHdrFields, parseNbOfTxs } from '../validation/commonParsers.js';
import { validateCommonAppHdrFields as validateCommonFields, validateNbOfTxs } from '../validation/commonValidators.js';

function extractSingleField(xml, pattern) {
  const match = xml.match(pattern);
  return match ? match[1] : null;
}

function parseTransaction(txInfXml) {
  const tx = {};
  tx.rtrId = extractSingleField(txInfXml, /<RtrId>([^<]+)<\/RtrId>/);
  tx.orgnlEndToEndId = extractSingleField(txInfXml, /<OrgnlEndToEndId>([^<]+)<\/OrgnlEndToEndId>/);
  
  const amtMatch = txInfXml.match(/<RtrdIntrBkSttlmAmt[^>]*>([^<]+)<\/RtrdIntrBkSttlmAmt>/);
  tx.amount = amtMatch ? Number.parseFloat(amtMatch[1]) : null;
  
  tx.settlementPriority = extractSingleField(txInfXml, /<SttlmPrty>([^<]+)<\/SttlmPrty>/);
  tx.returnReasonCode = extractSingleField(txInfXml, /<RtrRsnInf>[\s\S]*?<Cd>([^<]+)<\/Cd>/);
  
  const addtlInfMatches = txInfXml.match(/<AddtlInf>([^<]+)<\/AddtlInf>/g);
  if (addtlInfMatches) {
    tx.additionalInfo = addtlInfMatches.map(m => {
      const match = m.match(/<AddtlInf>([^<]+)<\/AddtlInf>/);
      return match ? match[1] : null;
    }).filter(Boolean);
  }
  
  return tx;
}

function parseXMLFields(xml) {
  const fields = parseCommonAppHdrFields(xml);
  fields.nbOfTxs = parseNbOfTxs(xml);
  
  const txInfMatches = xml.match(/<TxInf>[\s\S]*?<\/TxInf>/g);
  fields.transactions = txInfMatches ? txInfMatches.map(txInfXml => parseTransaction(txInfXml)) : [];
  
  return fields;
}

function validateTransactionRtrId(tx, index, errors) {
  if (!tx.rtrId) {
    errors.push(`Missing RtrId in transaction ${index + 1}`);
  } else if (!validateRtrId(tx.rtrId)) {
    errors.push(`Invalid RtrId format in transaction ${index + 1}: ${tx.rtrId}. Must follow pattern DxxxxxxxxyyyyMMddHHmmkkkkkkkkkkk`);
  }
}

function validateTransactionOrgnlEndToEndId(tx, index, errors) {
  if (!tx.orgnlEndToEndId) {
    errors.push(`Missing OrgnlEndToEndId in transaction ${index + 1}`);
  } else if (!validateEndToEndId(tx.orgnlEndToEndId)) {
    errors.push(`Invalid OrgnlEndToEndId format in transaction ${index + 1}: ${tx.orgnlEndToEndId}. Must follow pattern Exxxxxxxxyyyymmddhhmmkkkkkkkkkkk`);
  }
}

function validateTransactionAmount(tx, index, errors) {
  if (tx.amount === null || tx.amount === undefined || tx.amount <= 0) {
    errors.push(`Invalid amount in transaction ${index + 1}: ${tx.amount}. Must be a positive number`);
  }
}

function validateTransactionSettlementPriority(tx, index, errors) {
  if (!tx.settlementPriority) {
    errors.push(`Missing SttlmPrty in transaction ${index + 1}`);
  } else if (!isValidSettlementPriority(tx.settlementPriority)) {
    errors.push(`Invalid SttlmPrty in transaction ${index + 1}: ${tx.settlementPriority}. Must be HIGH or NORM`);
  }
}

function validateTransactionReturnReasonCode(tx, index, errors) {
  if (!tx.returnReasonCode) {
    errors.push(`Missing Return Reason Code in transaction ${index + 1}`);
  } else if (!isValidReturnReasonCode(tx.returnReasonCode)) {
    errors.push(`Invalid Return Reason Code in transaction ${index + 1}: ${tx.returnReasonCode}. Must be one of: BE08, FR01, MD06, SL02`);
  }
}

function validateTransactionAdditionalInfo(tx, index, errors) {
  if (tx.additionalInfo && Array.isArray(tx.additionalInfo)) {
    for (let j = 0; j < tx.additionalInfo.length; j++) {
      const info = tx.additionalInfo[j];
      if (info && info.length > 105) {
        errors.push(`AdditionalInfo ${j + 1} in transaction ${index + 1} exceeds 105 characters`);
      }
    }
  }
}

function validateSingleTransaction(tx, index, errors) {
  validateTransactionRtrId(tx, index, errors);
  validateTransactionOrgnlEndToEndId(tx, index, errors);
  validateTransactionAmount(tx, index, errors);
  validateTransactionSettlementPriority(tx, index, errors);
  validateTransactionReturnReasonCode(tx, index, errors);
  validateTransactionAdditionalInfo(tx, index, errors);
}

function validateTransactions(fields, errors) {
  if (!fields.transactions || fields.transactions.length === 0) {
    errors.push('Missing transactions (TxInf elements)');
    return;
  }
  
  if (fields.nbOfTxs !== fields.transactions.length) {
    errors.push(`NbOfTxs (${fields.nbOfTxs}) does not match number of transactions (${fields.transactions.length})`);
  }
  
  for (let i = 0; i < fields.transactions.length; i++) {
    validateSingleTransaction(fields.transactions[i], i, errors);
  }
}

function validateBusinessRules(fields) {
  const errors = validateCommonFields(fields, 'pacs.004.spi.1.5');
  errors.push(...validateNbOfTxs(fields.nbOfTxs));
  
  validateTransactions(fields, errors);
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export async function validatePacs004(xml, options = {}) {
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

