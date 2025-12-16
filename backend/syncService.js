import { PrismaClient } from "@prisma/client";
import { connectRouter } from "./services/mikrotik.js";

const prisma = new PrismaClient();

export async function syncMikrotikUsers() {
  const conn = await connectRouter();

  try {
    // Get all users from MikroTik
    const secrets = await conn.write("/ppp/secret/print");
    const active = await conn.write("/ppp/active/print");

    const activeUsernames = active.map(u => u.name);

    for (const sec of secrets) {
      await prisma.user.updateMany({
        where: { username: sec.name },
        data: {
          disabled: sec.disabled === "true",
          online: activeUsernames.includes(sec.name),
          lastSync: new Date(),
        },
      });
    }

    console.log("✅ Sync completed");
  } catch (err) {
    console.error("❌ Sync failed:", err);
  } finally {
    await conn.close(); // cleanly close MikroTik connection
  }
}
