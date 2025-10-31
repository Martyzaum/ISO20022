export function extractIdempotencyKey(req) {
  if (req.headers['idempotency-key']) {
    return req.headers['idempotency-key'];
  }

  if (req.body?.idempotencyKey) {
    return req.body.idempotencyKey;
  }

  return null;
}

export function idempotencyMiddleware(req, res, next) {
  const idempotencyKey = extractIdempotencyKey(req);
  
  if (!idempotencyKey) {
    return res.status(400).json({
      success: false,
      error: 'Idempotency-Key is required. Please provide it in the header (Idempotency-Key) or in the request body (idempotencyKey).'
    });
  }
  
  req.idempotencyKey = idempotencyKey;
  
  next();
}
