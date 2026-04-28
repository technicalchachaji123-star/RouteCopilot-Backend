import { supabase } from '../../config/supabase';

export class AuthService {
  /**
   * Register a new user
   * Supabase handles password hashing and duplicate email checks automatically.
   */
  static async register(data: any) {
    const { email, password, firstName, lastName, role } = data;

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role || 'driver'
        }
      }
    });

    if (error) {
      const err: any = new Error(error.message);
      err.statusCode = error.status || 400;
      err.code = 'AUTH_ERROR';
      throw err;
    }

    return {
      userId: authData.user?.id,
      email: authData.user?.email,
      firstName: authData.user?.user_metadata?.first_name,
      lastName: authData.user?.user_metadata?.last_name,
      role: authData.user?.user_metadata?.role
    };
  }

  /**
   * Login user
   */
  static async login(data: any) {
    const { email, password } = data;

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      const err: any = new Error(error.message);
      err.statusCode = error.status || 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    return {
      accessToken: authData.session?.access_token,
      refreshToken: authData.session?.refresh_token,
      user: {
        userId: authData.user?.id,
        email: authData.user?.email,
        firstName: authData.user?.user_metadata?.first_name,
        lastName: authData.user?.user_metadata?.last_name,
        role: authData.user?.user_metadata?.role
      }
    };
  }

  /**
   * Refresh the session
   */
  static async refresh(token: string) {
    const { data: authData, error } = await supabase.auth.refreshSession({
      refresh_token: token
    });

    if (error) {
      const err: any = new Error(error.message);
      err.statusCode = error.status || 401;
      err.code = 'REFRESH_TOKEN_INVALID';
      throw err;
    }

    return {
      accessToken: authData.session?.access_token,
      refreshToken: authData.session?.refresh_token
    };
  }

  /**
   * Logout user
   */
  static async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}
