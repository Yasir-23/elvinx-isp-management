import { Router } from "express";
import prisma from "../lib/prismaClient.js";

const router = Router();

/**
 * POST /api/invoices
 * Create manual invoice (amount derived from package price)
 */
router.post("/", async (req, res) => {
  try {
    const { userId, status, invoiceDate } = req.body;

    if (!userId || !status || !invoiceDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    if (!["paid", "unpaid"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    // 1️⃣ Fetch user
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        package: true,
      },
    });

    if (!user || !user.package) {
      return res.status(404).json({
        success: false,
        error: "User or user package not found",
      });
    }

    // 2️⃣ Fetch package price
    const pkg = await prisma.package.findFirst({
      where: { name: user.package },
      select: { regularPrice: true },
    });

    if (!pkg || pkg.regularPrice == null || Number(pkg.regularPrice) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Package price is not set",
      });
    }

    // 3️⃣ Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        amount: Number(pkg.regularPrice),
        status,
        invoiceDate: new Date(invoiceDate),
      },
    });

    return res.json({
      success: true,
      invoice,
    });
  } catch (err) {
    console.error("POST /api/invoices error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to create invoice",
    });
  }
});

/**
 * GET /api/invoices
 * Supports:
 *  - page (default 1)
 *  - limit (default 10)
 *  - search (user name / username)
 */
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    // ---------- SEARCH FILTER ----------
    const where = {};

    if (search && search.trim() !== "") {
      const s = search.trim();

      where.user = {
        OR: [
          { name: { contains: s } },
          { username: { contains: s} },
        ],
      };
    }

    // ---------- DB QUERY ----------
    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              package: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: invoices,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("GET /api/invoices error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch invoices",
    });
  }
});

/**
 * PUT /api/invoices/:id/status
 * Mark invoice as paid (unpaid -> paid only)
 */
router.put("/:id/status", async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const { status, paidAt } = req.body;

    if (status !== "paid") {
      return res.status(400).json({
        success: false,
        error: "Only unpaid to paid transition is allowed",
      });
    }

    if (!paidAt) {
      return res.status(400).json({
        success: false,
        error: "paidAt date is required",
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    if (invoice.status !== "unpaid") {
      return res.status(400).json({
        success: false,
        error: "Invoice is already paid",
      });
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "paid",
        paidAt: new Date(paidAt),
      },
    });

    res.json({
      success: true,
      invoice: updated,
    });
  } catch (err) {
    console.error("PUT /api/invoices/:id/status error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update invoice status",
    });
  }
});

/**
 * DELETE /api/invoices/:id
 * Delete invoice (paid or unpaid)
 */
router.delete("/:id", async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    res.json({
      success: true,
    });
  } catch (err) {
    console.error("DELETE /api/invoices/:id error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete invoice",
    });
  }
});



export default router;
