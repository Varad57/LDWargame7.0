import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getProgress, session } from "@/lib/api";

export function Navbar() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["progress"],
    queryFn: getProgress,
    enabled: typeof window !== "undefined" && Boolean(session.token),
  });

  const authed = typeof window !== "undefined" && Boolean(session.token);
  const username = data?.username ?? session.username ?? "OPERATOR";
  const initial = username.charAt(0).toUpperCase();

  const pathname = useLocation({ select: (loc) => loc.pathname });

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="bg-[#0b0f19]/90 border-b border-[#1c2742] backdrop-blur-md">
        <nav className="mx-auto flex h-20 items-center justify-between px-6 lg:px-8">
          {/* Left: Operator Info */}
          <div className="flex items-center gap-4 w-1/3">
            {authed && (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-cyan-500 bg-cyan-950/30 text-xl font-bold text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  {initial}
                </div>
                <div className="flex flex-col">
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest text-cyan-500">
                    Operator
                  </span>
                  <span className="font-display text-xl font-bold uppercase tracking-wider text-white">
                    {username}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Center: Title */}
          <div className="flex flex-col items-center justify-center w-1/3">
            <h1 className="font-display text-2xl font-bold tracking-[0.2em] text-white">
              LinuxDairy 7.0
            </h1>
            <span className="text-[0.65rem] font-bold tracking-[0.25em] text-slate-500 uppercase">
              Wargames
            </span>
          </div>

          {/* Right: Score & Actions */}
          <div className="flex items-center justify-end gap-6 w-1/3">
            {authed && (
              <div className="flex flex-col items-center mr-2">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-500">
                  Score
                </span>
                <span className="font-display text-2xl font-bold text-white leading-none mt-1.5">
                  {data?.points ?? 0}
                </span>
              </div>
            )}

            <Link
              to="/leaderboard"
              className="rounded-lg border border-white/10 bg-[#0f1523] px-6 py-3 text-sm sm:text-base font-bold uppercase tracking-wider text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              Leaderboard
            </Link>

            {authed ? (
              <button
                onClick={() => {
                  session.clear();
                  navigate({ to: "/login" });
                }}
                className="rounded-lg border border-white/10 bg-[#0f1523] px-6 py-3 text-sm sm:text-base font-bold uppercase tracking-wider text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                Sign Out
              </button>
            ) : pathname !== "/login" && pathname !== "/leaderboard" ? (
              <Link
                to="/login"
                className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-6 py-3 text-sm sm:text-base font-bold uppercase tracking-wider text-cyan-400 transition-colors hover:bg-cyan-500/20"
              >
                Board
              </Link>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
