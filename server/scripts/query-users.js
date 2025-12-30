// Query up to 10 users via Prisma client
require("dotenv").config({ path: "./.env" });
const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({ take: 10 });
    console.log(JSON.stringify(users, null, 2));
  } catch (e) {
    console.error("QUERY_ERROR", e && e.message ? e.message : e);
  } finally {
    await prisma.$disconnect();
  }
})();
