import { Request, Response, NextFunction } from 'express';
import { MapsService } from './maps.service';

export class MapsController {
  static async getAvailableMaps(req: Request, res: Response, next: NextFunction) {
    try {
      const maps = await MapsService.getAvailableMaps();
      res.status(200).json({ success: true, data: maps });
    } catch (error) {
      next(error);
    }
  }

  static async registerDownload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { mapId } = req.body;

      if (!userId) throw new Error('Unauthorized');
      if (!mapId) throw new Error('mapId is required');

      const downloadTicket = await MapsService.logMapDownload(userId, mapId);
      res.status(200).json({ success: true, data: downloadTicket });
    } catch (error) {
      next(error);
    }
  }
}
