import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth-core";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/projectAccess";
import { isPriority, isStatus } from "@/lib/issues";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(20000).optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  sortOrder: z.number().optional(),
  assigneeId: z.string().cuid().nullable().optional(),
});

type Params = { id: string };

export async function PATCH(req: NextRequest, context: { params: Promise<Params> }) {
  const s = await getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: issueId } = await context.params;
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const project = await assertProjectAccess(s.sub, issue.projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  const p = parsed.data;
  const data: Prisma.IssueUpdateInput = {};
  if (p.title !== undefined) data.title = p.title;
  if (p.description !== undefined) data.description = p.description;
  if (p.status !== undefined) {
    if (!isStatus(p.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = p.status;
  }
  if (p.priority !== undefined) {
    if (!isPriority(p.priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    data.priority = p.priority;
  }
  if (p.sortOrder !== undefined) data.sortOrder = p.sortOrder;
  if (p.assigneeId !== undefined) {
    if (p.assigneeId === null) {
      data.assignee = { disconnect: true };
    } else {
      const member = await prisma.projectMember.findFirst({
        where: { projectId: issue.projectId, userId: p.assigneeId },
      });
      if (!member) {
        return NextResponse.json({ error: "Assignee must be a project member" }, { status: 400 });
      }
      data.assignee = { connect: { id: p.assigneeId } };
    }
  }
  const updated = await prisma.issue.update({
    where: { id: issueId },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ issue: updated });
}
