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
    // Render spins down free services after 15 min of inactivity.
    // This pings /health every 14 minutes to keep the instance warm.
    if (env.NODE_ENV === 'production') {
      const KEEP_ALIVE_URL = process.env.RENDER_EXTERNAL_URL 
        ? `${process.env.RENDER_EXTERNAL_URL}/health`
        : `https://routecopilot-backend.onrender.com/health`;
      
      const keepAlive = () => {
        fetch(KEEP_ALIVE_URL)
          .then(res => console.log(`[KeepAlive] Ping OK: ${res.status}`))
          .catch(err => console.warn(`[KeepAlive] Ping failed:`, err.message));
      };
      
      // Ping every 14 minutes (840000ms)
      setInterval(keepAlive, 14 * 60 * 1000);
      console.log(`🏓 Keep-alive ping enabled → ${KEEP_ALIVE_URL} every 14min`);
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
