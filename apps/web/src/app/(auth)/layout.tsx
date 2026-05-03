import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Brand panel — deep-blue dot pattern with Georgia {moment} */}
      <aside className="relative hidden md:flex flex-col justify-between overflow-hidden bg-[var(--wc-blue-800)] bg-wc-dot-pattern bg-wc-dot p-10 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[10%] -top-[20%] h-[140%] w-[60%] blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(129,39,232,0.85) 0%, rgba(129,39,232,0.25) 40%, transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-3 text-[15px] font-semibold">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-wc-sm bg-[var(--wc-purple)] font-serif italic text-white"
          >
            {"{w}"}
          </span>
          <span className="tracking-tight">WBC</span>
        </div>
        <h2 className="relative max-w-[420px] font-serif italic text-[42px] leading-[1.1] tracking-tight">
          Software,
          <br />
          sewn to <span className="text-[var(--wc-orange)]">{"{fit}"}</span>.
        </h2>
        <p className="relative text-[12px] text-white/55">
          © weavecode · London / Lisbon
        </p>
      </aside>

      {/* Form column */}
      <main className="flex items-center justify-center bg-[var(--wc-bg)] p-6 md:p-10">
        <div className="w-full max-w-[360px] space-y-5">{children}</div>
      </main>
    </div>
  );
}
