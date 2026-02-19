-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'ACCOUNTANT', 'PATIENT');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PlanCode" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CHECKED_IN', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('REQUESTED', 'APPROVED', 'ADMITTED', 'TRANSFERRED', 'DISCHARGED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LabOrderStatus" AS ENUM ('ORDERED', 'COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'DISPENSED', 'PARTIALLY_DISPENSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'MPESA', 'BANK_TRANSFER', 'CHEQUE', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SYNCED', 'PENDING', 'CONFLICT', 'FAILED');

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "code" TEXT,
    "contactEmail" TEXT,
    "contactPhone" VARCHAR(30),
    "address" TEXT,
    "logoUrl" TEXT,
    "security" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'HOSPITAL_ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hospitalId" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" VARCHAR(30),
    "employeeId" TEXT,
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "specialty" TEXT,
    "licenseNo" TEXT,
    "phone" VARCHAR(30),
    "qualification" TEXT,
    "experience" INTEGER,
    "consultationFee" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorSchedule" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "departmentId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 15,
    "maxPatients" INTEGER NOT NULL DEFAULT 20,
    "breakTime" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorAvailability" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,

    CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nurse" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "licenseNo" TEXT,
    "phone" VARCHAR(30),
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nurse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurseShift" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shiftType" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "wardId" TEXT,
    "departmentId" TEXT,
    "notes" TEXT,

    CONSTRAINT "NurseShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pharmacist" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "licenseNo" TEXT,
    "phone" VARCHAR(30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pharmacist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabTechnician" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "licenseNo" TEXT,
    "phone" VARCHAR(30),
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTechnician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "location" TEXT,
    "phone" VARCHAR(30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "userId" TEXT,
    "uhid" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" VARCHAR(20),
    "dob" TIMESTAMP(3),
    "bloodGroup" VARCHAR(10),
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "allergies" JSONB,
    "chronicConditions" JSONB,
    "medicalHistory" JSONB,
    "currentMedications" JSONB,
    "insuranceProvider" TEXT,
    "insurancePolicyNo" TEXT,
    "primaryDoctorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncStatus" "SyncStatus" DEFAULT 'SYNCED',
    "offlineId" TEXT,
    "lastModified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "departmentId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "type" TEXT,
    "priority" TEXT DEFAULT 'ROUTINE',
    "reason" TEXT,
    "symptoms" TEXT,
    "notes" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "checkedInBy" TEXT,
    "consultedAt" TIMESTAMP(3),
    "diagnosis" TEXT,
    "treatment" TEXT,
    "consultationFee" INTEGER,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "billId" TEXT,
    "offlineId" TEXT,
    "syncStatus" "SyncStatus" DEFAULT 'SYNCED',
    "syncAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastSyncError" TEXT,
    "lastModified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalRecord" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "recordedBy" TEXT NOT NULL,
    "recordedByNurseId" TEXT,
    "bloodPressureSystolic" INTEGER,
    "bloodPressureDiastolic" INTEGER,
    "heartRate" INTEGER,
    "temperature" DOUBLE PRECISION,
    "respiratoryRate" INTEGER,
    "oxygenSaturation" INTEGER,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "painScore" INTEGER,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offlineId" TEXT,
    "syncStatus" "SyncStatus" DEFAULT 'SYNCED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VitalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "recordType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icd10Code" TEXT,
    "icd10Description" TEXT,
    "attachments" JSONB,
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "diagnosis" TEXT,
    "notes" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isDispensed" BOOLEAN NOT NULL DEFAULT false,
    "dispensedAt" TIMESTAMP(3),
    "dispensedBy" TEXT,
    "dispensedById" TEXT,
    "offlineId" TEXT,
    "syncStatus" "SyncStatus" DEFAULT 'SYNCED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medication" TEXT NOT NULL,
    "strength" TEXT,
    "form" TEXT,
    "route" TEXT,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "refills" INTEGER NOT NULL DEFAULT 0,
    "instructions" TEXT,
    "pharmacyItemId" TEXT,
    "unitPrice" INTEGER,
    "totalPrice" INTEGER,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyItem" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "drugCode" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "brandName" TEXT,
    "category" TEXT,
    "form" TEXT NOT NULL,
    "strength" TEXT,
    "unit" TEXT NOT NULL,
    "quantityInStock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "reorderQuantity" INTEGER NOT NULL DEFAULT 50,
    "unitPrice" INTEGER NOT NULL,
    "sellingPrice" INTEGER NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "batchNo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER,
    "totalPrice" INTEGER,
    "reference" TEXT,
    "notes" TEXT,
    "performedBy" TEXT NOT NULL,
    "pharmacistId" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabOrder" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "orderNumber" TEXT,
    "status" "LabOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "priority" TEXT NOT NULL DEFAULT 'ROUTINE',
    "clinicalNotes" TEXT,
    "indication" TEXT,
    "collectedAt" TIMESTAMP(3),
    "collectedBy" TEXT,
    "sampleId" TEXT,
    "sampleType" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "price" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "resultData" JSONB NOT NULL,
    "reportFile" TEXT,
    "notes" TEXT,
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
    "criticalFlags" JSONB,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "phone" VARCHAR(30),
    "totalBeds" INTEGER NOT NULL,
    "availableBeds" INTEGER NOT NULL DEFAULT 0,
    "occupiedBeds" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bed" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "bedNumber" TEXT NOT NULL,
    "departmentId" TEXT,
    "dailyRate" INTEGER NOT NULL DEFAULT 0,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCleaned" TIMESTAMP(3),

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabTest" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT,
    "description" TEXT,
    "sampleType" TEXT,
    "price" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admission" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "admittedBy" TEXT NOT NULL,
    "admittingDoctorId" TEXT NOT NULL,
    "bedId" TEXT,
    "admissionNumber" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'REQUESTED',
    "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDischarge" TIMESTAMP(3),
    "dischargeDate" TIMESTAMP(3),
    "diagnosis" TEXT,
    "treatmentNotes" TEXT,
    "dischargeNotes" TEXT,
    "dischargeInstructions" TEXT,
    "insuranceClaimId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "admissionId" TEXT,
    "appointmentId" TEXT,
    "billNumber" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "subtotal" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "paid" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "voidedBy" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillItem" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,

    CONSTRAINT "BillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "paymentNumber" TEXT,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedBy" TEXT NOT NULL,
    "receiptNumber" TEXT,
    "receiptIssuedAt" TIMESTAMP(3),
    "isRefunded" BOOLEAN NOT NULL DEFAULT false,
    "refundedAt" TIMESTAMP(3),
    "refundedBy" TEXT,
    "refundReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceProvider" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "contactPhone" VARCHAR(30),
    "contactEmail" TEXT,
    "coverageTerms" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InsuranceProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceClaim" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "claimNumber" TEXT,
    "status" TEXT NOT NULL,
    "submittedAmount" INTEGER NOT NULL,
    "approvedAmount" INTEGER,
    "paidAmount" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "InsuranceClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncConflict" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "offlineId" TEXT NOT NULL,
    "clientVersion" JSONB NOT NULL,
    "serverVersion" JSONB NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalSettings" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "defaultSlotDuration" INTEGER NOT NULL DEFAULT 15,
    "allowWalkIns" BOOLEAN NOT NULL DEFAULT true,
    "requirePrepayment" BOOLEAN NOT NULL DEFAULT false,
    "allowOnlineBooking" BOOLEAN NOT NULL DEFAULT true,
    "maxAdvanceBooking" INTEGER NOT NULL DEFAULT 30,
    "businessHours" JSONB,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "brandLogoUrl" TEXT,
    "brandPrimaryColor" TEXT,
    "brandSecondaryColor" TEXT,
    "themeKey" TEXT,
    "mode" TEXT,
    "density" TEXT,
    "radius" TEXT,
    "printShowLogo" BOOLEAN NOT NULL DEFAULT true,
    "printHeaderText" TEXT,
    "printFooterText" TEXT,
    "security" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "planCode" "PlanCode" DEFAULT 'FREE',
    "maxDoctors" INTEGER,
    "maxPatients" INTEGER,
    "maxStaff" INTEGER,
    "maxBeds" INTEGER,
    "limits" JSONB,
    "entitlements" JSONB,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "Role",
    "actorEmail" TEXT,
    "hospitalId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backup" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'HOSPITAL_SNAPSHOT',
    "status" TEXT NOT NULL DEFAULT 'READY',
    "meta" JSONB,
    "payload" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DepartmentToDoctor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DepartmentToDoctor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DepartmentToLabTest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DepartmentToLabTest_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_code_key" ON "Hospital"("code");

-- CreateIndex
CREATE INDEX "Hospital_code_idx" ON "Hospital"("code");

-- CreateIndex
CREATE INDEX "Hospital_isActive_idx" ON "Hospital"("isActive");

-- CreateIndex
CREATE INDEX "Integration_hospitalId_idx" ON "Integration"("hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_hospitalId_name_key" ON "Integration"("hospitalId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_hospitalId_idx" ON "User"("hospitalId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_employeeId_key" ON "Staff"("employeeId");

-- CreateIndex
CREATE INDEX "Staff_hospitalId_isActive_idx" ON "Staff"("hospitalId", "isActive");

-- CreateIndex
CREATE INDEX "Staff_hospitalId_lastName_idx" ON "Staff"("hospitalId", "lastName");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_hospitalId_employeeId_key" ON "Staff"("hospitalId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_userId_key" ON "Doctor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_licenseNo_key" ON "Doctor"("licenseNo");

-- CreateIndex
CREATE INDEX "Doctor_hospitalId_specialty_idx" ON "Doctor"("hospitalId", "specialty");

-- CreateIndex
CREATE INDEX "Doctor_hospitalId_lastName_idx" ON "Doctor"("hospitalId", "lastName");

-- CreateIndex
CREATE INDEX "Doctor_hospitalId_isActive_idx" ON "Doctor"("hospitalId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_hospitalId_licenseNo_key" ON "Doctor"("hospitalId", "licenseNo");

-- CreateIndex
CREATE INDEX "DoctorSchedule_hospitalId_doctorId_isActive_idx" ON "DoctorSchedule"("hospitalId", "doctorId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorSchedule_hospitalId_doctorId_dayOfWeek_departmentId_key" ON "DoctorSchedule"("hospitalId", "doctorId", "dayOfWeek", "departmentId");

-- CreateIndex
CREATE INDEX "DoctorAvailability_hospitalId_doctorId_date_idx" ON "DoctorAvailability"("hospitalId", "doctorId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorAvailability_hospitalId_doctorId_date_key" ON "DoctorAvailability"("hospitalId", "doctorId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Nurse_userId_key" ON "Nurse"("userId");

-- CreateIndex
CREATE INDEX "Nurse_hospitalId_isActive_idx" ON "Nurse"("hospitalId", "isActive");

-- CreateIndex
CREATE INDEX "Nurse_hospitalId_lastName_idx" ON "Nurse"("hospitalId", "lastName");

-- CreateIndex
CREATE INDEX "NurseShift_hospitalId_nurseId_date_idx" ON "NurseShift"("hospitalId", "nurseId", "date");

-- CreateIndex
CREATE INDEX "NurseShift_hospitalId_date_idx" ON "NurseShift"("hospitalId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Pharmacist_userId_key" ON "Pharmacist"("userId");

-- CreateIndex
CREATE INDEX "Pharmacist_hospitalId_isActive_idx" ON "Pharmacist"("hospitalId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LabTechnician_userId_key" ON "LabTechnician"("userId");

-- CreateIndex
CREATE INDEX "LabTechnician_hospitalId_isActive_idx" ON "LabTechnician"("hospitalId", "isActive");

-- CreateIndex
CREATE INDEX "Department_hospitalId_isActive_idx" ON "Department"("hospitalId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Department_hospitalId_name_key" ON "Department"("hospitalId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_hospitalId_code_key" ON "Department"("hospitalId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_userId_key" ON "Patient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_uhid_key" ON "Patient"("uhid");

-- CreateIndex
CREATE INDEX "Patient_hospitalId_primaryDoctorId_idx" ON "Patient"("hospitalId", "primaryDoctorId");

-- CreateIndex
CREATE INDEX "Patient_hospitalId_isActive_idx" ON "Patient"("hospitalId", "isActive");

-- CreateIndex
CREATE INDEX "Patient_hospitalId_lastName_idx" ON "Patient"("hospitalId", "lastName");

-- CreateIndex
CREATE INDEX "Patient_hospitalId_syncStatus_idx" ON "Patient"("hospitalId", "syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_hospitalId_uhid_key" ON "Patient"("hospitalId", "uhid");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_billId_key" ON "Appointment"("billId");

-- CreateIndex
CREATE INDEX "Appointment_hospitalId_date_idx" ON "Appointment"("hospitalId", "date");

-- CreateIndex
CREATE INDEX "Appointment_hospitalId_patientId_idx" ON "Appointment"("hospitalId", "patientId");

-- CreateIndex
CREATE INDEX "Appointment_hospitalId_doctorId_date_idx" ON "Appointment"("hospitalId", "doctorId", "date");

-- CreateIndex
CREATE INDEX "Appointment_hospitalId_status_idx" ON "Appointment"("hospitalId", "status");

-- CreateIndex
CREATE INDEX "Appointment_hospitalId_syncStatus_idx" ON "Appointment"("hospitalId", "syncStatus");

-- CreateIndex
CREATE INDEX "Appointment_offlineId_idx" ON "Appointment"("offlineId");

-- CreateIndex
CREATE INDEX "VitalRecord_hospitalId_patientId_recordedAt_idx" ON "VitalRecord"("hospitalId", "patientId", "recordedAt");

-- CreateIndex
CREATE INDEX "VitalRecord_hospitalId_syncStatus_idx" ON "VitalRecord"("hospitalId", "syncStatus");

-- CreateIndex
CREATE INDEX "VitalRecord_offlineId_idx" ON "VitalRecord"("offlineId");

-- CreateIndex
CREATE INDEX "MedicalRecord_hospitalId_patientId_recordedAt_idx" ON "MedicalRecord"("hospitalId", "patientId", "recordedAt");

-- CreateIndex
CREATE INDEX "MedicalRecord_hospitalId_patientId_recordType_idx" ON "MedicalRecord"("hospitalId", "patientId", "recordType");

-- CreateIndex
CREATE INDEX "MedicalRecord_icd10Code_idx" ON "MedicalRecord"("icd10Code");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_appointmentId_key" ON "Prescription"("appointmentId");

-- CreateIndex
CREATE INDEX "Prescription_hospitalId_patientId_issuedAt_idx" ON "Prescription"("hospitalId", "patientId", "issuedAt");

-- CreateIndex
CREATE INDEX "Prescription_hospitalId_status_idx" ON "Prescription"("hospitalId", "status");

-- CreateIndex
CREATE INDEX "Prescription_hospitalId_syncStatus_idx" ON "Prescription"("hospitalId", "syncStatus");

-- CreateIndex
CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyItem_drugCode_key" ON "PharmacyItem"("drugCode");

-- CreateIndex
CREATE INDEX "PharmacyItem_hospitalId_isActive_idx" ON "PharmacyItem"("hospitalId", "isActive");

-- CreateIndex
CREATE INDEX "PharmacyItem_hospitalId_expiryDate_idx" ON "PharmacyItem"("hospitalId", "expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyItem_hospitalId_drugCode_key" ON "PharmacyItem"("hospitalId", "drugCode");

-- CreateIndex
CREATE INDEX "InventoryTransaction_hospitalId_itemId_performedAt_idx" ON "InventoryTransaction"("hospitalId", "itemId", "performedAt");

-- CreateIndex
CREATE INDEX "InventoryTransaction_hospitalId_type_performedAt_idx" ON "InventoryTransaction"("hospitalId", "type", "performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LabOrder_orderNumber_key" ON "LabOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "LabOrder_hospitalId_patientId_idx" ON "LabOrder"("hospitalId", "patientId");

-- CreateIndex
CREATE INDEX "LabOrder_hospitalId_status_priority_idx" ON "LabOrder"("hospitalId", "status", "priority");

-- CreateIndex
CREATE INDEX "LabOrder_orderNumber_idx" ON "LabOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LabResult_orderId_key" ON "LabResult"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Ward_code_key" ON "Ward"("code");

-- CreateIndex
CREATE INDEX "Ward_hospitalId_type_idx" ON "Ward"("hospitalId", "type");

-- CreateIndex
CREATE INDEX "Ward_hospitalId_isActive_idx" ON "Ward"("hospitalId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Ward_hospitalId_code_key" ON "Ward"("hospitalId", "code");

-- CreateIndex
CREATE INDEX "Bed_wardId_isOccupied_idx" ON "Bed"("wardId", "isOccupied");

-- CreateIndex
CREATE INDEX "Bed_hospitalId_isOccupied_idx" ON "Bed"("hospitalId", "isOccupied");

-- CreateIndex
CREATE UNIQUE INDEX "Bed_hospitalId_bedNumber_key" ON "Bed"("hospitalId", "bedNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Bed_wardId_bedNumber_key" ON "Bed"("wardId", "bedNumber");

-- CreateIndex
CREATE INDEX "LabTest_hospitalId_isActive_idx" ON "LabTest"("hospitalId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LabTest_hospitalId_name_key" ON "LabTest"("hospitalId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LabTest_hospitalId_code_key" ON "LabTest"("hospitalId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Admission_bedId_key" ON "Admission"("bedId");

-- CreateIndex
CREATE UNIQUE INDEX "Admission_admissionNumber_key" ON "Admission"("admissionNumber");

-- CreateIndex
CREATE INDEX "Admission_hospitalId_patientId_idx" ON "Admission"("hospitalId", "patientId");

-- CreateIndex
CREATE INDEX "Admission_hospitalId_status_idx" ON "Admission"("hospitalId", "status");

-- CreateIndex
CREATE INDEX "Admission_admissionDate_idx" ON "Admission"("admissionDate");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_appointmentId_key" ON "Bill"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_billNumber_key" ON "Bill"("billNumber");

-- CreateIndex
CREATE INDEX "Bill_hospitalId_patientId_idx" ON "Bill"("hospitalId", "patientId");

-- CreateIndex
CREATE INDEX "Bill_hospitalId_status_idx" ON "Bill"("hospitalId", "status");

-- CreateIndex
CREATE INDEX "Bill_billNumber_idx" ON "Bill"("billNumber");

-- CreateIndex
CREATE INDEX "BillItem_billId_idx" ON "BillItem"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "Payment"("paymentNumber");

-- CreateIndex
CREATE INDEX "Payment_hospitalId_billId_idx" ON "Payment"("hospitalId", "billId");

-- CreateIndex
CREATE INDEX "Payment_hospitalId_receivedAt_idx" ON "Payment"("hospitalId", "receivedAt");

-- CreateIndex
CREATE INDEX "Payment_receiptNumber_idx" ON "Payment"("receiptNumber");

-- CreateIndex
CREATE INDEX "Payment_paymentNumber_idx" ON "Payment"("paymentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceProvider_code_key" ON "InsuranceProvider"("code");

-- CreateIndex
CREATE INDEX "InsuranceProvider_hospitalId_isActive_idx" ON "InsuranceProvider"("hospitalId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceProvider_hospitalId_name_key" ON "InsuranceProvider"("hospitalId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceClaim_claimNumber_key" ON "InsuranceClaim"("claimNumber");

-- CreateIndex
CREATE INDEX "InsuranceClaim_hospitalId_status_idx" ON "InsuranceClaim"("hospitalId", "status");

-- CreateIndex
CREATE INDEX "InsuranceClaim_claimNumber_idx" ON "InsuranceClaim"("claimNumber");

-- CreateIndex
CREATE INDEX "SyncConflict_hospitalId_entityType_entityId_idx" ON "SyncConflict"("hospitalId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "SyncConflict_hospitalId_resolvedAt_idx" ON "SyncConflict"("hospitalId", "resolvedAt");

-- CreateIndex
CREATE INDEX "SyncConflict_offlineId_idx" ON "SyncConflict"("offlineId");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalSettings_hospitalId_key" ON "HospitalSettings"("hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_hospitalId_key" ON "Subscription"("hospitalId");

-- CreateIndex
CREATE INDEX "Subscription_hospitalId_status_idx" ON "Subscription"("hospitalId", "status");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "AuditLog_hospitalId_createdAt_idx" ON "AuditLog"("hospitalId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Backup_hospitalId_createdAt_idx" ON "Backup"("hospitalId", "createdAt");

-- CreateIndex
CREATE INDEX "_DepartmentToDoctor_B_index" ON "_DepartmentToDoctor"("B");

-- CreateIndex
CREATE INDEX "_DepartmentToLabTest_B_index" ON "_DepartmentToLabTest"("B");

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorAvailability" ADD CONSTRAINT "DoctorAvailability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorAvailability" ADD CONSTRAINT "DoctorAvailability_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nurse" ADD CONSTRAINT "Nurse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nurse" ADD CONSTRAINT "Nurse_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nurse" ADD CONSTRAINT "Nurse_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseShift" ADD CONSTRAINT "NurseShift_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "Nurse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseShift" ADD CONSTRAINT "NurseShift_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseShift" ADD CONSTRAINT "NurseShift_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pharmacist" ADD CONSTRAINT "Pharmacist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pharmacist" ADD CONSTRAINT "Pharmacist_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTechnician" ADD CONSTRAINT "LabTechnician_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTechnician" ADD CONSTRAINT "LabTechnician_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTechnician" ADD CONSTRAINT "LabTechnician_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_primaryDoctorId_fkey" FOREIGN KEY ("primaryDoctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalRecord" ADD CONSTRAINT "VitalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalRecord" ADD CONSTRAINT "VitalRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalRecord" ADD CONSTRAINT "VitalRecord_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalRecord" ADD CONSTRAINT "VitalRecord_recordedByNurseId_fkey" FOREIGN KEY ("recordedByNurseId") REFERENCES "Nurse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_dispensedById_fkey" FOREIGN KEY ("dispensedById") REFERENCES "Pharmacist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_pharmacyItemId_fkey" FOREIGN KEY ("pharmacyItemId") REFERENCES "PharmacyItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyItem" ADD CONSTRAINT "PharmacyItem_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PharmacyItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "Pharmacist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_testId_fkey" FOREIGN KEY ("testId") REFERENCES "LabTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "LabTechnician"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "LabTechnician"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "LabOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "LabTechnician"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_admittingDoctorId_fkey" FOREIGN KEY ("admittingDoctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillItem" ADD CONSTRAINT "BillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceProvider" ADD CONSTRAINT "InsuranceProvider_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "InsuranceProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncConflict" ADD CONSTRAINT "SyncConflict_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalSettings" ADD CONSTRAINT "HospitalSettings_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backup" ADD CONSTRAINT "Backup_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToDoctor" ADD CONSTRAINT "_DepartmentToDoctor_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToDoctor" ADD CONSTRAINT "_DepartmentToDoctor_B_fkey" FOREIGN KEY ("B") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToLabTest" ADD CONSTRAINT "_DepartmentToLabTest_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToLabTest" ADD CONSTRAINT "_DepartmentToLabTest_B_fkey" FOREIGN KEY ("B") REFERENCES "LabTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
