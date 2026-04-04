import { NextResponse } from 'next/server';

// Auth 2.0: This endpoint will be replaced by Auth.js register flow in F10.E05.
// Temporarily disabled after Tenant schema refactor.

export async function POST() {
  return NextResponse.json(
    { error: 'Registration temporarily disabled — Auth 2.0 migration in progress' },
    { status: 503 },
  );
}
