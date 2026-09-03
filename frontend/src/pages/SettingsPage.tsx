import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, useReducedMotion } from "motion/react";
import { updateProfile, changePassword, logout } from "../api/chat";
import { getErrorMessage } from "../api/client";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuthStore } from "../store/auth";
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  LogOut,
  Sun,
  Moon,
  Palette,
} from "lucide-react";

function SectionHeader({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
      <h2 className="text-sm font-semibold text-slate-200">
        {title}
      </h2>
    </div>
  );
}

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    const stored = localStorage.getItem("nexus-theme") as "light" | "dark" | "system" | null;
    return stored || "system";
  });

  const applyTheme = (t: "light" | "dark" | "system") => {
    setTheme(t);
    localStorage.setItem("nexus-theme", t);
    const root = document.documentElement;
    if (t === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else if (t === "dark") {
      root.classList.remove("light");
      root.classList.add("dark");
    } else {
      root.classList.remove("light", "dark");
    }
  };

  return { theme, applyTheme };
}

export function SettingsPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const user = useAuthStore((s) => s.user);
  const { clear, refreshToken, setUser } = useAuthStore();
  const { theme, applyTheme } = useTheme();

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [notifSounds, setNotifSounds] = useState(() => {
    return localStorage.getItem("nexus-notif-sounds") !== "false";
  });
  const [notifDesktop, setNotifDesktop] = useState(() => {
    return localStorage.getItem("nexus-notif-desktop") !== "false";
  });

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const updated = await updateProfile({
        username: username !== user?.username ? username : undefined,
        email: email !== user?.email ? email : undefined,
      });
      setUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) await logout(refreshToken);
    } catch {
      // ignore
    }
    clear();
    navigate("/login");
  };

  const toggleNotifSounds = () => {
    const next = !notifSounds;
    setNotifSounds(next);
    localStorage.setItem("nexus-notif-sounds", String(next));
  };

  const toggleNotifDesktop = () => {
    const next = !notifDesktop;
    setNotifDesktop(next);
    localStorage.setItem("nexus-notif-desktop", String(next));
    if (next && "Notification" in window) {
      Notification.requestPermission();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-surface">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl px-4 py-3">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white active:scale-[0.95]"
          aria-label="Back to chat"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-100">Settings</h1>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-white/[0.06] bg-surface-raised p-6"
        >
          <SectionHeader icon={User} title="Profile" />
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="text-slate-400">Username</span>
              <Input
                required
                minLength={3}
                maxLength={32}
                pattern="[a-zA-Z0-9_]+"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1.5"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Email</span>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </label>
            <Button type="submit" disabled={profileLoading} className="w-full">
              {profileLoading ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </motion.section>

        <motion.section
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-white/[0.06] bg-surface-raised p-6"
        >
          <SectionHeader icon={Lock} title="Change Password" />
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="text-slate-400">Current password</span>
              <Input type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1.5" />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">New password</span>
              <Input type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1.5" />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Confirm new password</span>
              <Input type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1.5" />
            </label>
            <Button type="submit" disabled={passwordLoading} className="w-full">
              {passwordLoading ? "Changing..." : "Change password"}
            </Button>
          </form>
        </motion.section>

        <motion.section
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-white/[0.06] bg-surface-raised p-6"
        >
          <SectionHeader icon={Palette} title="Appearance" />
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: "dark" as const, icon: Moon, label: "Dark" },
              { value: "light" as const, icon: Sun, label: "Light" },
              { value: "system" as const, icon: Palette, label: "System" },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => applyTheme(opt.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                  theme === opt.value
                    ? "border-accent bg-accent/[0.12] text-accent"
                    : "border-white/[0.06] bg-surface-elevated text-slate-400 hover:border-white/[0.12] hover:text-slate-200"
                }`}
              >
                <opt.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-white/[0.06] bg-surface-raised p-6"
        >
          <SectionHeader icon={Bell} title="Notifications" />
          <div className="space-y-4">
            <ToggleRow
              label="Sound notifications"
              description="Play a sound when receiving new messages"
              enabled={notifSounds}
              onToggle={toggleNotifSounds}
            />
            <ToggleRow
              label="Desktop notifications"
              description="Show system notifications for new messages"
              enabled={notifDesktop}
              onToggle={toggleNotifDesktop}
            />
          </div>
        </motion.section>

        <motion.section
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-red-500/10 bg-surface-raised p-6"
        >
          <h2 className="text-sm font-semibold text-red-400 mb-4">Account</h2>
          <Button variant="danger" onClick={handleLogout} className="w-full gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </motion.section>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          enabled ? "bg-accent" : "bg-white/[0.1]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
