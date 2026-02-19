// ../../../modules/auth/services/authService.js
import api from '../../../services/api';

class AuthService {
  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, user: object}>}
   */
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      // Store token + user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user?.hospitalId) {
        localStorage.setItem('hospitalId', user.hospitalId);
      } else {
        localStorage.removeItem('hospitalId');
      }

      return { token, user };
    } catch (error) {
      throw new Error(error.formattedMessage || 'Login failed');
    }
  }

  /**
   * Fetch full user profile from API
   * @returns {Promise<object>}
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.user;

      // Ensure localStorage is in sync
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        if (user.hospitalId) localStorage.setItem('hospitalId', user.hospitalId);
      }

      return user;
    } catch (error) {
      // Clear invalid session if API fails
      this.logout();
      throw new Error(error.formattedMessage || 'Failed to get user');
    }
  }

  /**
   * Logout
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('hospitalId');
  }

  /**
   * Check authentication
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  /**
   * Get user from localStorage
   * @returns {object|null}
   */
  getStoredUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export default new AuthService();
