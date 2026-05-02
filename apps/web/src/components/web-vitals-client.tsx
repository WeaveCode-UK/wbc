"use client";

import { useEffect } from "react";
import { startWebVitals } from "@/lib/web-vitals";

// F11.E21: client wrapper that hooks Web Vitals reporting once per
// session. Mounted once in app/layout.tsx; idempotent across re-
// renders thanks to the `started` flag inside web-vitals.ts.
export function WebVitalsClient(): null {
  useEffect(() => {
    void startWebVitals();
  }, []);
  return null;
}
