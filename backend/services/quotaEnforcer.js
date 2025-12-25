import prisma from "../lib/prismaClient.js";
import { withConn } from "./mikrotik.js";

export async function checkQuotas() {
  console.log("🔍 Checking quotas...");
  
  try {
    // 1. Find all users who have a limit AND are not disabled
    const users = await prisma.user.findMany({
      where: {
        disabled: false,
        dataLimit: { gt: 0 }, // Only users with a limit > 0
      },
    });

    for (const user of users) {
      // 2. Check if used > limit
      if (user.usedBytesTotal >= user.dataLimit) {
        console.log(`🚫 LIMIT REACHED: ${user.username} (${user.usedBytesTotal} / ${user.dataLimit})`);
        
        // 3. Disable in DB
        await prisma.user.update({
          where: { id: user.id },
          data: { disabled: true },
        });

        // 4. Disable in MikroTik + Kill Session
        try {
          await withConn(async (conn) => {
            // Disable Secret
            const secrets = await conn.write("/ppp/secret/print", [`?name=${user.username}`]);
            if (secrets[0]) {
               await conn.write("/ppp/secret/set", [`=.id=${secrets[0][".id"]}`, "=disabled=yes"]);
            }
            
            // Kill Active Session (So they disconnect immediately)
            const active = await conn.write("/ppp/active/print", [`?name=${user.username}`]);
            if (active[0]) {
               await conn.write("/ppp/active/remove", [`=.id=${active[0][".id"]}`]);
            }
          });
        } catch (err) {
          console.error(`Failed to enforce quota on MikroTik for ${user.username}`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("Quota Check Error:", err);
  }
}