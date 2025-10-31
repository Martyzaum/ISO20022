export function validateISPB(ispb) {
  if (!ispb || typeof ispb !== 'string') {
    return false;
  }
  const ispbPattern = /^[0-9A-Z]{8}$/;
  return ispbPattern.test(ispb);
}

export function validateMsgId(msgId) {
  if (!msgId || typeof msgId !== 'string') {
    return false;
  }
  const msgIdPattern = /^M[0-9A-Z]{8}[a-zA-Z0-9]{23}$/;
  return msgIdPattern.test(msgId);
}

export function validateEndToEndId(endToEndId) {
  if (!endToEndId || typeof endToEndId !== 'string') {
    return false;
  }
  // Simplified regex to reduce complexity
  const prefix = /^E[0-9A-Z]{8}\d{4}/;
  const month = /(0[1-9]|1[0-2])/;
  const day = /(0[1-9]|[12]\d|3[01])/;
  const hour = /([01]\d|2[0-3])/;
  const minute = /[0-5]\d/;
  const suffix = /[a-zA-Z0-9]{11}$/;
  const endToEndIdPattern = new RegExp(`^${prefix.source}${month.source}${day.source}${hour.source}${minute.source}${suffix.source}`);
  return endToEndIdPattern.test(endToEndId);
}

export function validateOrgnlInstrId(orgnlInstrId) {
  if (!orgnlInstrId || typeof orgnlInstrId !== 'string') {
    return false;
  }
  // Simplified regex to reduce complexity
  const prefix = /^[ED][0-9A-Z]{8}\d{4}/;
  const month = /(0[1-9]|1[0-2])/;
  const day = /(0[1-9]|[12]\d|3[01])/;
  const hour = /([01]\d|2[0-3])/;
  const minute = /[0-5]\d/;
  const suffix = /[a-zA-Z0-9]{11}$/;
  const orgnlInstrIdPattern = new RegExp(`^${prefix.source}${month.source}${day.source}${hour.source}${minute.source}${suffix.source}`);
  return orgnlInstrIdPattern.test(orgnlInstrId);
}

function generateRandomString(length, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export function generateMsgId(ispb) {
  if (!validateISPB(ispb)) {
    throw new Error(`Invalid ISPB format: ${ispb}. Must be 8 alphanumeric characters [0-9A-Z]`);
  }
  
  const prefix = 'M';
  const randomPart = generateRandomString(23);
  
  return prefix + ispb + randomPart;
}

export function generateEndToEndId(ispb, date = new Date()) {
  if (!validateISPB(ispb)) {
    throw new Error(`Invalid ISPB format: ${ispb}. Must be 8 alphanumeric characters [0-9A-Z]`);
  }
  
  const prefix = 'E';
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timestamp = year + month + day + hours + minutes;
  const randomPart = generateRandomString(11);
  
  return prefix + ispb + timestamp + randomPart;
}

export function formatUTCDateTime(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}

export function validateUTCDateTime(dateTime) {
  if (!dateTime || typeof dateTime !== 'string') {
    return false;
  }
  // Simplified regex to reduce complexity
  const datePart = /\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])/;
  const timePart = /([01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/;
  const pattern = new RegExp(`^${datePart.source}T${timePart.source}`);
  return pattern.test(dateTime);
}

export function formatISODate(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function validateISODate(date) {
  if (!date || typeof date !== 'string') {
    return false;
  }
  const pattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  return pattern.test(date);
}
