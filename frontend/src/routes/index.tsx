import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getProgress, session } from "@/lib/api";
import { MissionMap } from "@/components/MissionMap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Missions — LinuxDiary 7.0 Deep Space CTF" },
      {
        name: "description",
        content:
          "Browse the LinuxDiary 7.0 mission map: unlock orbital hacking challenges one by one, capture flags and earn XP.",
      },
      { property: "og:title", content: "Missions — LinuxDiary 7.0 Deep Space CTF" },
      {
        property: "og:description",
        content: "Unlock orbital hacking challenges, capture flags and earn XP in the LinuxDiary 7.0 arena.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["progress"], queryFn: getProgress });

  useEffect(() => {
    if (!session.token) navigate({ to: "/login" });
  }, [navigate]);

  const challenges = data?.challenges ?? [];

  useEffect(() => {
    if (!isLoading && challenges.length > 0) {
      if (!sessionStorage.getItem("missionMapScrolled")) {
        sessionStorage.setItem("missionMapScrolled", "true");
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        }, 50);
      }
    }
  }, [isLoading, challenges.length]);

  return (
    <div className="w-full relative min-h-screen overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-8 sm:px-16 pt-20 pb-32">
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <span className="font-mono text-cyan-500 animate-pulse uppercase tracking-[0.3em]">
              SCANNING SECTORS...
            </span>
          </div>
        ) : (
          <MissionMap challenges={challenges} />
        )}
      </div>
    </div>
  );
}
