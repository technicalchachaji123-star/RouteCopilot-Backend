import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error('Unauthorized');

      const profile = await UserService.getUserById(userId);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  static async getPerformanceDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error('Unauthorized');

      const performance = await UserService.getDriverPerformance(userId);
      res.status(200).json({ success: true, data: performance });
    } catch (error) {
      next(error);
    }
  }
}
