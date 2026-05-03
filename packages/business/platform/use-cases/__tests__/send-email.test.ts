// T-coverage — sendTemplateEmail (template id + locale + vars)
//
// The template lookup is locale-aware (pt-BR / en) with a pt-BR
// fallback for unknown locales. All three string fields (subject /
// html / text) go through the same {{var}} render pass so the test
// pins down each substitution is applied. We also assert:
//   - "welcome" / "otp_code" / "sale_confirmation" templates resolve
//   - locale fallback to pt-BR for unknown languages
//   - the EmailPort.send is invoked with the rendered payload (NOT
//     the template literal — that would mean substitution skipped).
import { describe, it, expect, vi } from "vitest";
import { sendTemplateEmail } from "../send-email";
import type { EmailPort } from "../../ports/email-port";

function portMock(): EmailPort {
  return {
    send: vi.fn().mockResolvedValue({ success: true, messageId: "msg-1" }),
  };
}

describe("sendTemplateEmail", () => {
  it("renders the welcome template in pt-BR with {{name}} substituted", async () => {
    const port = portMock();
    await sendTemplateEmail(
      {
        to: "ana@x.com",
        templateId: "welcome",
        locale: "pt-BR",
        vars: { name: "Ana" },
      },
      port,
    );
    const call = (port.send as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(call.to).toBe("ana@x.com");
    expect(call.subject).toBe("Bem-vinda ao WBC!");
    expect(call.html).toContain("Olá, Ana!");
    expect(call.text).toContain("Olá, Ana!");
    // No unsubstituted placeholders left over.
    expect(call.html).not.toContain("{{name}}");
  });

  it("renders the welcome template in English when locale=en", async () => {
    const port = portMock();
    await sendTemplateEmail(
      {
        to: "ana@x.com",
        templateId: "welcome",
        locale: "en",
        vars: { name: "Ana" },
      },
      port,
    );
    const call = (port.send as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(call.subject).toBe("Welcome to WBC!");
    expect(call.html).toContain("Hello, Ana!");
  });

  it("falls back to pt-BR for unknown locales (don't crash on bad locale)", async () => {
    const port = portMock();
    await sendTemplateEmail(
      {
        to: "ana@x.com",
        templateId: "welcome",
        locale: "fr-FR",
        vars: { name: "Ana" },
      },
      port,
    );
    const call = (port.send as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(call.subject).toBe("Bem-vinda ao WBC!");
  });

  it("renders the OTP template with {{code}}", async () => {
    const port = portMock();
    await sendTemplateEmail(
      {
        to: "x@y.com",
        templateId: "otp_code",
        locale: "pt-BR",
        vars: { code: "123456" },
      },
      port,
    );
    const call = (port.send as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(call.html).toContain("123456");
    expect(call.text).toContain("123456");
  });

  it("renders the sale_confirmation template with multiple vars", async () => {
    const port = portMock();
    await sendTemplateEmail(
      {
        to: "x@y.com",
        templateId: "sale_confirmation",
        locale: "pt-BR",
        vars: { consultantName: "Ana", saleId: "S-001", total: "100,00" },
      },
      port,
    );
    const call = (port.send as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(call.html).toContain("Ana");
    expect(call.html).toContain("S-001");
    expect(call.html).toContain("100,00");
  });

  it("returns the port's success payload verbatim", async () => {
    const port = portMock();
    const result = await sendTemplateEmail(
      {
        to: "x@y.com",
        templateId: "welcome",
        locale: "pt-BR",
        vars: { name: "X" },
      },
      port,
    );
    expect(result).toEqual({ success: true, messageId: "msg-1" });
  });
});
