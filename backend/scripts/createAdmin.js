// backend/scripts/createAdmin.js
import bcrypt from "bcryptjs";
import prisma from "../lib/prismaClient.js";

async function main() {
  const username = process.argv[2] || "admin";
  const password = process.argv[3] || "admin123";
  const name = process.argv[4] || "Admin";

  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log("User already exists:", username);
    process.exit(0);
  }

  const user = await prisma.user.create({
    data: {
      username,
      password: hash,
      name,
      email: null,
    },
  });

  console.log("Created admin:", user.username, "password:", password);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
