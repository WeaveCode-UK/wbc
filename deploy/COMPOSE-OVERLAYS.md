# Compose Overlays — ACH-011

## Estrutura atual

- `docker-compose.yml` — **desenvolvimento local** (hot reload, portas expostas,
  sem healthcheck estrito).
- `docker-compose.prod.yml` — **produção** (imagens pinadas, healthchecks,
  networks isoladas, security_opt).
- `docker-compose.staging.yml` — **overlay de staging** (sobrepõe `prod.yml`
  mudando só o que diverge: réplicas, `.env.staging`, GF_SERVER_ROOT_URL).
- `docker-compose.sentinel.yml` — overlay opcional com o Redis Sentinel.

## Uso

### Dev

```bash
docker compose up -d
```

### Produção

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Staging

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.staging.yml up -d
```

### Produção com Sentinel

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.sentinel.yml up -d
```

## Regras

1. **Nunca copiar produção inteira** para criar um novo ambiente — use overlay.
2. **Um service novo** que só existe em staging → declarar em `staging.yml`.
3. **Valores sobrepostos** (strings) reescrevem o pai. Listas (`volumes`,
   `ports`, `depends_on`) são **substituídas inteiras** pelo overlay, não
   concatenadas. Sempre copiar a lista pai antes de adicionar um item.
4. **Secrets** continuam em `.env.<ambiente>` na raiz; nunca em overlay.
5. **CI** deve validar com `docker compose -f prod -f staging config` (sintaxe).

## Follow-up

- Ambiente `staging` ainda não tem pipeline de deploy automático — hoje
  requer execução manual da VM de staging. Abrir workflow
  `.github/workflows/deploy-staging.yml` quando a infra estiver pronta.
- Dados sintéticos de staging (seed dedicado) ficam em `deploy/seed/staging/`
  (não existe ainda).
