import { NextResponse } from 'next/server';
import { adminService } from '@/services/adminService';
import { getAuthUser } from '@/lib/getAuthUser';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: authUser.userId } });
    if (!admin || !admin.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const entries = await prisma.blacklistEntry.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, entries });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch blacklist' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: authUser.userId } });
    if (!admin || !admin.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { type, value, reason } = await req.json();
    const entry = await adminService.manageBlacklist(type, value, reason, admin.id);

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to manage blacklist' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: authUser.userId } });
    if (!admin || !admin.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { value } = await req.json();
    await prisma.blacklistEntry.delete({ where: { value } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
