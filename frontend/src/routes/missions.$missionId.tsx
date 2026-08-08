import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Flag, Loader2, Lightbulb, Lock, Check } from "lucide-react";
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
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!session.token) navigate({ to: "/login" });
  }, [navigate]);

  const challenge = data?.challenges.find((c) => c.id === missionId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!flag.trim() || !challenge) return;
    setPending(true);
    try {
      const res = await verifyFlag(challenge.id, flag);
      setStatus(res.correct ? "ok" : "fail");
      if (res.correct) {
        toast.success(res.message);
        setFlag("");
        await qc.invalidateQueries({ queryKey: ["progress"] });
        await qc.invalidateQueries({ queryKey: ["leaderboard"] });
      } else {
        toast.error(res.message);
      }
    } finally {
      setPending(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="glass-panel h-80 animate-pulse opacity-50" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-foreground">Unknown mission</h1>
        <BackLink />
      </div>
    );
  }

  const levelIndex = data?.challenges.findIndex((c) => c.id === missionId) ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <BackLink />

      <header className="glass-panel animate-rise mt-5 p-6 rounded-xl sm:p-9">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
            Level {levelIndex}
          </h1>
          <span className="font-mono text-lg font-bold text-alien sm:text-xl">
            {challenge.points} XP
          </span>
        </div>

        {challenge.solved && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-alien/40 bg-alien/10 px-4 py-2 text-sm font-bold uppercase tracking-wider text-alien">
            <Check className="size-4" /> Flag captured
          </p>
        )}
      </header>

      {!challenge.solved && (
        <section
          className="glass-panel animate-rise mt-6 p-6 rounded-xl sm:p-9"
          style={{ animationDelay: "80ms" }}
        >
          {challenge.locked ? (
            <p className="flex items-center gap-2 text-base text-muted-foreground">
              <Lock className="size-5" /> This system is offline. Capture the previous flag to route
              power here.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row">
              <span className="relative flex flex-1 items-center">
                <Flag className="pointer-events-none absolute left-4 size-5 text-primary/70" />
                <input
                  value={flag}
                  onChange={(e) => {
                    setFlag(e.target.value);
                    setStatus("idle");
                  }}
                  placeholder="WLUG{...}"
                  className={`w-full rounded-md border bg-void/60 py-3.5 pl-12 pr-4 font-mono text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 sm:text-lg ${
                    status === "fail"
                      ? "border-destructive"
                      : status === "ok"
                        ? "border-alien"
                        : "border-input focus:border-primary"
                  }`}
                />
              </span>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center justify-center gap-2 rounded-md border border-primary/60 bg-primary/15 px-8 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/25 disabled:opacity-60 sm:text-base"
              >
                {pending && <Loader2 className="size-5 animate-spin" />}
                Submit Flag
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary sm:text-base"
    >
      <ArrowLeft className="size-5" /> Mission grid
    </Link>
  );
}
