// backend/routes/wallet.js
import { Router } from "express";
import prisma from "../lib/prismaClient.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { hierarchyScope } from "../middleware/hierarchyScope.js";

const router = Router();

// POST /api/wallet/transfer
router.post("/transfer", requireAuth, hierarchyScope, async (req, res) => {
  try {
    const senderId = req.user.id;
    const senderRole = req.user.role;
    const { receiverId, amount } = req.body;

    if (!receiverId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid receiver or amount." });
    }

    if (senderId === Number(receiverId)) {
      return res.status(400).json({ success: false, error: "Cannot transfer credits to yourself." });
    }

    // 1️⃣ Enforce Data Isolation Boundaries
    // scope allows SUPER_ADMIN (null) OR any nested child. 
    if (req.scopedStaffIds !== null) {
      if (!req.scopedStaffIds.includes(Number(receiverId))) {
        return res.status(403).json({ success: false, error: "You can only transfer credits to downstream staff within your hierarchy." });
      }
    }

    // 2️⃣ Verify receiver exists
    const receiver = await prisma.staff.findUnique({ where: { id: Number(receiverId) } });
    if (!receiver) {
      return res.status(404).json({ success: false, error: "Receiver not found." });
    }

    // 3️⃣ Secure Atomic Database Transaction
    await prisma.$transaction(async (tx) => {
      // If NOT Super Admin, verify sender balance and deduct
      if (senderRole !== "SUPER_ADMIN") {
        const sender = await tx.staff.findUnique({ where: { id: senderId } });
        if (sender.walletBalance < amount) {
          throw new Error("INSUFFICIENT_FUNDS");
        }

        await tx.staff.update({
          where: { id: senderId },
          data: { walletBalance: { decrement: amount } }
        });
      }

      // Add to receiver
      await tx.staff.update({
        where: { id: Number(receiverId) },
        data: { walletBalance: { increment: amount } }
      });
    });

    return res.json({ success: true, message: `Successfully transferred ${amount} credits to ${receiver.name}` });
  } catch (err) {
    console.error("Credit Transfer Error:", err);
    if (err.message === "INSUFFICIENT_FUNDS") {
      return res.status(400).json({ success: false, error: "Insufficient wallet balance." });
    }
    return res.status(500).json({ success: false, error: "Server error during credit transfer." });
  }
});

// POST /api/wallet/adjust
router.post("/adjust", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, error: "Only Super Admin can adjust balances directly." });
    }

    const { targetStaffId, action, amount } = req.body;
    const numericAmount = Number(amount);

    if (!targetStaffId || !numericAmount || numericAmount <= 0 || !["add", "deduct"].includes(action)) {
      return res.status(400).json({ success: false, error: "Invalid parameters." });
    }

    const targetStaff = await prisma.staff.findUnique({ where: { id: Number(targetStaffId) } });
    if (!targetStaff) {
      return res.status(404).json({ success: false, error: "Target staff not found." });
    }

    const dataUpdate = action === "add" 
      ? { walletBalance: { increment: numericAmount } }
      : { walletBalance: { decrement: numericAmount } };

    await prisma.staff.update({
      where: { id: Number(targetStaffId) },
      data: dataUpdate
    });

    return res.json({ success: true, message: `Successfully ${action === 'add' ? 'added' : 'deducted'} ${numericAmount} credits for ${targetStaff.name}` });
  } catch (err) {
    console.error("Balance Adjust Error:", err);
    return res.status(500).json({ success: false, error: "Server error during balance adjustment." });
  }
});

export default router;
