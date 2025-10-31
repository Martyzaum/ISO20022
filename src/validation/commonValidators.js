import {
  validateISPB,
  validateMsgId,
  validateUTCDateTime
} from '../pacs002/utils.js';

function validateISPBField(value, fieldName, errors) {
  if (!value) {
    errors.push(`Missing ${fieldName}`);
  } else if (!validateISPB(value)) {
    errors.push(`Invalid ${fieldName} format: ${value}. Must be 8 alphanumeric characters [0-9A-Z]`);
  }
}

function validateMsgIdField(value, fieldName, errors) {
  if (!value) {
    errors.push(`Missing ${fieldName}`);
  } else if (!validateMsgId(value)) {
    errors.push(`Invalid ${fieldName} format: ${value}. Must follow pattern Mxxxxxxxxkkkkkkkkkkkkkkkkkkkkkkk`);
  }
}

function validateDateTimeField(value, fieldName, errors) {
  if (!value) {
    errors.push(`Missing ${fieldName}`);
  } else if (!validateUTCDateTime(value)) {
    errors.push(`Invalid ${fieldName} format: ${value}. Must be in UTC format YYYY-MM-DDTHH:mm:ss.sssZ`);
  }
}

function validateMsgDefIdrField(value, expectedMsgDefIdr, errors) {
  if (!value) {
    errors.push('Missing MsgDefIdr');
  } else if (value !== expectedMsgDefIdr) {
    errors.push(`Invalid MsgDefIdr: ${value}. Must be "${expectedMsgDefIdr}"`);
  }
}

function validateCrossFieldMatches(field1, field2, field1Name, field2Name, errors) {
  if (field1 && field2 && field1 !== field2) {
    errors.push(`${field1Name} (${field1}) and ${field2Name} (${field2}) must match`);
  }
}

export function validateCommonAppHdrFields(fields, expectedMsgDefIdr) {
  const errors = [];
  
  validateISPBField(fields.fromISPB, 'From ISPB', errors);
  validateISPBField(fields.toISPB, 'To ISPB', errors);
  validateMsgIdField(fields.bizMsgIdr, 'BizMsgIdr', errors);
  validateMsgDefIdrField(fields.msgDefIdr, expectedMsgDefIdr, errors);
  validateDateTimeField(fields.creDt, 'CreDt', errors);
  validateMsgIdField(fields.grpHdrMsgId, 'GrpHdr MsgId', errors);
  validateDateTimeField(fields.creDtTm, 'CreDtTm', errors);
  
  validateCrossFieldMatches(fields.bizMsgIdr, fields.grpHdrMsgId, 'BizMsgIdr', 'GrpHdr MsgId', errors);
  validateCrossFieldMatches(fields.creDt, fields.creDtTm, 'CreDt', 'CreDtTm', errors);
  
  return errors;
}

export function validateNbOfTxs(nbOfTxs, minValue = 1) {
  const errors = [];
  if (nbOfTxs === null || nbOfTxs === undefined) {
    errors.push('Missing NbOfTxs');
  } else if (nbOfTxs < minValue) {
    errors.push(`Invalid NbOfTxs: ${nbOfTxs}. Must be >= ${minValue}`);
  }
  return errors;
}

