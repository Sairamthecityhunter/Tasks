import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-core";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s) return NextResponse.json({ user: null }, { status: 200 });
  const user = await prisma.user.findUnique({
    where: { id: s.sub },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user });
}
