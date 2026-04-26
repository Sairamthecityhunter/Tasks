import { cookies } from "next/headers";
import { verifyToken, type SessionPayload, SESSION_COOKIE, sessionCookieOptions } from "./auth-core";

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(token: string) {
  const c = await cookies();
  c.set(SESSION_COOKIE, token, { ...sessionCookieOptions });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
