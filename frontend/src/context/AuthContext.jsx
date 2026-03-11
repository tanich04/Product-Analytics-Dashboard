import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api'; // Import the configured api instance

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set token in api instance
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  const login = async (username, password) => {
    try {
      console.log('🔑 Login attempt to:', `${api.defaults.baseURL}/auth/login`);
      
      const response = await api.post('/auth/login', {
        username,
        password
      });
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Is the backend running?'
      };
    }
  };

  const register = async (username, password, age, gender) => {
    try {
      console.log('📝 Registration attempt to:', `${api.defaults.baseURL}/auth/register`);
      console.log('Data:', { username, age, gender });
      
      const response = await api.post('/auth/register', {
        username,
        password,
        age: parseInt(age),
        gender
      });
      
      return { success: true, userId: response.data.userId };
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    // Verify token on load
    const verifyToken = async () => {
      if (token) {
        try {
          // Optionally verify token with backend
          setLoading(false);
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};