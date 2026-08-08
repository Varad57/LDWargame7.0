import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboard, session } from "@/lib/api";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Fleet Leaderboard — LinuxDiary 7.0 CTF" },
      {
        name: "description",
        content: "See the top LinuxDiary 7.0 pilots ranked by captured flags and total XP across the sector.",
      },
      { property: "og:title", content: "Fleet Leaderboard — LinuxDiary 7.0 CTF" },
      {
        property: "og:description",
        content: "Top LinuxDiary 7.0 pilots ranked by captured flags and total XP.",
      },
    ],
  }),
  component: LeaderboardPage,
});

const podium = [
  "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/1st%20place%20medal/3D/1st_place_medal_3d.png",
  "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/2nd%20place%20medal/3D/2nd_place_medal_3d.png",
  "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/3rd%20place%20medal/3D/3rd_place_medal_3d.png"
];

function LeaderboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["leaderboard"], queryFn: getLeaderboard });
  const me = typeof window !== "undefined" ? session.username : null;

  return (
    <>
      <BackLink />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14 relative">
        <header className="animate-rise text-center">
        <h1 className="text-4xl font-bold text-foreground sm:text-6xl">
          Leaderboard
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Pilots ranked by captured flags across the sector.
        </p>
      </header>

      <div className="glass-panel animate-rise mt-10 overflow-hidden rounded-xl border border-border/70">
        <div className="grid grid-cols-[3.5rem_1fr_auto] gap-3 border-b border-border/70 px-5 py-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid-cols-[6rem_1fr_9rem_7rem] sm:px-7 sm:text-sm">
          <span>Rank</span>
          <span>Pilot</span>
          <span className="hidden sm:block">Flags</span>
          <span className="text-right">XP</span>
        </div>

        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse border-b border-border/40 opacity-40" />
          ))
        ) : !data || data.length === 0 ? (
          <div className="p-12 text-center font-mono text-base text-muted-foreground">
            NO ACTIVE PILOTS RECORDED YET. LOG IN AND CAPTURE A FLAG TO TAKE RANK #1!
          </div>
        ) : (
          data.map((entry, i) => {
            const podiumImage = podium[i];
            const isMe = entry.username.toLowerCase() === me?.toLowerCase();
            return (
              <div
                key={entry.username + i}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`animate-rise grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 border-b border-border/40 px-5 py-4.5 transition-colors last:border-0 hover:bg-primary/5 sm:grid-cols-[6rem_1fr_9rem_7rem] sm:px-7 ${
                  isMe ? "bg-primary/10" : ""
                }`}
              >
                <span className="flex items-center gap-2 sm:gap-3">
                  {podiumImage ? (
                    <img src={podiumImage} alt="Trophy" className="size-6 sm:size-8 drop-shadow-md" />
                  ) : (
                    <span className="w-6 sm:w-8" />
                  )}
                  <span className="font-mono text-base font-bold text-foreground sm:text-lg">
                    {entry.rank}
                  </span>
                </span>

                <span className="min-w-0">
                  <span
                    className={`block truncate font-display text-base font-bold sm:text-xl ${
                      isMe ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {entry.username}
                    {isMe && (
                      <span className="ml-2.5 font-sans text-xs uppercase tracking-widest text-primary">
                        (YOU)
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs uppercase tracking-wider text-muted-foreground sm:text-sm">
                    {entry.solved} flags
                  </span>
                </span>

                <span className="hidden font-mono text-base text-muted-foreground sm:block sm:text-lg">
                  {entry.solved}
                </span>

                <span className="text-right font-mono text-base font-extrabold text-alien sm:text-xl">
                  {entry.points}
                </span>
              </div>
            );
          })
        )}
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
