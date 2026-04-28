import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import app from './app';
import { env } from './config/env';
import './config/supabase'; // Initializes Supabase

import { initSocket } from './socket';

const startServer = async () => {
  // Start HTTP Server
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  // Initialize WebSockets for real-time telemetry
  initSocket(server);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: any) => {
    console.error('Unhandled Rejection:', err?.message ?? err);
    console.error('Full error:', err);
    server.close(() => process.exit(1));
  });
};

startServer();
