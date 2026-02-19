// src/middleware/tenant.js
import { prisma } from "../lib/prisma.js";

function normalizeHeader(v) {
  if (Array.isArray(v)) return v[0];
  if (v == null) return null;
  return String(v).trim();
}

function isValidHospitalKey(v) {  // ← FIXED: Capital H, Hospital not hospital
  return typeof v === "string" && /^[a-zA-Z0-9_-]{2,64}$/.test(v);
}

// ---- tiny in-memory cache (kills DB spam)
const USER_CACHE = new Map();
const HOSPITAL_CACHE = new Map();  // ← FIXED: UPPERCASE, Hospital not hospital
const TTL_MS = 30_000;

function cacheGet(map, key) {
  const hit = map.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    map.delete(key);
    return null;
  }
  return hit.data;
}
function cacheSet(map, key, data, ttl = TTL_MS) {
  map.set(key, { data, exp: Date.now() + ttl });
  return data;
}

async function getUserDb(userId) {
  const id = String(userId);
  const cached = cacheGet(USER_CACHE, id);
  if (cached) return cached;

  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      hospitalId: true,
      email: true,
      isActive: true,
      doctor: { select: { id: true, hospitalId: true } },      // ← FIXED: teacher → doctor
      patient: { select: { id: true, hospitalId: true } },     // ← FIXED: student → patient
    },
  });

  return cacheSet(USER_CACHE, id, u);
}

async function resolveHospitalByIdOrCodeCached(key) {  // ← FIXED: School → Hospital
  const k = String(key || "").trim();
  if (!k) return null;

  const cached = cacheGet(HOSPITAL_CACHE, k);  // ← FIXED: SCHOOL_CACHE → HOSPITAL_CACHE
  if (cached) return cached;

  const h = await prisma.hospital.findFirst({  // ← FIXED: school → hospital
    where: { OR: [{ id: k }, { code: k }] },
    select: { id: true, code: true, name: true, isActive: true },
  });

  return cacheSet(HOSPITAL_CACHE, k, h);  // ← FIXED: SCHOOL_CACHE → HOSPITAL_CACHE
}

export async function tenantContext(req, res, next) {
  
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });

    const jwtHospitalRaw = req.user?.hospitalId ?? null;
    const jwtHospitalKey = jwtHospitalRaw ? String(jwtHospitalRaw).trim() : null;

    const userDb = await getUserDb(userId);

    if (!userDb || !userDb.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    req.role = userDb.role;
    req.userEmail = userDb.email;

    req.user = {
      ...(req.user || {}),
      id: userDb.id,
      role: userDb.role,
      hospitalId: userDb.hospitalId ?? null,
      doctorId: userDb.doctor?.id ?? null,    // ← FIXED: teacherId → doctorId
      patientId: userDb.patient?.id ?? null,  // ← FIXED: studentId → patientId
    };

    req.doctorId = req.user.doctorId;   // ← FIXED: teacherId → doctorId
    req.patientId = req.user.patientId; // ← FIXED: studentId → patientId

    // ---- SYSTEM_ADMIN: platform or tenant mode
    if (userDb.role === "SYSTEM_ADMIN") {
      const headerHospitalKey =
        normalizeHeader(req.headers["x-hospital-id"]) ||     // ← FIXED: school → hospital
        normalizeHeader(req.headers["x-hospitalId"]) ||      // ← FIXED: school → hospital
        normalizeHeader(req.headers["x-tenant-id"]) ||
        null;

      // ✅ Prefer header over token (header reflects live selection)
      const effectiveKey = headerHospitalKey || jwtHospitalKey;

      if (!effectiveKey) {
        req.hospitalId = null;
        req.hospital = null;        // ← FIXED: school → hospital
        req.hospitalName = null;    // ← FIXED: schoolName → hospitalName
        return next();
      }

      if (!isValidHospitalKey(effectiveKey)) {  // ← FIXED: isValidSchoolKey → isValidHospitalKey
        return res.status(400).json({ message: "Invalid X-Hospital-Id" });  // ← FIXED: School → Hospital
      }

      const hospital = await resolveHospitalByIdOrCodeCached(effectiveKey);  // ← FIXED: School → Hospital

      if (!hospital) return res.status(404).json({ message: "Hospital not found" });  // ← FIXED: School → Hospital
      if (!hospital.isActive) return res.status(403).json({ message: "Hospital inactive" });  // ← FIXED: School → Hospital

      req.hospitalId = hospital.id;
      req.hospital = hospital;        // ← FIXED: school → hospital
      req.hospitalName = hospital.name; // ← FIXED: schoolName → hospitalName
      return next();
    }

    // ---- Non-system users: must be tenant-bound
    const effectiveHospitalId = userDb.hospitalId;  // ← FIXED: effectivehospitalId → effectiveHospitalId
    if (!effectiveHospitalId) {
      return res.status(403).json({ message: "No hospital linked to this account" });  // ← FIXED: school → hospital
    }

    const hospital = await prisma.hospital.findUnique({  // ← FIXED: school → hospital
      where: { id: String(effectiveHospitalId) },
      select: { id: true, code: true, name: true, isActive: true },
    });

    if (!hospital) return res.status(404).json({ message: "Hospital not found" });  // ← FIXED: school → hospital
    if (!hospital.isActive) return res.status(403).json({ message: "Hospital inactive" });  // ← FIXED: school → hospital

    if (userDb.doctor && userDb.doctor.hospitalId !== hospital.id) {  // ← FIXED: teacher → doctor
      return res.status(403).json({ message: "Doctor profile mismatch (wrong hospital)" });  // ← FIXED: Teacher → Doctor, school → hospital
    }
    if (userDb.patient && userDb.patient.hospitalId !== hospital.id) {  // ← FIXED: student → patient
      return res.status(403).json({ message: "Patient profile mismatch (wrong hospital)" });  // ← FIXED: Student → Patient, school → hospital
    }

    req.hospitalId = hospital.id;
    req.hospital = hospital;        // ← FIXED: school → hospital
    req.hospitalName = hospital.name; // ← FIXED: schoolName → hospitalName
    return next();
  } catch (err) {
    console.error("TENANT CONTEXT ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export function requireTenant(req, res, next) {
  // Allow SYSTEM_ADMIN to access /hospitals without a tenant (inside settings router)
  if (req.role === 'SYSTEM_ADMIN' && req.path === '/hospitals') {
    return next();
  }
  if (!req.hospitalId) {
    return res.status(403).json({
      message: "Tenant required. Select a hospital (SYSTEM_ADMIN) or use a hospital user.",
      code: "TENANT_REQUIRED",
    });
  }
  return next();


}