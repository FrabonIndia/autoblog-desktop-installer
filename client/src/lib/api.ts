const API_BASE = import.meta.env.DEV ? "http://localhost:3001/api" : "/api";

function getAuthHeaders() {
  const token = sessionStorage.getItem("autoblog_token");
  if (token) {
    return { "Authorization": `Bearer ${token}` };
  }
  return {};
}

export async function apiRequest(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// Setup
export const checkSetupStatus = () => apiRequest("/setup/status");
export const completeSetup = (data: { username: string; password: string }) =>
  apiRequest("/setup", { method: "POST", body: JSON.stringify(data) });

// Auth
export const login = async (data: { username: string; password: string }) => {
  const response = await apiRequest("/login", { method: "POST", body: JSON.stringify(data) });
  if (response.token) {
    sessionStorage.setItem("autoblog_token", response.token);
  }
  return response;
};

export const logout = async () => {
  try {
    await apiRequest("/logout", { method: "POST" });
  } finally {
    sessionStorage.removeItem("autoblog_token");
    sessionStorage.removeItem("autoblog_logged_in");
  }
};

// Settings
export const getSettings = () => apiRequest("/settings");
export const saveSettings = (data: any) =>
  apiRequest("/settings", { method: "POST", body: JSON.stringify(data) });
export const analyzeWebsite = (url: string) =>
  apiRequest("/analyze-website", { method: "POST", body: JSON.stringify({ url }) });

// Blog Posts
export const getPosts = () => apiRequest("/posts");
export const getPost = (id: number) => apiRequest(`/posts/${id}`);
export const createPost = (data: any) =>
  apiRequest("/posts", { method: "POST", body: JSON.stringify(data) });
export const updatePost = (id: number, data: any) =>
  apiRequest(`/posts/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deletePost = (id: number) =>
  apiRequest(`/posts/${id}`, { method: "DELETE" });
export const publishPost = (id: number) =>
  apiRequest(`/posts/${id}/publish`, { method: "POST" });

// AI Generation
export const generatePost = (topic: string) =>
  apiRequest("/generate-post", { method: "POST", body: JSON.stringify({ topic }) });

// History
export const getGenerationHistory = (limit?: number) =>
  apiRequest(`/generation-history${limit ? `?limit=${limit}` : ""}`);
