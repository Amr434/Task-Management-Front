import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7249/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle data extraction and basic error mapping
apiClient.interceptors.response.use(
  (response) => {
    // If it's a 204 No Content, return an empty object or handle as needed
    if (response.status === 204) {
      return {} as any;
    }
    // Return just the data part by default for cleaner API calls
    return response.data;
  },
  (error) => {
    const errorData = error.response?.data;
    const message = errorData?.message || errorData?.title || error.message || "An unexpected error occurred";
    
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
