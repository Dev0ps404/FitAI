import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 20000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token refresh flow is added in Step 2 auth implementation.
    }

    return Promise.reject(error);
  },
);

export default apiClient;
