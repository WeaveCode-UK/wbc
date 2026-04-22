// ACH-013 observabilidade-operacao: delega para o factory central em
// @wbc/shared (LOG_LEVEL env + redact PII).
import { createLogger } from "@wbc/shared";

export const logger = createLogger("worker");
