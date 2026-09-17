import { prisma } from "@workspace/db";

function pendingInvitationsWhere(email: string) {
  return {
    email: { equals: email.trim().toLowerCase(), mode: "insensitive" as const },
    status: "pending",
    expiresAt: { gt: new Date() },
  };
}

export async function hasPendingInvitation(email: string) {
  const invitation = await prisma.invitation.findFirst({
    where: pendingInvitationsWhere(email),
    select: { id: true },
  });
  return invitation !== null;
}

// Someone who signs up through an invitation joins the inviting organisation
// straight away. Upstream sent them through onboarding first, which forces a
// new project in a new organisation before the invitations page is reachable,
// so invitees ended up working in a copy of the project nobody else could see.
export async function acceptPendingInvitations(userId: string, email: string) {
  const invitations = await prisma.invitation.findMany({
    where: pendingInvitationsWhere(email),
  });

  for (const invitation of invitations) {
    const existing = await prisma.member.findFirst({
      where: { organizationId: invitation.organizationId, userId },
      select: { id: true },
    });

    await prisma.$transaction([
      ...(existing
        ? []
        : [
            prisma.member.create({
              data: {
                organizationId: invitation.organizationId,
                userId,
                role: invitation.role ?? "member",
              },
            }),
          ]),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      }),
    ]);
  }

  if (invitations.length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });
  }

  return invitations.length;
}
