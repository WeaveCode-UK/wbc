# Encryption at Rest (ACH-014)

LGPD e GDPR exigem medidas técnicas proporcionais ao risco — em um
CRM com dados sensíveis (alergias, saúde) e identificadores (CPF,
telefone), criptografia em repouso é esperada.

## Estado atual (pós-correção parcial)

| Camada              | Status          | Detalhe                                       |
| ------------------- | --------------- | --------------------------------------------- |
| TLS em trânsito     | ✅              | Certbot via Nginx, TLS 1.3                    |
| Postgres data files | ⚠️              | Sem pgcrypto / encryption; depende do disco   |
| Volume do host      | ⚠️              | Disco da VPS não declara LUKS/EBS encryption  |
| Backup local        | ✅ (opt-in)     | GPG quando `BACKUP_GPG_RECIPIENT` configurado |
| Backup off-site     | ✅ (dependente) | S3 SSE-S3/SSE-KMS — configurar no bucket      |
| Redis AOF           | ⚠️              | Sem criptografia no volume                    |
| Logs em disco       | ⚠️              | Log rotation, sem criptografia                |

## Decisão arquitetural

Três níveis possíveis, em ordem de esforço:

### Nível 1 — Criptografia de **backup** (implementado — opt-in)

- GPG no `backup.sh` (adicionado nesta correção).
- Bucket S3 com SSE-S3 no provisionamento.

### Nível 2 — Criptografia **de campo** para dados sensíveis

- `pgcrypto` + chave gerenciada.
- Criptografar `Client.allergies`, `Account.cpf`, `Account.cnpj` em
  repouso.
- App decriptografa na leitura via Prisma middleware ou view.
- **Trade-off:** complexidade de rotação de chave + busca por índice
  fica inviável em texto claro.

### Nível 3 — Criptografia **de volume**

- LUKS no disco da VM (ou EBS encryption se migrar para AWS).
- Transparente para o app.
- Não protege contra comprometimento do host — protege contra perda
  física do disco.

## Pendências humanas

1. **Provisionar chaves GPG** — gerar par dedicado (`wbc-backup`), manter
   privada em secret manager, pública na VM de backup.
2. **Configurar `BACKUP_GPG_RECIPIENT`** em `.env.production`.
3. **Provisionar bucket S3** com SSE-S3 ou SSE-KMS (cross-ref ACH-003).
4. **Avaliar nível 2** — elaborar PoC de `pgcrypto` para `allergies`
   (dado de saúde, prioritário). Custo: ~1 sprint.
5. **Avaliar nível 3** — se ficar na Hostinger, LUKS. Se migrar para
   managed (RDS), encryption-at-rest é padrão.
6. **Documentar rotação** — GPG key rotation, KMS key policy.
7. **Testar restore** com chave errada → deve falhar cedo e limpo.
