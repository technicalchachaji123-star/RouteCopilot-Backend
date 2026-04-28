import * as Sentry from '@sentry/node';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import mongoose from 'mongoose';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import routesRoutes from './modules/routes/routes.routes';
import costRoutes from './modules/cost/cost.routes';
import telematicsRoutes from './modules/telematics/telematics.routes';
import mapsRoutes from './modules/maps/maps.routes';

const app = express();

// 1. Sentry (must be first)
if (env.SENTRY_DSN) {
  Sentry.init({ dsn: env.SENTRY_DSN });
}

// Simple Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health and Readiness checks (No auth, no heavy rate limiting)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

app.get('/ready', (req: Request, res: Response) => {
  // Supabase is HTTP-based, so if the server is up, it is ready.
  res.status(200).json({ status: 'READY' });
});

// 2. Security headers
app.use(helmet());

// 3. CORS
app.use(cors({
  origin: env.CORS_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// 4. Body and Cookie parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 5. NoSQL injection prevention removed as we use Supabase now

// Global Rate Limit
const globalLimiter = rateLimit({ 
  windowMs: 60 * 1000, // 1 minute
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
});
app.use('/api', globalLimiter);

// Auth strict rate limit
const authLimiter = rateLimit({ 
  windowMs: 60 * 1000, 
  max: 10, 
  skipSuccessfulRequests: true,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many auth requests' } }
});
app.use('/api/v1/auth', authLimiter);

// 9. Routes
const router = express.Router();
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/routes', routesRoutes);
router.use('/cost', costRoutes);
router.use('/telematics', telematicsRoutes);
router.use('/maps', mapsRoutes);

router.get('/', (req, res) => {
  res.json({ message: 'SmartRoute API V1' });
});
app.use('/api/v1', router);

// 11. Central error handler (always last)
Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

export default app;
