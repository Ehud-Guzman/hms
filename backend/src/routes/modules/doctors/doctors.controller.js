// backend/src/routes/modules/doctors/doctors.controller.js

import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma.js";
import { DoctorService } from "./doctors.service.js";
import {
  isValidLicense,
  isValidTimeFormat,
  formatDoctorName
} from "./doctors.utils.js";
import { logAudit } from "../../../utils/audit.js";

export class DoctorController {

  /**
   * Create new doctor (admin only)
   */
  static async createDoctor(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const hospital = req.hospital;
      const userId = req.user.id;
      const role = req.role; // admin only by route

      if (!hospitalId) {
        return res.status(403).json({ message: "No hospital context" });
      }

      const data = req.body;

      // Validation
      if (!data.email || !data.password || !data.firstName || !data.lastName) {
        return res.status(400).json({
          message: "Email, password, first name, and last name are required"
        });
      }

      // Check if email exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // Validate license if provided
      if (data.licenseNo && !isValidLicense(data.licenseNo)) {
        return res.status(400).json({
          message: "Invalid license number format"
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create doctor
      const doctor = await DoctorService.createDoctor(
        { ...data, password: hashedPassword },
        hospitalId,
        hospital.code || hospital.name.slice(0, 3).toUpperCase(),
        userId
      );

      // Log audit
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "DOCTORS_CREATED",
        targetType: "Doctor",
        targetId: doctor.id,
        metadata: {
          name: `${doctor.firstName} ${doctor.lastName}`,
          specialty: doctor.specialty,
          licenseNo: doctor.licenseNo
        }
      });

      res.status(201).json({
        message: "Doctor created successfully",
        doctor
      });

    } catch (error) {
      console.error("CREATE DOCTOR ERROR:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  /**
   * Get doctor by ID (all authenticated users)
   */
  static async getDoctor(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const currentDoctorId = req.doctorId; // for doctors, their own ID

      const doctor = await DoctorService.getDoctorById(id, hospitalId, role, currentDoctorId);

      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      res.json({ doctor });

    } catch (error) {
      console.error("GET DOCTOR ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Update doctor (admin only)
   */
  static async updateDoctor(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role; // admin only

      // Check if doctor exists
      const existing = await prisma.doctor.findFirst({
        where: { id, hospitalId }
      });

      if (!existing) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Validate license if changing
      if (req.body.licenseNo && !isValidLicense(req.body.licenseNo)) {
        return res.status(400).json({
          message: "Invalid license number format"
        });
      }

      const doctor = await DoctorService.updateDoctor(id, hospitalId, req.body);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "DOCTORS_UPDATED",
        targetType: "Doctor",
        targetId: doctor.id,
        metadata: {
          changes: Object.keys(req.body)
        }
      });

      res.json({
        message: "Doctor updated successfully",
        doctor
      });

    } catch (error) {
      console.error("UPDATE DOCTOR ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * List doctors (all authenticated users)
   */
  static async listDoctors(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const currentDoctorId = req.doctorId; // may be used for filtering (e.g., show only self? but we allow all)

      const {
        search,
        specialty,
        departmentId,
        isActive,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const result = await DoctorService.listDoctors({
        hospitalId,
        role,
        currentDoctorId,
        search,
        specialty,
        departmentId,
        isActive: isActive === 'false' ? false : true,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc'
      });

      res.json(result);

    } catch (error) {
      console.error("LIST DOCTORS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Delete/deactivate doctor (admin only)
   */
  static async deleteDoctor(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role; // admin only

      // Soft delete - deactivate doctor and user
      const doctor = await prisma.$transaction(async (tx) => {
        const doc = await tx.doctor.update({
          where: { id, hospitalId },
          data: { isActive: false }
        });

        await tx.user.update({
          where: { id: doc.userId },
          data: { isActive: false }
        });

        return doc;
      });

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "DOCTORS_DEACTIVATED",
        targetType: "Doctor",
        targetId: doctor.id,
        metadata: {
          name: `${doctor.firstName} ${doctor.lastName}`
        }
      });

      res.json({
        message: "Doctor deactivated successfully"
      });

    } catch (error) {
      console.error("DELETE DOCTOR ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get available slots (all authenticated users)
   */
  static async getAvailableSlots(req, res) {
    try {
      const { id } = req.params;
      const { date } = req.query;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const currentDoctorId = req.doctorId;

      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }

      const slots = await DoctorService.getAvailableSlots(id, hospitalId, date, role, currentDoctorId);

      res.json(slots);

    } catch (error) {
      console.error("GET AVAILABLE SLOTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Set availability override (admin only – but route may allow doctor self?)
   * The route already has requireRole("SYSTEM_ADMIN", "HOSPITAL_ADMIN", "DOCTOR")
   * So we need to ensure that a doctor can only set their own availability.
   */
  static async setAvailability(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const currentDoctorId = req.doctorId;

      const { doctorId, date } = req.body;
      if (!doctorId || !date) {
        return res.status(400).json({ message: "doctorId and date are required" });
      }

      // If user is a doctor, they can only set their own availability
      if (role === 'DOCTOR' && doctorId !== currentDoctorId) {
        return res.status(403).json({ message: "You can only set your own availability" });
      }

      const availability = await DoctorService.setAvailability(req.body, hospitalId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "DOCTORS_AVAILABILITY_UPDATED",
        targetType: "Doctor",
        targetId: doctorId,
        metadata: {
          date: req.body.date,
          isAvailable: req.body.isAvailable
        }
      });

      res.json({
        message: "Availability updated successfully",
        availability
      });

    } catch (error) {
      console.error("SET AVAILABILITY ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get doctor statistics (admin only – already in route)
   */
  static async getDoctorStats(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role; // admin only

      const stats = await DoctorService.getDoctorStats(hospitalId, role);

      res.json({ stats });

    } catch (error) {
      console.error("DOCTOR STATS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get doctor's upcoming appointments
   * Route allows: DOCTOR, HOSPITAL_ADMIN, SYSTEM_ADMIN
   * If doctor, they can only see their own.
   */
  static async getUpcomingAppointments(req, res) {
    try {
      const { id } = req.params;
      const { days } = req.query;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const currentDoctorId = req.doctorId;

      // Permission: if doctor, ensure they are requesting their own
      if (role === 'DOCTOR' && id !== currentDoctorId) {
        return res.status(403).json({ message: "You can only view your own appointments" });
      }

      const appointments = await DoctorService.getUpcomingAppointments(
        id,
        hospitalId,
        parseInt(days) || 7
      );

      res.json({ appointments });

    } catch (error) {
      console.error("GET UPCOMING APPOINTMENTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get all specialties (all authenticated users)
   */
  static async getSpecialties(req, res) {
    try {
      const hospitalId = req.hospitalId;

      const specialties = await prisma.doctor.findMany({
        where: {
          hospitalId,
          specialty: { not: null }
        },
        distinct: ['specialty'],
        select: {
          specialty: true
        }
      });

      res.json({
        specialties: specialties.map(s => s.specialty).filter(Boolean)
      });

    } catch (error) {
      console.error("GET SPECIALTIES ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Search doctors (quick lookup) – all authenticated users
   */
  static async searchDoctors(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.json({ doctors: [] });
      }

      const doctors = await prisma.doctor.findMany({
        where: {
          hospitalId,
          isActive: true,
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { specialty: { contains: q, mode: 'insensitive' } },
            { licenseNo: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specialty: true,
          consultationFee: true,
          licenseNo: true
        }
      });

      res.json({ doctors });

    } catch (error) {
      console.error("SEARCH DOCTORS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}