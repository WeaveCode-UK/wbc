// T0.4 — Type tests. Lock the inferred TS shape of critical Zod schemas
// so a silent change (a typo, a missing field, a widened union) breaks
// the build instead of leaking through to apps/web and apps/mobile via
// tRPC type inference. Uses vitest's `expectTypeOf` — runs at test time
// but the assertions are erased at runtime; the failures show up in the
// type-checker.
import { describe, it, expectTypeOf } from "vitest";
import type { z } from "zod";
import {
  createSaleSchema,
  confirmSaleSchema,
  cancelSaleSchema,
  markPaidSchema,
  updateSaleStatusSchema,
  createReturnSchema,
} from "../sales";
import { createClientSchema, listClientsSchema } from "../clients";
import { createCampaignSchema } from "../campaigns";
import {
  passwordPolicySchema,
  resetPasswordSchema,
  mfaConfirmEnrollmentSchema,
  mfaDisableSchema,
  updateMemberRoleSchema,
} from "../auth";

describe("validator contract types", () => {
  it("createSale shape is stable", () => {
    type CreateSale = z.infer<typeof createSaleSchema>;
    expectTypeOf<CreateSale>().toEqualTypeOf<{
      clientId: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
      }>;
      paymentMethod?: string | undefined;
      discount?: number | undefined;
      cashbackUsed?: number | undefined;
      campaignId?: string | undefined;
      notes?: string | undefined;
    }>();
  });

  it("confirmSale / cancelSale take only an id", () => {
    type Confirm = z.infer<typeof confirmSaleSchema>;
    type Cancel = z.infer<typeof cancelSaleSchema>;
    expectTypeOf<Confirm>().toEqualTypeOf<{ id: string }>();
    expectTypeOf<Cancel>().toEqualTypeOf<{ id: string }>();
  });

  it("markPaid takes only paymentId — never amount", () => {
    type MarkPaid = z.infer<typeof markPaidSchema>;
    expectTypeOf<MarkPaid>().toEqualTypeOf<{ paymentId: string }>();
    // Negative assertion: amount must NOT be on the input — money side comes
    // from the persisted Payment row, never from the client request.
    expectTypeOf<MarkPaid>().not.toHaveProperty("amount");
  });

  it("updateSaleStatus enum is exactly the 5 lifecycle steps", () => {
    type Update = z.infer<typeof updateSaleStatusSchema>;
    expectTypeOf<Update["status"]>().toEqualTypeOf<
      "CONFIRMED" | "SEPARATED" | "SHIPPED" | "DELIVERED" | "CANCELLED"
    >();
  });

  it("createReturn requires reason and refundAmount", () => {
    type Return = z.infer<typeof createReturnSchema>;
    expectTypeOf<Return>().toEqualTypeOf<{
      saleId: string;
      reason: string;
      refundAmount: number;
    }>();
  });

  it("createClient: phone is required, email/birthday optional", () => {
    type CreateClient = z.infer<typeof createClientSchema>;
    expectTypeOf<CreateClient["phone"]>().toEqualTypeOf<string>();
    expectTypeOf<CreateClient["email"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CreateClient["sex"]>().toEqualTypeOf<
      "MALE" | "FEMALE" | "OTHER" | undefined
    >();
    expectTypeOf<CreateClient["skinType"]>().toEqualTypeOf<
      "OILY" | "DRY" | "COMBINATION" | "NORMAL" | "SENSITIVE" | undefined
    >();
  });

  it("listClients classification is exactly A | B | C", () => {
    type List = z.infer<typeof listClientsSchema>;
    expectTypeOf<List["classification"]>().toEqualTypeOf<
      "A" | "B" | "C" | undefined
    >();
  });

  it("createCampaign requires recipientIds array (non-empty intent enforced at runtime)", () => {
    type CreateCampaign = z.infer<typeof createCampaignSchema>;
    expectTypeOf<CreateCampaign["recipientIds"]>().toEqualTypeOf<string[]>();
    expectTypeOf<CreateCampaign["scheduledAt"]>().toEqualTypeOf<
      Date | undefined
    >();
  });

  it("password policy yields a plain string at type level (length is runtime)", () => {
    type Password = z.infer<typeof passwordPolicySchema>;
    expectTypeOf<Password>().toEqualTypeOf<string>();
  });

  it("resetPassword requires token + new password", () => {
    type Reset = z.infer<typeof resetPasswordSchema>;
    expectTypeOf<Reset>().toEqualTypeOf<{
      token: string;
      newPassword: string;
    }>();
  });

  it("MFA enrollment input: secret + token, both required", () => {
    type Confirm = z.infer<typeof mfaConfirmEnrollmentSchema>;
    expectTypeOf<Confirm>().toEqualTypeOf<{ secret: string; token: string }>();
    type Disable = z.infer<typeof mfaDisableSchema>;
    expectTypeOf<Disable>().toEqualTypeOf<{ currentToken: string }>();
  });

  it("updateMemberRole: roles match the auth enum exactly", () => {
    type UpdateRole = z.infer<typeof updateMemberRoleSchema>;
    expectTypeOf<UpdateRole["newRole"]>().toEqualTypeOf<
      "CONSULTANT" | "LEADER" | "DIRECTOR" | "ADMIN"
    >();
  });
});
