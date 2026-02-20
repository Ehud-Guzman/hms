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
  static canAccessOrder(order, role, currentDoctorId, currentUserId) {
    if (['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'LAB_TECHNICIAN'].includes(role)) return true;
    if (role === 'DOCTOR') return order.doctorId === currentDoctorId;
    return true; // Default read-only for others
  }

  static _validateId(id, name = 'ID') {
    if (!id || typeof id !== 'string') throw { status: 400, message: `${name} is required and must be a string` };
  }

  static _validateRole(role, allowedRoles, action = 'perform this action') {
    if (!allowedRoles.includes(role)) throw { status: 403, message: `Unauthorized to ${action}` };
  }

  // ==================== TEST CATALOG MANAGEMENT ====================
  static async createTest(data, hospitalId) {
    if (!data?.name) throw { status: 400, message: "Test name is required" };

    const code = data.code || `TEST-${Date.now()}`;
    const existing = await prisma.labTest.findFirst({ where: { hospitalId, OR: [{ code }, { name: data.name }] } });
    if (existing) throw { status: 409, message: `Test with same name or code already exists` };

    return prisma.labTest.create({
      data: {
        name: data.name,
        code,
        category: data.category || null,
        description: data.description || null,
        sampleType: data.sampleType || null,
        price: data.price !== undefined ? parseInt(data.price) : null,
        isActive: data.isActive !== false,
        hospitalId
      }
    });
  }

  static async updateTest(id, hospitalId, data) {
    this._validateId(id, 'Test ID');

    const test = await prisma.labTest.findFirst({ where: { id, hospitalId } });
    if (!test) throw { status: 404, message: "Test not found" };

    return prisma.labTest.update({
      where: { id },
      data: {
        name: data.name ?? test.name,
        category: data.category ?? test.category,
        description: data.description ?? test.description,
        sampleType: data.sampleType ?? test.sampleType,
        price: data.price !== undefined ? parseInt(data.price) : test.price,
        isActive: data.isActive !== undefined ? data.isActive : test.isActive
      }
    });
  }

  static async listTests({ hospitalId, search = '', category = null, isActive = true, page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' }) {
    const skip = (page - 1) * limit;
    const where = { hospitalId, isActive };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) where.category = category;

    const total = await prisma.labTest.count({ where });
    const tests = await prisma.labTest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { _count: { select: { orders: true } } }
    });

    return { tests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  static async getCategories(hospitalId) {
    const categories = await prisma.labTest.findMany({
      where: { hospitalId, category: { not: null } },
      distinct: ['category'],
      select: { category: true }
    });
    return categories.map(c => c.category).filter(Boolean);
  }

  static async getTestById(id, hospitalId) {
    this._validateId(id, 'Test ID');

    const test = await prisma.labTest.findFirst({
      where: { id, hospitalId },
      include: {
        orders: {
          where: { status: { notIn: ['CANCELLED'] } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, uhid: true } },
            doctor: { select: { id: true, firstName: true, lastName: true } },
            result: true
          }
        }
      }
    });

    if (!test) throw { status: 404, message: "Test not found" };
    return test;
  }

  // ==================== LAB ORDER MANAGEMENT ====================
  static async createOrder(data, hospitalId, hospitalCode) {
    this._validateId(data.testId, 'Test ID');
    this._validateId(data.patientId, 'Patient ID');

    const test = await prisma.labTest.findFirst({ where: { id: data.testId, hospitalId } });
    if (!test) throw { status: 404, message: "Test not found" };

    const orderNumber = generateOrderNumber(hospitalCode);

    return prisma.labOrder.create({
      data: {
        orderNumber,
        patientId: data.patientId,
        doctorId: data.doctorId,
        testId: data.testId,
        appointmentId: data.appointmentId || null,
        status: 'ORDERED',
        priority: data.priority || 'ROUTINE',
        clinicalNotes: data.clinicalNotes || null,
        indication: data.indication || null,
        sampleType: data.sampleType || test.sampleType || null,
        hospitalId,
        price: test.price
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, uhid: true, dob: true, gender: true } },
        doctor: { select: { id: true, firstName: true, lastName: true, specialty: true } },
        test: { select: { id: true, name: true, code: true, category: true } }
      }
    });
  }

  static async getOrderById(id, hospitalId, role, currentDoctorId, currentUserId) {
    this._validateId(id, 'Order ID');

    const order = await prisma.labOrder.findFirst({
      where: { id, hospitalId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, uhid: true, dob: true, gender: true } },
        doctor: { select: { id: true, firstName: true, lastName: true, specialty: true } },
        test: { select: { id: true, name: true, code: true, category: true } },
        result: true
      }
    });

    if (!order) throw { status: 404, message: "Order not found" };
    if (!this.canAccessOrder(order, role, currentDoctorId, currentUserId)) throw { status: 403, message: "Access denied" };

    return order;
  }

  static async listOrders(params) {
    const {
      hospitalId, role, currentDoctorId, patientId, doctorId, testId,
      status, priority, fromDate, toDate, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc'
    } = params;

    const skip = (page - 1) * limit;
    const where = { hospitalId };

    if (role === 'DOCTOR') where.doctorId = currentDoctorId;
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
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
      orderBy: { [sortBy]: sortOrder },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, uhid: true, dob: true, gender: true } },
        doctor: { select: { id: true, firstName: true, lastName: true, specialty: true } },
        test: { select: { id: true, name: true, code: true, category: true } },
        result: { select: { id: true, isAbnormal: true, verifiedAt: true, createdAt: true } }
      }
    });

    return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  static async updateOrderStatus(id, hospitalId, status, userId, role, data = {}) {
    this._validateId(id, 'Order ID');
    this._validateRole(role, ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'LAB_TECHNICIAN'], 'update order status');

    const order = await prisma.labOrder.findFirst({ where: { id, hospitalId } });
    if (!order) throw { status: 404, message: "Order not found" };

    const updateData = { status };

    if (status === 'COLLECTED') {
      const test = await prisma.labTest.findUnique({ where: { id: order.testId } });
      updateData.collectedAt = new Date();
      updateData.collectedBy = userId;
      updateData.sampleId = data.sampleId || generateSampleBarcode(data.orderNumber || order.orderNumber, data.testCode || test?.code);
      updateData.sampleType = data.sampleType || order.sampleType || test?.sampleType || null;
    }

    if (status === 'PROCESSING') updateData.processedBy = userId;
    if (status === 'COMPLETED') { updateData.completedAt = new Date(); updateData.completedBy = userId; }
    if (status === 'CANCELLED' || status === 'REJECTED') updateData.notes = data.reason || null;

    return prisma.labOrder.update({ where: { id }, data: updateData, include: { patient: true, test: true } });
  }

  static async enterResults(orderId, hospitalId, data, userId, role) {
    this._validateId(orderId, 'Order ID');
    this._validateRole(role, ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'LAB_TECHNICIAN'], 'enter results');

    return prisma.$transaction(async (tx) => {
      const order = await tx.labOrder.findFirst({ where: { id: orderId, hospitalId }, include: { patient: true, test: true, result: true } });
      if (!order) throw { status: 404, message: "Order not found" };
      if (order.result) throw { status: 409, message: "Order already has results" };

      const resultDataJson = data.resultData ? (typeof data.resultData === 'string' ? JSON.parse(data.resultData) : data.resultData) : {};

      const result = await tx.labResult.create({
        data: {
          orderId,
          resultData: resultDataJson,
          reportFile: data.reportFile || null,
          notes: data.notes || null,
          verifiedBy: data.verifiedBy || null,
          verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : null
        }
      });

      const updatedOrder = await tx.labOrder.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedBy: userId,
          verifiedBy: data.verifiedBy || null,
          verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : null
        }
      });

      return { order: updatedOrder, result };
    });
  }

  static async verifyResults(orderId, hospitalId, userId, role) {
    this._validateId(orderId, 'Order ID');
    this._validateRole(role, ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'LAB_TECHNICIAN'], 'verify results');

    return prisma.$transaction(async (tx) => {
      const order = await tx.labOrder.findFirst({ where: { id: orderId, hospitalId }, include: { result: true } });
      if (!order) throw { status: 404, message: "Order not found" };
      if (!order.result) throw { status: 400, message: "No results to verify" };

      await tx.labResult.update({ where: { orderId }, data: { verifiedBy: userId, verifiedAt: new Date() } });
      const updated = await tx.labOrder.update({ where: { id: orderId }, data: { verifiedBy: userId, verifiedAt: new Date() } });
      return updated;
    });
  }

  static async getPatientLabHistory(patientId, hospitalId, role, currentDoctorId, limit = 20) {
    this._validateId(patientId, 'Patient ID');
    const where = { patientId, hospitalId, status: 'COMPLETED' };
    if (role === 'DOCTOR') where.doctorId = currentDoctorId;

    return prisma.labOrder.findMany({
      where,
      orderBy: { completedAt: 'desc' },
      take: limit,
      include: {
        test: { select: { id: true, name: true, code: true, category: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
        result: true
      }
    });
  }

  static async syncOffline(data, hospitalId, userId, role, currentDoctorId) {
    const results = [];
    for (const item of data) {
      try {
        if (item.type === 'order') {
          const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
          const order = await this.createOrder(item.data, hospitalId, hospital.code);
          results.push({ ...order, syncStatus: 'SYNCED' });
        }
        if (item.type === 'result') {
          const result = await this.enterResults(item.data.orderId, hospitalId, item.data, userId, role);
          results.push({ ...result, syncStatus: 'SYNCED' });
        }
      } catch (error) {
        results.push({ offlineId: item.offlineId, error: error.message, syncStatus: 'FAILED' });
      }
    }
    return results;
  }

  // ==================== LAB DASHBOARD / STATS ====================
  static async getLabStats(hospitalId) {
    const orders = await prisma.labOrder.findMany({
      where: { hospitalId },
      select: { status: true, priority: true }
    });

    const stats = { total: orders.length, byStatus: {}, byPriority: {} };

    orders.forEach(order => {
      stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;
      stats.byPriority[order.priority] = (stats.byPriority[order.priority] || 0) + 1;
    });

    return stats;
  }

}
