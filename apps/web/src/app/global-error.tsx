"use client";

// Last-resort error boundary. Next.js renders this when an error escapes
// the root layout itself (e.g. provider explodes during render). Without
// it, a single render-time throw in any layout/page collapses the whole
// dev server into "Algo deu errado" with no recovery path.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GlobalError:", error);
  }, [error]);

  return (
    <html lang="pt-BR" data-theme="default" data-mode="light">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1220",
          color: "#E5E7EB",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "#111827",
            border: "1px solid #1F2937",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 12px",
              borderRadius: 12,
              background: "#3F1D20",
              color: "#FCA5A5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 600,
            }}
            aria-hidden="true"
          >
            !
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            Algo se soltou.
          </h1>
          <p
            style={{
              fontSize: 13,
              fontWeight: 300,
              lineHeight: 1.55,
              color: "#9CA3AF",
              margin: "8px auto 0",
              maxWidth: 300,
            }}
          >
            {error?.message ?? "Erro inesperado. Tente novamente."}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "10px 16px",
              background: "#8127E8",
              color: "#FFFFFF",
              border: 0,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
