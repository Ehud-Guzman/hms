// src/utils/audit.js
import { prisma } from "../lib/prisma.js";

/**
 * Auto-categorize based on action naming conventions.
 * You can tune these once and forget it.
 *
 * Recommended action style:
 * - AUTH_LOGIN_SUCCESS, AUTH_LOGIN_FAILED
 * - USERS_CREATED, USERS_UPDATED, USERS_SUSPENDED
 * - PATIENTS_REGISTERED, PATIENTS_UPDATED
 * - APPOINTMENTS_BOOKED, APPOINTMENTS_CANCELLED
 * - BILLS_PAID, BILLS_VOIDED
 * - PRESCRIPTIONS_DISPENSED
 * - LAB_ORDERS_COMPLETED
 * - ADMISSIONS_ADMITTED, ADMISSIONS_DISCHARGED
 */
const CATEGORY_RULES = [
  { prefix: "AUTH_", category: "AUTH" },
  { prefix: "USERS_", category: "USERS" },
  { prefix: "HOSPITALS_", category: "HOSPITALS" },
  { prefix: "PATIENTS_", category: "PATIENTS" },
  { prefix: "DOCTORS_", category: "DOCTORS" },
  { prefix: "NURSES_", category: "NURSES" },
  { prefix: "STAFF_", category: "STAFF" },
  { prefix: "APPOINTMENTS_", category: "APPOINTMENTS" },
  { prefix: "PRESCRIPTIONS_", category: "PRESCRIPTIONS" },
  { prefix: "LAB_", category: "LABORATORY" },
  { prefix: "PHARMACY_", category: "PHARMACY" },
  { prefix: "BILLS_", category: "BILLING" },
  { prefix: "PAYMENTS_", category: "BILLING" },
  { prefix: "ADMISSIONS_", category: "ADMISSIONS" },
  { prefix: "REPORTS_", category: "REPORTS" },
  { prefix: "SETTINGS_", category: "SETTINGS" },
  { prefix: "SECURITY_", category: "SECURITY" },
  { prefix: "SYSTEM_", category: "SYSTEM" },
  { prefix: "SYNC_", category: "OFFLINE_SYNC" },
];

// Hard limits (prevents oversized JSON / accidental dumps)
const MAX_METADATA_BYTES = 8_000; // ~8KB (safe default)
const MAX_UA_LENGTH = 512;
const MAX_ACTION_LENGTH = 80;
const MAX_TARGET_TYPE_LENGTH = 40;
const MAX_TARGET_ID_LENGTH = 80;

function upper(v) {
  return String(v || "").trim().toUpperCase();
}

function clampStr(v, maxLen) {
  if (v === null || v === undefined) return null;
  const s = String(v);
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function getCategoryFromAction(action) {
  const a = upper(action);
  for (const rule of CATEGORY_RULES) {
    if (a.startsWith(rule.prefix)) return rule.category;
  }
  return "SYSTEM"; // fallback
}

function safeJsonByteLength(obj) {
  try {
    return Buffer.byteLength(JSON.stringify(obj), "utf8");
  } catch {
    return Infinity;
  }
}

function safeMetadata(input, category) {
  // Always store JSON object (or null)
  if (!input && !category) return null;

  let meta = null;

  // If they pass a string by mistake, wrap it
  if (typeof input === "string") {
    meta = { note: input };
  } else if (input && typeof input === "object" && !Array.isArray(input)) {
    meta = { ...input };
  } else if (Array.isArray(input)) {
    meta = { list: input };
  } else if (input === null || input === undefined) {
    meta = {};
  } else {
    meta = { value: input };
  }

  // Inject category unless already explicitly set
  if (!meta.category) meta.category = category;

  // Clamp size
  const bytes = safeJsonByteLength(meta);
  if (bytes <= MAX_METADATA_BYTES) return meta;

  // If too big, keep only the essentials
  return {
    category: meta.category || category,
    truncated: true,
    originalSizeBytes: bytes,
  };
}

function parseClientIp(req) {
  if (!req) return null;

  const xf = req.headers?.["x-forwarded-for"];
  const xr = req.headers?.["x-real-ip"];

  let ip =
    (typeof xf === "string" ? xf.split(",")[0]?.trim() : null) ||
    (typeof xr === "string" ? xr.trim() : null) ||
    req.socket?.remoteAddress ||
    null;

  if (!ip) return null;

  // Normalize IPv6 mapped IPv4 like ::ffff:127.0.0.1
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);

  return ip;
}

/**
 * logAudit: "never fail main request" logging utility.
 *
 * Usage:
 * await logAudit({ 
 *   req, 
 *   action: "PATIENTS_REGISTERED", 
 *   hospitalId, 
 *   targetType: "Patient", 
 *   targetId, 
 *   metadata: { ... } 
 * })
 */
export async function logAudit({
  req = null,
  actorId = null,
  actorRole = null,
  actorEmail = null,
  hospitalId = null,  // ← CHANGED: schoolId → hospitalId
  action,
  targetType = null,
  targetId = null,
  metadata = null,
} = {}) {
  try {
    if (!action) return;

    const actionNorm = clampStr(upper(action), MAX_ACTION_LENGTH);
    if (!actionNorm) return;

    const category = getCategoryFromAction(actionNorm);

    const ip = parseClientIp(req);
    const userAgent = clampStr(req?.headers?.["user-agent"] || null, MAX_UA_LENGTH);

    const data = {
      actorId: clampStr(actorId, 80),
      actorRole: clampStr(actorRole ? upper(actorRole) : null, 30),
      actorEmail: clampStr(actorEmail, 120),
      hospitalId: clampStr(hospitalId, 80),  // ← CHANGED: schoolId → hospitalId
      action: actionNorm,
      targetType: clampStr(targetType, MAX_TARGET_TYPE_LENGTH),
      targetId: clampStr(targetId, MAX_TARGET_ID_LENGTH),
      metadata: safeMetadata(metadata, category),
      ip,
      userAgent,
    };

    await prisma.auditLog.create({ data });
  } catch (err) {
    // Never break the main request because logging failed
    console.error("AUDIT LOG ERROR:", err);
  }
}