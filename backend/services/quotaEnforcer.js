// backend/services/quotaEnforcer.js
import prisma from "../lib/prismaClient.js";
import { withConn } from "./mikrotik.js";

export async function checkQuotas() {
  console.log("🔍 Checking Quotas & Expiry...");
  
  try {
    // Find active users who have (Limit OR Expiry)
    const users = await prisma.user.findMany({
      where: { disabled: false },
    });

    const now = new Date();

    for (const user of users) {
      let shouldDisable = false;
      let reason = "";

      // 1. Check Data Limit
      if (user.dataLimit && user.dataLimit > 0n && user.usedBytesTotal >= user.dataLimit) {
        shouldDisable = true;
        reason = "Data Limit Reached";
      }

      // 2. Check Expiry Date (NEW)
      if (user.expiryDate && new Date(user.expiryDate) < now) {
        shouldDisable = true;
        reason = "Package Expired";
      }

      if (shouldDisable) {
        console.log(`🚫 DISABLING ${user.username}: ${reason}`);
        
        // Disable in DB
        await prisma.user.update({
          where: { id: user.id },
          data: { disabled: true },
        });

        // Disable in MikroTik + Kill Session
        try {
          await withConn(async (conn) => {
            const secrets = await conn.write("/ppp/secret/print", [`?name=${user.username}`]);
            if (secrets[0]) {
               await conn.write("/ppp/secret/set", [`=.id=${secrets[0][".id"]}`, "=disabled=yes"]);
            }
            const active = await conn.write("/ppp/active/print", [`?name=${user.username}`]);
            if (active[0]) {
               await conn.write("/ppp/active/remove", [`=.id=${active[0][".id"]}`]);
            }
          });
        } catch (err) {
          console.error(`Failed to disable ${user.username}`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("Quota Check Error:", err);
  }
}