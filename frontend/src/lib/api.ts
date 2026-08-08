/**
 * API layer for LinuxDiary 7.0.
 *
 * Every function below is a thin fetch template pointing at the real backend
 * endpoint. Until the backend exists, requests that fail (404 / network error)
 * fall back to local mock data so the UI stays fully interactive.
 * Delete `MOCK` + the `withFallback` wrapper once the API is live.
 */

export type Challenge = {
  id: string;
  title: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "insane";
  points: number;
  description: string;
  hint?: string | undefined;
  locked: boolean;
  solved: boolean;
};

export type Progress = {
  username: string;
  points: number;
  rank: number;
  solvedIds: string[];
  challenges: Challenge[];
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  points: number;
  solved: number;
  callsign: string;
};

export type LoginResponse = { token: string; username: string };
export type VerifyResponse = { correct: boolean; message: string; points?: number };

const TOKEN_KEY = "linuxdiary.token";
const USER_KEY = "linuxdiary.user";
const SOLVED_KEY = "linuxdiary.solved";

const USERS_KEY = "linuxdiary.users";

export const session = {
  get token() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  get username() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(USER_KEY);
  },
  get solved(): string[] {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem(SOLVED_KEY) ?? "[]") as string[];
    } catch {
      return [];
    }
  },
  addSolved(id: string) {
    const next = Array.from(new Set([...session.solved, id]));
    window.localStorage.setItem(SOLVED_KEY, JSON.stringify(next));
    if (session.username) {
      const solvedChallenges = MOCK_CHALLENGES.filter((c) => next.includes(c.id));
      const points = solvedChallenges.reduce((sum, c) => sum + c.points, 0);
      session.updateUser(session.username, points, next);
    }
  },
  get allUsers(): Record<string, { points: number; solved: string[]; callsign: string }> {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(window.localStorage.getItem(USERS_KEY) ?? "{}");
    } catch {
      return {};
    }
  },
  updateUser(username: string, points: number, solvedIds: string[]) {
    if (typeof window === "undefined") return;
    const users = session.allUsers;
    users[username] = {
      points,
      solved: solvedIds,
      callsign: users[username]?.callsign || "Sector Pilot",
    };
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
  save(token: string, username: string) {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, username);
    session.updateUser(
      username,
      session.solved.reduce((sum, id) => {
        const c = MOCK_CHALLENGES.find((ch) => ch.id === id);
        return sum + (c?.points ?? 0);
      }, 0),
      session.solved,
    );
  },
  clear() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(SOLVED_KEY);
    window.sessionStorage.removeItem("missionMapScrolled");
  },
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8081";
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err.message) msg = err.message;
    } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

/* ------------------------------- endpoints ------------------------------- */

export async function login(username: string, password: string) {
  const data = await request<{
    success: boolean;
    token: string;
    callsign: string;
    message?: string;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ callsign: username, password }),
  });
  if (!data.success) throw new Error(data.message || "Failed to login");
  return { token: data.token, username: data.callsign };
}

export async function getProgress() {
  const data = await request<{
    success: boolean;
    callsign: string;
    currentLevel: number;
    totalPoints: number;
  }>("/api/progress");

  const challenges: Challenge[] = MOCK_CHALLENGES.map((c, i) => {
    // CurrentLevel implies how many are completely solved. So if CurrentLevel is 2, index 0 and 1 are solved.
    return {
      ...c,
      solved: i < data.currentLevel,
      locked: i > data.currentLevel,
    };
  });
  const solvedIds = MOCK_CHALLENGES.slice(0, data.currentLevel).map((c) => c.id);

  if (session.username) {
    session.updateUser(session.username, data.totalPoints, solvedIds);
  }

  return {
    username: data.callsign,
    points: data.totalPoints,
    rank: 1,
    solvedIds,
    challenges,
  };
}

export async function verifyFlag(challengeId: string, flag: string) {
  const levelIndex = MOCK_CHALLENGES.findIndex((c) => c.id === challengeId);
  const data = await request<{ success: boolean; message: string; points: number }>("/api/verify", {
    method: "POST",
    body: JSON.stringify({ levelIndex, flag }),
  });

  if (data.success) {
    session.addSolved(challengeId);
  }

  return {
    correct: data.success,
    message: data.message,
    points: data.points,
  };
}

export async function getLeaderboard() {
  const data =
    await request<{ rank: number; callsign: string; points: number; currentLevel: number }[]>(
      "/api/leaderboard",
    );
  return data.map((row) => ({
    rank: row.rank,
    username: row.callsign,
    points: row.points,
    solved: row.currentLevel,
    callsign: row.callsign,
  }));
}

/* --------------------------------- mocks --------------------------------- */

const MOCK_CHALLENGES: (Omit<Challenge, "locked" | "solved"> & { flag: string })[] = [
  {
    id: "tutorial-00",
    title: "Boot Sequence",
    category: "Tutorial",
    difficulty: "easy",
    points: 0,
    description: "Welcome to the terminal. Enter the flag to initialize your session.\n\nThe flag is `WLUG{hello_hacker}`",
    hint: "Just copy and paste the flag.",
    flag: "WLUG{hello_hacker}",
  },
  {
    id: "beacon-01",
    title: "Orbital Beacon",
    category: "Recon",
    difficulty: "easy",
    points: 100,
    description:
      "A derelict relay is broadcasting on a forgotten channel. Decode the repeating burst to recover the station's access phrase.\n\nTransmission: `V0xVR3toZWxsb192b2lkfQ==`",
    hint: "Base64 is the lingua franca of dead satellites.",
    flag: "WLUG{hello_void}",
  },
  {
    id: "airlock-02",
    title: "Airlock Override",
    category: "Web",
    difficulty: "easy",
    points: 150,
    description:
      "The station airlock panel trusts anything the client sends. Inspect the request payload and flip the crew clearance bit.",
    hint: "Some doors only check what you tell them about yourself.",
    flag: "WLUG{client_side_trust}",
  },
  {
    id: "terminal-03",
    title: "Bash History Leak",
    category: "Linux",
    difficulty: "easy",
    points: 200,
    description:
      "An operator forgot to purge their shell history after configuring the sector gateway. Inspect the hidden `.bash_history` file to find the root key.",
    hint: "Check hidden dotfiles in the home directory (`cat ~/.bash_history`).",
    flag: "WLUG{bash_history_pwned}",
  },
  {
    id: "nebula-04",
    title: "Nebula Cipher",
    category: "Crypto",
    difficulty: "medium",
    points: 250,
    description:
      "Stellar cartographers encrypted their coordinates with a rotating key harvested from pulsar timings. Recover the plaintext waypoint.",
    hint: "The rotation count matches the pulsar period.",
    flag: "WLUG{rotating_pulsar}",
  },
  {
    id: "reactor-05",
    title: "Reactor Overflow",
    category: "Pwn",
    difficulty: "medium",
    points: 300,
    description:
      "The coolant controller reads operator names into a 32-byte buffer with no bounds check. Redirect execution to the maintenance shell.",
    hint: "Count your bytes before the return address.",
    flag: "WLUG{smashing_the_core}",
  },
  {
    id: "suid-06",
    title: "SUID Privilege Escalation",
    category: "Linux",
    difficulty: "medium",
    points: 350,
    description:
      "A custom binary on the subsystem node has the SUID permission set (`-rwsr-xr-x`). Exploit its insecure PATH lookup to spawn a root terminal.",
    hint: "Look for binaries with SUID bit using `find / -perm -4000`.",
    flag: "WLUG{suid_root_access}",
  },
  {
    id: "ghost-07",
    title: "Ghost Frequency",
    category: "Forensics",
    difficulty: "hard",
    points: 400,
    description:
      "A corrupted flight recorder holds an audio capture. Something is hidden in the spectrogram between 12kHz and 16kHz.",
    hint: "Look at sound, don't listen to it.",
    flag: "WLUG{spectral_stowaway}",
  },
  {
    id: "kernel-08",
    title: "Kernel Module Hijack",
    category: "Reverse",
    difficulty: "hard",
    points: 500,
    description:
      "An unauthenticated module hook into `/proc/sys/kernel` accepts arbitrary syscall pointers. Reverse the module binary to reconstruct the key.",
    hint: "Decompile the kernel module and check the ioctl handler.",
    flag: "WLUG{kernel_ring_0}",
  },
  {
    id: "cron-09",
    title: "Wildcard Cron Exploitation",
    category: "Linux",
    difficulty: "hard",
    points: 550,
    description:
      "A root cron job executes `tar -czf backup.tar.gz *` in `/var/log`. Inject tar option flags via filenames to extract `/root/flag.txt`.",
    hint: "`--checkpoint-action=exec=sh shell.sh` can be triggered using filenames.",
    flag: "WLUG{tar_wildcard_exploit}",
  },
  {
    id: "singularity-10",
    title: "Singularity Core",
    category: "Reverse",
    difficulty: "insane",
    points: 700,
    description:
      "The alien firmware validates its key inside a self-modifying VM. Lift the bytecode, rebuild the check, and forge a valid key.",
    hint: "The VM only has 9 opcodes. Two of them lie.",
    flag: "WLUG{event_horizon_reached}",
  },
];
