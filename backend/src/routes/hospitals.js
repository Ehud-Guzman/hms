import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { logAudit } from "../utils/audit.js";

const router = Router();

// All hospital routes require SYSTEM_ADMIN
router.use(requireAuth);
router.use(requireRole("SYSTEM_ADMIN"));

/**
 * POST /api/hospitals
 * Create a new hospital (tenant)
 */
router.post("/", async (req, res) => {
  try {
    const { name, shortName, code, contactEmail, contactPhone, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Hospital name is required" });
    }

    // Check if code is unique (if provided)
    if (code) {
      const existing = await prisma.hospital.findUnique({
        where: { code }
      });
      if (existing) {
        return res.status(409).json({ message: "Hospital code already exists" });
      }
    }

    const hospital = await prisma.hospital.create({
      data: {
        name,
        shortName,
        code: code || `HOSP-${Date.now()}`,
        contactEmail,
        contactPhone,
        address,
        isActive: true,
        onboardingCompleted: false,
        // Create default settings
        settings: {
          create: {}
        }
      },
      include: {
        settings: true
      }
    });

    await logAudit({
      req,
      actorId: req.user.id,
      actorRole: req.role,
      actorEmail: req.userEmail,
      action: "HOSPITALS_CREATED",
      targetType: "Hospital",
      targetId: hospital.id,
      metadata: { name: hospital.name, code: hospital.code }
    });

    res.status(201).json(hospital);
  } catch (error) {
    console.error("CREATE HOSPITAL ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/hospitals
 * List all hospitals
 */
router.get("/", async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
            patients: true,
            doctors: true
          }
        }
      }
    });
    res.json(hospitals);
  } catch (error) {
    console.error("LIST HOSPITALS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/hospitals/:id
 * Get hospital by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        settings: true,
        _count: {
          select: {
            users: true,
            patients: true,
            doctors: true,
            nurses: true,
            appointments: true,
            beds: true
          }
        }
      }
    });

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    res.json(hospital);
  } catch (error) {
    console.error("GET HOSPITAL ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PATCH /api/hospitals/:id
 * Update hospital
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, shortName, code, contactEmail, contactPhone, address, isActive } = req.body;

    const hospital = await prisma.hospital.findUnique({
      where: { id }
    });

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Check code uniqueness if changing
    if (code && code !== hospital.code) {
      const existing = await prisma.hospital.findUnique({
        where: { code }
      });
      if (existing) {
        return res.status(409).json({ message: "Hospital code already exists" });
      }
    }

    const updated = await prisma.hospital.update({
      where: { id },
      data: {
        name,
        shortName,
        code,
        contactEmail,
        contactPhone,
        address,
        isActive
      }
    });

    await logAudit({
      req,
      actorId: req.user.id,
      actorRole: req.role,
      actorEmail: req.userEmail,
      action: "HOSPITALS_UPDATED",
      targetType: "Hospital",
      targetId: updated.id,
      metadata: { changes: req.body }
    });

    res.json(updated);
  } catch (error) {
    console.error("UPDATE HOSPITAL ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE /api/hospitals/:id
 * Deactivate hospital (soft delete)
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const hospital = await prisma.hospital.findUnique({
      where: { id }
    });

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Soft delete - just deactivate
    const updated = await prisma.hospital.update({
      where: { id },
      data: { isActive: false }
    });

    await logAudit({
      req,
      actorId: req.user.id,
      actorRole: req.role,
      actorEmail: req.userEmail,
      action: "HOSPITALS_DEACTIVATED",
      targetType: "Hospital",
      targetId: updated.id
    });

    res.json({ message: "Hospital deactivated successfully" });
  } catch (error) {
    console.error("DELETE HOSPITAL ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;