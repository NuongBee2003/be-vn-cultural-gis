const sendSuccess = (res, { statusCode = 200, message = 'OK', data = null, meta }) => {
  const body = {
    success: true,
    message,
    data,
  };

  if (meta !== undefined) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
};

const sendError = (
  res,
  {
    statusCode = 500,
    message = 'Internal Server Error',
    code = 'INTERNAL_ERROR',
    details,
  }
) => {
  const body = {
    success: false,
    message,
    error: {
      code,
    },
  };

  if (details !== undefined) {
    body.error.details = details;
  }

  return res.status(statusCode).json(body);
};

module.exports = {
  sendSuccess,
  sendError,
};
