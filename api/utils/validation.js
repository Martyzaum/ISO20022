const VALID_MESSAGE_TYPES = ['PACS002', 'PACS004', 'PACS008'];
const MAX_PAGINATION_LIMIT = 100;
const MIN_PAGINATION_LIMIT = 1;
const DEFAULT_PAGINATION_LIMIT = 50;

export function validatePaginationParams(limit, offset) {
  const parsedLimit = Number.parseInt(limit, 10);
  const parsedOffset = Number.parseInt(offset, 10);
  
  if (Number.isNaN(parsedLimit) || parsedLimit < MIN_PAGINATION_LIMIT) {
    throw new Error(`Invalid limit: must be between ${MIN_PAGINATION_LIMIT} and ${MAX_PAGINATION_LIMIT}`);
  }
  
  if (parsedLimit > MAX_PAGINATION_LIMIT) {
    throw new Error(`Limit exceeds maximum of ${MAX_PAGINATION_LIMIT}`);
  }
  
  if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
    throw new Error('Invalid offset: must be a non-negative integer');
  }
  
  return { limit: parsedLimit, offset: parsedOffset };
}

export function validateMessageType(messageType) {
  if (messageType && !VALID_MESSAGE_TYPES.includes(messageType)) {
    throw new Error(`Invalid messageType: must be one of ${VALID_MESSAGE_TYPES.join(', ')}`);
  }
  return messageType;
}

export function validateId(id) {
  const parsedId = Number.parseInt(id, 10);
  if (Number.isNaN(parsedId) || parsedId < 1) {
    throw new Error('Invalid ID: must be a positive integer');
  }
  return parsedId;
}

export { VALID_MESSAGE_TYPES, MAX_PAGINATION_LIMIT, MIN_PAGINATION_LIMIT, DEFAULT_PAGINATION_LIMIT };

