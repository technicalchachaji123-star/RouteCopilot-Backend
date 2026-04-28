import { Request, Response, NextFunction } from 'express';
import { TelematicsService } from './telematics.service';

export class TelematicsController {
  static async getLiveDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { routeId } = req.query;
      
      if (!routeId) {
        throw new Error('routeId is required to fetch live telematics');
      }

      // Fetch simulated live data for this route
      const dashboardData = await TelematicsService.getLiveTelemetry(routeId as string);
      
      res.status(200).json({ success: true, data: dashboardData });
    } catch (error) {
      next(error);
    }
  }
}
