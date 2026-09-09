export class AppError extends Error { constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; } }
export const notFound = (req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} was not found.` } });
export function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  if (error.name === 'ZodError') return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message || 'Invalid request.', details: error.issues } });
  if (error.code === 11000) return res.status(409).json({ success: false, error: { code: 'DUPLICATE_RESOURCE', message: 'A resource with that value already exists.' } });
  if (error.name === 'MulterError') return res.status(400).json({ success: false, error: { code: 'UPLOAD_ERROR', message: error.message } });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ success: false, error: { code: error.code || 'INTERNAL_ERROR', message: status >= 500 ? 'An unexpected error occurred.' : error.message } });
}
