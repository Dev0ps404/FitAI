const { Server } = require('socket.io')

function initializeSocketServer(httpServer, clientOrigin) {
  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    socket.emit('fitai:connected', {
      message: 'Socket connected to FitAI backend',
      socketId: socket.id,
    })

    socket.on('disconnect', () => {
      // Reserved for presence and notification tracking in upcoming steps.
    })
  })

  return io
}

module.exports = {
  initializeSocketServer,
}
