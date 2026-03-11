import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL || 'https://dashboard-backend-pj2u.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Track feature click
export const trackClick = async (featureName) => {
  try {
    await api.post('/track', { feature_name: featureName });
  } catch (error) {
    console.error('Tracking error:', error);
  }
};

// Get analytics with filters
export const getAnalytics = async (filters) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.ageGroup && filters.ageGroup !== 'All') params.append('ageGroup', filters.ageGroup);
    if (filters.gender && filters.gender !== 'All') params.append('gender', filters.gender);
    if (filters.selectedFeature) params.append('selectedFeature', filters.selectedFeature);
    
    const response = await api.get(`/analytics?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Analytics error:', error);
    return { barChartData: [], lineChartData: [] };
  }
};

// Save filters to cookies
export const saveFiltersToCookies = (filters) => {
  Cookies.set('dashboardFilters', JSON.stringify(filters), { 
    expires: 7,
    path: '/',
    sameSite: 'lax'
  });
};

// Load filters from cookies
export const loadFiltersFromCookies = () => {
  const saved = Cookies.get('dashboardFilters');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        startDate: parsed.startDate ? new Date(parsed.startDate) : new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: parsed.endDate ? new Date(parsed.endDate) : new Date(),
        ageGroup: parsed.ageGroup || 'All',
        gender: parsed.gender || 'All',
        selectedFeature: parsed.selectedFeature || null
      };
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const debugCookies = () => {
  if (import.meta.env.DEV) {
    console.log('All cookies:', document.cookie);
    const saved = Cookies.get('dashboardFilters');
    console.log('Dashboard filters cookie:', saved);
  }
};

export default api;