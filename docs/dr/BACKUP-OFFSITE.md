# Backup Off-site (ACH-003)

## Estado atual (pós-correção parcial)

`deploy/backup/backup.sh` agora chama `replicate_offsite` após gerar o
dump local. Quando `BACKUP_S3_URL` está definido (via `.env.production`),
o arquivo é copiado para um bucket remoto usando `aws-cli` (preferência)
ou `mc` (MinIO client). Se nenhuma ferramenta estiver instalada, emite
warning e segue — o backup local continua válido.

Diretório local: `./backups/` (mantido, 30 dias de retenção).

## Variáveis de ambiente

Adicionar em `.env.production`:

```bash
BACKUP_S3_URL=s3://wbc-backups/postgres/
# Se for AWS S3:
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1

# Se for MinIO / R2 / outro provedor S3-compat via mc:
# MC_HOST_minio=https://access:secret@minio.example/
# BACKUP_S3_URL=minio/wbc-backups/postgres/
```

## IAM policy mínima (AWS)

Exemplo para IAM user dedicado (`wbc-backup-writer`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::wbc-backups/postgres/*"
    }
  ]
}
```

Leitura (para restore / drill) deve ficar em outra policy / user separado
para manter o princípio do menor privilégio (cross-ref
seguranca/ACH-016 e compliance-privacidade).

## Pendências humanas (follow-up)

1. **Provisionar bucket** com:
   - Versioning ativo (recuperação de dump corrompido).
   - Lifecycle: transição para Glacier após 30 dias, expiração em 365.
   - Bucket policy negando `s3:DeleteObject` ao user de backup.
   - Server-side encryption (SSE-S3 mínimo, SSE-KMS preferível).
2. **Testar o caminho** em staging antes de habilitar em prod (cross-ref
   ACH-010 — drill de restauração).
3. **Monitorar**: alertar quando o último `PutObject` for > 30h no passado
   (Prometheus via CloudWatch exporter ou check simples em worker).
4. **Cross-ref seguranca/ACH-016**: credenciais AWS devem vir do secret
   manager, não do `.env.production` estático, quando a feature de
   secret-manager estiver pronta.
