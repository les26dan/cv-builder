// User data interface matching the authentication system
export interface UserData {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  createdAt?: string;
}

// Storage key for user data
const USER_STORAGE_KEY = 'okbuddy_user';

/**
 * Store user data in localStorage after successful login
 */
export const storeUserData = (userData: UserData): void => {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    console.log('✅ User data stored successfully:', { email: userData.email, name: userData.fullName });
  } catch (error) {
    console.error('❌ Failed to store user data:', error);
  }
};

/**
 * Retrieve user data from localStorage
 */
export const getUserData = (): UserData | null => {
  try {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (error) {
    console.error('❌ Failed to retrieve user data:', error);
  }
  return null;
};

/**
 * Clear user data (for logout)
 */
export const clearUserData = (): void => {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    console.log('✅ User data cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear user data:', error);
  }
};

/**
 * Check if user is logged in
 */
export const isUserLoggedIn = (): boolean => {
  return getUserData() !== null;
};

/**
 * Development helper removed - use real authentication only
 */

/**
 * Handle login response from authentication API
 */
export const handleLoginSuccess = (loginResponse: { user: UserData }): void => {
  storeUserData(loginResponse.user);
  // Refresh the page to reload with user data
  window.location.reload();
}; 