import { prisma } from "@/lib/prisma";

export async function assertProjectAccess(userId: string, projectId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
  });
}
