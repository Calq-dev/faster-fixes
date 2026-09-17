"use server";

import { inngest } from "@/server/inngest";
import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, type inferProcedureOutput } from "@trpc/server";
import z from "zod";

export const bulkUpdateFeedbackStatus = protectedProcedure
  .input(
    z.object({
      feedbackIds: z.array(z.string()).min(1),
      status: z.enum(["new", "in_progress", "resolved", "closed"]),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    // Every id must belong to an organisation the caller is a member of. Checking
    // only the first id let a caller change feedback in other organisations.
    const feedbackIds = [...new Set(input.feedbackIds)];
    const allowed = await prisma.feedback.findMany({
      where: {
        id: { in: feedbackIds },
        project: {
          organization: { members: { some: { userId: session.user.id } } },
        },
      },
      select: { id: true },
    });

    if (allowed.length !== feedbackIds.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found." });
    }

    await prisma.feedback.updateMany({
      where: { id: { in: feedbackIds } },
      data: { status: input.status },
    });

    // Fan-out: one event per feedback so each gets independent retries and
    // fault isolation — a single failing GitHub sync won't block the others.
    const events = feedbackIds.map((feedbackId) => ({
      name: "feedback/status-changed" as const,
      // Dashboard bulk edits are always a human in the inbox.
      data: { feedbackId, newStatus: input.status, actor: "user" as const },
    }));
    inngest.send(events).catch(() => {});

    return { count: input.feedbackIds.length };
  });

export type BulkUpdateFeedbackStatusOutput = inferProcedureOutput<
  typeof bulkUpdateFeedbackStatus
>;
