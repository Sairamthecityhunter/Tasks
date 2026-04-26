import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/projectAccess";

const postSchema = z.object({ email: z.string().email() });

type Params = { id: string };

export async function GET(req: NextRequest, context: { params: Promise<Params> }) {
  const s = await getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await context.params;
  const project = await assertProjectAccess(s.sub, projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ members: members.map((m) => m.user) });
}

export async function POST(req: NextRequest, context: { params: Promise<Params> }) {
  const s = await getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await context.params;
  const project = await assertProjectAccess(s.sub, projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const owner = project.ownerId === s.sub;
  if (!owner) {
    return NextResponse.json({ error: "Only the project lead can add people" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) {
    return NextResponse.json({ error: "No user with that email. They must sign up first." }, { status: 404 });
  }
  const existing = await prisma.projectMember.findFirst({
    where: { projectId, userId: user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "They are already on this project" }, { status: 409 });
  }
  await prisma.projectMember.create({ data: { projectId, userId: user.id } });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
}
