export function notFound(req, res) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Request payload is too large.' });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Request body must contain valid JSON.' });
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ success: false, error: error.message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
  }
  if (error.status && error.status < 500) {
    return res.status(error.status).json({ success: false, error: error.message });
  }
  console.error(error);
  return res.status(error.status || 500).json({
    success: false,
    error: error.status && error.status < 500 ? error.message : 'Something went wrong. Please try again.'
  });
}
