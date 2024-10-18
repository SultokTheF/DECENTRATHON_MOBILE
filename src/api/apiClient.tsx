// apiConfig.ts

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define your API base URL here
const API_BASE_URL = process.env.API_BASE_URL || 'http://10.73.62.120:8000/';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define all your API endpoints here
const endpoints = {
  REGISTER: 'user/register/',
  LOGIN: 'user/login/',
  USER: 'user/user/',
  USERS: 'user/users/',
  CENTERS: 'api/centers/',
  SECTIONS: 'api/sections/',
  CATEGORIES: 'api/categories/',
  SUBSCRIPTIONS: 'api/subscriptions/',
  SCHEDULES: 'api/schedules/',
  RECORDS: 'api/records/',
  FEEDBACKS: 'api/feedbacks/',
  CONFIRM_ATTENDANCE: 'api/records/confirm_attendance/',
  CANCEL_RESERVATION: 'api/records/cancel_reservation/',
  SUBMIT_TEST: 'api/submit_test/', // Endpoint to submit test answers
  GET_SYLLABUSES: 'api/get_tests/', // Endpoint to fetch syllabuses for a section
  GET_TEST_BY_ID: 'api/get_test/', // Endpoint to fetch a specific test by its ID
};

// Function to get the access token from AsyncStorage
const getAccessToken = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  return token;
};

// Function to refresh the access token using the refresh token
const refreshAccessToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await axios.post(`${API_BASE_URL}user/token/refresh/`, {
      refresh: refreshToken,
    });

    await AsyncStorage.setItem('accessToken', response.data.access);
    return response.data.access;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    // Optionally, handle token refresh failure (e.g., navigate to login screen)
    return null;
  }
};

// Axios interceptor to add the access token to every request
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Axios interceptor to handle 401 errors (expired tokens)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is due to an expired token
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        // Update the Authorization header and retry the original request
        axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export { axiosInstance, endpoints };
