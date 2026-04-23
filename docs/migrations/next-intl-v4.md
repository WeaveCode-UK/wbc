# Migração next-intl 3.x → 4.x

## Contexto

A auditoria `supply-chain-dependencias/runs/2026-04-19_21-11-51` registrou (ACH-012) que versões `next-intl < 4.9.1` sofrem de uma vulnerabilidade de open redirect no locale param do middleware de internacionalização. O projeto usa atualmente `^3.20.0`, com lockfile resolvido em `3.26.5`.

## Exposição real neste repositório

O projeto **não** usa o middleware de locale-redirect do next-intl. A configuração atual (em `apps/web/src/i18n/request.ts`) usa apenas `getRequestConfig` para resolver traduções server-side com `defaultLocale` fixo, sem rotear por prefixo de locale.

Como consequência, a superfície de ataque descrita na CVE **não está ativa** neste repositório no estado atual. No entanto, qualquer mudança futura que introduza o middleware `createMiddleware` do next-intl reativará a exposição enquanto estivermos em `3.x`.

## Por que esta correção é parcial

A recomendação original é atualizar para `next-intl@4.x`. Entretanto:

1. A API do next-intl 4 mudou de forma não-retrocompatível — `getRequestConfig` ganhou argumentos adicionais e alguns helpers foram movidos.
2. A refatoração exige revalidação de rotas, testes de tradução e possível adaptação de `apps/web/src/app/layout.tsx` + providers.
3. O framework de auditoria automatizou a geração de overrides e docs, mas não a refatoração de API, que exige revisão humana.

Portanto, a correção automatizada parou em documentar o caminho de migração. O bump de `^3.20.0` → `^4.9.1` fica como trabalho humano.

## Checklist de migração (para execução humana)

- [ ] Ler o guia oficial: https://next-intl-docs.vercel.app/docs/upgrade-guide
- [ ] Ajustar `apps/web/package.json`: `"next-intl": "^4.9.1"`.
- [ ] Adaptar `apps/web/src/i18n/request.ts`:
  - Atualizar assinatura de `getRequestConfig` para aceitar `{requestLocale}` e retornar o locale resolvido explicitamente.
  - Confirmar que a importação de mensagens continua funcionando (path alias `@wbc/i18n/...`).
- [ ] Rodar `pnpm type-check` e corrigir quebras.
- [ ] Rodar `pnpm test` para garantir que componentes que usam `useTranslations` ainda resolvem namespaces corretamente.
- [ ] Se, no futuro, for adotado o middleware de locale-redirect (`createMiddleware`), garantir que ele está em versão `≥ 4.9.1` para não reintroduzir a CVE.

## Referências

- Achado original: `Auditoria/supply-chain-dependencias/runs/2026-04-19_21-11-51/achados.md#ACH-012`
- Correção parcial: `Auditoria/supply-chain-dependencias/runs/2026-04-19_21-11-51/correcao/progresso.md#ACH-012`
