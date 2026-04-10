import { createHash, randomBytes } from "node:crypto";

import { makeDevToken, makeDevUser, readDevUsername } from "@/lib/auth/dev-fallback";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "moa_session";
export const THEME_COOKIE = "moa_theme";

const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  theme: string;
};

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

export function issueDevSession(username: string) {
  const token = makeDevToken(username);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  return { token, expiresAt };
}

export async function revokeSession(token: string | null | undefined) {
  if (!token) return;
  if (readDevUsername(token)) return;
  const tokenHash = hashToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } }).catch(() => {});
}

export async function getSessionUser(token: string | null | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  if (readDevUsername(token)) return makeDevUser();
  const tokenHash = hashToken(token);
  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }
    return {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      displayName: session.user.displayName,
      theme: session.user.theme,
    };
  } catch {
    return null;
  }
}
