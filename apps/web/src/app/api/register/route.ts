import { NextResponse } from 'next/server';
import { PrismaOtpRepository } from '../../../../../../packages/business/auth/adapters/prisma-otp-repository';
import { PrismaTenantRepository } from '../../../../../../packages/business/auth/adapters/prisma-tenant-repository';
import { registerTenant } from '../../../../../../packages/business/auth/use-cases/register-tenant';
import { sendOtp } from '../../../../../../packages/business/auth/use-cases/send-otp';

const otpRepository = new PrismaOtpRepository();
const tenantRepository = new PrismaTenantRepository();

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; phone?: string };

    if (!body.name || !body.phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const result = await registerTenant({ name: body.name, phone: body.phone }, tenantRepository, otpRepository);
    await sendOtp({ phone: body.phone }, otpRepository);

    return NextResponse.json({ tenantId: result.tenantId, slug: result.slug });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
