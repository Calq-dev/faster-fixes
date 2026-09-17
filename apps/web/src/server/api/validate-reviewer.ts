import { prisma } from "@workspace/db";
import crypto from "crypto";

/**
 * Validates that a reviewer token belongs to an active reviewer in the given project.
 * Tokens are stored as SHA-256 hashes. During migration, plaintext fallback is supported.
 * Returns the reviewer record or null if invalid/inactive.
 */
export async function validateReviewer(
  token: string | null,
  projectId: string,
) {
  if (!token) return null;

  const hash = crypto.createHash("sha256").update(token).digest("hex");
  // Only the hash is accepted. A plaintext fallback made the stored hash itself a
  // working credential, so anyone who could read it could act as the reviewer.
  return prisma.reviewer.findFirst({
    where: { token: hash, projectId, isActive: true },
  });
}
