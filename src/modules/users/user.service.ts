import { supabase } from '../../config/supabase';

export class UserService {
  /**
   * Fetch user profile from Supabase
   */
  static async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Driver Performance Engine
   * Aggregates completed routes to generate a Driver Rating (out of 5 stars)
   */
  static async getDriverPerformance(userId: string) {
    // 1. Fetch all routes for this driver
    const { data: routes, error } = await supabase
      .from('routes')
      .select('*')
      .eq('driver_id', userId);

    if (error) throw new Error(error.message);

    if (!routes || routes.length === 0) {
      return {
        rating: 0,
        completedTrips: 0,
        safetyScore: 0,
        efficiencyScore: 0,
        performanceSummary: 'No trips completed yet. Start driving to build your profile!'
      };
    }

    // 2. Analytics Calculation
    const completedTrips = routes.filter(r => r.status === 'completed').length;
    
    // Simulate scoring (In real app, these come from telemetry / route engine logs)
    // Assuming each route could save a "final_risk_score" and "actual_duration"
    // Since we don't have historical telematics saved yet, we'll generate scores based on their activity.
    const safetyScore = Math.min(100, 75 + (completedTrips * 2)); // Improves with experience
    const efficiencyScore = Math.min(100, 80 + (completedTrips * 1.5));

    // Calculate out of 5 stars
    const combinedScore = (safetyScore + efficiencyScore) / 2;
    const rating = Math.round((combinedScore / 100) * 5 * 10) / 10; // e.g., 4.2

    let performanceSummary = '';
    if (rating >= 4.5) performanceSummary = 'Elite Driver: Outstanding safety and efficiency.';
    else if (rating >= 3.5) performanceSummary = 'Great Driver: Reliable and safe.';
    else performanceSummary = 'Needs Improvement: Pay attention to speed and risk alerts.';

    return {
      rating,
      completedTrips,
      totalTripsPlanned: routes.length,
      metrics: {
        safetyScore,
        efficiencyScore
      },
      performanceSummary
    };
  }
}
