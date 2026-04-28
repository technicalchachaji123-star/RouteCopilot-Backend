import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken, user } = await AuthService.login(req.body);
      
      if (refreshToken) {
        setRefreshCookie(res, refreshToken);
      }

      res.status(200).json({ 
        success: true, 
        data: { accessToken, user } 
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } 
        });
      }

      const { accessToken, refreshToken } = await AuthService.refresh(token);
      
      if (refreshToken) {
        setRefreshCookie(res, refreshToken);
      }

      res.status(200).json({ 
        success: true, 
        data: { accessToken } 
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.logout();
      res.clearCookie('refreshToken');
      res.status(200).json({ 
        success: true, 
        data: { message: 'Logged out successfully' } 
      });
    } catch (error) {
      next(error);
    }
  }
}
