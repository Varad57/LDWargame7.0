import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SpaceBackground } from "@/components/SpaceBackground";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel hud-corner max-w-md p-10 text-center">
        <h1 className="font-display text-7xl font-bold text-primary neon-text">404</h1>
        <h2 className="mt-4 font-display text-lg tracking-widest text-foreground">
          SECTOR NOT CHARTED
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This coordinate returns only static and cold vacuum.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md border border-primary/50 bg-primary/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary transition-all hover:shadow-[var(--shadow-neon-strong)]"
        >
          Return to base
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel max-w-md p-10 text-center">
        <h1 className="font-display text-lg tracking-widest text-destructive">SYSTEM FAULT</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The hull integrity monitor flagged an error. Try re-initialising.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md border border-primary/50 bg-primary/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary transition-all hover:shadow-[var(--shadow-neon-strong)]"
          >
            Reboot
          </button>
          <a
            href="/"
            className="rounded-md border border-border px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LinuxDiary 7.0 — Deep Space CTF Arena" },
      {
        name: "description",
        content:
          "LinuxDiary 7.0 is a deep-space Capture The Flag arena: solve orbital hacking missions, capture flags and climb the fleet leaderboard.",
      },
      { name: "author", content: "LinuxDiary 7.0" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", href: "data:;base64,=" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SpaceBackground />
      <Navbar />
      <main className="min-h-screen pt-20">
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </main>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
