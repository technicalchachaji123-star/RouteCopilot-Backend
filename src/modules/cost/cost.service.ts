import { supabase } from '../../config/supabase';

export class CostService {
  /**
   * Add a new expense
   */
  static async addCost(userId: string, data: any) {
    const { routeId, costType, amount, currency, description, expenseDate } = data;

    const { data: cost, error } = await supabase
      .from('costs')
      .insert([
        {
          driver_id: userId,
          route_id: routeId || null,
          cost_type: costType,
          amount: amount,
          currency: currency || 'INR',
          description: description,
          expense_date: expenseDate || new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      const err: any = new Error(error.message);
      err.statusCode = 400;
      throw err;
    }

    return cost;
  }

  /**
   * Get all costs for a user, optionally filtered by a specific route
   */
  static async getMyCosts(userId: string, routeId?: string) {
    let query = supabase
      .from('costs')
      .select('*, route:routes(origin_name, destination_name)')
      .eq('driver_id', userId)
      .order('expense_date', { ascending: false });

    if (routeId) {
      query = query.eq('route_id', routeId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  }
}
