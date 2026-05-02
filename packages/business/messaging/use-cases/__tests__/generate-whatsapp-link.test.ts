import { describe, it, expect } from "vitest";
import { generateWhatsappLink } from "../generate-whatsapp-link";

describe("generateWhatsappLink", () => {
  it("personalises the GENERIC template", () => {
    const result = generateWhatsappLink({
      phone: "+5511999990001",
      clientName: "Ana",
      kind: "GENERIC",
    });
    expect(result.message).toContain("Ana");
    expect(result.url).toContain("wa.me/5511999990001");
    expect(result.url).toContain(encodeURIComponent("Ana"));
  });

  it("uses the SALE_CONFIRMED template with the client's name", () => {
    const result = generateWhatsappLink({
      phone: "11999990002",
      clientName: "Beatriz",
      kind: "SALE_CONFIRMED",
    });
    expect(result.message).toContain("Beatriz");
    expect(result.message).toContain("compra");
  });

  it("respects customMessage when provided", () => {
    const result = generateWhatsappLink({
      phone: "11999990003",
      clientName: "Carla",
      kind: "GENERIC",
      customMessage: "Mensagem específica para {{nome}}",
    });
    expect(result.message).toBe("Mensagem específica para Carla");
  });

  it("strips non-digits from the phone for wa.me", () => {
    const result = generateWhatsappLink({
      phone: "+55 (11) 99999-0004",
      clientName: "Daniela",
      kind: "GENERIC",
    });
    expect(result.url).toContain("wa.me/5511999990004");
  });

  it("URL-encodes special characters in the message", () => {
    const result = generateWhatsappLink({
      phone: "11999990005",
      clientName: "Eduarda",
      kind: "GENERIC",
      customMessage: "Olá & valeu",
    });
    expect(result.url).toContain(encodeURIComponent("Olá & valeu"));
  });
});
