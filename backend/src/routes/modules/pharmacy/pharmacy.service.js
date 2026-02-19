// backend/src/routes/modules/pharmacy/pharmacy.service.js

import { prisma } from "../../../lib/prisma.js";
import {
  generateDrugCode,
  getExpiryStatus,
  isLowStock,
  generatePrescriptionRef,
  calculatePrescriptionCost
} from "./pharmacy.utils.js";

export class PharmacyService {

  // ==================== HELPER: PRESCRIPTION ACCESS ====================

  /**
   * Check if the current user can access a given prescription.
   * @param {Object} prescription - Must include doctorId, patientId
   * @param {string} role - User role
   * @param {string} currentDoctorId - Current doctor ID (if user is a doctor)
   * @param {string} currentPatientId - Current patient ID (if user is a patient)
   * @returns {boolean}
   */
  static canAccessPrescription(prescription, role, currentDoctorId, currentPatientId) {
    if (['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'].includes(role)) {
      return true;
    }
    if (role === 'DOCTOR') {
      return prescription.doctorId === currentDoctorId;
    }
    if (role === 'PATIENT') {
      return prescription.patientId === currentPatientId;
    }
    // Other roles (NURSE, RECEPTIONIST) – deny by default
    return false;
  }

  // ==================== INVENTORY MANAGEMENT ====================

  /**
   * Create new pharmacy item (pharmacist/admin only)
   */
  static async createItem(data, hospitalId, hospitalCode, role, userId) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'].includes(role)) {
      throw new Error("Access denied: Only pharmacists and admins can create items");
    }

    const {
      genericName,
      brandName,
      category,
      form,
      strength,
      unit,
      quantityInStock,
      reorderLevel,
      reorderQuantity,
      unitPrice,
      sellingPrice,
      expiryDate,
      batchNo,
      requiresPrescription
    } = data;

    // Generate drug code
    const lastItem = await prisma.pharmacyItem.findFirst({
      where: { hospitalId },
      orderBy: { drugCode: 'desc' }
    });

    const sequence = lastItem ? parseInt(lastItem.drugCode.split('-')[1]) + 1 : 1;
    const drugCode = generateDrugCode(category?.slice(0, 3).toUpperCase() || 'GEN', sequence);

    return prisma.pharmacyItem.create({
      data: {
        drugCode,
        genericName,
        brandName,
        category,
        form,
        strength,
        unit,
        quantityInStock: quantityInStock || 0,
        reorderLevel: reorderLevel || 10,
        reorderQuantity: reorderQuantity || 50,
        unitPrice: unitPrice || 0,
        sellingPrice: sellingPrice || 0,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        batchNo,
        requiresPrescription: requiresPrescription !== false,
        isActive: true,
        hospitalId
      }
    });
  }

  /**
   * Get item by ID (all authenticated users)
   */
  static async getItemById(id, hospitalId, role, userId) {
    // No special filtering; all users can view items
    return prisma.pharmacyItem.findFirst({
      where: {
        id,
        hospitalId
      },
      include: {
        transactions: {
          orderBy: { performedAt: 'desc' },
          take: 20
        },
        prescriptionItems: {
          where: {
            prescription: {
              status: { not: 'CANCELLED' }
            }
          },
          include: {
            prescription: {
              select: {
                id: true,
                patientId: true,
                doctorId: true,
                issuedAt: true,
                patient: {
                  select: {
                    firstName: true,
                    lastName: true,
                    uhid: true
                  }
                }
              }
            }
          },
          take: 10
        }
      }
    });
  }

  /**
   * Update item (pharmacist/admin only)
   */
  static async updateItem(id, hospitalId, data, role, userId) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'].includes(role)) {
      throw new Error("Access denied: Only pharmacists and admins can update items");
    }

    return prisma.pharmacyItem.update({
      where: {
        id,
        hospitalId
      },
      data: {
        genericName: data.genericName,
        brandName: data.brandName,
        category: data.category,
        form: data.form,
        strength: data.strength,
        unit: data.unit,
        reorderLevel: data.reorderLevel,
        reorderQuantity: data.reorderQuantity,
        unitPrice: data.unitPrice,
        sellingPrice: data.sellingPrice,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        batchNo: data.batchNo,
        requiresPrescription: data.requiresPrescription,
        isActive: data.isActive
      }
    });
  }

  /**
   * List inventory items (all authenticated users)
   */
  static async listItems({
    hospitalId,
    role, // not used for filtering, but kept for consistency
    userId,
    search = '',
    category = null,
    lowStock = false,
    expiring = false,
    isActive = true,
    page = 1,
    limit = 20,
    sortBy = 'genericName',
    sortOrder = 'asc'
  }) {
    const skip = (page - 1) * limit;

    const where = {
      hospitalId,
      isActive
    };

    // Search
    if (search) {
      where.OR = [
        { genericName: { contains: search, mode: 'insensitive' } },
        { brandName: { contains: search, mode: 'insensitive' } },
        { drugCode: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Low stock filter
    if (lowStock) {
      where.AND = [
        { quantityInStock: { lte: prisma.pharmacyItem.fields.reorderLevel } },
        { quantityInStock: { gt: 0 } }
      ];
    }

    // Expiring soon (next 3 months)
    if (expiring) {
      const threeMonths = new Date();
      threeMonths.setMonth(threeMonths.getMonth() + 3);

      where.expiryDate = {
        lte: threeMonths,
        gte: new Date()
      };
    }

    const total = await prisma.pharmacyItem.count({ where });

    const items = await prisma.pharmacyItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    // Add computed fields
    const itemsWithStatus = items.map(item => ({
      ...item,
      expiryStatus: getExpiryStatus(item.expiryDate),
      lowStock: isLowStock(item.quantityInStock, item.reorderLevel),
      stockValue: item.quantityInStock * item.unitPrice
    }));

    return {
      items: itemsWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Delete/deactivate item (pharmacist/admin only)
   */
  static async deleteItem(id, hospitalId, role, userId) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'].includes(role)) {
      throw new Error("Access denied: Only pharmacists and admins can delete items");
    }

    return prisma.pharmacyItem.update({
      where: {
        id,
        hospitalId
      },
      data: { isActive: false }
    });
  }

  /**
   * Adjust stock (pharmacist/admin only)
   */
  static async adjustStock(id, hospitalId, data, userId, role) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'].includes(role)) {
      throw new Error("Access denied: Only pharmacists and admins can adjust stock");
    }

    const { type, quantity, notes, reference } = data;
    const pharmacistId = data.pharmacistId;

    return prisma.$transaction(async (tx) => {
      // Get current item
      const item = await tx.pharmacyItem.findFirst({
        where: { id, hospitalId }
      });

      if (!item) {
        throw new Error("Item not found");
      }

      // Calculate new quantity
      let newQuantity = item.quantityInStock;
      if (type === 'RECEIVED') {
        newQuantity += quantity;
      } else if (type === 'DISPENSED' || type === 'EXPIRED' || type === 'RETURNED') {
        newQuantity -= quantity;
        if (newQuantity < 0) {
          throw new Error("Insufficient stock");
        }
      } else if (type === 'ADJUSTED') {
        newQuantity = quantity; // Absolute value
      }

      // Update item
      const updated = await tx.pharmacyItem.update({
        where: { id },
        data: { quantityInStock: newQuantity }
      });

      // Create transaction record
      const transaction = await tx.inventoryTransaction.create({
        data: {
          itemId: id,
          hospitalId,
          type,
          quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * quantity,
          reference,
          notes,
          performedBy: userId,
          pharmacistId
        }
      });

      return { item: updated, transaction };
    });
  }

/**
 * Get low stock alerts (role‑aware)
 */
static async getLowStockAlerts(hospitalId, role) {
  // Return empty alerts for non‑authorized roles
  if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'].includes(role)) {
    return [];
  }

  const items = await prisma.pharmacyItem.findMany({
    where: {
      hospitalId,
      isActive: true,
      quantityInStock: {
        lte: prisma.pharmacyItem.fields.reorderLevel
      }
    },
    orderBy: [
      { quantityInStock: 'asc' }
    ]
  });

  return items.map(item => ({
    ...item,
    status: item.quantityInStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
    suggestedOrder: item.reorderQuantity
  }));
}

  /**
   * Get expiring items (pharmacist/admin only)
   */
  static async getExpiringItems(hospitalId, months = 3, role) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'].includes(role)) {
      throw new Error("Access denied");
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    return prisma.pharmacyItem.findMany({
      where: {
        hospitalId,
        isActive: true,
        expiryDate: {
          lte: expiryDate,
          gte: new Date()
        }
      },
      orderBy: {
        expiryDate: 'asc'
      }
    });
  }

  // ==================== PRESCRIPTION MANAGEMENT ====================

  /**
   * Create prescription (doctor/admin only)
   */
  static async createPrescription(data, hospitalId, hospitalCode, userId, role, currentDoctorId) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'].includes(role)) {
      throw new Error("Access denied: Only doctors and admins can create prescriptions");
    }

    const {
      patientId,
      doctorId: requestDoctorId,
      appointmentId,
      diagnosis,
      notes,
      items,
      validUntil
    } = data;

    // Generate prescription reference
    const prescriptionRef = generatePrescriptionRef(hospitalCode);

    return prisma.$transaction(async (tx) => {
      // Create prescription
      const prescription = await tx.prescription.create({
        data: {
          patientId,
          doctorId: requestDoctorId,
          appointmentId,
          diagnosis,
          notes,
          status: 'ACTIVE',
          issuedAt: new Date(),
          validUntil: validUntil ? new Date(validUntil) : null,
          hospitalId,
          offlineId: data.offlineId || null,
          syncStatus: 'SYNCED'
        }
      });

      // Create prescription items
      for (const item of items) {
        const pharmacyItem = await tx.pharmacyItem.findUnique({
          where: { id: item.pharmacyItemId }
        });

        if (!pharmacyItem) {
          throw new Error(`Item not found: ${item.pharmacyItemId}`);
        }

        // Check stock? Usually not at creation; only at dispense. So we skip.

        await tx.prescriptionItem.create({
          data: {
            prescriptionId: prescription.id,
            medication: item.medication || pharmacyItem.genericName,
            strength: item.strength || pharmacyItem.strength,
            form: item.form || pharmacyItem.form,
            route: item.route,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            quantity: item.quantity,
            refills: item.refills || 0,
            instructions: item.instructions,
            pharmacyItemId: item.pharmacyItemId,
            unitPrice: pharmacyItem.sellingPrice,
            totalPrice: pharmacyItem.sellingPrice * item.quantity
          }
        });
      }

      // Return prescription with items
      return tx.prescription.findUnique({
        where: { id: prescription.id },
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
              lastName: true,
              specialty: true
            }
          },
          items: {
            include: {
              pharmacyItem: true
            }
          }
        }
      });
    });
  }

  /**
   * Get prescription by ID (with RBAC)
   */
  static async getPrescriptionById(id, hospitalId, role, currentDoctorId, currentPatientId, currentUserId) {
    const prescription = await prisma.prescription.findFirst({
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
            dob: true
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
        items: {
          include: {
            pharmacyItem: true
          }
        },
        pharmacist: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!prescription) return null;

    if (!this.canAccessPrescription(prescription, role, currentDoctorId, currentPatientId)) {
      return null;
    }

    return prescription;
  }

  /**
   * List prescriptions (with RBAC)
   */
  static async listPrescriptions({
    hospitalId,
    role,
    currentDoctorId,
    currentPatientId,
    currentUserId,
    patientId = null,
    doctorId = null,
    status = null,
    fromDate = null,
    toDate = null,
    page = 1,
    limit = 20
  }) {
    const skip = (page - 1) * limit;

    const where = {
      hospitalId
    };

    // Role-based filtering
    if (role === 'DOCTOR') {
      where.doctorId = currentDoctorId;
    } else if (role === 'PATIENT') {
      where.patientId = currentPatientId;
    }
    // PHARMACIST and admins see all

    if (patientId) where.patientId = patientId; // overrides if admin wants to filter
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    if (fromDate || toDate) {
      where.issuedAt = {};
      if (fromDate) where.issuedAt.gte = new Date(fromDate);
      if (toDate) where.issuedAt.lte = new Date(toDate);
    }

    const total = await prisma.prescription.count({ where });

    const prescriptions = await prisma.prescription.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        issuedAt: 'desc'
      },
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
            lastName: true,
            specialty: true
          }
        },
        items: {
          include: {
            pharmacyItem: true
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      }
    });

    return {
      prescriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Dispense prescription (pharmacist/admin only)
   */
  static async dispensePrescription(id, hospitalId, pharmacistId, userId, role) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'].includes(role)) {
      throw new Error("Access denied: Only pharmacists and admins can dispense prescriptions");
    }

    return prisma.$transaction(async (tx) => {
      // Get prescription with items
      const prescription = await tx.prescription.findFirst({
        where: {
          id,
          hospitalId,
          status: 'ACTIVE'
        },
        include: {
          items: {
            include: {
              pharmacyItem: true
            }
          }
        }
      });

      if (!prescription) {
        throw new Error("Active prescription not found");
      }

      // Check stock and dispense each item
      for (const item of prescription.items) {
        if (!item.pharmacyItem) continue;

        if (item.pharmacyItem.quantityInStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.pharmacyItem.genericName}`);
        }

        // Reduce stock
        await tx.pharmacyItem.update({
          where: { id: item.pharmacyItem.id },
          data: {
            quantityInStock: {
              decrement: item.quantity
            }
          }
        });

        // Record transaction
        await tx.inventoryTransaction.create({
          data: {
            itemId: item.pharmacyItem.id,
            hospitalId,
            type: 'DISPENSED',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            reference: prescription.id,
            notes: `Dispensed for prescription ${prescription.id}`,
            performedBy: userId,
            pharmacistId
          }
        });
      }

      // Update prescription status
      const updated = await tx.prescription.update({
        where: { id },
        data: {
          status: 'DISPENSED',
          dispensedAt: new Date(),
          dispensedBy: userId,
          dispensedById: pharmacistId
        },
        include: {
          patient: true,
          doctor: true,
          pharmacist: true,
          items: {
            include: {
              pharmacyItem: true
            }
          }
        }
      });

      return updated;
    });
  }

  /**
   * Partially dispense prescription (pharmacist/admin only)
   */
  static async partiallyDispense(id, hospitalId, pharmacistId, userId, dispensedItems, role) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'].includes(role)) {
      throw new Error("Access denied: Only pharmacists and admins can dispense prescriptions");
    }

    return prisma.$transaction(async (tx) => {
      const prescription = await tx.prescription.findFirst({
        where: {
          id,
          hospitalId,
          status: 'ACTIVE'
        },
        include: {
          items: true
        }
      });

      if (!prescription) {
        throw new Error("Active prescription not found");
      }

      // Process each dispensed item
      for (const dispItem of dispensedItems) {
        const prescriptionItem = prescription.items.find(i => i.id === dispItem.id);
        if (!prescriptionItem) continue;

        const pharmacyItem = await tx.pharmacyItem.findUnique({
          where: { id: prescriptionItem.pharmacyItemId }
        });

        if (!pharmacyItem) continue;

        if (pharmacyItem.quantityInStock < dispItem.quantity) {
          throw new Error(`Insufficient stock for ${pharmacyItem.genericName}`);
        }

        // Reduce stock
        await tx.pharmacyItem.update({
          where: { id: pharmacyItem.id },
          data: {
            quantityInStock: {
              decrement: dispItem.quantity
            }
          }
        });

        // Record transaction
        await tx.inventoryTransaction.create({
          data: {
            itemId: pharmacyItem.id,
            hospitalId,
            type: 'DISPENSED',
            quantity: dispItem.quantity,
            unitPrice: prescriptionItem.unitPrice,
            totalPrice: prescriptionItem.unitPrice * dispItem.quantity,
            reference: prescription.id,
            notes: `Partial dispense for prescription ${prescription.id}`,
            performedBy: userId,
            pharmacistId
          }
        });
      }

      // Check if all items are fully dispensed
      const allItemsDispensed = true; // This would need tracking per item

      // Update prescription status
      const updated = await tx.prescription.update({
        where: { id },
        data: {
          status: allItemsDispensed ? 'DISPENSED' : 'PARTIALLY_DISPENSED',
          dispensedAt: new Date(),
          dispensedBy: userId,
          dispensedById: pharmacistId
        }
      });

      return updated;
    });
  }

  /**
   * Cancel prescription (doctor/pharmacist/admin only)
   */
  static async cancelPrescription(id, hospitalId, reason, role, currentDoctorId, userId) {
    const prescription = await prisma.prescription.findFirst({
      where: {
        id,
        hospitalId,
        status: 'ACTIVE'
      }
    });

    if (!prescription) {
      throw new Error("Active prescription not found");
    }

    // Permission: doctor can cancel own, pharmacist/admin can cancel any
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'].includes(role)) {
      if (role === 'DOCTOR' && prescription.doctorId !== currentDoctorId) {
        throw new Error("Access denied: You can only cancel your own prescriptions");
      }
    }

    return prisma.prescription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason
      }
    });
  }

  /**
   * Get patient prescriptions (with RBAC)
   */
  static async getPatientPrescriptions(patientId, hospitalId, role, currentDoctorId, currentPatientId, limit = 10) {
    // Access control
    if (role === 'DOCTOR') {
      // Doctors can see prescriptions they wrote for this patient
      const where = {
        patientId,
        hospitalId,
        doctorId: currentDoctorId
      };
      return prisma.prescription.findMany({
        where,
        orderBy: { issuedAt: 'desc' },
        take: limit,
        include: {
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              specialty: true
            }
          },
          items: {
            include: {
              pharmacyItem: true
            }
          }
        }
      });
    } else if (role === 'PATIENT') {
      // Patients can only see their own prescriptions
      if (patientId !== currentPatientId) {
        throw new Error("Access denied");
      }
      return prisma.prescription.findMany({
        where: { patientId, hospitalId },
        orderBy: { issuedAt: 'desc' },
        take: limit,
        include: {
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              specialty: true
            }
          },
          items: {
            include: {
              pharmacyItem: true
            }
          }
        }
      });
    } else {
      // Pharmacists and admins can see all
      return prisma.prescription.findMany({
        where: { patientId, hospitalId },
        orderBy: { issuedAt: 'desc' },
        take: limit,
        include: {
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              specialty: true
            }
          },
          items: {
            include: {
              pharmacyItem: true
            }
          }
        }
      });
    }
  }

  /**
   * Get prescription statistics (admin only)
   */
  static async getPrescriptionStats(hospitalId, role) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(role)) {
      throw new Error("Access denied: Only admins can view statistics");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPrescriptions,
      activePrescriptions,
      dispensedToday,
      byDoctor,
      byStatus
    ] = await Promise.all([
      prisma.prescription.count({ where: { hospitalId } }),
      prisma.prescription.count({
        where: {
          hospitalId,
          status: 'ACTIVE'
        }
      }),
      prisma.prescription.count({
        where: {
          hospitalId,
          dispensedAt: {
            gte: today
          }
        }
      }),
      prisma.prescription.groupBy({
        by: ['doctorId'],
        where: { hospitalId },
        _count: true
      }),
      prisma.prescription.groupBy({
        by: ['status'],
        where: { hospitalId },
        _count: true
      })
    ]);

    return {
      total: totalPrescriptions,
      active: activePrescriptions,
      dispensedToday,
      byDoctor,
      byStatus
    };
  }

  /**
   * Get inventory statistics (admin/pharmacist only)
   */
  static async getInventoryStats(hospitalId, role) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'].includes(role)) {
      throw new Error("Access denied");
    }

    const items = await prisma.pharmacyItem.findMany({
      where: { hospitalId, isActive: true }
    });

    const totalItems = items.length;
    const totalValue = items.reduce((sum, i) => sum + (i.quantityInStock * i.unitPrice), 0);
    const lowStock = items.filter(i => i.quantityInStock <= i.reorderLevel).length;
    const outOfStock = items.filter(i => i.quantityInStock === 0).length;

    const expiringSoon = items.filter(i => {
      if (!i.expiryDate) return false;
      const monthsLeft = (new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24 * 30);
      return monthsLeft < 3 && monthsLeft > 0;
    }).length;

    const expired = items.filter(i => {
      if (!i.expiryDate) return false;
      return new Date(i.expiryDate) < new Date();
    }).length;

    // Group by category
    const byCategory = items.reduce((acc, item) => {
      const cat = item.category || 'OTHER';
      if (!acc[cat]) {
        acc[cat] = {
          count: 0,
          value: 0
        };
      }
      acc[cat].count++;
      acc[cat].value += item.quantityInStock * item.unitPrice;
      return acc;
    }, {});

    return {
      totalItems,
      totalValue,
      lowStock,
      outOfStock,
      expiringSoon,
      expired,
      byCategory
    };
  }

  /**
   * Sync offline data (with RBAC)
   */
  static async syncOffline(data, hospitalId, userId, role, currentDoctorId) {
    const results = [];

    for (const item of data) {
      try {
        if (item.type === 'prescription') {
          const hospital = await prisma.hospital.findUnique({
            where: { id: hospitalId }
          });

          const prescription = await this.createPrescription(
            item.data,
            hospitalId,
            hospital.code,
            userId,
            role,
            currentDoctorId
          );
          results.push({ ...prescription, syncStatus: 'SYNCED' });
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