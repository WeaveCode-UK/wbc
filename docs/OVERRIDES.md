# Catálogo de `pnpm.overrides`

Este documento explica por que cada override em `package.json` (bloco `pnpm.overrides`) existe. Overrides devem ser o recurso de último caso — são preferíveis a forks ou patches, mas escondem decisões do grafo de dependências e exigem revisão periódica.

Ao adicionar um novo override, adicione também uma entrada aqui com rationale, data e condição de remoção.

## Overrides ativos

### `react` → `19.1.0`

- **Rationale:** congela a versão cross-workspace para evitar múltiplas cópias do React em runtime (multiple React copies bug). Next.js 15 + React Native 0.81 precisam convergir num único `react`.
- **Quando remover:** quando apps/web e apps/mobile-app concordarem com a mesma faixa `^19.x` sem override manual.
- **Adicionado em:** pré-auditoria (inherited).

### `react-dom` → `19.1.0`

- **Rationale:** pareado com `react`. Divergência entre versões de `react` e `react-dom` é sempre bug.
- **Quando remover:** junto com `react`.
- **Adicionado em:** pré-auditoria (inherited).

### `react-native` → `0.81.5`

- **Rationale:** o Expo SDK atual e algumas libs nativas (ex.: `react-native-reanimated`, `react-native-gesture-handler`) têm peer-ranges conflitantes; fixar a versão evita que o resolver escolha um peer incompatível.
- **Quando remover:** quando o Expo SDK aceitar uma faixa `^0.82.x` estável e todas as libs nativas atualizarem os peers.
- **Adicionado em:** pré-auditoria (inherited).

### `@types/react` → `~19.1.17`

- **Rationale:** manter os tipos `@types/react` estritamente dentro da minor `19.1`. Upgrades de minor dos types têm quebrado o type-check em tsc 5.9 em combinações com `react-native`.
- **Quando remover:** quando o monorepo migrar para React 19.2+ ou 20.x.
- **Adicionado em:** pré-auditoria (inherited).

### `ioredis` → `5.10.1`

- **Rationale:** garantir que BullMQ (usado em apps/worker) e qualquer camada de cache (apps/api) usem a mesma major de `ioredis`. Duas versões do cliente podem mascarar bugs de pub/sub.
- **Quando remover:** quando BullMQ 5.x for substituído ou quando as faixas semver dos consumidores convergirem.
- **Adicionado em:** pré-auditoria (inherited).

### `protobufjs` → `>=7.5.5` <!-- ACH-001 supply-chain-dependencias -->

- **Rationale:** versões `< 7.5.5` têm RCE (CVE) explorável via serialização gRPC. `@opentelemetry/auto-instrumentations-node@0.72.0` puxa `protobufjs@7.5.4`.
- **Quando remover:** quando a dependência upstream (`@opentelemetry/auto-instrumentations-node`) bumpar para uma versão que já resolva `protobufjs >= 7.5.5` naturalmente — remover o override e validar com `pnpm audit`.
- **Adicionado em:** 2026-04-23 (correção ACH-001 run 2026-04-19_21-11-51).

### `picomatch` → `>=4.0.3` <!-- ACH-010 supply-chain-dependencias -->

- **Rationale:** versões `2.x` e `3.x` têm CVE de injeção em patterns de glob, puxadas transitivamente por tailwindcss, vite e expo. `4.0.3` corrige.
- **Quando remover:** quando tailwindcss, vite e expo migrarem para `picomatch@^4.x` em suas próprias dependências, e `pnpm why picomatch` não mostrar mais consumidores em 2.x/3.x.
- **Adicionado em:** 2026-04-23 (correção ACH-010 run 2026-04-19_21-11-51).

### `vite` → `^8.0.10` <!-- ACH-011 supply-chain-dependencias -->

- **Rationale:** versões `8.0.x ≤ 8.0.4` sofrem de path traversal em sourcemaps. `@vitejs/plugin-react@6.0.1` (única versão 6.x publicada até esta data) ainda peer-requires um vite menor; o override garante que a versão efetivamente instalada seja segura. Nota: a recomendação original do achado citava bump para `@vitejs/plugin-react@6.0.2+`, mas essa versão não existe no registry público.
- **Quando remover:** quando `@vitejs/plugin-react` publicar uma versão cuja peer-range exija vite `>= 8.0.5` por padrão e o override se tornar redundante.
- **Adicionado em:** 2026-04-23 (correção ACH-011 run 2026-04-19_21-11-51).

## Boas práticas

1. **Sempre registrar aqui** antes de abrir PR com novo override. PR sem entrada neste doc não deve ser merge.
2. **Revisão trimestral:** passar por cada entrada e verificar se ainda é necessária; remover overrides obsoletos reduz drift silencioso entre o que o registry publica e o que o lockfile instala.
3. **Overrides transitivos vs diretos:** use override apenas quando a dependência é transitiva. Para dependências diretas, prefira bump do constraint na `package.json` do workspace afetado.
4. **CI gate:** o job `strict-peer-dependencies` (ACH-016) mostra quando um override escondeu um peer mismatch grave.

## Referências

- Achado origem (ACH-001/008/010/011): `Auditoria/supply-chain-dependencias/runs/2026-04-19_21-11-51/achados.md`
- [pnpm overrides docs](https://pnpm.io/package_json#pnpmoverrides)
