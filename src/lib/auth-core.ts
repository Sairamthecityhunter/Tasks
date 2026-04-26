import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

const COOKIE = "session";
const DAY = 60 * 60 * 24;

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    if (process.env.VERCEL || process.env.CI) {
      console.warn(
        "[auth] AUTH_SECRET is not set. JWT signing will use a build placeholder. Add AUTH_SECRET in your host env (e.g. Vercel) for production.",
      );
    } else {
      throw new Error("AUTH_SECRET is not set");
    }
  }
  return new TextEncoder().encode(s || "insecure-build-placeholder-32b-min!!!!");
}

export type SessionPayload = { sub: string; email: string; name: string };

export const SESSION_COOKIE = COOKIE;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${7 * DAY}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  const sub = payload.sub;
  if (!sub || typeof sub !== "string") return null;
  const email = payload.email;
  const name = payload.name;
  if (typeof email !== "string" || typeof name !== "string") return null;
  return { sub, email, name } satisfies SessionPayload;
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const sessionCookieOptions = {
  name: COOKIE,
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * DAY,
};

export { COOKIE as SESSION_COOKIE_NAME };
