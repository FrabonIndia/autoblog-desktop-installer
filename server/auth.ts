import { storage } from "./storage";
import crypto from "crypto";

// Simple password hashing using Node's built-in crypto
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function createUser(username: string, password: string) {
  const hashedPassword = hashPassword(password);
  return await storage.createUser({ username, password: hashedPassword });
}

export async function authenticateUser(username: string, password: string) {
  const user = await storage.getUserByUsername(username);
  if (!user) return null;
  
  if (verifyPassword(password, user.password)) {
    return user;
  }
  return null;
}

export async function isFirstTimeSetup(): Promise<boolean> {
  const users = await storage.getAllUsers();
  return users.length === 0;
}
