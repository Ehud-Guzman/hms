import { prisma } from "../../../../../lib/prisma.js";
import { logAudit } from "../../../../../utils/audit.js";

export class IntegrationsController {
  static async list(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const integrations = await prisma.integration.findMany({
        where: { hospitalId },
        orderBy: { name: 'asc' }
      });
      res.json({ integrations });
    } catch (error) {
      console.error("LIST INTEGRATIONS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getOne(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const integration = await prisma.integration.findFirst({
        where: { id, hospitalId }
      });
      if (!integration) return res.status(404).json({ message: "Integration not found" });
      res.json({ integration });
    } catch (error) {
      console.error("GET INTEGRATION ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async create(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const { name, type, config, enabled } = req.body;

      const integration = await prisma.integration.create({
        data: { hospitalId, name, type, config, enabled }
      });

      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "INTEGRATION_CREATED",
        targetType: "Integration",
        targetId: integration.id,
        metadata: { name, type }
      });

      res.status(201).json({ integration });
    } catch (error) {
      console.error("CREATE INTEGRATION ERROR:", error);
      if (error.code === 'P2002') return res.status(409).json({ message: "Integration with this name already exists" });
      res.status(500).json({ message: "Server error" });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const { name, type, config, enabled } = req.body;

      const integration = await prisma.integration.updateMany({
        where: { id, hospitalId },
        data: { name, type, config, enabled }
      });

      if (integration.count === 0) return res.status(404).json({ message: "Integration not found" });

      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "INTEGRATION_UPDATED",
        targetType: "Integration",
        targetId: id
      });

      res.json({ message: "Integration updated" });
    } catch (error) {
      console.error("UPDATE INTEGRATION ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;

      const result = await prisma.integration.deleteMany({
        where: { id, hospitalId }
      });

      if (result.count === 0) return res.status(404).json({ message: "Integration not found" });

      await logAudit({
        req,
        actorId: userId,
        actorRole: req.role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "INTEGRATION_DELETED",
        targetType: "Integration",
        targetId: id
      });

      res.json({ message: "Integration deleted" });
    } catch (error) {
      console.error("DELETE INTEGRATION ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}