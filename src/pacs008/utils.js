export {
  validateISPB,
  validateMsgId,
  validateEndToEndId,
  generateMsgId,
  generateEndToEndId,
  formatUTCDateTime,
  formatISODate,
  validateUTCDateTime,
  validateISODate
} from '../pacs002/utils.js';

function generateRandomString(length, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export function validateCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') {
    return false;
  }
  // Remove non-digit characters
  const cleaned = cpf.replaceAll(/\D/g, '');
  // Check if it's exactly 11 digits
  return /^\d{11}$/.test(cleaned);
}

export function validateCNPJ(cnpj) {
  if (!cnpj || typeof cnpj !== 'string') {
    return false;
  }
  // Remove non-digit characters
  const cleaned = cnpj.replaceAll(/\D/g, '');
  // Check if it's exactly 14 digits
  return /^\d{14}$/.test(cleaned);
}

export function validateCPFOrCNPJ(document) {
  return validateCPF(document) || validateCNPJ(document);
}

export function validateAccountNumber(account) {
  if (!account || typeof account !== 'string') {
    return false;
  }
  // Remove non-digit characters for validation
  const cleaned = account.replaceAll(/\D/g, '');
  // Check if it's between 1 and 20 digits
  return /^\d{1,20}$/.test(cleaned);
}

export function validateAgency(agency) {
  if (!agency || typeof agency !== 'string') {
    return false;
  }
  // Remove non-digit characters for validation
  const cleaned = agency.replaceAll(/\D/g, '');
  // Check if it's between 1 and 4 digits
  return /^\d{1,4}$/.test(cleaned);
}

export function validatePixKey(key) {
  if (!key || typeof key !== 'string') {
    return false;
  }
  
  // Remove whitespace
  const cleaned = key.trim();
  
  // CPF (11 digits)
  if (/^\d{11}$/.test(cleaned)) {
    return true;
  }
  
  // CNPJ (14 digits)
  if (/^\d{14}$/.test(cleaned)) {
    return true;
  }
  
  // Email (basic validation)
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    return true;
  }
  
  // Phone (+55 + DDD + number, 13-14 digits total)
  if (/^\+55\d{10,11}$/.test(cleaned)) {
    return true;
  }
  
  // Random key (UUID format)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleaned)) {
    return true;
  }
  
  return false;
}

export function validateTxId(txId, initiationForm) {
  if (!txId || typeof txId !== 'string') {
    return false;
  }
  
  // Must be alphanumeric
  if (!/^[a-zA-Z0-9]+$/.test(txId)) {
    return false;
  }
  
  // Length validation based on initiation form
  if (initiationForm === 'QRES' || initiationForm === 'INIC') {
    return txId.length <= 25;
  } else if (initiationForm === 'QRDN' || initiationForm === 'AUTO') {
    return txId.length >= 26 && txId.length <= 35;
  }
  
  // For other forms, allow up to 35 characters
  return txId.length <= 35;
}

export function generateTxId(length = 25) {
  if (length < 1 || length > 35) {
    throw new Error(`Invalid TxId length: ${length}. Must be between 1 and 35`);
  }
  return generateRandomString(length);
}

export function formatCPFOrCNPJ(document) {
  if (!document) {
    return '';
  }
  return document.replaceAll(/\D/g, '');
}

export function formatAccountNumber(account) {
  if (!account) {
    return '';
  }
  // Replace alphanumeric characters with 0, keep only digits
  return account.replaceAll(/\D/g, '0').replaceAll(/[a-zA-Z]/g, '0');
}
