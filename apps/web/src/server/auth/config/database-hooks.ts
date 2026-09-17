import { generateUniqueSlug } from "@/app/_features/organization/_utils/generate-unique-slug";
import { prisma } from "@workspace/db";
import type { BetterAuthOptions } from "better-auth";
import { APIError } from "better-auth/api";
import { hasPendingInvitation } from "./accept-pending-invitations";

// SIGNUP_ALLOWED_EMAIL_DOMAINS (comma separated) closes open registration on a
// self-hosted instance: only those domains, or an address with a pending
// organisation invitation, can create an account. Unset keeps upstream behaviour.
async function assertSignupAllowed(email: string) {
  const allowedDomains = (process.env.SIGNUP_ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

  if (allowedDomains.length === 0) return;

  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.split("@").pop() ?? "";
  if (allowedDomains.includes(domain)) return;

  const invitation = await prisma.invitation.findFirst({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
      status: "pending",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!invitation) {
    throw new APIError("FORBIDDEN", {
      message: "Sign-up is by invitation only.",
    });
  }
}

export const databaseHooks: NonNullable<BetterAuthOptions["databaseHooks"]> = {
  user: {
    create: {
      before: async (user) => {
        await assertSignupAllowed(user.email);
        return { data: user };
      },
      after: async (user) => {
        // Create marketing preferences record
        await prisma.marketingPreferences.create({
          data: {
            userId: user.id,
            acceptsNewsletter: false,
            acceptsMarketing: false,
          },
        });

        // Invitees join the inviting organisation on email verification instead.
        if (await hasPendingInvitation(user.email)) return;

        // Generate a unique slug for the default organization
        const organizationSlug = await generateUniqueSlug("My organization");

        // Create a default organization for every new user
        await prisma.organization.create({
          data: {
            name: "My organization",
            slug: organizationSlug,
            isDefault: true,
            members: {
              create: [
                {
                  userId: user.id,
                  role: "owner",
                },
              ],
            },
          },
        });
      },
    },
    update: {
      // Better Auth passes the updated user directly, not { data, oldData }
      after: async (user) => {
        console.log(`[audit] user.updated userId=${user.id}`);
      },
    },
  },

  session: {
    create: {
      before: async (session) => {
        try {
          // Retrieve the user's default organization
          // Invitees have no default organisation of their own, so fall back to
          // the first organisation they are a member of.
          const defaultOrg =
            (await prisma.organization.findFirst({
              where: {
                members: { some: { userId: session.userId } },
                isDefault: true,
              },
            })) ??
            (await prisma.organization.findFirst({
              where: { members: { some: { userId: session.userId } } },
              orderBy: { createdAt: "asc" },
            }));

          // Return the modified session with activeOrganizationId set
          // This directly modifies the session before database persistence
          return {
            data: {
              ...session,
              activeOrganizationId: defaultOrg?.id || null,
            },
          };
        } catch (error) {
          console.error(
            "Error setting default organization for user session:",
            error,
          );

          // Return session without active organization on error
          return {
            data: {
              ...session,
              activeOrganizationId: null,
            },
          };
        }
      },
      after: async (session) => {
        console.log(`[audit] session.created userId=${session.userId}`);
      },
    },
  },
};
