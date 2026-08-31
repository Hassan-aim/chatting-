import axios, { type AxiosError } from "axios";
import { useAuthStore } from "../store/auth";
import type { ApiErrorBody, ApiSuccess, Tokens } from "../types";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

export const api = axios.create({
  baseURL,
  timeout: 60_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config;
    if (!original || error.response?.status !== 401 || (original as { _retry?: boolean })._retry) {
      return Promise.reject(error);
    }
    (original as { _retry?: boolean })._retry = true;
    if (!refreshing) {
      refreshing = (async () => {
        const refresh = useAuthStore.getState().refreshToken;
        if (!refresh) return null;
        try {
          const res = await axios.post<ApiSuccess<Tokens>>(`${baseURL}/api/auth/refresh`, {
            refresh_token: refresh,
          });
          const tokens = res.data.data;
          useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token);
          return tokens.access_token;
        } catch {
          useAuthStore.getState().clear();
          return null;
        } finally {
          refreshing = null;
        }
      })();
    }
    const token = await refreshing;
    if (!token) return Promise.reject(error);
    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  },
);

export function getErrorMessage(err: unknown): string {
  const ax = err as AxiosError<ApiErrorBody>;
  return ax.response?.data?.error?.message || ax.message || "Something went wrong";
}
