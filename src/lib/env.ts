import { z } from "zod";

const envSchema = z.object({
  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Enterprise Skills Hub"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // Auth
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default("2h"),
  JWT_REFRESH_EXPIRY: z.string().default("30d"),

  // SSO
  SSO_ISSUER: z.string().url().optional(),
  SSO_CLIENT_ID: z.string().optional(),
  SSO_CLIENT_SECRET: z.string().optional(),

  // S3
  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_ACCESS_KEY: z.string().default("minioadmin"),
  S3_SECRET_KEY: z.string().default("minioadmin"),
  S3_BUCKET: z.string().default("skills-hub"),
  S3_REGION: z.string().default("us-east-1"),
  S3_AUDIT_BUCKET: z.string().default("skills-hub-audit"),

  // Elasticsearch
  ELASTICSEARCH_URL: z.string().default("http://localhost:9200"),
  ELASTICSEARCH_INDEX: z.string().default("skills"),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32),
  AUDIT_HMAC_KEY: z.string().min(32),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_ELASTICSEARCH: z.string().default("false"),
  NEXT_PUBLIC_ENABLE_SECURITY_SCAN: z.string().default("true"),
});

function createEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = createEnv();
