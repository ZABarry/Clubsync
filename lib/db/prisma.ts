import { PrismaClient } from "@prisma/client";
import { createPrismaClient } from "@/lib/db/create-prisma-client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getPrismaClient() {
  if (process.env.DATABASE_URL) {
    return createPrismaClient();
  }
  // Build-time placeholder — runtime requires DATABASE_URL
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { createPrismaClient } from "@/lib/db/create-prisma-client";
