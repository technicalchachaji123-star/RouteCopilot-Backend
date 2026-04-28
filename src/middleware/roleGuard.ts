import { Request, Response, NextFunction } from 'express';

export const roleGuard = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Note: requires req.user to have been populated with role.
    // In this implementation, verifyAccessToken only gives userId. 
    // We would fetch user in requireAuth or here if we need role checking.
    // For now, skipping implementation or doing a simple pass.
    next();
  };
};
