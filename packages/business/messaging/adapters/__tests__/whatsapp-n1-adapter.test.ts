// T3.3 — WhatsAppN1Adapter (deep links)
//
// N1 doesn't talk to Meta — it produces wa.me links the consultora opens
// in the user's WhatsApp. The two things that matter:
//   - phone is reduced to digits (E.164 minus the +) so wa.me accepts it
//   - the message is urlencoded so `&`, `?`, `#`, spaces, and emojis don't
//     break the URL
import { describe, it, expect } from "vitest";
import { WhatsAppN1Adapter } from "../whatsapp-n1-adapter";

describe("WhatsAppN1Adapter — deep link generation", () => {
  it("strips the leading + and any spaces/dashes from the phone (E.164 → digits)", async () => {
    const adapter = new WhatsAppN1Adapter();
    const r = await adapter.sendText("+55 11 91234-5678", "olá");
    expect(r.success).toBe(true);
    expect(r.whatsappLink).toMatch(/^https:\/\/wa\.me\/5511912345678\?text=/);
  });

  it("urlencodes the message — spaces become %20", async () => {
    const adapter = new WhatsAppN1Adapter();
    const r = await adapter.sendText("+5511999990000", "ola mundo");
    expect(r.whatsappLink).toBe("https://wa.me/5511999990000?text=ola%20mundo");
  });

  it("escapes ampersand so it can't open a second query parameter", async () => {
    const adapter = new WhatsAppN1Adapter();
    const r = await adapter.sendText("+5511999990000", "promo & desconto");
    // `&` must become %26 — otherwise wa.me would parse `desconto` as a
    // separate query param and drop it.
    expect(r.whatsappLink).toContain("%26");
    expect(r.whatsappLink).not.toMatch(/&desconto/);
  });

  it("escapes literal ?", async () => {
    const adapter = new WhatsAppN1Adapter();
    const r = await adapter.sendText("+5511999990000", "tudo bem?");
    // The first `?` is the wa.me query separator; any `?` in the text
    // must be %3F.
    expect(r.whatsappLink?.split("?").length).toBe(2);
    expect(r.whatsappLink).toContain("%3F");
  });

  it("escapes # so the link doesn't get truncated at a fragment", async () => {
    const adapter = new WhatsAppN1Adapter();
    const r = await adapter.sendText("+5511999990000", "ofertas #brasil");
    expect(r.whatsappLink).toContain("%23");
  });

  it("preserves accented characters via urlencoding", async () => {
    const adapter = new WhatsAppN1Adapter();
    const r = await adapter.sendText("+5511999990000", "açaí");
    // ç + í both need percent-encoding — wa.me happens to render them,
    // but the adapter MUST emit the encoded form.
    expect(r.whatsappLink).toContain("a%C3%A7a%C3%AD");
  });

  it("sendImage embeds caption + URL in the encoded text", async () => {
    const adapter = new WhatsAppN1Adapter();
    const r = await adapter.sendImage(
      "+5511999990000",
      "https://cdn/x.jpg",
      "Veja",
    );
    expect(r.whatsappLink).toContain("https%3A%2F%2Fcdn%2Fx.jpg");
    expect(r.whatsappLink).toContain("Veja");
  });

  it("sendImage without caption only encodes the URL", async () => {
    const adapter = new WhatsAppN1Adapter();
    const r = await adapter.sendImage("+5511999990000", "https://cdn/x.jpg");
    expect(r.whatsappLink).toContain("https%3A%2F%2Fcdn%2Fx.jpg");
  });

  it("sendAudio encodes the audio URL", async () => {
    const adapter = new WhatsAppN1Adapter();
    const r = await adapter.sendAudio("+5511999990000", "https://cdn/a.mp3");
    expect(r.whatsappLink).toContain("https%3A%2F%2Fcdn%2Fa.mp3");
  });

  it("never reaches an HTTP endpoint (no network)", async () => {
    // The adapter is purely synchronous w.r.t. network; this guards
    // against a future refactor that accidentally introduces fetch.
    const calls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = ((..._args: unknown[]): Promise<Response> => {
      calls.push("fetch");
      return Promise.reject(new Error("fetch should not be called"));
    }) as unknown as typeof fetch;
    try {
      const adapter = new WhatsAppN1Adapter();
      await adapter.sendText("+5511999990000", "hi");
      expect(calls).toEqual([]);
    } finally {
      globalThis.fetch = original;
    }
  });
});
