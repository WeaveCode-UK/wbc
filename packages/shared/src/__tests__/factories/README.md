# Factories compartilhadas

ACH-008 testes-qualidade. Quando a Fase 7 começar, a escrita de testes deve
evitar mocks ad-hoc (que drift silenciosamente quando o domínio evolui).
Este diretório concentra factories reutilizáveis por módulo de negócio.

## Convenção

- `<entity>-factory.ts` exporta `buildX(overrides?)` que retorna entidade
  válida com defaults aleatórios via Faker.
- `makeMockRepo<T>()` helper genérico para quando o repo é tipado.
- Cada factory é determinística por padrão via seed fixo, com override
  opcional (`setSeed()`).

## Migração em Fase 7

1. Pegar o mock manual mais repetido (ex: `clientRepo`, `saleRepo`).
2. Extrair para `<entity>-factory.ts`.
3. Substituir nos testes existentes.
4. Cobertura do módulo aumenta → threshold escalona.

Ver `WBC-Fase7-Testes-Roadmap.md` em `begin/` para sequência planejada.
