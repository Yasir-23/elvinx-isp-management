// backend/scripts/createAdmin.js
import bcrypt from "bcryptjs";
import prisma from "../lib/prismaClient.js";

async function main() {
  const username = process.argv[2] || "admin";
  const password = process.argv[3] || "admin123";
  const name = process.argv[4] || "Admin";

  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.staff.findUnique({ where: { username } });
  if (existing) {
    console.log("Super Admin already exists:", username);
    process.exit(0);
  }

  const staff = await prisma.staff.create({
    data: {
      username,
      password: hash,
      name,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Created Super Admin:", staff.username, "password:", password);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
