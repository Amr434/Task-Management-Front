import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7249/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.status === 204) {
      return {} as any;
    }
    return response.data;
  },
  (error) => {
    const errorData = error.response?.data;
    const message = errorData?.message || errorData?.title || error.message || "An unexpected error occurred";

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
