import { prisma } from "../../../../../lib/prisma.js";
import { logAudit } from "../../../../../utils/audit.js";

export class SecurityController {
  static async getSettings(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const settings = await prisma.hospitalSettings.findUnique({
        where: { hospitalId },
        select: { security: true }
      });
      res.json({ security: settings?.security || {} });
    } catch (error) {
      console.error("GET SECURITY ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async updateSettings(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const security = req.body;

      await prisma.hospitalSettings.upsert({
        where: { hospitalId },
        update: { security },
        create: { hospitalId, security }
      });

      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "SECURITY_UPDATED",
        targetType: "HospitalSettings",
        targetId: hospitalId,
        metadata: { security }
      });

      res.json({ message: "Security settings updated", security });
    } catch (error) {
      console.error("UPDATE SECURITY ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}