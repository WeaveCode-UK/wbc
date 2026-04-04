# ADR-002: Multi-Tenant with tenantId Filter

## Status
Accepted

## Context
WBC Platform serves multiple beauty consultants (tenants). Each tenant's data must be isolated.

## Decision
Use tenantId column on all tenant-scoped tables. Every query includes tenantId filter. AsyncLocalStorage carries tenant context through the request lifecycle.

## Consequences
- Simple to implement and reason about
- Every repository method must accept tenantId
- No cross-tenant data leakage when consistently applied
- No RLS at database level (application-enforced)
