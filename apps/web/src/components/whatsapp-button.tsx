"use client";

import { useState } from "react";
import { Button } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

// F11.E11: thin wrapper that asks the backend for a wa.me deep link
// (the backend resolves the client's phone server-side) and opens it
// in a new tab. Lazy — the tRPC query is `enabled: false` and only
// fires when the user clicks.

interface WhatsappButtonProps {
  clientId: string;
  label: string;
  kind?:
    | "GENERIC"
    | "SALE_CONFIRMED"
    | "PAYMENT_REMINDER"
    | "REPOSITION_REMINDER"
    | "BIRTHDAY"
    | "DELIVERY_DISPATCHED"
    | "REACTIVATION";
}

export function WhatsappButton({
  clientId,
  label,
  kind = "GENERIC",
}: WhatsappButtonProps) {
  const [busy, setBusy] = useState(false);
  const utils = trpc.useUtils();

  const onClick = async () => {
    setBusy(true);
    try {
      const result = await utils.messaging.generateLink.fetch({
        clientId,
        kind,
      });
      window.open(result.url, "_blank", "noopener");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" variant="secondary" onClick={onClick} disabled={busy}>
      {busy ? "..." : label}
    </Button>
  );
}
