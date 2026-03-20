# WBC Platform — Prompts de Implementação

Gerados automaticamente pelo WBC Orchestrator.

## Estrutura

- `STATE.json` — Estado atual do Orchestrator
- `fase-XX/` — Prompts de implementação por fase
- `reports/` — Relatórios de checkpoint por fase

## Regras

- O Orchestrator gera prompts fase a fase
- O Executor implementa sequencialmente, sem parar
- Sem testes até a fase final
- Gates (type-check) apenas entre fases
