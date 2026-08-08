import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Flag, Loader2, Lock, Check, Zap, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getProgress, session, verifyFlag } from "@/lib/api";

export const Route = createFileRoute("/missions/$missionId")({
  head: () => ({
    meta: [
      { title: "Mission Briefing — LinuxDiary 7.0 CTF" },
      {
        name: "description",
        content: "Read the mission briefing, breach the target system and submit the captured flag.",
      },
      { property: "og:title", content: "Mission Briefing — LinuxDiary 7.0 CTF" },
      {
        property: "og:description",
        content: "Breach the target system and submit the captured flag to earn XP.",
      },
    ],
  }),
  component: MissionPage,
});

function MissionPage() {
  const { missionId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["progress"], queryFn: getProgress });

  const [flag, setFlag] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");

  useEffect(() => {
    if (!session.token) navigate({ to: "/login" });
  }, [navigate]);

  const challenge = data?.challenges.find((c) => c.id === missionId);
  const levelIndex = data?.challenges.findIndex((c) => c.id === missionId) ?? 0;
  const nextChallenge = data?.challenges[levelIndex + 1];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!flag.trim() || !challenge) return;
    setPending(true);
    try {
      const res = await verifyFlag(challenge.id, flag);
      setStatus(res.correct ? "ok" : "fail");
      if (res.correct) {
        // Rich custom success toast
        toast.custom(
          (id) => (
            <div className="w-[360px] rounded-2xl border border-cyan-400/30 bg-[#020a14] shadow-[0_0_40px_rgba(6,182,212,0.25)] p-5 flex flex-col gap-3 animate-rise">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-alien/15 border border-alien/40 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(96,165,250,0.3)]">
                  <Check className="size-5 text-alien" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-widest text-alien">
                    Sector Breached
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Flag authentication successful
                  </p>
                </div>
              </div>

              {/* Gradient divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

              {/* XP Award */}
              <div className="flex items-center justify-between bg-black/30 border border-slate-800 rounded-lg px-4 py-2.5">
                <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">XP Awarded</span>
                <span className="flex items-center gap-1.5 font-display text-lg font-bold text-amber-400">
                  <Zap className="size-4" />
                  +{challenge.points}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => toast.dismiss(id)}
                  className="flex-1 text-center text-xs font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 border border-slate-800 rounded-lg py-2 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                {nextChallenge && !nextChallenge.locked ? (
                  <Link
                    to="/missions/$missionId"
                    params={{ missionId: nextChallenge.id }}
                    onClick={() => toast.dismiss(id)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/40 bg-cyan-500/10 rounded-lg py-2 hover:bg-cyan-500/20 transition-colors"
                  >
                    Next Sector <ChevronRight className="size-3.5" />
                  </Link>
                ) : (
                  <Link
                    to="/"
                    onClick={() => toast.dismiss(id)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/40 bg-cyan-500/10 rounded-lg py-2 hover:bg-cyan-500/20 transition-colors"
                  >
                    Mission Map <ChevronRight className="size-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ),
          { duration: 6000, position: "top-center" }
        );
        setFlag("");
        await qc.invalidateQueries({ queryKey: ["progress"] });
        await qc.invalidateQueries({ queryKey: ["leaderboard"] });
      } else {
        toast.error(res.message, {
          description: "That flag doesn't match. Try again.",
          style: { fontFamily: "JetBrains Mono, monospace" },
        });
      }
    } finally {
      setPending(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <div className="glass-panel h-20 animate-pulse opacity-50" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl text-foreground">Unknown mission</h1>
        <BackLink />
      </div>
    );
  }

  return (
    <>
      {/* Fixed top-left Back button */}
      <BackLink />

      <div className="min-h-[80vh] flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md">
          <div className="glass-panel p-6 rounded-xl sm:p-8">
            {challenge.locked ? (
              <p className="flex items-center gap-2.5 text-base text-rose-400/90 font-mono bg-rose-500/5 border border-rose-500/20 p-4 rounded-lg">
                <Lock className="size-5 shrink-0" /> Target sector firewall is offline. Resolve previous sectors to route power.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <span className="relative flex items-center">
                  <Flag className="pointer-events-none absolute left-4 size-5 text-primary/70" />
                  <input
                    value={flag}
                    onChange={(e) => {
                      setFlag(e.target.value);
                      setStatus("idle");
                    }}
                    placeholder="WLUG{...}"
                    autoFocus
                    className={`w-full rounded-md border bg-void/60 py-3.5 pl-12 pr-4 font-mono text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 sm:text-lg ${
                      status === "fail"
                        ? "border-destructive focus:border-destructive"
                        : status === "ok"
                          ? "border-alien"
                          : "border-input focus:border-primary"
                    }`}
                  />
                </span>
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full flex items-center justify-center gap-2 rounded-md border border-primary/60 bg-primary/15 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/25 disabled:opacity-60 sm:text-base cursor-pointer"
                >
                  {pending && <Loader2 className="size-5 animate-spin" />}
                  Submit Flag
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      className="fixed top-24 left-6 z-50 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition-all hover:text-primary bg-black/50 backdrop-blur-md border border-slate-800 rounded-full px-4 py-2 hover:border-primary/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]"
    >
      <ArrowLeft className="size-3.5" /> Back
    </Link>
  );
}
