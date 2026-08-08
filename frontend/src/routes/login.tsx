import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, User, KeyRound, Terminal, ArrowLeft } from "lucide-react";
import { login, session } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Access Terminal — LinuxDiary 7.0 CTF" },
      {
        name: "description",
        content: "Authenticate at the LinuxDiary 7.0 docking terminal to begin capturing flags in deep space.",
      },
      { property: "og:title", content: "Access Terminal — LinuxDiary 7.0 CTF" },
      {
        property: "og:description",
        content: "Authenticate at the LinuxDiary 7.0 docking terminal to begin capturing flags.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await login(username, password);
      session.save(res.token, res.username);
      await qc.invalidateQueries({ queryKey: ["progress"] });
      await qc.invalidateQueries({ queryKey: ["leaderboard"] });
      navigate({ to: "/" });
    } catch {
      setError("ACCESS DENIED — username and password required.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12 relative">
      <div className="w-full max-w-lg animate-rise">
        <div className="glass-panel rounded-xl p-8 sm:p-10">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Wargames
            </h1>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-6">
            <Field
              icon={<User className="size-5" />}
              label="Username"
              value={username}
              onChange={setUsername}
              placeholder="Username"
              autoComplete="username"
            />
            <Field
              icon={<KeyRound className="size-5" />}
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Password"
              type="password"
              autoComplete="current-password"
            />

            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 font-mono text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-primary/60 bg-primary/5 px-5 py-3.5 font-display text-base font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/15 disabled:opacity-60"
            >
              {pending && <Loader2 className="size-5 animate-spin" />}
              {pending ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground sm:text-sm">
        {label}
      </span>
      <span className="relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 text-primary/70">{icon}</span>
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-input bg-void/60 py-3.5 pl-11 pr-4 font-mono text-base text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:shadow-[var(--shadow-neon-strong)] sm:text-lg"
        />
      </span>
    </label>
  );
}
