import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // PROTOTYPE BYPASS: Assign a dummy user ID for guest access
      req.user = { userId: '00000000-0000-0000-0000-000000000000' };
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // PROTOTYPE BYPASS: Assign dummy user instead of throwing error
      req.user = { userId: '00000000-0000-0000-0000-000000000000' };
      return next();
    }

    // Attach user ID to request
    req.user = { userId: user.id };
    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Authentication failed' }
    });
  }
};
