function getHealth(_req, res) {
  res.status(200).json({
    success: true,
    message: 'FitAI API is healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Number(process.uptime().toFixed(2)),
  })
}

module.exports = {
  getHealth,
}
