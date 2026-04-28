import { Request, Response, NextFunction } from 'express';
import { RoutesService } from './routes.service';
import { RouteEngine } from './routes.engine';

export class RoutesController {
  static async createRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error('Unauthorized');

      const route = await RoutesService.createRoute(userId, req.body);
      res.status(201).json({ success: true, data: route });
    } catch (error) {
      next(error);
    }
  }

  static async findMasterRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        origin, 
        destination, 
        waypoints, 
        cargoTypes, 
        truckType, 
        isNightTime,
        simulatedFuelPrice,
        simulatedWeatherIntensity
      } = req.body;

      if (!origin || !destination || !cargoTypes || !truckType) {
        throw new Error('Missing required route parameters (origin, destination, cargoTypes, truckType)');
      }

      // calculateOptimalRoutes is now async (uses OSRM API)
      const routeOptions = await RouteEngine.calculateOptimalRoutes({
        origin,
        destination,
        waypoints,
        cargoTypes,
        truckType,
        isNightTime,
        simulatedFuelPrice,
        simulatedWeatherIntensity
      });

      // Return as a flat array — frontend expects response.data.data to be an array
      res.status(200).json({ 
        success: true, 
        data: routeOptions
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyRoutes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error('Unauthorized');

      const routes = await RoutesService.getMyRoutes(userId);
      res.status(200).json({ success: true, data: routes });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { status } = req.body;
      
      if (!userId) throw new Error('Unauthorized');

      const updatedRoute = await RoutesService.updateRouteStatus(id as string, userId, status as string);
      res.status(200).json({ success: true, data: updatedRoute });
    } catch (error) {
      next(error);
    }
  }
}
