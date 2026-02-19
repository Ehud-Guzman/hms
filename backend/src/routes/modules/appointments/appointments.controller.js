// backend/src/routes/modules/appointments/appointments.controller.js

import { prisma } from "../../../lib/prisma.js";
import { AppointmentService } from "./appointments.service.js";
import {
  formatAppointmentDisplay,
  generateOfflineId
} from "./appointments.utils.js";
import { logAudit } from "../../../utils/audit.js";

export class AppointmentController {

  /**
   * Book new appointment
   */
  static async bookAppointment(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const hospital = req.hospital;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId; // for doctors, this is their own doctorId

      if (!hospitalId) {
        return res.status(403).json({ message: "No hospital context" });
      }

      const data = req.body;

      // Validation
      if (!data.patientId || !data.doctorId || !data.date || !data.startTime) {
        return res.status(400).json({
          message: "Patient ID, Doctor ID, date, and start time are required"
        });
      }

      // Permission: doctors can only book appointments for themselves
      if (role === 'DOCTOR' && data.doctorId !== doctorId) {
        return res.status(403).json({ message: "Doctors can only book appointments for themselves" });
      }

      // Check if patient exists
      const patient = await prisma.patient.findFirst({
        where: {
          id: data.patientId,
          hospitalId,
          isActive: true
        }
      });

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Check if doctor exists and is active
      const doctor = await prisma.doctor.findFirst({
        where: {
          id: data.doctorId,
          hospitalId,
          isActive: true
        }
      });

      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found or inactive" });
      }

      // Book appointment
      const appointment = await AppointmentService.bookAppointment(
        data,
        hospitalId,
        hospital.code || hospital.name.slice(0, 3).toUpperCase(),
        userId,
        role,
        doctorId
      );

      // Log audit
      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "APPOINTMENTS_BOOKED",
        targetType: "Appointment",
        targetId: appointment.id,
        metadata: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          date: data.date,
          time: data.startTime
        }
      });

      res.status(201).json({
        message: "Appointment booked successfully",
        appointment: formatAppointmentDisplay(appointment)
      });

    } catch (error) {
      console.error("BOOK APPOINTMENT ERROR:", error);

      if (error.message.includes("already booked")) {
        return res.status(409).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  /**
   * Get all appointments (with filters)
   */
  static async getAllAppointments(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const appointments = await AppointmentService.getAllAppointments(
        hospitalId,
        req.query,
        role,
        doctorId
      );
      res.json(appointments);
    } catch (error) {
      console.error("GET ALL APPOINTMENTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Check-in patient
   */
  static async checkIn(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const appointment = await AppointmentService.checkIn(id, hospitalId, userId, role, doctorId);

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found or cannot be checked in" });
      }

      // Move to waiting queue
      await prisma.appointment.update({
        where: { id },
        data: { status: 'WAITING' }
      });

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "APPOINTMENTS_CHECKED_IN",
        targetType: "Appointment",
        targetId: appointment.id
      });

      res.json({
        message: "Patient checked in successfully",
        appointment: formatAppointmentDisplay({
          ...appointment,
          status: 'WAITING'
        })
      });

    } catch (error) {
      console.error("CHECK-IN ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Start appointment
   */
  static async startAppointment(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const appointment = await AppointmentService.startAppointment(id, hospitalId, role, doctorId);

      res.json({
        message: "Appointment started",
        appointment: formatAppointmentDisplay(appointment)
      });

    } catch (error) {
      console.error("START APPOINTMENT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Complete appointment
   */
  static async completeAppointment(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const data = {
        ...req.body,
        userId
      };

      const appointment = await AppointmentService.completeAppointment(id, hospitalId, data, role, doctorId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "APPOINTMENTS_COMPLETED",
        targetType: "Appointment",
        targetId: appointment.id,
        metadata: {
          diagnosis: data.diagnosis
        }
      });

      res.json({
        message: "Appointment completed",
        appointment: formatAppointmentDisplay(appointment)
      });

    } catch (error) {
      console.error("COMPLETE APPOINTMENT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const appointment = await AppointmentService.cancelAppointment(id, hospitalId, reason, userId, role, doctorId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "APPOINTMENTS_CANCELLED",
        targetType: "Appointment",
        targetId: appointment.id,
        metadata: { reason }
      });

      res.json({
        message: "Appointment cancelled",
        appointment: formatAppointmentDisplay(appointment)
      });

    } catch (error) {
      console.error("CANCEL APPOINTMENT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Mark no-show
   */
  static async markNoShow(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const appointment = await AppointmentService.markNoShow(id, hospitalId, role, doctorId);

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "APPOINTMENTS_NO_SHOW",
        targetType: "Appointment",
        targetId: appointment.id
      });

      res.json({
        message: "Patient marked as no-show",
        appointment: formatAppointmentDisplay(appointment)
      });

    } catch (error) {
      console.error("NO-SHOW ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get appointment by ID
   */
  static async getAppointment(req, res) {
    try {
      const { id } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const appointment = await AppointmentService.getAppointmentById(id, hospitalId, role, doctorId);

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      res.json({ appointment });

    } catch (error) {
      console.error("GET APPOINTMENT ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get today's appointments
   */
  static async getTodayAppointments(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const appointments = await AppointmentService.getTodayAppointments(hospitalId, role, doctorId);

      res.json({
        date: new Date().toISOString().split('T')[0],
        total: appointments.length,
        appointments: appointments.map(formatAppointmentDisplay)
      });

    } catch (error) {
      console.error("GET TODAY APPOINTMENTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get waiting list
   */
  static async getWaitingList(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const waiting = await AppointmentService.getWaitingList(hospitalId, role, doctorId);

      res.json({
        total: waiting.length,
        waiting: waiting.map(a => ({
          ...formatAppointmentDisplay(a),
          waitingTime: a.checkedInAt ?
            Math.floor((new Date() - new Date(a.checkedInAt)) / 60000) : 0
        }))
      });

    } catch (error) {
      console.error("GET WAITING LIST ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get calendar view
   */
  static async getCalendar(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const { startDate, endDate, doctorId: queryDoctorId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "startDate and endDate are required (YYYY-MM-DD)"
        });
      }

      const calendar = await AppointmentService.getCalendar(
        hospitalId,
        startDate,
        endDate,
        queryDoctorId,
        role,
        doctorId
      );

      res.json({ calendar });

    } catch (error) {
      console.error("GET CALENDAR ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get patient appointments
   */
  static async getPatientAppointments(req, res) {
    try {
      const { patientId } = req.params;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;
      const { limit } = req.query;

      const appointments = await AppointmentService.getPatientAppointments(
        patientId,
        hospitalId,
        parseInt(limit) || 10,
        role,
        doctorId
      );

      res.json({ appointments });

    } catch (error) {
      console.error("GET PATIENT APPOINTMENTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get doctor appointments
   */
  static async getDoctorAppointments(req, res) {
    try {
      const { doctorId: targetDoctorId } = req.params;
      const { date } = req.query;
      const hospitalId = req.hospitalId;
      const role = req.role;
      const currentDoctorId = req.doctorId;

      const appointments = await AppointmentService.getDoctorAppointments(
        targetDoctorId,
        hospitalId,
        date,
        role,
        currentDoctorId
      );

      res.json({
        doctorId: targetDoctorId,
        date: date || 'all',
        total: appointments.length,
        appointments
      });

    } catch (error) {
      console.error("GET DOCTOR APPOINTMENTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Reschedule appointment
   */
  static async rescheduleAppointment(req, res) {
    try {
      const { id } = req.params;
      const { date, time, reason } = req.body;
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      if (!date || !time) {
        return res.status(400).json({ message: "New date and time are required" });
      }

      const appointment = await AppointmentService.rescheduleAppointment(
        id,
        hospitalId,
        date,
        time,
        reason,
        role,
        doctorId
      );

      await logAudit({
        req,
        actorId: userId,
        actorRole: role,
        actorEmail: req.userEmail,
        hospitalId,
        action: "APPOINTMENTS_RESCHEDULED",
        targetType: "Appointment",
        targetId: appointment.id,
        metadata: { newDate: date, newTime: time, reason }
      });

      res.json({
        message: "Appointment rescheduled successfully",
        appointment: formatAppointmentDisplay(appointment)
      });

    } catch (error) {
      console.error("RESCHEDULE ERROR:", error);

      if (error.message.includes("not available")) {
        return res.status(409).json({ message: error.message });
      }

      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get appointment statistics
   */
  static async getAppointmentStats(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const role = req.role;
      const doctorId = req.doctorId;

      const stats = await AppointmentService.getAppointmentStats(hospitalId, role, doctorId);

      res.json({ stats });

    } catch (error) {
      console.error("APPOINTMENT STATS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Sync offline appointments
   */
  static async syncOfflineAppointments(req, res) {
    try {
      const hospitalId = req.hospitalId;
      const userId = req.user.id;
      const role = req.role;
      const doctorId = req.doctorId;

      const appointments = Array.isArray(req.body) ? req.body : [req.body];

      const results = await AppointmentService.syncOfflineAppointments(
        appointments,
        hospitalId,
        userId,
        role,
        doctorId
      );

      res.json({
        message: `${results.length} appointments synced`,
        results,
        syncStatus: "COMPLETED"
      });

    } catch (error) {
      console.error("SYNC APPOINTMENTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  /**
   * Get available slots for doctor/date
   */
  static async getAvailableSlots(req, res) {
    try {
      const { doctorId, date } = req.query;
      const hospitalId = req.hospitalId;

      if (!doctorId || !date) {
        return res.status(400).json({ message: "doctorId and date are required" });
      }

      // This endpoint is open to all authenticated users, no role filtering needed
      // (but it already respects hospital and doctor)

      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();

      const schedule = await prisma.doctorSchedule.findFirst({
        where: {
          doctorId,
          hospitalId,
          dayOfWeek,
          isActive: true
        }
      });

      if (!schedule) {
        return res.json({
          available: false,
          message: "Doctor not available on this day",
          slots: []
        });
      }

      // Check for override
      const override = await prisma.doctorAvailability.findUnique({
        where: {
          hospitalId_doctorId_date: {
            hospitalId,
            doctorId,
            date: targetDate
          }
        }
      });

      if (override && !override.isAvailable) {
        return res.json({
          available: false,
          message: override.reason || "Doctor not available",
          slots: []
        });
      }

      // Get existing bookings
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookings = await prisma.appointment.findMany({
        where: {
          doctorId,
          hospitalId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] }
        },
        select: {
          startTime: true,
          endTime: true
        }
      });

      // Generate slots
      const slots = [];
      const start = override?.startTime || schedule.startTime;
      const end = override?.endTime || schedule.endTime;
      const duration = schedule.slotDuration;

      let current = new Date(`${date}T${start}`);
      const endTime = new Date(`${date}T${end}`);

      while (current < endTime) {
        const slotEnd = new Date(current);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

        const isBooked = bookings.some(booking => {
          const bookingStart = new Date(booking.startTime).getTime();
          const bookingEnd = new Date(booking.endTime).getTime();
          const slotStartTime = current.getTime();
          const slotEndTime = slotEnd.getTime();

          return (slotStartTime < bookingEnd && slotEndTime > bookingStart);
        });

        if (!isBooked) {
          slots.push({
            time: current.toTimeString().slice(0, 5),
            endTime: slotEnd.toTimeString().slice(0, 5),
            available: true
          });
        }

        current.setMinutes(current.getMinutes() + duration);
      }

      res.json({
        doctorId,
        date,
        available: slots.length > 0,
        slots
      });

    } catch (error) {
      console.error("GET AVAILABLE SLOTS ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}