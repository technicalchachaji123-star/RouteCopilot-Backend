import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { TelematicsService } from './modules/telematics/telematics.service';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`📡 New client connected to Telematics WebSocket: ${socket.id}`);

    // When the frontend starts a route, it joins a specific "room" for that route
    socket.on('start_navigation', (routeId: string) => {
      socket.join(routeId);
      console.log(`🚙 Client ${socket.id} started navigating route: ${routeId}`);
      
      // Send an immediate telemetry update
      pushTelemetryUpdate(routeId);
    });

    socket.on('stop_navigation', (routeId: string) => {
      socket.leave(routeId);
      console.log(`🛑 Client ${socket.id} stopped navigating route: ${routeId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Start the background simulation loop for active routes
  startTelemetryLoop();
};

/**
 * Pushes live updates to all users currently navigating a route
 */
const pushTelemetryUpdate = async (routeId: string) => {
  try {
    const liveData = await TelematicsService.getLiveTelemetry(routeId);
    io.to(routeId).emit('telemetry_update', liveData);
  } catch (error) {
    console.error(`Failed to push telemetry for ${routeId}`, error);
  }
};

/**
 * Simulates a continuous data feed pushing updates every 10 seconds
 * to all active rooms (routes being navigated).
 */
const startTelemetryLoop = () => {
  setInterval(() => {
    if (!io) return;
    
    // Get all active rooms (routes)
    const rooms = io.sockets.adapter.rooms;
    rooms.forEach((_, roomName) => {
      // Socket.io creates a room for each socket ID by default. 
      // Real route rooms start with 'r', e.g., 'r1', 'r2'
      if (roomName && typeof roomName === 'string' && roomName.startsWith('r') && roomName.length < 10) {
        pushTelemetryUpdate(roomName);
      }
    });
  }, 10000); // Push every 10 seconds
};
