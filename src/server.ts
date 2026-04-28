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

    // ── Keep-Alive Self-Ping (prevents Render free-tier cold starts) ──
    if (env.NODE_ENV === 'production') {
      // Priority: 1. Render provided URL, 2. Hardcoded fallback
      const baseUrl = process.env.RENDER_EXTERNAL_URL || 'https://routecopilot-backend.onrender.com';
      const KEEP_ALIVE_URL = `${baseUrl}/health`;
      
      const keepAlive = async () => {
        try {
          const res = await fetch(KEEP_ALIVE_URL);
          console.log(`[${new Date().toLocaleTimeString()}] ⚡ Keep-Alive: Pinged ${KEEP_ALIVE_URL} - Status: ${res.status}`);
        } catch (err) {
          console.warn(`[${new Date().toLocaleTimeString()}] ⚠️ Keep-Alive: Ping failed`, err.message);
        }
      };
      
      // Ping every 14 minutes to stay within Render's 15-min sleep window
      setInterval(keepAlive, 14 * 60 * 1000);
      console.log(`🏓 Keep-alive system active → Pinging every 14min`);
    }
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
