// backend/prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminUser = "admin";
  const adminPass = "admin123"; // change or use env vars for production

  // if admin exists, skip
  const existing = await prisma.admin.findUnique({ where: { username: adminUser } });
  if (existing) {
    console.log("Admin already exists, skipping seed.");
    return;
  }

  const hash = await bcrypt.hash(adminPass, 10);

  await prisma.admin.create({
    data: {
      username: adminUser,
      password: hash,
      name: "System Admin",
      email: "admin@example.com",
      role: "admin",
      active: true,
    },
  });

  console.log(`Admin created: ${adminUser} / ${adminPass}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
