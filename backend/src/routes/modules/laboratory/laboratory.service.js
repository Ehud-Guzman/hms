// backend/src/routes/modules/laboratory/laboratory.service.js

import { prisma } from "../../../lib/prisma.js";
import {
  generateOrderNumber,
  isAbnormal,
  formatCriticalFlag,
  generateSampleBarcode,
  calculateAge
} from "./laboratory.utils.js";

export class LaboratoryService {

  // ==================== HELPER: CHECK ORDER ACCESS ====================

  /**
   * Check if the current user can access a given lab order.
   * @param {Object} order - Must include doctorId, patientId, etc.
   * @param {string} role - User role.
   * @param {string} currentDoctorId - Current doctor ID (if user is a doctor).
   * @param {string} currentUserId - Current user ID (for lab techs).
   * @returns {boolean}
   */
  static canAccessOrder(order, role, currentDoctorId, currentUserId) {
    // Admins and lab technicians can access all orders
    if (['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'LAB_TECHNICIAN'].includes(role)) {
      return true;
    }
    if (role === 'DOCTOR') {
      // Doctors can access orders they requested
      return order.doctorId === currentDoctorId;
    }
    // Other roles (NURSE, RECEPTIONIST) might have limited access; for now allow view only.
    // If needed, restrict further.
    return true;
  }

  // ==================== TEST CATALOG MANAGEMENT ====================

  /**
   * Create lab test
   */
  static async createTest(data, hospitalId) {
    const {
      name,
      code,
      category,
      description,
      sampleType,
      price,
      isActive
    } = data;

    // Check if code already exists
    if (code) {
      const existing = await prisma.labTest.findFirst({
        where: {
          hospitalId,
          code
        }
      });

      if (existing) {
        throw new Error(`Test with code ${code} already exists`);
      }
    }

    // Check if name already exists
    const existingByName = await prisma.labTest.findFirst({
      where: {
        hospitalId,
        name
      }
    });

    if (existingByName) {
      throw new Error(`Test with name ${name} already exists`);
    }

    return prisma.labTest.create({
      data: {
        name,
        code: code || `TEST-${Date.now()}`,
        category,
        description,
        sampleType,
        price: price ? parseInt(price) : null,
        isActive: isActive !== false,
        hospitalId
      }
    });
  }

  /**
   * Update lab test
   */
  static async updateTest(id, hospitalId, data, role, userId) {
    // role and userId passed for logging, but no extra checks needed (route already restricted)
    const {
      name,
      category,
      description,
      sampleType,
      price,
      isActive
    } = data;

    return prisma.labTest.update({
      where: {
        id,
        hospitalId
      },
      data: {
        name,
        category,
        description,
        sampleType,
        price: price ? parseInt(price) : undefined,
        isActive
      }
    });
  }

  /**
   * List lab tests
   */
  static async listTests({
    hospitalId,
    role, // not used for filtering tests, but kept for consistency
    userId,
    search = '',
    category = null,
    isActive = true,
    page = 1,
    limit = 20,
    sortBy = 'name',
    sortOrder = 'asc'
  }) {
    const skip = (page - 1) * limit;

    const where = {
      hospitalId,
      isActive
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    const total = await prisma.labTest.count({ where });

    const tests = await prisma.labTest.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    });

    return {
      tests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get test categories
   */
  static async getCategories(hospitalId) {
    const categories = await prisma.labTest.findMany({
      where: {
        hospitalId,
        category: { not: null }
      },
      distinct: ['category'],
      select: {
        category: true
      }
    });

    return categories.map(c => c.category).filter(Boolean);
  }

  /**
   * Get test by ID
   */
  static async getTestById(id, hospitalId, role, userId) {
    // role and userId passed for consistency, but test catalog is public within hospital
    return prisma.labTest.findFirst({
      where: {
        id,
        hospitalId
      },
      include: {
        orders: {
          where: {
            status: { notIn: ['CANCELLED'] }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10,
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                uhid: true
              }
            },
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            result: true
          }
        }
      }
    });
  }

  // ==================== LAB ORDER MANAGEMENT ====================

  /**
   * Create lab order
   */
  static async createOrder(data, hospitalId, hospitalCode, userId, role, currentDoctorId) {
    const {
      patientId,
      doctorId: requestDoctorId,
      testId,
      appointmentId,
      priority,
      clinicalNotes,
      indication,
      sampleType
    } = data;

    // Get test details
    const test = await prisma.labTest.findFirst({
      where: {
        id: testId,
        hospitalId
      }
    });

    if (!test) {
      throw new Error("Test not found");
    }

    // Generate order number
    const orderNumber = generateOrderNumber(hospitalCode);

    // Create order
    const order = await prisma.labOrder.create({
      data: {
        orderNumber,
        patientId,
        doctorId: requestDoctorId,
        testId,
        appointmentId,
        status: 'ORDERED',
        priority: priority || 'ROUTINE',
        clinicalNotes,
        indication,
        sampleType,
        hospitalId,
        price: test.price
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true,
            dob: true,
            gender: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        test: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true
          }
        }
      }
    });

    return order;
  }

  /**
   * Get order by ID (with RBAC)
   */
  static async getOrderById(id, hospitalId, role, currentDoctorId, currentUserId) {
    const order = await prisma.labOrder.findFirst({
      where: {
        id,
        hospitalId
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true,
            phone: true,
            dob: true,
            gender: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        test: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
            description: true,
            preparation: true,
            referenceRanges: true,
            parameters: true
          }
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            status: true
          }
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        verifier: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        result: true
      }
    });

    if (!order) return null;

    // Apply access control
    if (!this.canAccessOrder(order, role, currentDoctorId, currentUserId)) {
      return null;
    }

    return order;
  }

  /**
   * Get order by order number (with RBAC)
   */
  static async getOrderByNumber(orderNumber, hospitalId, role, currentDoctorId, currentUserId) {
    const order = await prisma.labOrder.findFirst({
      where: {
        orderNumber,
        hospitalId
      },
      include: {
        patient: true,
        doctor: true,
        test: true,
        result: true
      }
    });

    if (!order) return null;

    if (!this.canAccessOrder(order, role, currentDoctorId, currentUserId)) {
      return null;
    }

    return order;
  }

  /**
   * List lab orders (with RBAC)
   */
  static async listOrders({
    hospitalId,
    role,
    currentDoctorId,
    currentUserId,
    patientId = null,
    doctorId = null,
    testId = null,
    status = null,
    priority = null,
    fromDate = null,
    toDate = null,
    search = '',
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  }) {
    const skip = (page - 1) * limit;

    const where = {
      hospitalId
    };

    // Role-based filtering
    if (role === 'DOCTOR') {
      // Doctors see only orders they requested
      where.doctorId = currentDoctorId;
    }
    // LAB_TECHNICIAN and admins see all (no extra filter)

    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId; // overrides role filter if needed (admins can query any)
    if (testId) where.testId = testId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { uhid: { contains: search } } }
      ];
    }

    const total = await prisma.labOrder.count({ where });

    const orders = await prisma.labOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uhid: true,
            dob: true,
            gender: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        },
        test: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true
          }
        },
        result: {
          select: {
            id: true,
            isAbnormal: true,
            verifiedAt: true,
            createdAt: true
          }
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update order status (lab_technician/admin only)
   */
  static async updateOrderStatus(id, hospitalId, status, userId, role, data = {}) {
    // First, fetch order to check if user has permission (though route already restricts)
    const order = await prisma.labOrder.findFirst({
      where: { id, hospitalId }
    });
    if (!order) {
      throw new Error("Order not found");
    }

    // Additional check: if a doctor somehow reaches here, they should not update status.
    if (role === 'DOCTOR') {
      throw new Error("Doctors cannot update order status");
    }

    const updateData = {
      status
    };

    if (status === 'COLLECTED') {
      updateData.collectedAt = new Date();
      updateData.collectedBy = userId;
      updateData.sampleId = data.sampleId || generateSampleBarcode(
        data.orderNumber || order.orderNumber,
        data.testCode || (await prisma.labTest.findUnique({ where: { id: order.testId } }))?.code
      );
      updateData.sampleType = data.sampleType;
    }

    if (status === 'PROCESSING') {
      updateData.processedBy = userId; // using processedBy field if exists, or technicianId
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.completedBy = userId;
    }

    if (status === 'CANCELLED' || status === 'REJECTED') {
      updateData.notes = data.reason;
    }

    return prisma.labOrder.update({
      where: {
        id,
        hospitalId
      },
      data: updateData,
      include: {
        patient: true,
        test: true
      }
    });
  }

  /**
   * Get pending orders count by priority
   */
  static async getPendingCounts(hospitalId) {
    const orders = await prisma.labOrder.groupBy({
      by: ['priority'],
      where: {
        hospitalId,
        status: {
          in: ['ORDERED', 'COLLECTED', 'PROCESSING']
        }
      },
      _count: true
    });

    const result = {
      ROUTINE: 0,
      URGENT: 0,
      STAT: 0,
      TOTAL: 0
    };

    orders.forEach(o => {
      result[o.priority] = o._count;
      result.TOTAL += o._count;
    });

    return result;
  }

  // ==================== RESULTS MANAGEMENT ====================

  /**
   * Enter results for order (lab_technician/admin only)
   */
  static async enterResults(orderId, hospitalId, data, userId, role) {
    const {
      resultData,
      reportFile,
      notes,
      verifiedBy,
      verifiedAt
    } = data;

    // Check if user has permission (route already restricts, but we can add role check)
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'LAB_TECHNICIAN'].includes(role)) {
      throw new Error("Unauthorized to enter results");
    }

    return prisma.$transaction(async (tx) => {
      // Get order with test and patient
      const order = await tx.labOrder.findFirst({
        where: {
          id: orderId,
          hospitalId
        },
        include: {
          patient: true,
          test: true
        }
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status === 'COMPLETED') {
        throw new Error("Order already has results");
      }

      // Create or update result
      let result;

      const resultDataJson = resultData ?
        (typeof resultData === 'string' ? JSON.parse(resultData) : resultData) : {};

      if (order.result) {
        // Update existing result
        result = await tx.labResult.update({
          where: { orderId },
          data: {
            resultData: resultDataJson,
            reportFile,
            notes,
            verifiedBy,
            verifiedAt: verifiedAt ? new Date(verifiedAt) : null
          }
        });
      } else {
        // Create new result
        result = await tx.labResult.create({
          data: {
            orderId,
            resultData: resultDataJson,
            reportFile,
            notes,
            verifiedBy,
            verifiedAt: verifiedAt ? new Date(verifiedAt) : null
          }
        });
      }

      // Update order status
      const updatedOrder = await tx.labOrder.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedBy: userId,
          verifiedAt: verifiedAt ? new Date(verifiedAt) : null,
          verifiedBy
        }
      });

      return {
        order: updatedOrder,
        result
      };
    });
  }

  /**
   * Verify results (lab_technician/admin only)
   */
  static async verifyResults(orderId, hospitalId, userId, role) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'LAB_TECHNICIAN'].includes(role)) {
      throw new Error("Unauthorized to verify results");
    }

    return prisma.$transaction(async (tx) => {
      const order = await tx.labOrder.findFirst({
        where: {
          id: orderId,
          hospitalId
        },
        include: {
          result: true
        }
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (!order.result) {
        throw new Error("No results to verify");
      }

      // Update result
      await tx.labResult.update({
        where: { orderId },
        data: {
          verifiedBy: userId,
          verifiedAt: new Date()
        }
      });

      // Update order
      const updated = await tx.labOrder.update({
        where: { id: orderId },
        data: {
          verifiedBy: userId,
          verifiedAt: new Date()
        }
      });

      return updated;
    });
  }

  /**
   * Get patient lab history (with RBAC)
   */
  static async getPatientLabHistory(patientId, hospitalId, role, currentDoctorId, limit = 20) {
    const where = {
      patientId,
      hospitalId,
      status: 'COMPLETED'
    };

    // If doctor, ensure they have access to this patient's orders (i.e., they requested them)
    if (role === 'DOCTOR') {
      where.doctorId = currentDoctorId;
    }

    return prisma.labOrder.findMany({
      where,
      orderBy: {
        completedAt: 'desc'
      },
      take: limit,
      include: {
        test: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        result: true
      }
    });
  }

  /**
   * Get laboratory statistics (admin only)
   */
  static async getLabStats(hospitalId, role) {
    // role is passed for logging, but stats are only for admins (already in route)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      completedToday,
      byStatus,
      byPriority,
      averageTAT
    ] = await Promise.all([
      // Total orders
      prisma.labOrder.count({ where: { hospitalId } }),

      // Pending orders
      prisma.labOrder.count({
        where: {
          hospitalId,
          status: { in: ['ORDERED', 'COLLECTED', 'PROCESSING'] }
        }
      }),

      // Completed today
      prisma.labOrder.count({
        where: {
          hospitalId,
          status: 'COMPLETED',
          completedAt: { gte: today }
        }
      }),

      // By status
      prisma.labOrder.groupBy({
        by: ['status'],
        where: { hospitalId },
        _count: true
      }),

      // By priority
      prisma.labOrder.groupBy({
        by: ['priority'],
        where: { hospitalId },
        _count: true
      }),

      // Average turnaround time (completed orders only)
      prisma.labOrder.aggregate({
        where: {
          hospitalId,
          status: 'COMPLETED',
          completedAt: { not: null },
          createdAt: { not: null }
        },
        _avg: {
          completedAt: true,
          createdAt: true
        }
      })
    ]);

    // Calculate average TAT in minutes
    let avgTAT = null;
    if (averageTAT._avg.completedAt && averageTAT._avg.createdAt) {
      const avgTime = (new Date(averageTAT._avg.completedAt) - new Date(averageTAT._avg.createdAt)) / 60000;
      avgTAT = Math.round(avgTime);
    }

    return {
      totalOrders,
      pendingOrders,
      completedToday,
      byStatus,
      byPriority,
      averageTAT: avgTAT
    };
  }

  /**
   * Sync offline data (with RBAC)
   */
  static async syncOffline(data, hospitalId, userId, role, currentDoctorId) {
    const results = [];

    for (const item of data) {
      try {
        if (item.type === 'order') {
          const hospital = await prisma.hospital.findUnique({
            where: { id: hospitalId }
          });

          const order = await this.createOrder(
            item.data,
            hospitalId,
            hospital.code,
            userId,
            role,
            currentDoctorId
          );
          results.push({ ...order, syncStatus: 'SYNCED' });
        }

        if (item.type === 'result') {
          const result = await this.enterResults(
            item.data.orderId,
            hospitalId,
            item.data,
            userId,
            role
          );
          results.push({ ...result, syncStatus: 'SYNCED' });
        }
      } catch (error) {
        results.push({
          offlineId: item.offlineId,
          error: error.message,
          syncStatus: 'FAILED'
        });
      }
    }

    return results;
  }
}