import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import bcrypt from "bcryptjs";
import { env } from "@/lib/env";

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

// =============================================================================
// JWT Token Management
// =============================================================================

export interface TokenPayload {
  sub: string;           // User ID
  email: string;
  orgId: string;
  role: string;
  member_id?: string;
  [key: string]: unknown;
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRY)
    .setJti(crypto.randomUUID())
    .sign(jwtSecret);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRY)
    .setJti(crypto.randomUUID())
    .sign(jwtSecret);
}

export async function verifyToken<T extends JWTPayload>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret);
    return payload as T;
  } catch {
    return null;
  }
}

// =============================================================================
// Password Hashing
// =============================================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// =============================================================================
// API Token Hashing
// =============================================================================

export function generateApiToken(): { token: string; hash: string } {
  const token = `sh_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;

  // Simple synchronous hash using a basic algorithm
  let hash = 0;
  const str = token;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hashHex = Math.abs(hash).toString(16).padStart(8, "0");

  return { token, hash: hashHex };
}

// =============================================================================
// Encryption (L4 Security - AES-256-GCM)
// =============================================================================

export async function encrypt(plaintext: string): Promise<{ ciphertext: string; iv: string; tag: string }> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.ENCRYPTION_KEY.slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  const ciphertext = new Uint8Array(encrypted);
  const tag = ciphertext.slice(ciphertext.length - 16);
  const data = ciphertext.slice(0, ciphertext.length - 16);

  return {
    ciphertext: Array.from(data).map((b) => b.toString(16).padStart(2, "0")).join(""),
    iv: Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join(""),
    tag: Array.from(tag).map((b) => b.toString(16).padStart(2, "0")).join(""),
  };
}

export async function decrypt(data: { ciphertext: string; iv: string; tag: string }): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.ENCRYPTION_KEY.slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const ciphertext = new Uint8Array(data.ciphertext.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const iv = new Uint8Array(data.iv.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const tag = new Uint8Array(data.tag.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));

  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, combined);
  return new TextDecoder().decode(decrypted);
}
