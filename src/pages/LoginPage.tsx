import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { login } from "../api/chat";
import { getErrorMessage } from "../api/client";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuthStore } from "../store/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user, tokens } = await login(email, password);
      setSession(user, tokens.access_token, tokens.refresh_token);
      navigate("/chat");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-full max-w-md place-content-center px-4">
      <form onSubmit={onSubmit} className="w-full space-y-4 rounded-2xl border border-white/10 bg-ink-900 p-8">
        <Link to="/" className="mb-2 inline-block text-xs text-slate-500 transition hover:text-slate-300">
          &larr; Back to home
        </Link>
        <h1 className="text-2xl font-semibold">Sign in to Nexus</h1>
        <p className="text-sm text-slate-400">Private two-person chat. Transport security in production via TLS.</p>
        <label className="block text-sm">
          Email
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm">
          Password
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-slate-400">
          No account?{" "}
          <Link className="text-accent" to="/register">
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}
