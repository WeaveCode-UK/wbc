// ACH-013 observabilidade-operacao: delega para o factory central em
// @wbc/shared. Hoje a configuração era idêntica à de shared; centralizar
// evita drift de config (ex: redact paths, LOG_LEVEL) entre apps.
export { createLogger } from "@wbc/shared";
