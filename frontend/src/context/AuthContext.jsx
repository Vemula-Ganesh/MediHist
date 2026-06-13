import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure axios instance globally
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Profile context delegation (switching scope to view dependent's records)
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [selectedProfileName, setSelectedProfileName] = useState(null);

  // Sync token headers on reload
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    
    if (accessToken && storedUser) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Request interceptor to catch expired tokens and rotate them
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          try {
            const res = await axios.post('/api/auth/refresh-token', { refreshToken });
            const newAccessToken = res.data.accessToken;
            
            localStorage.setItem('accessToken', newAccessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            
            return api(originalRequest);
          } catch (refreshErr) {
            // Failed to rotate - logout user
            logout();
          }
        }
      }
      return Promise.reject(error);
    }
  );

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user: loggedUser } = res.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setUser(loggedUser);
      setSelectedProfileId(null); // Reset delegation scope
      setSelectedProfileName(null);
      return loggedUser;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Authentication failed');
    }
  };

  const registerUser = async (email, password, role) => {
    try {
      const res = await api.post('/auth/register', { email, password, role });
      const { accessToken, refreshToken, user: newUser } = res.data;

      // Store tokens and auto-login
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setUser(newUser);
      return newUser;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Registration request failed');
    }
  };

  const verifyOTP = async (email, code) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, code });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'OTP verification failed');
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (e) {
      // Invalidate client tokens anyway
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setSelectedProfileId(null);
      setSelectedProfileName(null);
    }
  };

  const switchProfileScope = (dependentUserId, dependentName = null) => {
    if (dependentUserId === user?.id) {
      setSelectedProfileId(null);
      setSelectedProfileName(null);
    } else {
      setSelectedProfileId(dependentUserId);
      setSelectedProfileName(dependentName);
    }
  };

  const value = {
    user,
    loading,
    login,
    registerUser,
    verifyOTP,
    logout,
    selectedProfileId,
    selectedProfileName,
    switchProfileScope,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
