// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = Number(err.status || 500);
  const safeStatus = Number.isFinite(status) ? status : 500;

  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd ? 'Internal Server Error' : err.message || 'Internal Server Error';

  return res.status(safeStatus).json({
    error: {
      message,
    },
  });
}

module.exports = { errorHandler };
