import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const postSchema = z.object({
  name: z.string().min(1).max(200),
  key: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[A-Z][A-Z0-9]*$/, "Use 2–10 uppercase letters/numbers, e.g. PROJ"),
  description: z.string().max(2000).optional(),
});

function normalizeKey(k: string) {
  return k.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function GET(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projects = await prisma.project.findMany({
    where: { OR: [{ ownerId: s.sub }, { members: { some: { userId: s.sub } } }] },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { issues: true } } },
  });
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid project details" }, { status: 400 });
  }
  const key = normalizeKey(parsed.data.key);
  if (key.length < 2) {
    return NextResponse.json({ error: "Project key is too short" }, { status: 400 });
  }
  const existing = await prisma.project.findUnique({ where: { key } });
  if (existing) {
    return NextResponse.json({ error: "That project key is already in use" }, { status: 409 });
  }
  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: {
        name: parsed.data.name,
        key,
        description: parsed.data.description ?? "",
        ownerId: s.sub,
      },
    });
    await tx.projectMember.create({ data: { projectId: p.id, userId: s.sub } });
    return p;
  });
  return NextResponse.json({ project });
}
