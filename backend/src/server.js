import path from "path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

import { prisma } from "./lib/prisma.js";

// Import routes
import authRoutes from "./routes/auth.js";
import hospitalsRoutes from "./routes/hospitals.js"; 
import usersRoutes from "./routes/users.js"; 

// Module routes
import patientRoutes from "./routes/modules/patients/patients.routes.js";
import doctorRoutes from "./routes/modules/doctors/doctors.routes.js";
import appointmentRoutes from "./routes/modules/appointments/appointments.routes.js";
import pharmacyRoutes from "./routes/modules/pharmacy/pharmacy.routes.js";
import laboratoryRoutes from "./routes/modules/laboratory/laboratory.routes.js";
import vitalsRoutes from "./routes/modules/vitals/vitals.routes.js";
import billingRoutes from "./routes/modules/billing/billing.routes.js";
import admissionsRoutes from "./routes/modules/admissions/admissions.routes.js";
import medicalRecordsRoutes from "./routes/modules/medical-records/medical-records.routes.js";

// Settings module routes
import { 
  settingsRoutes,
  brandingRoutes,
  hoursRoutes,
  notificationsRoutes,
  featuresRoutes
} from "./routes/modules/settings/index.js";

import securityRoutes from "./routes/modules/settings/submodules/security/security.routes.js";
import integrationsRoutes from "./routes/modules/settings/submodules/intergrations/integrations.routes.js";
import auditLogsRoutes from "./routes/modules/audit-logs/audit-logs.routes.js";

// Middleware
import { requireAuth } from "./middleware/auth.js";
import { tenantContext } from "./middleware/tenant.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

/** ✅ Stable server root */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = __dirname;

/** ✅ Serve uploads */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.set("trust proxy", 1);

// ===============================
// CORS CONFIGURATION
// ===============================
const envOrigins = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...envOrigins,
]);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ===============================
// MIDDLEWARE
// ===============================
app.use(express.json({ limit: "1mb" }));

// Dev request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

app.disable("etag");

// ===============================
// HEALTH CHECK
// ===============================
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Hospital Management System API running",
    timestamp: new Date().toISOString()
  });
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

// ===============================
// PUBLIC ROUTES (No auth required)
// ===============================
app.use("/api/auth", authRoutes);

// ===============================
// PLATFORM ROUTES (SYSTEM_ADMIN only)
// ===============================
app.use("/api/hospitals", requireAuth, hospitalsRoutes); 
app.use("/api/users", requireAuth, usersRoutes); 

// ===============================
// TENANT ROUTES (requireAuth + tenantContext)
// Each route explicitly gets the middleware chain
// ===============================

// Core modules
app.use("/api/patients", requireAuth, tenantContext, patientRoutes);
app.use("/api/doctors", requireAuth, tenantContext, doctorRoutes); 
app.use("/api/appointments", requireAuth, tenantContext, appointmentRoutes);
app.use("/api/pharmacy", requireAuth, tenantContext, pharmacyRoutes);
app.use("/api/laboratory", requireAuth, tenantContext, laboratoryRoutes);
app.use("/api/vitals", requireAuth, tenantContext, vitalsRoutes);
app.use("/api/billing", requireAuth, tenantContext, billingRoutes);
app.use("/api/admissions", requireAuth, tenantContext, admissionsRoutes);
app.use("/api/medical-records", requireAuth, tenantContext, medicalRecordsRoutes);

// Settings modules
app.use("/api/settings", requireAuth, tenantContext, settingsRoutes);
app.use("/api/settings/branding", requireAuth, tenantContext, brandingRoutes);
app.use("/api/settings/hours", requireAuth, tenantContext, hoursRoutes);
app.use("/api/settings/notifications", requireAuth, tenantContext, notificationsRoutes);
app.use("/api/settings/features", requireAuth, tenantContext, featuresRoutes);

app.use("/api/settings/security", requireAuth, tenantContext, securityRoutes);
app.use("/api/settings/integrations", requireAuth, tenantContext, integrationsRoutes);
app.use("/api/audit-logs", requireAuth, tenantContext, auditLogsRoutes);

// ===============================
// USER INFO ENDPOINT
// ===============================
app.get("/api/me", requireAuth, tenantContext, async (req, res) => {
  try {
    const user = req.user;
    return res.json({
      user: {
        id: user?.id ?? null,
        email: req.userEmail ?? null,
        role: req.role ?? user?.role ?? null,
        hospitalId: req.hospitalId ?? null,
        doctorId: req.doctorId ?? null,
        patientId: req.patientId ?? null,
      },
      hospital: req.hospital ? {
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

// ===============================
// 404 HANDLER
// ===============================
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ===============================
// GLOBAL ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  if (err?.message?.includes("CORS")) {
    return res.status(403).json({ message: "Blocked by CORS" });
  }

  return res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log("\n");
  console.log("🏥", "=".repeat(50));
  console.log("🏥  Hospital Management System API");
  console.log("🏥", "=".repeat(50));
  console.log(`🏥  Server:    http://localhost:${PORT}`);
  console.log(`🏥  Health:    http://localhost:${PORT}/health`);
  console.log(`🏥  Port:      ${PORT}`);
  console.log(`🏥  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log("🏥", "=".repeat(50));
  console.log("\n");
});

export default app;