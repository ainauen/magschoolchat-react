import axios from "axios";

export function createApiClient({ getAccessToken, refreshAccessToken, onAuthFailed }) {
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "", // e.g. https://localhost:5001
    withCredentials: true, // required for refresh cookie
  });

  api.interceptors.request.use((config) => {
    const token = getAccessToken?.();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    async (err) => {
      const original = err.config;

      // Only retry once
      if (err.response?.status === 401 && !original?._retry) {
        original._retry = true;

        try {
          const newToken = await refreshAccessToken?.();
          if (newToken) {
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${newToken}`;
            return api.request(original);
          }
        } catch {
          // swallow and handle below
        }

        onAuthFailed?.();
      }

      return Promise.reject(err);
    }
  );

  return api;
}