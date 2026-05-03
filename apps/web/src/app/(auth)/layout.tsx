import type { ReactNode } from "react";
import { HandwrittenIntro } from "@/components/auth/handwritten-intro";

export default function AuthLayout({ children }: { children: ReactNode }) {
  // Lock the auth surfaces to the WeaveCode default+dark palette. The
  // ThemeProvider writes data-theme/data-mode on <html>; declaring the
  // same attributes on a closer ancestor wins by selector specificity
  // and keeps /login looking identical regardless of what the user
  // picked in the dashboard topbar.
  return (
    <div
      data-theme="default"
      data-mode="dark"
      className="relative min-h-screen overflow-hidden bg-[var(--wc-blue-800)] bg-wc-dot-pattern bg-wc-dot text-white"
    >
      {/* Purple radial accent — same vibe as the original split layout but
       * spread across the full canvas, behind the central card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[10%] -top-[20%] h-[140%] w-[60%] blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(129,39,232,0.55) 0%, rgba(129,39,232,0.18) 40%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[15%] -bottom-[25%] h-[120%] w-[55%] blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,102,0,0.22) 0%, rgba(255,102,0,0.08) 45%, transparent 70%)",
        }}
      />

      {/* Brand mark — top-left, hidden on the smallest phones to keep the
       * card breathing room. */}
      <div className="relative z-10 hidden sm:flex items-center gap-3 p-6 text-[15px] font-semibold">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-wc-sm bg-[var(--wc-purple)] font-serif italic text-white"
        >
          {"{w}"}
        </span>
        <span className="tracking-tight">WBC</span>
      </div>

      {/* Handwritten meaning of the WBC acronym — animates on each mount
       * (every navigation back to /login replays it). Hidden on the
       * smallest viewports so it doesn't crowd the card. */}
      <div className="pointer-events-none absolute left-1/2 top-16 z-10 hidden -translate-x-1/2 sm:top-20 sm:block">
        <HandwrittenIntro
          text="Weave Beauty Consultant"
          className="text-[36px] leading-none text-white/85 sm:text-[48px]"
        />
      </div>

      {/* Card — centred over the brand canvas. The elevated blue lifts it
       * clearly off the deep-blue-800 background. */}
      <main className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-4 pb-10 sm:px-6">
        <div className="w-full max-w-[420px] space-y-5 rounded-wc-lg border border-white/10 bg-[var(--wc-bg-elevated)] p-6 shadow-wc-lg sm:p-8">
          {children}
        </div>
      </main>

      {/* Tagline + copyright sit at the bottom edges, unobtrusive. */}
      <p className="pointer-events-none absolute bottom-4 left-6 z-10 hidden text-[12px] text-white/55 sm:block">
        © weavecode · London / Lisbon
      </p>
      <p className="pointer-events-none absolute bottom-4 right-6 z-10 hidden font-serif italic text-[14px] text-white/65 sm:block">
        Software, sewn to{" "}
        <span className="text-[var(--wc-orange)]">{"{fit}"}</span>.
      </p>
    </div>
  );
}
