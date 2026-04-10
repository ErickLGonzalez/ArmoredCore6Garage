import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "moa_session";
export const THEME_COOKIE = "moa_theme";

const SESSION_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createRawSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function issueSession(userId: string) {
  const token = createRawSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
  return { token, expiresAt };
}

export async function revokeSession(token: string | null | undefined) {
  if (!token) return;
  const tokenHash = hashToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export async function getSessionUser(token: string | null | undefined) {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}
