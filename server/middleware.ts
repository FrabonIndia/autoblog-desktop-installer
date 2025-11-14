import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Simple session store (in production, use a proper session store)
const sessions = new Map<string, { userId: number; username: string; expiresAt: number }>();

export function generateSessionToken(): string {
  // Use crypto-secure random bytes for unguessable tokens
  return crypto.randomBytes(32).toString("base64url");
}

export function createSession(userId: number, username: string): string {
  const token = generateSessionToken();
  // Session expires in 30 days
  const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
  sessions.set(token, { userId, username, expiresAt });
  return token;
}

export function getSession(token: string) {
  const session = sessions.get(token);
  if (!session) return undefined;
  
  // Check if session is expired
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return undefined;
  }
  
  return session;
}

export function destroySession(token: string) {
  sessions.delete(token);
}

// Auth middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  // Attach user info to request
  (req as any).user = session;
  next();
}
