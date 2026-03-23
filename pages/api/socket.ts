import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function SocketHandler(req: NextApiRequest, res: any) {
  if (!res.socket.server.io) {
    console.log('Starting Socket.IO Server natively in Next.js...');
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      socket.on('join_chat', (userId) => {
        socket.join(userId);
      });

      socket.on('notify_user', (data) => {
        socket.to(data.receiverId).emit('update_received');
      });
    });

    res.socket.server.io = io;
  }
}
