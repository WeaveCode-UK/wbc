// ACH-026 performance-escalabilidade: k6 smoke script.
//
// Minimal load test exercising the hot paths (health, login, list
// clients). Intended for staging — points at `$BASE_URL`, uses a test
// user credentials set in `$TEST_EMAIL` / `$TEST_PASSWORD`.
//
// Run:
//   BASE_URL=https://staging.seudominio.com.br \
//   TEST_EMAIL=loadtest@wbc \
//   TEST_PASSWORD=REPLACE \
//   k6 run scripts/load-tests/k6-smoke.js
//
// Tuning: start at the `smoke` stage (1 VU, 30 s). When the smoke
// passes, run `soak` (20 VU, 10 min) then `spike` (0→200 VU over 30s,
// hold 1 min, back to 0). Publish p95 numbers in a perf ADR.

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const TEST_EMAIL = __ENV.TEST_EMAIL;
const TEST_PASSWORD = __ENV.TEST_PASSWORD;

export const options = {
  scenarios: {
    smoke: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 1),
      duration: __ENV.DURATION || "30s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // 1. Health
  const health = http.get(`${BASE_URL}/api/health`);
  check(health, { "health 200": (r) => r.status === 200 });

  // 2. tRPC "health.version" — cheap public procedure.
  const version = http.post(
    `${BASE_URL}/api/trpc/health.version?batch=1`,
    JSON.stringify({ 0: { json: null } }),
    { headers: { "Content-Type": "application/json" } },
  );
  check(version, { "version 200": (r) => r.status === 200 });

  // 3. Auth + protected procedure — only runs when creds set.
  if (TEST_EMAIL && TEST_PASSWORD) {
    const login = http.post(`${BASE_URL}/api/auth/callback/credentials`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      redirect: "false",
    });
    check(login, { "login 200/302": (r) => [200, 302].includes(r.status) });
    // Cookie jar persists session for the VU loop.
  }

  sleep(1);
}
