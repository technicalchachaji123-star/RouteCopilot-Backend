import { supabase } from '../../config/supabase';

export class RoutesService {
  /**
   * Save a new route to the database
   */
  static async createRoute(userId: string, data: any) {
    const { originName, destinationName, waypoints, totalDistanceKm, estimatedDurationMins } = data;

    // Use the admin client since we verified the token in middleware
    const { data: route, error } = await supabase
      .from('routes')
      .insert([
        {
          driver_id: userId,
          origin_name: originName,
          destination_name: destinationName,
          waypoints: waypoints || [],
          total_distance_km: totalDistanceKm,
          estimated_duration_mins: estimatedDurationMins,
          status: 'planned'
        }
      ])
      .select()
      .single();

    if (error) {
      const err: any = new Error(error.message);
      err.statusCode = 400;
      throw err;
    }

    return route;
  }

  /**
   * Get all routes for a specific driver
   */
  static async getMyRoutes(userId: string) {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('driver_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Update the status of a route (e.g., to 'active' or 'completed')
   */
  static async updateRouteStatus(routeId: string, userId: string, status: string) {
    const { data, error } = await supabase
      .from('routes')
      .update({ status })
      .eq('id', routeId)
      .eq('driver_id', userId) // Ensure they own it
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
