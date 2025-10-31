import {
  isValidPaymentInitiationForm,
  isValidPaymentPurpose,
  isValidInstructionPriority,
  isValidServiceLevel
} from './types.js';
import {
  validateEndToEndId,
  validateCPFOrCNPJ,
  validatePixKey,
  validateTxId,
  validateUTCDateTime
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
  
  tx.endToEndId = extractSingleField(txInfXml, /<EndToEndId>([^<]+)<\/EndToEndId>/);
  tx.txId = extractSingleField(txInfXml, /<TxId>([^<]+)<\/TxId>/);
  
  const amtMatch = txInfXml.match(/<IntrBkSttlmAmt[^>]*>([^<]+)<\/IntrBkSttlmAmt>/);
  tx.amount = amtMatch ? Number.parseFloat(amtMatch[1]) : null;
  
  tx.acceptanceDateTime = extractSingleField(txInfXml, /<AccptncDtTm>([^<]+)<\/AccptncDtTm>/);
  tx.initiationForm = extractSingleField(txInfXml, /<MndtRltdInf>[\s\S]*?<Prtry>([^<]+)<\/Prtry>/);
  tx.purpose = extractSingleField(txInfXml, /<Purp>[\s\S]*?<Cd>([^<]+)<\/Cd>/);
  tx.debtorName = extractSingleField(txInfXml, /<Dbtr>[\s\S]*?<Nm>([^<]+)<\/Nm>/);
  tx.debtorCpfCnpj = extractSingleField(txInfXml, /<Dbtr>[\s\S]*?<Id>[\s\S]*?<Id>([^<]+)<\/Id>/);
  tx.pixKey = extractSingleField(txInfXml, /<Prxy>[\s\S]*?<Id>([^<]+)<\/Id>/);
  
  return tx;
}

function parseTransactions(xml) {
  const cdtTrfTxInfMatches = xml.match(/<CdtTrfTxInf>[\s\S]*?<\/CdtTrfTxInf>/g);
  if (!cdtTrfTxInfMatches) {
    return [];
  }
  
  return cdtTrfTxInfMatches.map(txInfXml => parseTransaction(txInfXml));
}

function parseXMLFields(xml) {
  const fields = parseCommonAppHdrFields(xml);
  fields.nbOfTxs = parseNbOfTxs(xml);
  fields.instrPrty = extractSingleField(xml, /<InstrPrty>([^<]+)<\/InstrPrty>/);
  fields.serviceLevel = extractSingleField(xml, /<SvcLvl>[\s\S]*?<Prtry>([^<]+)<\/Prtry>/);
  fields.transactions = parseTransactions(xml);
  
  return fields;
}

function validateInstructionPriority(instrPrty, errors) {
  if (!instrPrty) {
    errors.push('Missing InstrPrty');
  } else if (!isValidInstructionPriority(instrPrty)) {
    errors.push(`Invalid InstrPrty: ${instrPrty}. Must be HIGH or NORM`);
  }
}

function validateServiceLevel(serviceLevel, errors) {
  if (!serviceLevel) {
    errors.push('Missing Service Level');
  } else if (!isValidServiceLevel(serviceLevel)) {
    errors.push(`Invalid Service Level: ${serviceLevel}. Must be PAGPRI, PAGFRD, or PAGAGD`);
  }
}

function validatePriorityServiceLevelConsistency(instrPrty, serviceLevel, errors) {
  if (instrPrty === 'HIGH' && serviceLevel !== 'PAGPRI') {
    errors.push('When InstrPrty is HIGH, Service Level must be PAGPRI');
  }
  
  if (instrPrty === 'NORM' && serviceLevel !== 'PAGFRD' && serviceLevel !== 'PAGAGD') {
    errors.push('When InstrPrty is NORM, Service Level must be PAGFRD or PAGAGD');
  }
}

function validateTransactionLimit(nbOfTxs, serviceLevel, errors) {
  const maxTransactions = serviceLevel === 'PAGAGD' ? 500 : 10;
  if (nbOfTxs > maxTransactions) {
    errors.push(`NbOfTxs (${nbOfTxs}) exceeds maximum (${maxTransactions}) for service level ${serviceLevel}`);
  }
}

function validateTransactionCount(nbOfTxs, transactionCount, errors) {
  if (nbOfTxs !== transactionCount) {
    errors.push(`NbOfTxs (${nbOfTxs}) does not match number of transactions (${transactionCount})`);
  }
}

function validateTransactionEndToEndId(tx, index, errors) {
  if (!tx.endToEndId) {
    errors.push(`Missing EndToEndId in transaction ${index + 1}`);
  } else if (!validateEndToEndId(tx.endToEndId)) {
    errors.push(`Invalid EndToEndId format in transaction ${index + 1}: ${tx.endToEndId}`);
  }
}

function validateTransactionTxId(tx, index, errors) {
  if (tx.initiationForm && ['QRES', 'QRDN', 'INIC', 'AUTO'].includes(tx.initiationForm)) {
    if (!tx.txId) {
      errors.push(`TxId is required for initiationForm ${tx.initiationForm} in transaction ${index + 1}`);
    } else if (!validateTxId(tx.txId, tx.initiationForm)) {
      errors.push(`Invalid TxId format in transaction ${index + 1}: ${tx.txId}`);
    }
  }
}

function validateTransactionInitiationForm(tx, index, errors) {
  if (!tx.initiationForm) {
    errors.push(`Missing Initiation Form in transaction ${index + 1}`);
  } else if (!isValidPaymentInitiationForm(tx.initiationForm)) {
    errors.push(`Invalid Initiation Form in transaction ${index + 1}: ${tx.initiationForm}`);
  }
}

function validateTransactionPurpose(tx, index, errors) {
  if (!tx.purpose) {
    errors.push(`Missing Purpose in transaction ${index + 1}`);
  } else if (!isValidPaymentPurpose(tx.purpose)) {
    errors.push(`Invalid Purpose in transaction ${index + 1}: ${tx.purpose}`);
  }
}

function validateTransactionAmount(tx, index, errors) {
  if (tx.amount === null || tx.amount === undefined || tx.amount <= 0) {
    errors.push(`Invalid amount in transaction ${index + 1}: ${tx.amount}`);
  }
}

function validateTransactionAcceptanceDateTime(tx, index, errors) {
  if (!tx.acceptanceDateTime) {
    errors.push(`Missing Acceptance DateTime in transaction ${index + 1}`);
  } else if (!validateUTCDateTime(tx.acceptanceDateTime)) {
    errors.push(`Invalid Acceptance DateTime format in transaction ${index + 1}: ${tx.acceptanceDateTime}`);
  }
}

function validateTransactionDebtorCpfCnpj(tx, index, errors) {
  if (!tx.debtorCpfCnpj) {
    errors.push(`Missing Debtor CPF/CNPJ in transaction ${index + 1}`);
  } else if (!validateCPFOrCNPJ(tx.debtorCpfCnpj)) {
    errors.push(`Invalid Debtor CPF/CNPJ format in transaction ${index + 1}: ${tx.debtorCpfCnpj}`);
  }
}

function validateTransactionPixKey(tx, index, errors) {
  const requiresPixKey = tx.initiationForm && ['QRDN', 'QRES', 'APDN', 'INIC'].includes(tx.initiationForm);
  const shouldNotHavePixKey = tx.initiationForm && ['MANU', 'AUTO'].includes(tx.initiationForm);
  
  if (requiresPixKey && (!tx.pixKey || !validatePixKey(tx.pixKey))) {
    errors.push(`Pix key is required for initiationForm ${tx.initiationForm} in transaction ${index + 1}`);
  }
  
  if (shouldNotHavePixKey && tx.pixKey) {
    errors.push(`Pix key should not be provided for initiationForm ${tx.initiationForm} in transaction ${index + 1}`);
  }
}

function validateSingleTransaction(tx, index, errors) {
  validateTransactionEndToEndId(tx, index, errors);
  validateTransactionTxId(tx, index, errors);
  validateTransactionInitiationForm(tx, index, errors);
  validateTransactionPurpose(tx, index, errors);
  validateTransactionAmount(tx, index, errors);
  validateTransactionAcceptanceDateTime(tx, index, errors);
  validateTransactionDebtorCpfCnpj(tx, index, errors);
  validateTransactionPixKey(tx, index, errors);
}

function validateTransactions(fields, errors) {
  if (!fields.transactions || fields.transactions.length === 0) {
    errors.push('Missing transactions (CdtTrfTxInf elements)');
    return;
  }
  
  validateTransactionCount(fields.nbOfTxs, fields.transactions.length, errors);
  
  for (let i = 0; i < fields.transactions.length; i++) {
    validateSingleTransaction(fields.transactions[i], i, errors);
  }
}

function validateBusinessRules(fields) {
  const errors = validateCommonFields(fields, 'pacs.008.spi.1.13');
  errors.push(...validateNbOfTxs(fields.nbOfTxs));
  
  validateInstructionPriority(fields.instrPrty, errors);
  validateServiceLevel(fields.serviceLevel, errors);
  validatePriorityServiceLevelConsistency(fields.instrPrty, fields.serviceLevel, errors);
  validateTransactionLimit(fields.nbOfTxs, fields.serviceLevel, errors);
  validateTransactions(fields, errors);
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export async function validatePacs008(xml, options = {}) {
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

