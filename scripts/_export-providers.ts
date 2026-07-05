import { config } from "dotenv";
import { writeFileSync } from "fs";
import { createPrismaClient } from "../lib/db/create-prisma-client";

config({ path: ".env.local" });
config();

async function main() {
  const prisma = createPrismaClient();
  const providers = await prisma.provider.findMany({ orderBy: { name: "asc" } });
  writeFileSync(
    "prisma/seed-data/_db-export-providers.json",
    JSON.stringify(providers, null, 2) + "\n",
  );

  const complete = providers.filter(
    (p) => p.description && p.contactEmail && p.phone && p.logoUrl && !p.website?.includes("example.com"),
  );

  console.log(`Exported ${providers.length} providers`);
  console.log(`Fully complete: ${complete.length}/${providers.length}`);
  console.log(`Missing description: ${providers.filter((p) => !p.description).length}`);
  console.log(`Missing email: ${providers.filter((p) => !p.contactEmail).length}`);
  console.log(`Missing phone: ${providers.filter((p) => !p.phone).length}`);
  console.log(`Missing logo: ${providers.filter((p) => !p.logoUrl).length}`);
  console.log(`Placeholder website: ${providers.filter((p) => p.website?.includes("example.com")).length}`);

  await prisma.$disconnect();
}

main();
