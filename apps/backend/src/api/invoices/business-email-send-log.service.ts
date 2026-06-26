import { prisma } from "@repo/db";

export async function hasEmailSendLog(
  organizationId: string,
  scopeKey: string,
): Promise<boolean> {
  const row = await prisma.businessEmailSendLog.findUnique({
    where: {
      organizationId_scopeKey: { organizationId, scopeKey },
    },
    select: { id: true },
  });
  return row !== null;
}

export async function createEmailSendLog(
  organizationId: string,
  scopeKey: string,
): Promise<void> {
  await prisma.businessEmailSendLog.create({
    data: { organizationId, scopeKey },
  });
}
