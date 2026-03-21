import { NextResponse } from 'next/server';
import { PrismaOtpRepository } from '../../../../../../packages/business/auth/adapters/prisma-otp-repository';
import { sendOtp } from '../../../../../../packages/business/auth/use-cases/send-otp';

const otpRepository = new PrismaOtpRepository();

export async function POST(request: Request) {
  try {
    const body = await request.json() as { phone?: string };
    const phone = body.phone;

    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    const result = await sendOtp({ phone }, otpRepository);
    return NextResponse.json({ success: result.success });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
