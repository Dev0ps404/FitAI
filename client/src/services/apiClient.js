import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000/api";

let accessTokenGetter = () => "";

export function registerAccessTokenGetter(getter) {
  accessTokenGetter = typeof getter === "function" ? getter : () => "";
}

export function getApiErrorMessage(error, fallbackMessage = "Request failed") {
  const responseMessage = error?.response?.data?.message;
  const validationMessage = error?.response?.data?.errors?.join?.("; ");

  if (
    typeof responseMessage === "string" &&
    responseMessage.trim().length > 0
  ) {
    return responseMessage;
  }

  if (
    typeof validationMessage === "string" &&
    validationMessage.trim().length > 0
  ) {
    return validationMessage;
  }

  return fallbackMessage;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = accessTokenGetter();

  if (accessToken) {
    config.headers = config.headers || {};

    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return config;
});

export default apiClient;
