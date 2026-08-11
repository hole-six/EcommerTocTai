import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const sessionName = "toc_tai_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "");

export type SessionUser = { id: string; role: "customer" | "admin"; phone: string };

export async function createSession(user: SessionUser) {
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is not configured.");
  return new SignJWT({ role: user.role, phone: user.phone }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime("7d").sign(secret());
}

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(sessionName)?.value;
  if (!token || !process.env.AUTH_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || (payload.role !== "customer" && payload.role !== "admin") || typeof payload.phone !== "string") return null;
    return { id: payload.sub, role: payload.role, phone: payload.phone };
  } catch { return null; }
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

export const sessionCookie = (token: string) => ({ name: sessionName, value: token, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
