import { Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useRef, useEffect } from "react";
import { type Challenge } from "@/lib/api";

type MissionMapProps = {
  challenges: Challenge[];
};

const ROCKET_IMG = "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rocket/3D/rocket_3d.png";

const PLANET_IMAGES = [
  "/fonts/astro-space/planets/planet1.png",
  "/fonts/astro-space/planets/planet2.png",
  "/fonts/astro-space/planets/planet3.png",
  "/fonts/astro-space/planets/planet4.png",
  "/fonts/astro-space/planets/planet5.png",
  "/fonts/astro-space/planets/planet6.png",
  "/fonts/astro-space/planets/planet7.png",
  "/fonts/astro-space/planets/planet8.png",
  "/fonts/astro-space/planets/planet9.png",
  "/fonts/astro-space/planets/planet10.png",
  "/fonts/astro-space/planets/planet11.png",
];

export function MissionMap({ challenges }: MissionMapProps) {
  // Height per step in pixels
  const STEP_Y = 200;
  const paddingY = 200;
  const totalHeight = Math.max(0, challenges.length - 1) * STEP_Y + paddingY * 2;

  // Find the exact challenge that should be in focus (first unlocked)
  const firstUnlockedIndex = challenges.findIndex((c) => !c.locked && !c.solved);
  const activeFocusId =
    firstUnlockedIndex !== -1 ? challenges[firstUnlockedIndex]?.id ?? null : null;

  // Ref to scroll the active node into view on mount
  const activeNodeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeNodeRef.current) {
      activeNodeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeFocusId]);

  // Calculate coordinates for each challenge
  const nodes = challenges.map((c, i) => {
    // Zigzag from bottom to top
    const y = totalHeight - paddingY - i * STEP_Y;

    // Snake pattern for X (percentages) pushed cleanly to the boundaries
    const x = i % 2 === 0 ? 15 : 85;

    return { ...c, index: i, x, y };
  });

  return (
    <>
      <style>{`
        @keyframes float-node {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .planet-float-wrapper {
          display: inline-block;
        }
        .group:hover .planet-float-wrapper {
          animation: float-node 2.5s ease-in-out infinite;
        }
      `}</style>
      <div
        className="relative w-full mx-auto"
        style={{ height: `${totalHeight}px` }}
      >
        {/* Background SVG for lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 100 ${totalHeight}`}
          preserveAspectRatio="none"
          style={{ zIndex: 0 }}
        >
          <path
            d={
              nodes
                .map(
                  (n, i) =>
                    `${i === 0 ? "M" : "L"} ${n.x} ${n.y}`
                )
                .join(" ")
            }
            fill="none"
            stroke="rgba(6, 182, 212, 0.4)"
            strokeWidth="3"
            strokeDasharray="1.5 3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Render Nodes */}
        {nodes.map((node) => {
          const isFocus = node.id === activeFocusId;
          const labelAlign = node.x >= 50 ? "left" : "right";

          return (
            <div
              key={node.id}
              ref={isFocus ? activeNodeRef : undefined}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${node.x}%`, top: `${node.y}px` }}
            >
              <Link to="/missions/$missionId" params={{ missionId: node.id }} className={node.locked ? "pointer-events-none opacity-40 grayscale blur-[1px]" : ""}>
                <div className="relative group w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center cursor-pointer">

                  {/* Orbital Ring */}
                  <div className={`absolute inset-0 rounded-full border ${isFocus ? 'border-cyan-400 border-dashed animate-[spin_12s_linear_infinite]' : 'border-slate-800'}`}></div>

                  {/* Lock Icon */}
                  {node.locked && (
                    <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0b0f19] border border-slate-700 flex items-center justify-center shadow-lg pointer-events-none z-20">
                      <Lock className="size-3.5 sm:size-4 text-slate-500" />
                    </div>
                  )}

                  {/* Planet Core */}
                  <div className={`relative w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${isFocus ? 'bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_50px_rgba(6,182,212,0.9)] group-hover:border-cyan-300' :
                      node.solved ? 'bg-slate-800 border-2 border-alien/40 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_35px_rgba(96,165,250,0.5)] group-hover:border-alien/80' :
                        'bg-slate-900 border border-slate-700 shadow-md opacity-80 group-hover:opacity-100 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]'
                    }`}>
                    <span className="planet-float-wrapper">
                      <img
                        src={PLANET_IMAGES[node.index % PLANET_IMAGES.length]}
                        alt="Planet"
                        className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-lg transition-transform duration-300 group-hover:scale-125 object-contain"
                      />
                    </span>
                  </div>

                  {/* Connection Line */}
                  <div className={`absolute top-1/2 h-[1px] w-6 sm:w-10 border-t ${isFocus ? 'border-cyan-400/50 border-dashed' : 'border-slate-700 border-solid'}`}
                    style={{ [labelAlign === 'right' ? 'left' : 'right']: '100%' }}>
                  </div>

                  {/* Label Box */}
                  <div className={`absolute top-1/2 -translate-y-1/2 w-64 rounded-full border ${isFocus ? 'border-cyan-400/40 bg-black/80 shadow-[0_0_15px_rgba(6,182,212,0.15)]' :
                      'border-slate-800/80 bg-black/60'
                    } flex flex-col justify-center px-6 py-3 transition-colors group-hover:bg-[#000000] backdrop-blur-md`}
                    style={{ [labelAlign === 'right' ? 'left' : 'right']: 'calc(100% + 24px)' }}>

                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-[0.65rem] font-bold uppercase tracking-widest ${isFocus ? 'text-white' : 'text-slate-500'}`}>
                        Level {String(node.index).padStart(2, "0")}
                      </span>
                      <span className={`text-[0.6rem] font-bold px-2.5 py-0.5 rounded-full ${isFocus ? 'bg-amber-400 text-black' :
                          node.locked ? 'border border-slate-700 text-slate-500' :
                            'bg-amber-900/40 text-amber-500'
                        }`}>
                        +{node.points} PTS
                      </span>
                    </div>
                    <span className={`font-display text-sm font-bold uppercase tracking-wider truncate w-full ${isFocus ? 'text-white' : 'text-slate-400'}`}>
                      Sector {node.index}
                    </span>
                  </div>

                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
