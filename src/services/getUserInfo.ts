import { axiosInstance, endpoints } from '../api/apiClient';
import { User } from '../types/types';

export const getUserInfo = async (): Promise<User | null> => {
  try {
    const response = await axiosInstance.get<User>(endpoints.USER);
    return response.data;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
};
