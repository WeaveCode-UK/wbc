# Runbook — Certbot / SSL expiring

## Trigger

- Alerta (a adicionar): certificate expiring in < 14 days.
- Cenário planejado: rotação manual após incident de certbot.

## Diagnóstico

1. Confirmar expiração real:
   ```bash
   ssh prod 'docker compose exec nginx \
     openssl x509 -in /etc/nginx/ssl/live/<dominio>/cert.pem -noout -dates'
   ```
2. Checar logs do certbot (renewal falhou):
   ```bash
   docker compose -f docker-compose.prod.yml logs certbot | tail -200
   ```
3. Causas comuns:
   - Porta 80 bloqueada (Let's Encrypt precisa HTTP-01 via webroot).
   - Rate limit do Let's Encrypt (5 certs/week per domain).
   - DNS incorreto (A record apontando para VPS anterior).

## Mitigação

### A) Renovação forçada (automação funcional, só não rodou ainda)

```bash
docker compose -f docker-compose.prod.yml exec certbot certbot renew --force-renewal
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### B) Emitir certificado do zero

```bash
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d <dominio> -d www.<dominio> \
  --agree-tos -m security@weavecode.co.uk \
  --non-interactive
docker compose -f docker-compose.prod.yml restart nginx
```

### C) Fallback — certificado self-signed temporário (último recurso)

Se Let's Encrypt está bloqueando e o cert expira em < 1h:

```bash
openssl req -x509 -nodes -days 7 -newkey rsa:2048 \
  -keyout /tmp/self.key -out /tmp/self.crt \
  -subj "/CN=<dominio>"
# Trocar em /etc/nginx/ssl temporariamente; avisar usuários sobre warning do browser.
```

> Este é um workaround. Resolver o bloqueio do Let's Encrypt em paralelo.

## Rollback

- Certificado auto-renovado funciona? Nada a reverter.
- Se emissão nova falhou e o antigo ainda está válido: nada a fazer (certbot tentará de novo em 12h).

## Post-mortem

Se a expiração **ocorreu** (downtime real):

- Incident sev-1. Escalar imediatamente.
- Quando caso for fechado, ajustar alerta para 30 dias em vez de 14.

## Referências

- `docker-compose.prod.yml` — service `certbot` (renewal loop).
- Let's Encrypt rate limits: https://letsencrypt.org/docs/rate-limits/

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: 2026-07-24_
