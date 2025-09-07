module.exports = {
  devServer: {
    allowedHosts: ['localhost', '127.0.0.1'],
    client: {
      webSocketURL: 'ws://localhost:3000/ws',
    },
  },
};
