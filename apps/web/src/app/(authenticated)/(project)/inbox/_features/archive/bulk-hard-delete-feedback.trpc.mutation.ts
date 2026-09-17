"use server";

import { deleteAsset } from "@/server/storage/delete-asset";
import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import z from "zod";

export const bulkHardDeleteFeedback = protectedProcedure
  .input(z.object({ feedbackIds: z.array(z.string()).min(1) }))
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    // Only feedback in the caller's own organisations. Checking only the first id
    // let a caller permanently delete feedback in other organisations.
    const feedbackIds = [...new Set(input.feedbackIds)];
    const feedbackItems = await prisma.feedback.findMany({
      where: {
        id: { in: feedbackIds },
        project: {
          organization: { members: { some: { userId: session.user.id } } },
        },
      },
    });

    if (feedbackItems.length !== feedbackIds.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found." });
    }

    const nonClosed = feedbackItems.find((f) => f.status !== "closed");
    if (nonClosed) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only archived feedback can be permanently deleted.",
      });
    }

    const screenshotIds = feedbackItems
      .map((f) => f.screenshotId)
      .filter((id): id is string => id !== null);

    await Promise.all(screenshotIds.map((id) => deleteAsset(id)));

    await prisma.feedback.deleteMany({
      where: { id: { in: feedbackIds } },
    });

    return { count: feedbackIds.length };
  });
