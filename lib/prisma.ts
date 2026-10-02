import "dotenv/config";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

export function getDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.SUPABASE_DATABASE_URL ||
    "";
  return url.trim();
}

export function isDatabaseConfigured(): boolean {
  const url = getDatabaseUrl();
  return Boolean(url && !url.includes("dummy:dummy") && (!url.includes("localhost") || process.env.NODE_ENV !== "production"));
}

function createPrismaClient(): PrismaClient {
  const rawUrl = getDatabaseUrl();
  const connectionString = rawUrl || "postgresql://postgres:postgres@localhost:5432/kraven";

  const isCloudPostgres =
    connectionString.includes("sslmode=require") ||
    connectionString.includes(".neon.tech") ||
    connectionString.includes(".supabase.co") ||
    connectionString.includes(".vercel-storage.com") ||
    connectionString.includes(".render.com") ||
    connectionString.includes(".railway.app") ||
    Boolean(process.env.VERCEL) ||
    (process.env.NODE_ENV === "production" && !connectionString.includes("localhost"));

  const isServerless = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";

  const pool =
    globalForPrisma.pool ??
    new pg.Pool({
      connectionString,
      ssl: isCloudPostgres ? { rejectUnauthorized: false } : undefined,
      max: isServerless ? 3 : 5,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 5000,
    });

  // Always cache on globalThis to prevent connection pool exhaustion in serverless warm containers
  globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  globalForPrisma.prisma = client;
  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();


