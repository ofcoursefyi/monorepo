import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {}

async function update_all() {}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
