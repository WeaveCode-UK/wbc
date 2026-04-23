# infra/terraform — seed (ACH-002)

Esta pasta é um **placeholder** criado pela correção da run
`2026-04-19_09-03-12` do domínio infraestrutura-deploy-config. Hoje o
deploy é imperativo (`deploy/deploy.sh` + Docker Compose na VM). Esta
pasta marca o lugar onde a migração para Infrastructure-as-Code vai
viver quando for feita.

Ver `docs/INFRA-AS-CODE-FOLLOWUP.md` para o plano.

## Estrutura recomendada (quando implementado)

```
infra/terraform/
├── README.md                  ← este arquivo
├── backend.tf                 ← state remoto (S3 + DynamoDB lock, ou equivalente)
├── versions.tf                ← terraform { required_version, required_providers }
├── modules/
│   ├── network/               ← VPC / subnets / security groups
│   ├── database/              ← Postgres managed (RDS ou equivalente)
│   ├── redis/                 ← Redis managed ou containerizado
│   ├── compute/               ← VM(s) ou ECS/K8s — depende da decisão
│   └── dns/                   ← Route53 / Cloudflare records
└── environments/
    ├── production/
    │   ├── main.tf            ← compõe os módulos
    │   ├── variables.tf
    │   └── terraform.tfvars.example
    └── staging/
        ├── main.tf
        ├── variables.tf
        └── terraform.tfvars.example
```

## Não commitar

- `terraform.tfvars` (valores reais) — sempre gitignored.
- `.terraform/` (cache de providers).
- `*.tfstate` (se usar backend local — evitar).

## Como começar

Antes de escrever um `.tf`, decidir:

1. **Target provider**: AWS, GCP, Hetzner, OCI? Hoje está em Hostinger KVM8
   (dedicated VM). Se ficar em VMs simples, `hcloud` ou equivalente pode
   bastar. Se migrar para managed DB/Redis, decisão maior.
2. **Scope mínimo**: DNS + SSL + VM + Managed Postgres + Managed Redis
   costumam ser os melhores primeiros módulos.
3. **State remoto**: nunca armazenar state localmente. Bucket S3
   (com versionamento + encryption) e DynamoDB lock funcionam bem.
