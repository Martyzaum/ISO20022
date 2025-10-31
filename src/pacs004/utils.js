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

import { validateISPB as validateISPBBase } from '../pacs002/utils.js';

function generateRandomString(length, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export function validateRtrId(rtrId) {
  if (!rtrId || typeof rtrId !== 'string') {
    return false;
  }
  // Pattern: D + 8 alphanumeric ISPB + YYYYMMDDHHMM + 11 alphanumeric
  const rtrIdPattern = /^D[0-9A-Z]{8}\d{4}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])[0-5]\d[a-zA-Z0-9]{11}$/;
  return rtrIdPattern.test(rtrId);
}

export function generateRtrId(ispb, date = new Date()) {
  if (!validateISPBBase(ispb)) {
    throw new Error(`Invalid ISPB format: ${ispb}. Must be 8 alphanumeric characters [0-9A-Z]`);
  }
  
  const prefix = 'D';
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timestamp = year + month + day + hours + minutes;
  const randomPart = generateRandomString(11);
  
  return prefix + ispb + timestamp + randomPart;
}
