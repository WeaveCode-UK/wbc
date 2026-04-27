# DNS and email authentication policy — ACH-054, ACH-055

Two related concerns are documented together: anti-spoofing (SPF / DKIM /
DMARC) for the sender domain and registry hardening (DNSSEC, registrar
lock, subdomain inventory) for the apex.

## Sender domain hardening (ACH-054)

The platform sends transactional email from `weavecode.co.uk` via Resend.
Without SPF / DKIM / DMARC the recipient mail server has no way to
distinguish a legitimate WBC email from a spoofed one — and a single
spoofed phishing run can damage every WBC tenant's reputation.

### Required DNS records

| Record | Name                     | Value                                                                                                                                 |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| TXT    | `weavecode.co.uk`        | `v=spf1 include:_spf.resend.com ~all`                                                                                                 |
| CNAME  | `resend._domainkey`      | `<resend-provided-value>`                                                                                                             |
| TXT    | `_dmarc.weavecode.co.uk` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@weavecode.co.uk; ruf=mailto:dmarc@weavecode.co.uk; sp=quarantine; adkim=s; aspf=s; pct=100` |

### Verification

```bash
dig TXT weavecode.co.uk +short                    # SPF
dig TXT resend._domainkey.weavecode.co.uk +short  # DKIM
dig TXT _dmarc.weavecode.co.uk +short             # DMARC
```

The DMARC policy starts at `quarantine` to give us a transition window;
escalate to `p=reject` once the `rua` aggregate report is consistently
clean for 30 days.

### Owner

- Platform team owns the records.
- DMARC `rua` reports go to `dmarc@weavecode.co.uk`; the ops on-call
  reads them weekly.

## Registry hardening (ACH-055)

### DNSSEC

`weavecode.co.uk` MUST have DNSSEC enabled at the registrar (Hostinger
domain dashboard → DNS → DNSSEC). Without DNSSEC, an attacker who
compromises an upstream resolver can poison the SPF/DKIM/DMARC records
above and bypass every email-auth check.

### Registrar lock

`Transfer Lock` at the registrar prevents a third party from initiating
a domain transfer with a leaked auth code. Verify quarterly that the
lock is on.

### Subdomain inventory

Subdomains under `weavecode.co.uk`:

| Subdomain                 | Owner         | Purpose                       |
| ------------------------- | ------------- | ----------------------------- |
| `app.weavecode.co.uk`     | Platform team | Production WBC app            |
| `wbc.cdn.weavecode.co.uk` | Platform team | Static assets (Hostinger CDN) |
| `mail.weavecode.co.uk`    | Platform team | Inbound MX (informational)    |

Stale CNAMEs to dead origins are a subdomain-takeover risk. The list
above is the source of truth; new subdomains require a PR adding them
and a corresponding cleanup PR when they're decommissioned.

## Cadence

Quarterly review of:

- DMARC `rua` reports (subset by failure reason).
- DNSSEC chain still valid (`dig +dnssec weavecode.co.uk SOA`).
- Registrar Transfer Lock still on.
- Subdomain inventory still matches reality.
