import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import type { NextApiRequest, NextApiResponse } from 'next';

// These custom types are needed to attach the socket server to Next.js
interface SocketServer extends HTTPServer {
  io?: Server;
}
interface SocketWithIO extends NetSocket {
  server: SocketServer;
}
interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

const SocketHandler = (_req: NextApiRequest, res: NextApiResponseWithSocket) => {
  // Check if the socket server is already running
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    // If not, create a new Socket.IO server and attach it to the main HTTP server
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    // This block runs when a new user connects
    io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Listen for a 'sendMessage' event from any client
      socket.on('sendMessage', (msg) => {
        // When a message is received, broadcast it to ALL connected clients
        io.emit('receiveMessage', msg);
      });

      // This block runs when a user disconnects
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  }
  res.end();
};

export default SocketHandler;