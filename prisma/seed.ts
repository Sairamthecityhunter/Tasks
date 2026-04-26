import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "you@company.com";
  const password = await bcrypt.hash("changeme-please", 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "You", passwordHash: password },
  });
  const project = await prisma.project.upsert({
    where: { key: "DEMO" },
    update: {},
    create: {
      name: "Demo project",
      key: "DEMO",
      description: "Sample work — add your team in Project settings (invite by email).",
      ownerId: user.id,
    },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
    update: {},
    create: { projectId: project.id, userId: user.id },
  });
  const count = await prisma.issue.count({ where: { projectId: project.id } });
  if (count === 0) {
    await prisma.issue.createMany({
      data: [
        {
          projectId: project.id,
          number: 1,
          title: "Set up this board with your real projects",
          description: "Create projects from the sidebar and invite teammates by email (they need accounts first).",
          status: "TODO",
          priority: "MEDIUM",
          reporterId: user.id,
          sortOrder: 1,
        },
        {
          projectId: project.id,
          number: 2,
          title: "Move cards between columns",
          status: "IN_PROGRESS",
          priority: "LOW",
          reporterId: user.id,
          assigneeId: user.id,
          sortOrder: 1,
        },
        {
          projectId: project.id,
          number: 3,
          title: "First task completed",
          status: "DONE",
          priority: "LOW",
          reporterId: user.id,
          sortOrder: 1,
        },
      ],
    });
  }
  console.log("Seed done. Sign in with:", email, "/ password: changeme-please");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
