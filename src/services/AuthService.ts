import { axiosInstance, endpoints } from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email: string, password: string) => {
  try {
    const response = await axiosInstance.post(endpoints.LOGIN, {
      email,
      password,
    });
    const { access, refresh } = response.data;

    // Store access and refresh tokens
    await AsyncStorage.setItem('accessToken', access);
    await AsyncStorage.setItem('refreshToken', refresh);

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout and clear tokens
export const logout = async () => {
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('refreshToken');
};
