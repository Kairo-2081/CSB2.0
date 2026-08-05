import { toast } from "sonner";

const API_URL = 'http://localhost:3001/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  phone?: string;
  department?: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  user: User;
  message?: string;
}

/**
 * Check if server is running and database is ready
 */
async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    return data.success && data.database === 'ready';
  } catch (error) {
    return false;
  }
}

/**
 * Parse fetch error response as JSON or text
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data.error || 'An error occurred';
    } else {
      const text = await response.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        return 'Server returned an HTML error page. Is the backend running on http://localhost:3001?';
      }
      return text || 'An error occurred';
    }
  } catch {
    return 'Failed to parse server response';
  }
}

class AuthService {
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Check server health first
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        throw new Error('Backend server is not responding. Make sure to run: node server.js');
      }

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error);
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        // Store user in localStorage
        this.setCurrentUser(data.user);
        return data;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during login';
      throw new Error(message);
    }
  }

  /**
   * Register a new user
   */
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    department?: string;
  }): Promise<RegisterResponse> {
    try {
      // Check server health first
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        throw new Error('Backend server is not responding. Make sure to run: node server.js');
      }

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error);
      }

      const data = await response.json();

      if (data.success && data.user) {
        this.setCurrentUser(data.user);
        return data;
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during registration';
      throw new Error(message);
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  /**
   * Set current user in localStorage
   */
  setCurrentUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  /**
   * Verify token (optional - for additional security)
   */
  async verifyAuth(): Promise<boolean> {
    try {
      const user = this.getCurrentUser();
      if (!user) return false;

      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.id}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        throw new Error('Backend server is not responding. Make sure to run: node server.js');
      }

      const response = await fetch(`${API_URL}/auth/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error);
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        this.setCurrentUser(data.user);
        return data.user;
      } else {
        throw new Error(data.error || 'Profile update failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred updating profile';
      throw new Error(message);
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        throw new Error('Backend server is not responding. Make sure to run: node server.js');
      }

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, oldPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error);
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred changing password';
      throw new Error(message);
    }
  }
}

export const authService = new AuthService();
