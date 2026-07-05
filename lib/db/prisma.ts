import { Prisma, PrismaClient } from "@prisma/client";

import { createPrismaClient } from "@/lib/db/create-prisma-client";

const PRISMA_SCHEMA_TAG = "20260705130000_child_sex";

type PrismaGlobal = {
  prisma?: PrismaClient;
  prismaSchemaTag?: string;
};

const globalForPrisma = globalThis as unknown as PrismaGlobal;

function hasCurrentUserFields() {
  return "lastLoginAt" in Prisma.UserScalarFieldEnum;
}

function getClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (
    cached &&
    globalForPrisma.prismaSchemaTag === PRISMA_SCHEMA_TAG &&
    hasCurrentUserFields()
  ) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaTag = PRISMA_SCHEMA_TAG;
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export { createPrismaClient } from "@/lib/db/create-prisma-client";
