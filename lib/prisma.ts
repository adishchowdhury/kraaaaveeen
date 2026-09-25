import "dotenv/config";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/kraven";

  const isCloudPostgres =
    connectionString.includes("sslmode=require") ||
    connectionString.includes(".neon.tech") ||
    connectionString.includes(".supabase.co") ||
    connectionString.includes(".vercel-storage.com") ||
    connectionString.includes(".render.com") ||
    connectionString.includes(".railway.app") ||
    (process.env.NODE_ENV === "production" && !connectionString.includes("localhost"));

  const pool =
    globalForPrisma.pool ??
    new pg.Pool({
      connectionString,
      ssl: isCloudPostgres ? { rejectUnauthorized: false } : undefined,
      max: process.env.NODE_ENV === "production" ? 10 : 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

