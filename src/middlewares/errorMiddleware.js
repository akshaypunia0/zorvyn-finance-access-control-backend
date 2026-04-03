export function notFound(req, res) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

/**
 * Express error handler (4 args).
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const body = {
    error: err.message || 'Internal server error',
  };
  if (process.env.NODE_ENV !== 'production' && err.details) {
    body.details = err.details;
  }
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json(body);
}
