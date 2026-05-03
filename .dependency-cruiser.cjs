// Dependency-cruiser config — regras arquiteturais da WBC Platform.
// Referência: ADR-001 (hexagonal), ADR-003 (comunicação inter-módulo via eventos).
// Rodar localmente:  pnpm run arch:check
// Rodar no CI:       mesmo comando.

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'hexagonal-domain-cannot-import-adapters',
      comment:
        'Hexagonal (ADR-001): domain/ encapsula entidades e regras de negocio; nunca pode depender de adapters/ (detalhes de infraestrutura).',
      severity: 'error',
      from: { path: 'packages/business/[^/]+/domain' },
      to: { path: 'packages/business/[^/]+/adapters' },
    },
    {
      name: 'hexagonal-domain-cannot-import-use-cases',
      comment:
        'Hexagonal (ADR-001): domain/ eh a camada mais interna; nao pode depender de use-cases/ (orquestracao).',
      severity: 'error',
      from: { path: 'packages/business/[^/]+/domain' },
      to: { path: 'packages/business/[^/]+/use-cases' },
    },
    {
      name: 'hexagonal-use-cases-cannot-import-adapters',
      comment:
        'Hexagonal (ADR-001): use-cases/ devem depender de ports/ (interfaces), nunca de adapters/ (implementacoes concretas). Use injecao de dependencia.',
      severity: 'error',
      from: { path: 'packages/business/[^/]+/use-cases' },
      to: { path: 'packages/business/[^/]+/adapters' },
    },
    {
      name: 'hexagonal-ports-cannot-import-adapters',
      comment:
        'Hexagonal (ADR-001): ports/ definem contratos puros; nunca podem depender de adapters/.',
      severity: 'error',
      from: { path: 'packages/business/[^/]+/ports' },
      to: { path: 'packages/business/[^/]+/adapters' },
    },
    {
      name: 'domain-cannot-import-prisma',
      comment:
        'Hexagonal (ADR-001): domain/ é puro — não pode tocar em Prisma client, schema ou repos. Acesso a dados é via ports/ implementadas em adapters/.',
      severity: 'error',
      from: { path: 'packages/business/[^/]+/domain' },
      to: { path: '(@prisma/client|^packages/db/)' },
    },
    {
      name: 'domain-cannot-import-next-auth',
      comment:
        'Hexagonal (ADR-001): domain/ não pode depender de framework HTTP/auth. NextAuth é detalhe de adapter web.',
      severity: 'error',
      from: { path: 'packages/business/[^/]+/domain' },
      to: { path: '(^next-auth|^@auth/)' },
    },
    {
      name: 'use-cases-cannot-import-prisma-directly',
      comment:
        'Hexagonal (ADR-001): use-cases dependem de ports/ — nunca instanciam Prisma direto. A composition root injeta o repo concreto.',
      severity: 'error',
      from: { path: 'packages/business/[^/]+/use-cases' },
      to: { path: '(@prisma/client|^packages/db/src/index)' },
    },
    {
      name: 'use-cases-cannot-import-bullmq-redis-directly',
      comment:
        'Hexagonal (ADR-001): use-cases não tocam em BullMQ/ioredis direto — usam ports. Adapters concretos estão em adapters/ ou packages/shared/redis.',
      severity: 'error',
      from: { path: 'packages/business/[^/]+/use-cases' },
      to: { path: '^(bullmq|ioredis)$' },
    },
    {
      name: 'no-cross-business-module-imports',
      comment:
        'ADR-003: comunicacao entre modulos business/* e exclusivamente por eventos assincronos (BullMQ/outbox). Nao importar diretamente entre modulos business.',
      severity: 'error',
      from: { path: '^packages/business/([^/]+)/' },
      to: {
        path: '^packages/business/([^/]+)/',
        pathNot: [
          // Permitir o mesmo modulo referenciar a si proprio.
          '^packages/business/$1/',
        ],
      },
    },
    {
      name: 'no-circular',
      comment: 'Dependencias circulares indicam acoplamento oculto; proibidas.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      comment:
        'Arquivos orfaos (sem ninguem importando) podem ser codigo morto. Informativo, nao bloqueia.',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '\\.(config|setup|d)\\.(js|cjs|mjs|ts)$',
          '(^|/)[^/]+\\.config\\.(js|cjs|mjs|ts)$',
          '(^|/)index\\.(ts|tsx|js)$',
          '(^|/)types?\\.(ts|tsx)$',
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: [
        'node_modules',
        '\\.next',
        '\\.turbo',
        'dist',
        'build',
        'out',
        'coverage',
        '\\.test\\.(ts|tsx)$',
        '\\.spec\\.(ts|tsx)$',
        'e2e/',
        'Auditoria/',
      ],
    },
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
