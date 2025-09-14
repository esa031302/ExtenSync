import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up axios defaults
  axios.defaults.baseURL = 'http://localhost:5000/api';

  // Add token to requests if it exists
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Auth check failed:', error);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password, loginType = 'employee') => {
    try {
      const endpoint = loginType === 'beneficiary' ? '/auth/beneficiary-login' : '/auth/login';
      const response = await axios.post(endpoint, { email, password });
      const { token: newToken } = response.data;
      // Set token first so subsequent requests include it
      setToken(newToken);
      // Immediately fetch the current user using the new token
      const meResponse = await axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${newToken}` }
      });
      const userData = meResponse.data;
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (fullname, email, password, role, department_college) => {
    try {
      const response = await axios.post('/auth/register', { 
        fullname, 
        email, 
        password, 
        role, 
        department_college 
      });
      const { token: newToken } = response.data;
      setToken(newToken);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      // Call the backend logout endpoint to log the logout action
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call success
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const logoutWithRedirect = async (navigate) => {
    const currentUser = user;
    
    try {
      // Call the backend logout endpoint to log the logout action
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call success
      setToken(null);
      setUser(null);
      setLoading(false);
      
      // Small delay to ensure state is cleared before redirect
      setTimeout(() => {
        // Role-based redirect logic
        if (currentUser && currentUser.role === 'Beneficiary') {
          // Beneficiaries return to portal
          navigate('/portal');
        } else {
          // All other roles (employees) go to employee login
          navigate('/login');
        }
      }, 100);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    logoutWithRedirect,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
