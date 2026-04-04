import { NextResponse } from 'next/server';

// Auth 2.0: OTP login flow replaced by Auth.js (Google + Credentials)
export async function POST() {
  return NextResponse.json(
    { error: 'Auth 2.0 migration complete. Use /api/auth/signin instead.' },
    { status: 503 },
  );
}
