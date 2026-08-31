import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { fetchMe } from "../api/chat";
import { useAuthStore } from "../store/auth";
import type { ApiSuccess, Tokens } from "../types";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { accessToken, refreshToken, setSession, clear } = useAuthStore();
  const [ready, setReady] = useState(Boolean(accessToken));

  useEffect(() => {
    if (accessToken) {
      setReady(true);
      return;
    }
    if (!refreshToken) {
      setReady(true);
      return;
    }
    const base = import.meta.env.VITE_API_BASE_URL || "";
    void (async () => {
      try {
        const res = await axios.post<ApiSuccess<Tokens>>(`${base}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const tokens = res.data.data;
        useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token);
        const me = await fetchMe();
        setSession(me, tokens.access_token, tokens.refresh_token);
      } catch {
        clear();
      } finally {
        setReady(true);
      }
    })();
  }, [accessToken, refreshToken, setSession, clear]);

  if (!ready) {
    return (
      <div className="grid h-full place-items-center text-slate-400" role="status">
        Restoring session…
      </div>
    );
  }

  if (!useAuthStore.getState().accessToken) return <Navigate to="/login" replace />;
  return children;
}
