import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { tenantContext } from "../middleware/tenant.js";
import { logAudit } from "../utils/audit.js";

const router = Router();

// All user routes require authentication
router.use(requireAuth);

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get("/me", tenantContext, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        hospitalId: true,
        isActive: true,
        mustChangePassword: true,
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        nurse: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true
          }
        }
      }
    });

    res.json({ user });
  } catch (error) {
    console.error("GET ME ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PATCH /api/users/me
 * Update current user
 */
router.patch("/me", tenantContext, async (req, res) => {
  try {
    const { hospitalId } = req.body;

    // Only SYSTEM_ADMIN can change their hospitalId
    if (req.role !== "SYSTEM_ADMIN" && hospitalId) {
      return res.status(403).json({ message: "Only SYSTEM_ADMIN can change hospital context" });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        hospitalId: hospitalId || null
      },
      select: {
        id: true,
        email: true,
        role: true,
        hospitalId: true,
        isActive: true
      }
    });

    await logAudit({
      req,
      actorId: req.user.id,
      actorRole: req.role,
      actorEmail: req.userEmail,
      hospitalId: user.hospitalId,
      action: "USERS_UPDATED_SELF",
      targetType: "User",
      targetId: user.id,
      metadata: { hospitalId: user.hospitalId }
    });

    res.json({ user });
  } catch (error) {
    console.error("UPDATE ME ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/users
 * Create a new user (SYSTEM_ADMIN or HOSPITAL_ADMIN)
 */
router.post("/", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"), tenantContext, async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, hospitalId } = req.body;

    // Validation
    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password and role are required" });
    }

    // Check permissions
    if (req.role === "HOSPITAL_ADMIN") {
      // Hospital admin can only create users in their hospital
      if (!req.hospitalId) {
        return res.status(403).json({ message: "No hospital context" });
      }
      if (hospitalId && hospitalId !== req.hospitalId) {
        return res.status(403).json({ message: "Cannot create user in different hospital" });
      }
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        hospitalId: hospitalId || req.hospitalId || null,
        isActive: true,
        mustChangePassword: true,
        ...(role === "DOCTOR" && firstName && lastName ? {
          doctor: {
            create: {
              firstName,
              lastName,
              hospitalId: hospitalId || req.hospitalId
            }
          }
        } : {}),
        ...(role === "NURSE" && firstName && lastName ? {
          nurse: {
            create: {
              firstName,
              lastName,
              hospitalId: hospitalId || req.hospitalId
            }
          }
        } : {}),
        ...(role === "RECEPTIONIST" && firstName && lastName ? {
          staff: {
            create: {
              firstName,
              lastName,
              employeeId: `EMP-${Date.now()}`,
              hospitalId: hospitalId || req.hospitalId
            }
          }
        } : {})
      },
      select: {
        id: true,
        email: true,
        role: true,
        hospitalId: true,
        isActive: true,
        createdAt: true
      }
    });

    await logAudit({
      req,
      actorId: req.user.id,
      actorRole: req.role,
      actorEmail: req.userEmail,
      hospitalId: user.hospitalId,
      action: "USERS_CREATED",
      targetType: "User",
      targetId: user.id,
      metadata: { role: user.role }
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/users
 * List users (filter by hospital)
 */
router.get("/", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"), tenantContext, async (req, res) => {
  try {
    const where = {};
    
    if (req.role === "HOSPITAL_ADMIN") {
      where.hospitalId = req.hospitalId;
    } else if (req.query.hospitalId) {
      where.hospitalId = req.query.hospitalId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        hospitalId: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        nurse: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ users });
  } catch (error) {
    console.error("LIST USERS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PATCH /api/users/:id
 * Update user (admin only)
 */
router.patch("/:id", requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN"), tenantContext, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, role, hospitalId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check permissions
    if (req.role === "HOSPITAL_ADMIN") {
      if (user.hospitalId !== req.hospitalId) {
        return res.status(403).json({ message: "Cannot update user in different hospital" });
      }
      if (role && role === "SYSTEM_ADMIN") {
        return res.status(403).json({ message: "Cannot create SYSTEM_ADMIN" });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isActive,
        role,
        hospitalId
      },
      select: {
        id: true,
        email: true,
        role: true,
        hospitalId: true,
        isActive: true
      }
    });

    await logAudit({
      req,
      actorId: req.user.id,
      actorRole: req.role,
      actorEmail: req.userEmail,
      hospitalId: updated.hospitalId,
      action: "USERS_UPDATED",
      targetType: "User",
      targetId: updated.id,
      metadata: { changes: req.body }
    });

    res.json({ user: updated });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;