# `next-auth` — situação atual (beta) e checklist de bump

## Contexto

O projeto usa `next-auth@5.0.0-beta.30` em `apps/web` para a camada de autenticação de produção. A auditoria `supply-chain-dependencias/runs/2026-04-19_21-11-51` (ACH-002, severidade alto) registrou que rodar um pre-release em uma dependência crítica de segurança carrega risco:

- Breaking changes silenciosos entre betas.
- Suporte oficial limitado em LTS.
- Rollbacks para 4.x LTS são possíveis, mas também são breaking.

Como a escolha entre "aguardar GA de next-auth 5" e "rollback para 4.x" é uma decisão de produto — não de engenharia pura — o framework de auditoria classificou a correção como **parcial**: a mitigação imediata é documental e de processo.

## Por que esta correção é parcial

O caminho de "correção completa" seria:

1. **Aguardar GA:** nenhum risco de upgrade, mas a janela é indeterminada.
2. **Rollback para `next-auth@4.x`:** LTS, suporte oficial, mas reescrita das `auth.config.ts` e fluxos de callback — quebra rotas de auth em produção.

Ambos exigem aprovação humana e plano de teste manual. Nenhuma dessas opções é segura para um agente executar sem supervisão, portanto a correção é limitada a:

- Este documento explicando o estado e os caminhos.
- Ownership reforçado via CODEOWNERS (já existente — veja seção abaixo).

## Checklist antes de bumpar `next-auth`

Se alguém for subir a versão (seja de beta.30 para outro beta, seja para GA, seja rollback para 4.x):

- [ ] Ler o changelog completo entre a versão atual e a nova.
- [ ] Rodar o fluxo completo de login local (provider Credentials) e confirmar que `getServerSession`/`auth()` retornam a shape esperada.
- [ ] Confirmar que `callbacks.session`, `callbacks.jwt` e `callbacks.authorized` continuam com a mesma interface.
- [ ] Validar o middleware (`apps/web/src/middleware.ts`) — em particular a função `auth((req) => {...})` que hoje guarda rotas privadas.
- [ ] Rodar o fluxo de recuperação de senha (`/reset-password`) — a lógica de token está sensível a mudanças na sessão.
- [ ] Confirmar que 2FA/MFA (se habilitado) ainda funciona — o flow usa `signIn` com challenge.
- [ ] Type-check estrito: `pnpm type-check` precisa passar sem warnings novos em `apps/web/**`.
- [ ] Smoke test manual: login, logout, switch de workspace, onboarding — todos devem seguir funcionando.

## Ownership e revisão

`.github/CODEOWNERS` já cobre as áreas de autenticação:

```
/packages/business/auth/           @WeaveCode-UK/owners
/apps/web/src/lib/auth.config.ts   @WeaveCode-UK/owners
/apps/web/src/lib/auth.ts          @WeaveCode-UK/owners
/apps/web/src/app/(auth)/          @WeaveCode-UK/owners
```

Qualquer PR que toque essas áreas requer aprovação do grupo `@WeaveCode-UK/owners`. Bumps de `next-auth` em `apps/web/package.json` também entram no CODEOWNERS geral (via regra `*`).

## Monitoramento

- GitHub Dependabot: configurado para levantar PRs de npm updates semanalmente.
- `pnpm audit` em CI (ACH-003): irá alertar se uma CVE for publicada contra a versão beta fixada.
- `dependabot.yml` separa grupos minor/patch; major (qualquer bump para um beta.31 ou 5.0.0 GA) gerará PR individual para revisão humana.

## Referências

- Achado original: `Auditoria/supply-chain-dependencias/runs/2026-04-19_21-11-51/achados.md#ACH-002`
- Doc de correção parcial: `Auditoria/supply-chain-dependencias/runs/2026-04-19_21-11-51/correcao/progresso.md#ACH-002`
