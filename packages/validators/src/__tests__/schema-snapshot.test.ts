// T0.5 — Schema drift guard. Two complementary snapshots:
//
// 1) Validator field shape — for each critical Zod schema, capture the keys
//    and shallow type. A silent rename or a removed field breaks the snap.
//
// 2) Prisma schema models — for each `model X` block in
//    packages/db/prisma/schema.prisma, capture the field list. If a Prisma
//    model gains/loses a column without the validator following, the diff
//    surfaces here even if no test that hits the column was added.
//
// On legitimate change run `pnpm vitest -u packages/validators` and review
// the diff before committing the new snapshot.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  createSaleSchema,
  confirmSaleSchema,
  cancelSaleSchema,
  markPaidSchema,
  updateSaleStatusSchema,
  createReturnSchema,
} from "../sales";
import {
  createClientSchema,
  updateClientSchema,
  createTagSchema,
} from "../clients";
import { createCampaignSchema } from "../campaigns";
import {
  passwordPolicySchema,
  resetPasswordSchema,
  mfaConfirmEnrollmentSchema,
  mfaDisableSchema,
  updateMemberRoleSchema,
  completeOnboardingSchema,
} from "../auth";

function describeSchema(schema: z.ZodTypeAny): unknown {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(shape).sort()) {
      const inner = shape[k];
      if (inner) out[k] = describeSchema(inner);
    }
    return { object: out };
  }
  if (schema instanceof z.ZodOptional) {
    return { optional: describeSchema(schema.unwrap()) };
  }
  if (schema instanceof z.ZodNullable) {
    return { nullable: describeSchema(schema.unwrap()) };
  }
  if (schema instanceof z.ZodArray) {
    return { array: describeSchema(schema.element) };
  }
  if (schema instanceof z.ZodEnum) {
    return { enum: [...schema.options].sort() };
  }
  if (schema instanceof z.ZodLiteral) {
    return { literal: schema.value };
  }
  if (schema instanceof z.ZodString) return "string";
  if (schema instanceof z.ZodNumber) return "number";
  if (schema instanceof z.ZodBoolean) return "boolean";
  if (schema instanceof z.ZodDate) return "date";
  if (schema instanceof z.ZodEffects) {
    return { effect: describeSchema(schema.innerType()) };
  }
  return schema._def?.typeName ?? "unknown";
}

describe("validator schema snapshot", () => {
  it("locks the shape of critical sale schemas", () => {
    expect({
      createSale: describeSchema(createSaleSchema),
      confirmSale: describeSchema(confirmSaleSchema),
      cancelSale: describeSchema(cancelSaleSchema),
      markPaid: describeSchema(markPaidSchema),
      updateSaleStatus: describeSchema(updateSaleStatusSchema),
      createReturn: describeSchema(createReturnSchema),
    }).toMatchSnapshot();
  });

  it("locks the shape of client schemas", () => {
    expect({
      createClient: describeSchema(createClientSchema),
      updateClient: describeSchema(updateClientSchema),
      createTag: describeSchema(createTagSchema),
    }).toMatchSnapshot();
  });

  it("locks the shape of campaign schemas", () => {
    expect({
      createCampaign: describeSchema(createCampaignSchema),
    }).toMatchSnapshot();
  });

  it("locks the shape of auth/MFA schemas", () => {
    expect({
      passwordPolicy: describeSchema(passwordPolicySchema),
      resetPassword: describeSchema(resetPasswordSchema),
      mfaConfirmEnrollment: describeSchema(mfaConfirmEnrollmentSchema),
      mfaDisable: describeSchema(mfaDisableSchema),
      updateMemberRole: describeSchema(updateMemberRoleSchema),
      completeOnboarding: describeSchema(completeOnboardingSchema),
    }).toMatchSnapshot();
  });
});

describe("Prisma model field snapshot (drift guard vs validators)", () => {
  it("captures field lists of business-critical models", () => {
    const schemaText = readFileSync(
      resolve(__dirname, "../../../db/prisma/schema.prisma"),
      "utf8",
    );

    // Tracked models — bumping this list means the snapshot must be reviewed.
    const tracked = [
      "Tenant",
      "Member",
      "Client",
      "Sale",
      "SaleItem",
      "Payment",
      "Product",
      "StockEntry",
      "Campaign",
      "CampaignRecipient",
      "ScheduledMessage",
      "Cashback",
      "LoyaltyEntry",
      "OutboxEvent",
      "ProcessedEvent",
    ];

    const result: Record<string, string[]> = {};
    for (const model of tracked) {
      const re = new RegExp(`^model\\s+${model}\\s*{([^}]+)}`, "ms");
      const match = schemaText.match(re);
      if (!match) {
        result[model] = ["__MODEL_NOT_FOUND__"];
        continue;
      }
      const fields: string[] = [];
      const body = match[1] ?? "";
      for (const raw of body.split("\n")) {
        const line = raw.trim();
        if (!line || line.startsWith("//") || line.startsWith("@@")) continue;
        // First token is the field name.
        const fieldName = line.split(/\s+/)[0];
        if (fieldName) fields.push(fieldName);
      }
      result[model] = fields.sort();
    }

    expect(result).toMatchSnapshot();
  });
});
