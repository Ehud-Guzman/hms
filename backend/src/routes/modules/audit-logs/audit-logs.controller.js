// backend/src/modules/audit-logs/audit-logs.controller.js

import { prisma } from "../../../lib/prisma.js";

export class AuditLogsController {
  /**
   * List audit logs with role‑based filtering.
   * Access restricted to SYSTEM_ADMIN and HOSPITAL_ADMIN via route middleware.
   */
  static async list(req, res) {
    try {
      const { role, hospitalId } = req; // from tenantContext and auth
      const { page = 1, limit = 50, action, targetType, fromDate, toDate } = req.query;
      const skip = (page - 1) * limit;

      // Build the Prisma where clause
      const where = {};

      // Apply hospital filter based on role and context
      if (role === 'SYSTEM_ADMIN' && !hospitalId) {
        // SYSTEM_ADMIN with no hospital selected: see logs from all hospitals (no filter)
        // Leave where.hospitalId undefined
      } else if (hospitalId) {
        // Any user with a hospital context (including SYSTEM_ADMIN when a hospital is selected)
        where.hospitalId = hospitalId;
      } else {
        // This should never happen for non‑SYSTEM_ADMIN because tenantContext would have
        // already returned an error. Defensive guard.
        return res.status(403).json({ message: "No hospital context" });
      }

      // Optional filters
      if (action) where.action = action;
      if (targetType) where.targetType = targetType;
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = new Date(fromDate);
        if (toDate) where.createdAt.lte = new Date(toDate);
      }

      // Execute query with pagination
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip: Number(skip),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            hospital: { select: { name: true, code: true } }
          }
        }),
        prisma.auditLog.count({ where })
      ]);

      res.json({
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("LIST AUDIT LOGS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}