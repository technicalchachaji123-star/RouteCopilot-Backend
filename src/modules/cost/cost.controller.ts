import { Request, Response, NextFunction } from 'express';
import { CostService } from './cost.service';

export class CostController {
  static async addCost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error('Unauthorized');

      const cost = await CostService.addCost(userId, req.body);
      res.status(201).json({ success: true, data: cost });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const routeId = req.query.routeId as string;
      
      if (!userId) throw new Error('Unauthorized');

      const history = await CostService.getMyCosts(userId, routeId);
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }
}
