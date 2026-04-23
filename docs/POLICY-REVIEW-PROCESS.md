# Policy Review Process (ACH-021)

## Escopo

Processo que garante que as políticas de privacidade, retenção, DPIA e
incident response não fiquem obsoletas. Aplica-se a:

- `docs/PRIVACY_POLICY.md` / `PRIVACY_POLICY-EN.md` (ACH-002)
- `docs/DATA_RETENTION_POLICY.md` (ACH-010)
- `docs/DPIA.md` (ACH-006)
- `docs/INCIDENT_RESPONSE_PRIVACY.md` (ACH-015)
- `docs/SUB_PROCESSORS.md` (ACH-005 + ACH-007)
- `docs/TERMS_OF_SERVICE.md` (ACH-018)
- `docs/COOKIES-POLICY.md` (ACH-016)

## Cadência

- **Revisão anual obrigatória** (marcar 1º de fevereiro de cada ano).
- **Revisão reativa** em até 30 dias após:
  - Novo sub-processador (Sentry, DeepSeek, etc.).
  - Mudança de base legal (ex: consentimento → execução de contrato).
  - Alteração significativa de dados coletados.
  - Incidente ou orientação regulatória nova.
  - Decisão judicial relevante sobre LGPD/GDPR.

## Frontmatter obrigatório

Cada política deve iniciar com:

```yaml
---
last_reviewed: 2026-02-01
next_review_due: 2027-02-01
reviewers: [dpo, legal]
version: 1.0.0
---
```

Quando alguma mudança material acontecer, bumpar `version`, atualizar
`last_reviewed` e `next_review_due`, registrar mudança no CHANGELOG da
política.

## Checklist anual

Por política, rodar este checklist:

- [ ] Sub-processadores listados ainda correspondem à stack real?
- [ ] Bases legais refletem o uso atual?
- [ ] Prazos de retenção são respeitados em produção?
- [ ] Direitos do titular mencionados têm endpoint funcional?
- [ ] DPO / contato na política é atual?
- [ ] Datas, leis e artigos citados continuam vigentes?
- [ ] Link público acessa? Versão sincronizada com repo?
- [ ] Links para traduções (PT/EN) funcionam?

## Workflow de mudança

1. Alguém abre PR tocando `docs/PRIVACY_POLICY*.md` (ou similar).
2. CODEOWNERS pede review do DPO automaticamente (ver ACH-005).
3. Se for mudança material (bump major/minor), DPO atualiza o
   frontmatter e envia notificação aos titulares impactados.
4. Atualizar o changelog no final do arquivo.

## Pendências humanas

1. Criar o frontmatter em todas as políticas listadas acima.
2. Adicionar workflow `.github/workflows/policy-review-reminder.yml`
   que abre issue anualmente.
3. Definir `@WeaveCode-UK/dpo` team no GitHub e adicionar em CODEOWNERS.
