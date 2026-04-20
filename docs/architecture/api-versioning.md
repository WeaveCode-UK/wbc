# API Versioning Policy (ACH-002 apis-integracoes)

## Why

Before this doc, the system had `API_VERSION = '1.0.0'` as a string
reported from `health.version` and nothing else: no policy for bumps,
no discoverable compatibility matrix, no way for the mobile app to know
"stop, this server is too new for me" or vice versa. A breaking change
could ship and silently break every mobile install that hadn't updated.

## Versioning rules (semver)

- **MAJOR** — any change that a correctly-coded client against the
  previous MAJOR would observe as a break. Examples: removing a field
  from a response, renaming a procedure, changing a field's type,
  tightening a Zod input that previously accepted more. MAJOR bumps
  are rare and paired with a mobile release.
- **MINOR** — additive, compatible changes. New procedures, new
  _optional_ input fields, new fields on responses (clients that
  ignore them keep working).
- **PATCH** — bug fixes / perf changes that don't touch the wire.

Never reuse a version number. Never retcon a MINOR into a MAJOR after
release.

## Deprecation path

See `docs/architecture/api-deprecation.md` (ACH-005). Short version:
mark the field/procedure `@deprecated`, keep it alive for at least
one MAJOR (≥ 6 months), CI has a check that flags removing a
`@deprecated` entry.

## What `health.version` publishes

```ts
{
  apiVersion: "1.0.0",              // current server
  minMobileVersion: "1.0.0",        // oldest mobile the server will serve
  supportedMobileVersions: [...],   // newest-first list, all still served
  wireFormat: { ... }               // ACH-010
}
```

Mobile flow on cold start:

1. Call `health.version`.
2. If `installedVersion < minMobileVersion`: hard-block the app and
   prompt update.
3. If `installedVersion` is not in `supportedMobileVersions` but
   `>= minMobileVersion`: soft warn ("a newer version is available")
   and continue.
4. Otherwise: run.

## Keeping `SUPPORTED_MOBILE_VERSIONS` honest

Every time a mobile release ships:

1. Append the new build's semver to `SUPPORTED_MOBILE_VERSIONS`
   (newest-first order).
2. If the API removed a field that the mobile build uses, bump
   `MIN_MOBILE_VERSION` so the old build can't connect.
3. Update the API changelog (follow-up — today we don't have one).

## Follow-up

- Write the API changelog as a companion to each MAJOR/MINOR bump.
- Add a CI job that diffs the exported `AppRouter` type against the
  last release and flags removed/renamed procedures (ACH-005 stub is
  already in `scripts/check-deprecated-fields.mjs`).
