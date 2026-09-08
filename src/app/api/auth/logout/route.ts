import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export async function POST(req: Request) {
  await clearSession();
  return NextResponse.redirect(new URL('/', req.url));
}
