const { sendError } = require('../utils/apiResponse');

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  const isServerError = statusCode >= 500;
  const message = isServerError ? 'Internal Server Error' : err.message;

  const code = err.code || (isServerError ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
  const details = err.details;

  if (isServerError) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return sendError(res, {
    statusCode,
    message,
    code,
    details,
  });
};
