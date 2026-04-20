// ACH-002 apis-integracoes: semver policy enforcement starts here.
// `MAJOR.MINOR.PATCH`. Bump MAJOR when a mobile client built against
// the previous one would break; bump MINOR for additive/compatible
// changes. See docs/architecture/api-versioning.md.
export const API_VERSION = "1.0.0";

// Mobile clients consume the tRPC AppRouter via generated types; if a
// response shape lands in a way that old builds can't handle, bump
// MIN_MOBILE_VERSION to the first mobile release that speaks the new
// shape. `health.version` publishes this so the mobile app can prompt
// the user to update before hitting the API.
export const MIN_MOBILE_VERSION = "1.0.0";

// Versions the API is prepared to accept from mobile clients. The most
// recent entry is the preferred build; older entries are still
// supported but may have feature gaps (tagged `@deprecated` in the
// changelog). Ordered newest-first.
export const SUPPORTED_MOBILE_VERSIONS = ["1.0.0"] as const;
