// T-coverage — NPS survey lifecycle
//
// NPS bands (industry standard):
//   detractor 0-6, passive 7-8, promoter 9-10
// nps = (% promoters - % detractors) — a single number from -100 to 100.
//
// Critical guards:
//   - recordNpsResponse rejects scores outside 0..10 (out-of-band data
//     would throw the bands off-balance forever).
//   - getNpsStats handles "no responses yet" without div-by-zero.
//   - getNpsByToken returns alreadyResponded=true if the survey was
//     filled in (so the public route can show a thank-you instead of
//     letting a user double-vote).
import { describe, it, expect, vi, beforeEach } from "vitest";

const { npsCreate, npsUpdate, npsFindMany, npsCount, npsFindUnique } =
  vi.hoisted(() => ({
    npsCreate: vi.fn(),
    npsUpdate: vi.fn().mockResolvedValue(undefined),
    npsFindMany: vi.fn().mockResolvedValue([]),
    npsCount: vi.fn().mockResolvedValue(0),
    npsFindUnique: vi.fn(),
  }));

vi.mock("@wbc/db", () => ({
  prisma: {
    npsSurvey: {
      create: npsCreate,
      update: npsUpdate,
      findMany: npsFindMany,
      count: npsCount,
      findUnique: npsFindUnique,
    },
  },
}));

import {
  createNpsSurvey,
  recordNpsResponse,
  getNpsStats,
  listNpsResponses,
  getNpsByToken,
} from "../manage-nps";

beforeEach(() => {
  npsCreate.mockReset();
  npsUpdate.mockClear();
  npsFindMany.mockReset();
  npsCount.mockReset();
  npsFindUnique.mockReset();
});

describe("createNpsSurvey", () => {
  it("creates a survey with a fresh token + tenant scoping", async () => {
    npsCreate.mockResolvedValue({ id: "n1", token: "tok-1" });
    const out = await createNpsSurvey({
      tenantId: "t1",
      clientId: "c1",
      saleId: "s1",
    });
    expect(out).toEqual({ id: "n1", token: "tok-1" });
    const call = npsCreate.mock.calls[0]?.[0];
    expect(call.data.tenantId).toBe("t1");
    expect(call.data.clientId).toBe("c1");
    expect(call.data.saleId).toBe("s1");
    // token is a UUID — at least 32 chars + 4 dashes.
    expect(call.data.token).toMatch(/[0-9a-f-]{36}/);
  });

  it("nulls saleId when omitted", async () => {
    npsCreate.mockResolvedValue({ id: "n1", token: "tok-1" });
    await createNpsSurvey({ tenantId: "t1", clientId: "c1" });
    const call = npsCreate.mock.calls[0]?.[0];
    expect(call.data.saleId).toBeNull();
  });
});

describe("recordNpsResponse", () => {
  it("rejects scores below 0", async () => {
    await expect(recordNpsResponse({ token: "t", score: -1 })).rejects.toThrow(
      /Score must be between 0 and 10/,
    );
    expect(npsUpdate).not.toHaveBeenCalled();
  });

  it("rejects scores above 10", async () => {
    await expect(recordNpsResponse({ token: "t", score: 11 })).rejects.toThrow(
      /Score must be between 0 and 10/,
    );
    expect(npsUpdate).not.toHaveBeenCalled();
  });

  it("persists score + comment + respondedAt for valid scores", async () => {
    await recordNpsResponse({ token: "tok-1", score: 9, comment: "great" });
    expect(npsUpdate).toHaveBeenCalledWith({
      where: { token: "tok-1" },
      data: {
        score: 9,
        comment: "great",
        respondedAt: expect.any(Date),
      },
    });
  });

  it("nulls comment when omitted", async () => {
    await recordNpsResponse({ token: "tok-1", score: 5 });
    const call = npsUpdate.mock.calls[0]?.[0];
    expect(call.data.comment).toBeNull();
  });
});

describe("getNpsStats", () => {
  it("returns zeroed stats with no responses (no div-by-zero)", async () => {
    npsFindMany.mockResolvedValue([]);
    npsCount.mockResolvedValue(0);
    const out = await getNpsStats("t1");
    expect(out).toEqual({
      total: 0,
      responded: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      averageScore: 0,
      npsScore: 0,
    });
  });

  it("classifies 9-10 as promoters, 7-8 passives, 0-6 detractors", async () => {
    npsFindMany.mockResolvedValue([
      { score: 10 },
      { score: 9 }, // 2 promoters
      { score: 8 },
      { score: 7 }, // 2 passives
      { score: 6 },
      { score: 0 }, // 2 detractors
    ]);
    npsCount.mockResolvedValue(6);
    const out = await getNpsStats("t1");
    expect(out.promoters).toBe(2);
    expect(out.passives).toBe(2);
    expect(out.detractors).toBe(2);
    // (2 - 2) / 6 * 100 = 0
    expect(out.npsScore).toBe(0);
    expect(out.averageScore).toBeCloseTo(40 / 6);
  });

  it("computes a perfect +100 NPS when every response is a promoter", async () => {
    npsFindMany.mockResolvedValue([{ score: 10 }, { score: 9 }, { score: 10 }]);
    npsCount.mockResolvedValue(3);
    const out = await getNpsStats("t1");
    expect(out.npsScore).toBe(100);
  });

  it("computes a -100 NPS when every response is a detractor", async () => {
    npsFindMany.mockResolvedValue([{ score: 0 }, { score: 5 }, { score: 6 }]);
    npsCount.mockResolvedValue(3);
    const out = await getNpsStats("t1");
    expect(out.npsScore).toBe(-100);
  });
});

describe("listNpsResponses", () => {
  it("uses 100 as the default limit", async () => {
    npsFindMany.mockResolvedValue([]);
    await listNpsResponses("t1");
    expect(npsFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: "t1" }, take: 100 }),
    );
  });

  it("forwards a custom limit", async () => {
    npsFindMany.mockResolvedValue([]);
    await listNpsResponses("t1", 25);
    expect(npsFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 25 }),
    );
  });
});

describe("getNpsByToken", () => {
  it("returns null for unknown tokens (don't leak existence of foreign tenants)", async () => {
    npsFindUnique.mockResolvedValue(null);
    const out = await getNpsByToken("nope");
    expect(out).toBeNull();
  });

  it("reports alreadyResponded=true when respondedAt is set", async () => {
    npsFindUnique.mockResolvedValue({
      tenantId: "t1",
      respondedAt: new Date("2026-04-01"),
    });
    const out = await getNpsByToken("tok-1");
    expect(out).toEqual({ tenantId: "t1", alreadyResponded: true });
  });

  it("reports alreadyResponded=false when respondedAt is null", async () => {
    npsFindUnique.mockResolvedValue({ tenantId: "t1", respondedAt: null });
    const out = await getNpsByToken("tok-1");
    expect(out?.alreadyResponded).toBe(false);
  });
});
