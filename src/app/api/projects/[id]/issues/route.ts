import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth-core";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/projectAccess";
import { isPriority, isStatus } from "@/lib/issues";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const postSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(20000).optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().cuid().nullable().optional(),
});

type Params = { id: string };

export async function GET(req: NextRequest, context: { params: Promise<Params> }) {
  const s = await getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await context.params;
  const project = await assertProjectAccess(s.sub, projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const issues = await prisma.issue.findMany({
    where: { projectId },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { number: "asc" }],
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ issues });
}

export async function POST(req: NextRequest, context: { params: Promise<Params> }) {
  const s = await getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await context.params;
  const project = await assertProjectAccess(s.sub, projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid issue" }, { status: 400 });
  }
  const status = parsed.data.status && isStatus(parsed.data.status) ? parsed.data.status : "TODO";
  const priority = parsed.data.priority && isPriority(parsed.data.priority) ? parsed.data.priority : "MEDIUM";
  let assigneeId: string | null = parsed.data.assigneeId ?? null;
  if (assigneeId) {
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: assigneeId },
    });
    if (!member) assigneeId = null;
  }
  const last = await prisma.issue.findFirst({
    where: { projectId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const number = (last?.number ?? 0) + 1;
  const lastOrder = await prisma.issue.findFirst({
    where: { projectId, status },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (lastOrder?.sortOrder ?? 0) + 1;
  const issue = await prisma.issue.create({
    data: {
      projectId,
      number,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      status,
      priority,
      assigneeId,
      reporterId: s.sub,
      sortOrder,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ issue });
}
