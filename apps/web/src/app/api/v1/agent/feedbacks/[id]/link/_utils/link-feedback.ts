import { prisma } from "@workspace/db";
import { NextRequest, NextResponse } from "next/server";
import { agentError } from "../../../../_utils/agent-error";
import {
  FeedbackIdSchema,
  LinkFeedbackSchema,
} from "../../../../_utils/agent.schema";
import {
  isAuthFailure,
  requireAgentAuth,
} from "../../../../_utils/require-agent-auth";

type RouteContext = { params: Promise<{ id: string }> };

// Stores which tracker issue a feedback item was triaged into. Upserts, so a
// retried triage round overwrites instead of failing.
export async function linkFeedback(req: NextRequest, context: RouteContext) {
  const auth = await requireAgentAuth(
    req.headers.get("authorization"),
    "feedbacks:link",
    "agent:write",
  );
  if (isAuthFailure(auth)) return auth;
  const agentToken = auth;

  const { id } = await context.params;
  const idParsed = FeedbackIdSchema.safeParse(id);
  if (!idParsed.success) {
    return agentError("Invalid feedback ID", "VALIDATION_ERROR", 422);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return agentError("Invalid JSON body", "VALIDATION_ERROR", 422);
  }

  const parsed = LinkFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return agentError("Validation failed", "VALIDATION_ERROR", 422);
  }

  const orgProjectIds = agentToken.organization.projects.map((p) => p.id);
  const feedback = await prisma.feedback.findFirst({
    where: { id: idParsed.data, projectId: { in: orgProjectIds } },
    select: { id: true },
  });

  if (!feedback) {
    return agentError("Feedback not found", "NOT_FOUND", 404);
  }

  const link = await prisma.feedbackExternalLink.upsert({
    where: { feedbackId: feedback.id },
    create: { feedbackId: feedback.id, ...parsed.data },
    update: parsed.data,
  });

  console.info(
    `[agent-api] feedbacks:link tokenId=${agentToken.id} feedbackId=${feedback.id} ${link.provider}:${link.externalId}`,
  );

  return NextResponse.json({
    feedbackId: link.feedbackId,
    provider: link.provider,
    externalId: link.externalId,
    url: link.url,
    updatedAt: link.updatedAt,
  });
}
