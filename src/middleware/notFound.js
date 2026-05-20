const { sendError } = require('../utils/apiResponse');

module.exports = (req, res) => {
  return sendError(res, {
    statusCode: 404,
    message: 'Not Found',
    code: 'NOT_FOUND',
    details: {
      path: req.originalUrl,
      method: req.method,
    },
  });
};
