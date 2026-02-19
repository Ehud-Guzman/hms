// src/routes/auth.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../utils/jwt.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { tenantContext } from "../middleware/tenant.js";
import { logAudit } from "../utils/audit.js";

const router = Router();

/* ----------------------------------------
 * Helpers
 * ---------------------------------------- */
const cleanEmail = (email) => String(email || "").trim().toLowerCase();

const validatePassword = (password) => {
  const p = String(password || "");
  return p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
};

const normalizeId = (v) => {
  const s = String(v || "").trim();
  return s ? s : null;
};

function upper(v) {
  return String(v || "").trim().toUpperCase();
}

async function resolveHospitalByIdOrCode(key) {  // ← RENAMED: School → Hospital
  const k = normalizeId(key);
  if (!k) return null;

  return prisma.hospital.findFirst({  // ← CHANGED: school → hospital
    where: { OR: [{ id: k }, { code: k }] },
    select: { id: true, code: true, name: true, isActive: true },
  });
}

function auditActorFromUser(user) {
  return {
    actorId: user?.id ?? null,
    actorRole: user?.role ?? null,
    actorEmail: user?.email ?? null,
  };
}

/* ----------------------------------------
 * AUTH (Base path: /api/auth)
 * ---------------------------------------- */

/**
 * Public bootstrap signup:
 * - Allowed ONLY when ALLOW_BOOTSTRAP=true
 * - If there are NO users, create the first user as SYSTEM_ADMIN
 * - After bootstrap, public signup is disabled forever
 */
router.post("/signup", async (req, res) => {
  try {
    if (process.env.ALLOW_BOOTSTRAP !== "true") {
      return res.status(403).json({ message: "Bootstrap disabled" });
    }

    const email = cleanEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 chars and include letters + numbers",
      });
    }

    const usersCount = await prisma.user.count();
    if (usersCount > 0) {
      return res.status(403).json({
        message: "Signup disabled. Ask an admin to create your account.",
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: "SYSTEM_ADMIN",
        isActive: true,
        hospitalId: null,  // ← CHANGED: schoolId → hospitalId
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lockUntil: null,
        lastLoginAt: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        hospitalId: true,  // ← CHANGED: schoolId → hospitalId
        createdAt: true,
      },
    });

    await logAudit({
      req,
      ...auditActorFromUser(user),
      hospitalId: null,  // ← CHANGED: schoolId → hospitalId
      action: "AUTH_BOOTSTRAP_SIGNUP",
      targetType: "USER",
      targetId: user.id,
    });

    const token = signToken({
      sub: user.id,
      role: user.role,
      schoolId: null, // NOTE: Keeping 'schoolId' in JWT payload for compatibility
    });

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Login (tenant-aware)
 * Body:
 * - email
 * - password
 * - hospitalId (optional: only used to validate hospital for non-system users)
 *
 * NOTE:
 * - SYSTEM_ADMIN logs in platform-mode (schoolId in token = null)
 * - hospital context is supplied via x-hospital-id (recommended) or select-hospital route (optional)
 */
router.post("/login", async (req, res) => {
  try {
    const MAX_ATTEMPTS = Number(process.env.AUTH_MAX_ATTEMPTS || 5);
    const LOCK_MINUTES = Number(process.env.AUTH_LOCK_MINUTES || 30);

    const email = cleanEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const hospitalKey = normalizeId(req.body?.hospitalId); // ← RENAMED: schoolKey → hospitalKey, schoolId → hospitalId

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        hospitalId: true,  // ← CHANGED: schoolId → hospitalId
        isActive: true,
        password: true,
        mustChangePassword: true,
        failedLoginAttempts: true,
        lockUntil: true,
      },
    });

    // Generic fail (avoid enumeration)
    if (!user || !user.isActive) {
      await logAudit({
        req,
        actorEmail: email,
        hospitalId: null,  // ← CHANGED: schoolId → hospitalId
        action: "AUTH_LOGIN_FAILED",
        metadata: { reason: "invalid_credentials" },
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Locked check
    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      await logAudit({
        req,
        ...auditActorFromUser(user),
        hospitalId: user.role === "SYSTEM_ADMIN" ? null : user.hospitalId,  // ← CHANGED: schoolId → hospitalId
        action: "AUTH_LOGIN_BLOCKED_LOCKED",
        metadata: { lockUntil: user.lockUntil },
      });

      return res.status(403).json({
        message: "Account temporarily locked. Try again later.",
        code: "ACCOUNT_LOCKED",
      });
    }

    // Password check
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const nextAttempts = (user.failedLoginAttempts || 0) + 1;
      const shouldLock = nextAttempts >= MAX_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: nextAttempts,
          ...(shouldLock
            ? { lockUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) }
            : {}),
        },
      });

      await logAudit({
        req,
        ...auditActorFromUser(user),
        hospitalId: user.role === "SYSTEM_ADMIN" ? null : user.hospitalId,  // ← CHANGED: schoolId → hospitalId
        action: shouldLock ? "AUTH_ACCOUNT_LOCKED" : "AUTH_LOGIN_FAILED",
        metadata: { attempts: nextAttempts, max: MAX_ATTEMPTS },
      });

      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Tenant rule for non-system users:
    // - must have a hospitalId
    // - if client provided hospitalId (id/code), it must match the user's hospital
    if (upper(user.role) !== "SYSTEM_ADMIN") {
      if (!user.hospitalId) {  // ← CHANGED: schoolId → hospitalId
        return res.status(403).json({ message: "No hospital linked to this account" });  // ← CHANGED: school → hospital
      }

      if (hospitalKey) {  // ← RENAMED: schoolKey → hospitalKey
        const hospital = await resolveHospitalByIdOrCode(hospitalKey);  // ← CHANGED: School → Hospital
        if (!hospital) return res.status(404).json({ message: "Hospital not found" });  // ← CHANGED: School → Hospital
        if (!hospital.isActive) return res.status(403).json({ message: "Hospital inactive" });  // ← CHANGED: School → Hospital

        if (String(user.hospitalId) !== String(hospital.id)) {  // ← CHANGED: schoolId → hospitalId
          await logAudit({
            req,
            ...auditActorFromUser(user),
            hospitalId: hospital.id,  // ← CHANGED: schoolId → hospitalId
            action: "AUTH_LOGIN_FAILED",
            metadata: { reason: "hospital_mismatch" },  // ← CHANGED: school_mismatch → hospital_mismatch
          });
          return res.status(403).json({ message: "Account not in this hospital" });  // ← CHANGED: school → hospital
        }
      } else {
        // still validate hospital exists + active
        const hospital = await prisma.hospital.findUnique({  // ← CHANGED: school → hospital
          where: { id: String(user.hospitalId) },  // ← CHANGED: schoolId → hospitalId
          select: { id: true, isActive: true },
        });
        if (!hospital) return res.status(404).json({ message: "Hospital not found" });  // ← CHANGED: School → Hospital
        if (!hospital.isActive) return res.status(403).json({ message: "Hospital inactive" });  // ← CHANGED: School → Hospital
      }
    }

    // Success: reset counters + lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockUntil: null,
        lastLoginAt: new Date(),
      },
    });

    await logAudit({
      req,
      ...auditActorFromUser(user),
      hospitalId: upper(user.role) === "SYSTEM_ADMIN" ? null : user.hospitalId,  // ← CHANGED: schoolId → hospitalId
      action: "AUTH_LOGIN_SUCCESS",
    });

    // Token strategy:
    // - SYSTEM_ADMIN: keep token schoolId null (platform-mode)
    // - Non-system: include schoolId (mapped from hospitalId)
    const token = signToken({
      sub: user.id,
      role: user.role,
      schoolId: upper(user.role) === "SYSTEM_ADMIN" ? null : (user.hospitalId ?? null),  // ← CHANGED: schoolId → hospitalId value
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        hospitalId: upper(user.role) === "SYSTEM_ADMIN" ? null : user.hospitalId,  // ← CHANGED: schoolId → hospitalId
        mustChangePassword: !!user.mustChangePassword,
      },
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Change password (self-service)
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword }
 */
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "currentPassword and newPassword are required",
      });
    }
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 chars and include letters + numbers",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { 
        id: true, 
        email: true, 
        role: true, 
        hospitalId: true,  // ← CHANGED: schoolId → hospitalId
        password: true, 
        isActive: true 
      },
    });

    if (!user || !user.isActive) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: String(userId) },
      data: {
        password: hashed,
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    });

    await logAudit({
      req,
      ...auditActorFromUser(user),
      hospitalId: upper(user.role) === "SYSTEM_ADMIN" ? null : user.hospitalId,  // ← CHANGED: schoolId → hospitalId
      action: "AUTH_PASSWORD_CHANGED",
      targetType: "USER",
      targetId: user.id,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * DEV ONLY: SYSTEM_ADMIN impersonate a user (issues token without password)
 * POST /api/auth/impersonate
 * Body: { userId }
 */
router.post("/impersonate", requireAuth, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  try {
    if (process.env.ALLOW_IMPERSONATION !== "true") {
      return res.status(403).json({ message: "Impersonation disabled" });
    }

    const userId = normalizeId(req.body?.userId);
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const target = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: {
        id: true,
        email: true,
        role: true,
        hospitalId: true,  // ← CHANGED: schoolId → hospitalId
        isActive: true,
        mustChangePassword: true,
      },
    });

    if (!target || !target.isActive) {
      return res.status(404).json({ message: "User not found or inactive" });
    }

    const token = signToken({
      sub: target.id,
      role: target.role,
      schoolId: target.hospitalId ?? null,  // ← CHANGED: schoolId → hospitalId value
    });

    await logAudit({
      req,
      actorId: req.user?.id,
      actorRole: "SYSTEM_ADMIN",
      actorEmail: req.auth?.actorEmail || null,
      hospitalId: target.hospitalId ?? null,  // ← CHANGED: schoolId → hospitalId
      action: "AUTH_IMPERSONATE",
      targetType: "USER",
      targetId: target.id,
      metadata: { targetRole: target.role },
    });

    return res.json({
      token,
      user: {
        id: target.id,
        email: target.email,
        role: target.role,
        hospitalId: target.hospitalId,  // ← CHANGED: schoolId → hospitalId
        mustChangePassword: !!target.mustChangePassword,
      },
    });
  } catch (err) {
    console.error("IMPERSONATE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Current user (DB-truth)
 * GET /api/auth/me
 */
router.get("/me", requireAuth, tenantContext, async (req, res) => {
  try {
    // tenantContext already DB-validated user, role, active
    const user = req.user;
    return res.json({
      user: {
        id: user?.id ?? null,
        email: req.userEmail ?? null,
        role: req.role ?? user?.role ?? null,
        hospitalId: req.hospitalId ?? null,  // ← CHANGED: schoolId → hospitalId
        doctorId: req.doctorId ?? null,      // ← CHANGED: teacherId → doctorId
        patientId: req.patientId ?? null,    // ← CHANGED: studentId → patientId
      },
      hospital: req.hospital ? {  // ← CHANGED: school → hospital
        id: req.hospital.id, 
        code: req.hospital.code, 
        name: req.hospital.name 
      } : null,
    });
  } catch (err) {
    console.error("ME ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * SYSTEM_ADMIN: select a hospital context (issues a new token containing hospitalId)
 *
 * NOTE:
 * You can keep this for convenience, but the cleaner approach is:
 * SYSTEM_ADMIN token stays platform-mode and the client sends x-hospital-id per request.
 */
router.post("/select-hospital", requireAuth, requireRole("SYSTEM_ADMIN"), async (req, res) => {  // ← RENAMED: select-school → select-hospital
  try {
    const hospitalKey = normalizeId(req.body?.hospitalId);  // ← CHANGED: schoolKey → hospitalKey, schoolId → hospitalId
    if (!hospitalKey) return res.status(400).json({ message: "hospitalId required" });  // ← CHANGED: schoolId → hospitalId

    const hospital = await resolveHospitalByIdOrCode(hospitalKey);  // ← CHANGED: School → Hospital
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });  // ← CHANGED: School → Hospital
    if (!hospital.isActive) return res.status(403).json({ message: "Hospital inactive" });  // ← CHANGED: School → Hospital

    const token = signToken({
      sub: req.user.id,
      role: "SYSTEM_ADMIN",
      schoolId: hospital.id, // normalize to real id (kept as schoolId in JWT)
    });

    await logAudit({
      req,
      actorId: req.user.id,
      actorRole: "SYSTEM_ADMIN",
      hospitalId: hospital.id,  // ← CHANGED: schoolId → hospitalId
      action: "AUTH_SELECT_HOSPITAL",  // ← CHANGED: SELECT_SCHOOL → SELECT_HOSPITAL
      metadata: { code: hospital.code, name: hospital.name },  // ← CHANGED: school → hospital
    });

    return res.json({
      token,
      hospital,  // ← CHANGED: school → hospital
      user: {
        id: req.user.id,
        role: "SYSTEM_ADMIN",
        hospitalId: hospital.id,  // ← CHANGED: schoolId → hospitalId
      },
    });
  } catch (err) {
    console.error("SELECT HOSPITAL ERROR:", err);  // ← CHANGED: SCHOOL → HOSPITAL
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Deprecated route (kept to avoid breaking older clients)
 * You already have: POST /api/users
 */
router.post("/admin/create-user", requireAuth, (req, res) => {
  return res.status(410).json({
    message: "Deprecated endpoint. Use POST /api/users instead.",
    code: "DEPRECATED",
  });
});

export default router;