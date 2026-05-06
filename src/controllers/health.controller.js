function getHealth(req, res) {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getHealth };
