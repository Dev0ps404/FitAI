import apiClient from "./apiClient";

function extractData(response) {
  return response?.data?.data ?? null;
}

export const workoutsApi = {
  async getStats() {
    const response = await apiClient.get("/workouts/stats");
    return extractData(response);
  },

  async list(params = {}) {
    const response = await apiClient.get("/workouts", { params });
    return extractData(response);
  },
};

export const dietApi = {
  async getSummary() {
    const response = await apiClient.get("/diet/summary");
    return extractData(response);
  },

  async list(params = {}) {
    const response = await apiClient.get("/diet", { params });
    return extractData(response);
  },

  async requestAiPlan(payload) {
    const response = await apiClient.post("/diet/ai-plan", payload);
    return extractData(response);
  },
};

export const progressApi = {
  async getAnalytics() {
    const response = await apiClient.get("/progress/analytics");
    return extractData(response);
  },

  async list(params = {}) {
    const response = await apiClient.get("/progress", { params });
    return extractData(response);
  },

  async create(payload) {
    const response = await apiClient.post("/progress", payload);
    return extractData(response);
  },
};

export const trainerApi = {
  async list(params = {}) {
    const response = await apiClient.get("/trainers", { params });
    return extractData(response);
  },

  async getClients() {
    const response = await apiClient.get("/trainers/me/clients");
    return extractData(response);
  },

  async reviewApplication(trainerId, payload) {
    const response = await apiClient.patch(
      `/trainers/${trainerId}/approval`,
      payload,
    );
    return extractData(response);
  },
};

export const bookingApi = {
  async list(params = {}) {
    const response = await apiClient.get("/bookings", { params });
    return extractData(response);
  },

  async updateStatus(bookingId, status) {
    const response = await apiClient.patch(`/bookings/${bookingId}/status`, {
      status,
    });
    return extractData(response);
  },

  async cancel(bookingId) {
    const response = await apiClient.patch(`/bookings/${bookingId}/cancel`);
    return extractData(response);
  },
};

export const adminApi = {
  async getAnalytics() {
    const response = await apiClient.get("/admin/analytics");
    return extractData(response);
  },

  async listTrainerApplications(params = {}) {
    const response = await apiClient.get("/admin/trainer-applications", {
      params,
    });
    return extractData(response);
  },
};

export const notificationsApi = {
  async list(params = {}) {
    const response = await apiClient.get("/notifications", { params });
    return extractData(response);
  },

  async markAllRead() {
    const response = await apiClient.patch("/notifications/read-all");
    return extractData(response);
  },
};

export const aiApi = {
  async listSessions() {
    const response = await apiClient.get("/ai/sessions");
    return extractData(response);
  },

  async getSession(sessionId) {
    const response = await apiClient.get(`/ai/sessions/${sessionId}`);
    return extractData(response);
  },

  async sendMessage(payload) {
    const response = await apiClient.post("/ai/chat", payload);
    return extractData(response);
  },

  async deleteSession(sessionId) {
    const response = await apiClient.delete(`/ai/sessions/${sessionId}`);
    return extractData(response);
  },

  async getRecommendations() {
    const response = await apiClient.get("/ai/recommendations");
    return extractData(response);
  },
};
