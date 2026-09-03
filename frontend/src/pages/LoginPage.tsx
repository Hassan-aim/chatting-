import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { login } from "../api/chat";
import { getErrorMessage } from "../api/client";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuthStore } from "../store/auth";
import { MessageCircle } from "lucide-react";

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
      <form onSubmit={onSubmit} className="w-full space-y-5 rounded-2xl border border-white/[0.06] bg-surface-raised p-8">
        <Link to="/" className="mb-1 inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-300">
          <span>&larr;</span> Back to home
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
            <MessageCircle className="h-4 w-4 text-accent" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold">Sign in to Nexus</h1>
        </div>

        <p className="text-sm text-slate-400">Private two-person chat. Transport security in production via TLS.</p>

        <label className="block text-sm">
          <span className="text-slate-300 font-medium">Email</span>
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
        </label>

        <label className="block text-sm">
          <span className="text-slate-300 font-medium">Password</span>
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
          />
        </label>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Sign in"}
        </Button>

        <p className="text-center text-sm text-slate-500">
          No account?{" "}
          <Link className="text-accent hover:text-accent-muted transition" to="/register">
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}
