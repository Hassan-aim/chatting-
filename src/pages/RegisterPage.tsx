import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { register } from "../api/chat";
import { getErrorMessage } from "../api/client";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuthStore } from "../store/auth";

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user, tokens } = await register(username, email, password);
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
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <label className="block text-sm">
          Username
          <Input
            required
            minLength={3}
            maxLength={32}
            pattern="[a-zA-Z0-9_]+"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Email
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm">
          Password
          <Input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating…" : "Register"}
        </Button>
        <p className="text-center text-sm text-slate-400">
          Already registered?{" "}
          <Link className="text-accent" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
