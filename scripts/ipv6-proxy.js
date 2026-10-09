const net = require('net');

const server = net.createServer((clientSocket) => {
  const targetSocket = net.connect(5173, '127.0.0.1');

  clientSocket.pipe(targetSocket);
  targetSocket.pipe(clientSocket);

  clientSocket.on('error', () => {});
  targetSocket.on('error', () => {});
});

server.on('error', (err) => {
  console.error('IPv6 proxy error:', err.message);
});

server.listen(5173, '::1', () => {
  console.log('[IPv6 Proxy] Dual-stack bridge active: listening on [::1]:5173 -> 127.0.0.1:5173');
});
