import apiClient, { API_BASE_URL } from "./apiClient";

function getResponseData(response) {
  return response?.data ?? null;
}

const authApi = {
  async signup(payload) {
    const response = await apiClient.post("/auth/signup", payload);
    return getResponseData(response);
  },

  async login(payload) {
    const response = await apiClient.post("/auth/login", payload);
    return getResponseData(response);
  },

  async getMe() {
    const response = await apiClient.get("/auth/me");
    return getResponseData(response);
  },

  async updateMe(payload) {
    const response = await apiClient.patch("/auth/me", payload);
    return getResponseData(response);
  },

  async changePassword(payload) {
    const response = await apiClient.patch("/auth/change-password", payload);
    return getResponseData(response);
  },

  async refreshSession(refreshToken) {
    const body = refreshToken ? { refreshToken } : {};
    const response = await apiClient.post("/auth/refresh", body);
    return getResponseData(response);
  },

  async logout() {
    const response = await apiClient.post("/auth/logout");
    return getResponseData(response);
  },

  async logoutAll() {
    const response = await apiClient.post("/auth/logout-all");
    return getResponseData(response);
  },

  async getSessions() {
    const response = await apiClient.get("/auth/sessions");
    return getResponseData(response);
  },

  async revokeSession(sessionId) {
    const response = await apiClient.delete(`/auth/sessions/${sessionId}`);
    return getResponseData(response);
  },

  async forgotPassword(payload) {
    const response = await apiClient.post("/auth/forgot-password", payload);
    return getResponseData(response);
  },

  async resetPassword(payload) {
    const response = await apiClient.post("/auth/reset-password", payload);
    return getResponseData(response);
  },
};

export function getGoogleOAuthUrl() {
  return `${API_BASE_URL}/auth/google`;
}

export default authApi;
