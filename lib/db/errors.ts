import { Prisma } from "@prisma/client";

export function isDbConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (
      error.code === "ECONNREFUSED" ||
      error.code === "P1001" ||
      error.code === "P1000"
    );
  }
  if (error instanceof Error) {
    return (
      error.message.includes("DATABASE_URL") ||
      error.message.includes("DIRECT_URL is required") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("Authentication failed") ||
      error.message.includes("credentials") ||
      error.message.includes("connect") ||
      error.message.includes("Connection")
    );
  }
  return false;
}
