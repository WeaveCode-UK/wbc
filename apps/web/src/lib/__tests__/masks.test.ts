// Coverage push — Brazilian input masks. These run on every keystroke
// in the dashboard forms so a regression silently corrupts user input
// in production. We assert the visible, length-based contract.
import { describe, it, expect } from "vitest";
import {
  onlyDigits,
  maskPhoneBR,
  maskCPF,
  maskCNPJ,
  phoneDigits,
} from "../masks";

describe("onlyDigits", () => {
  it("strips spaces, parens, dashes and letters", () => {
    expect(onlyDigits("(11) 9876-5432 abc")).toBe("1198765432");
  });
  it("keeps the empty string empty", () => {
    expect(onlyDigits("")).toBe("");
  });
});

describe("maskPhoneBR", () => {
  it("returns empty for empty input", () => {
    expect(maskPhoneBR("")).toBe("");
  });
  it("opens parens after 1-2 digits", () => {
    expect(maskPhoneBR("1")).toBe("(1");
    expect(maskPhoneBR("11")).toBe("(11");
  });
  it("formats area + start of subscriber up to 6 digits", () => {
    expect(maskPhoneBR("11987")).toBe("(11) 987");
  });
  it("uses landline dash position for 8-digit subscribers", () => {
    expect(maskPhoneBR("1198765432")).toBe("(11) 9876-5432");
  });
  it("uses mobile dash position for 9-digit subscribers (full 11 digits)", () => {
    expect(maskPhoneBR("11987654321")).toBe("(11) 98765-4321");
  });
  it("clamps input past 11 digits — never overflows", () => {
    expect(maskPhoneBR("119876543219999")).toBe("(11) 98765-4321");
  });
});

describe("maskCPF", () => {
  it("formats CPF as XXX.XXX.XXX-XX once 11 digits typed", () => {
    expect(maskCPF("12345678909")).toBe("123.456.789-09");
  });
  it("progressively formats as the user types", () => {
    expect(maskCPF("123")).toBe("123");
    expect(maskCPF("123456")).toBe("123.456");
    expect(maskCPF("123456789")).toBe("123.456.789");
  });
  it("clamps past 11 digits", () => {
    expect(maskCPF("1234567890999")).toBe("123.456.789-09");
  });
});

describe("maskCNPJ", () => {
  it("formats full 14-digit CNPJ", () => {
    expect(maskCNPJ("11444777000161")).toBe("11.444.777/0001-61");
  });
  it("progressively formats", () => {
    expect(maskCNPJ("11")).toBe("11");
    expect(maskCNPJ("114")).toBe("11.4");
    expect(maskCNPJ("11444")).toBe("11.444");
    expect(maskCNPJ("114447")).toBe("11.444.7");
    expect(maskCNPJ("11444777")).toBe("11.444.777");
    expect(maskCNPJ("114447770001")).toBe("11.444.777/0001");
  });
  it("clamps past 14 digits", () => {
    expect(maskCNPJ("11444777000161999")).toBe("11.444.777/0001-61");
  });
});

describe("phoneDigits", () => {
  it("returns raw digits — ready for E.164 prefix", () => {
    expect(phoneDigits("(11) 98765-4321")).toBe("11987654321");
  });
});
