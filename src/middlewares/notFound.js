function notFound(req, res) {
  return res.status(404).json({
    error: {
      message: 'Not Found',
      path: req.originalUrl,
    },
  });
}

module.exports = { notFound };
