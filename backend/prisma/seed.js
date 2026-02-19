// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordPlain = "Password123!"; // ✅ frontend login password

  // ──────────────── HOSPITAL ────────────────
  const hospital = await prisma.hospital.create({
    data: {
      name: "Busia General Hospital",
      shortName: "BGH",
      code: "BGH001",
      contactEmail: "info@bgh.com",
      contactPhone: "+254701234567",
      address: "123 Main St, Busia, Kenya",
      logoUrl: "https://via.placeholder.com/150",
      security: { mfa: true },
    },
  });

  // ──────────────── USERS & SYSTEM ADMIN ────────────────
  const adminPasswordHash = await bcrypt.hash(adminPasswordPlain, 10);
  const systemAdmin = await prisma.user.create({
    data: {
      email: "admin@bgh.com",
      password: adminPasswordHash,
      role: "SYSTEM_ADMIN",
      hospitalId: hospital.id,
      isActive: true,
    },
  });

  // ──────────────── DEPARTMENTS ────────────────
  const departments = await prisma.department.createMany({
    data: [
      { name: "General Medicine", code: "GM", hospitalId: hospital.id },
      { name: "Pediatrics", code: "PED", hospitalId: hospital.id },
      { name: "Surgery", code: "SURG", hospitalId: hospital.id },
    ],
  });

  const allDepartments = await prisma.department.findMany({
    where: { hospitalId: hospital.id },
  });

  // ──────────────── DOCTORS ────────────────
  const doctorsData = [
    { firstName: "Alice", lastName: "Mwangi", specialty: "Pediatrics", licenseNo: "DOC001", consultationFee: 2000 },
    { firstName: "John", lastName: "Otieno", specialty: "Surgery", licenseNo: "DOC002", consultationFee: 2500 },
  ];

  const doctors = [];
  for (let doc of doctorsData) {
    const user = await prisma.user.create({
      data: {
        email: `${doc.firstName.toLowerCase()}@bgh.com`,
        password: adminPasswordHash,
        role: "DOCTOR",
        hospitalId: hospital.id,
      },
    });
    const doctor = await prisma.doctor.create({
      data: { userId: user.id, hospitalId: hospital.id, ...doc },
    });
    doctors.push(doctor);
  }

  // ──────────────── NURSES ────────────────
  const nursesData = [
    { firstName: "Grace", lastName: "Achieng", licenseNo: "NUR001" },
    { firstName: "Faith", lastName: "Njeri", licenseNo: "NUR002" },
  ];

  const nurses = [];
  for (let n of nursesData) {
    const user = await prisma.user.create({
      data: {
        email: `${n.firstName.toLowerCase()}@bgh.com`,
        password: adminPasswordHash,
        role: "NURSE",
        hospitalId: hospital.id,
      },
    });
    const nurse = await prisma.nurse.create({
      data: { userId: user.id, hospitalId: hospital.id, ...n, departmentId: allDepartments[0].id },
    });
    nurses.push(nurse);
  }

  // ──────────────── WARDS + BEDS ────────────────
  const ward = await prisma.ward.create({
    data: {
      name: "Ward A",
      hospitalId: hospital.id,
      type: "General",
      totalBeds: 10,
      availableBeds: 10,
    },
  });

  for (let i = 1; i <= 10; i++) {
    await prisma.bed.create({
      data: { bedNumber: `A${i}`, wardId: ward.id, hospitalId: hospital.id, dailyRate: 500 },
    });
  }

  // ──────────────── PATIENTS ────────────────
  const patientsData = [
    { firstName: "Peter", lastName: "Kariuki", uhid: "UHID001", dob: new Date("1990-01-01"), gender: "Male" },
    { firstName: "Mary", lastName: "Wanjiku", uhid: "UHID002", dob: new Date("1985-05-15"), gender: "Female" },
  ];

  const patients = [];
  for (let p of patientsData) {
    const user = await prisma.user.create({
      data: {
        email: `${p.firstName.toLowerCase()}@patient.com`,
        password: adminPasswordHash,
        role: "PATIENT",
        hospitalId: hospital.id,
      },
    });
    const patient = await prisma.patient.create({
      data: { userId: user.id, hospitalId: hospital.id, ...p, primaryDoctorId: doctors[0].id },
    });
    patients.push(patient);
  }

  // ──────────────── APPOINTMENTS ────────────────
  for (let patient of patients) {
    await prisma.appointment.create({
      data: {
        hospitalId: hospital.id,
        patientId: patient.id,
        doctorId: doctors[0].id,
        departmentId: allDepartments[0].id,
        date: new Date(),
        startTime: new Date(),
      },
    });
  }

  // ──────────────── PHARMACY ITEMS ────────────────
  await prisma.pharmacyItem.createMany({
    data: [
      { hospitalId: hospital.id, drugCode: "DRUG001", genericName: "Paracetamol", form: "Tablet", strength: "500mg", unit: "Tablet", unitPrice: 50, sellingPrice: 60 },
      { hospitalId: hospital.id, drugCode: "DRUG002", genericName: "Amoxicillin", form: "Capsule", strength: "250mg", unit: "Capsule", unitPrice: 100, sellingPrice: 120 },
    ],
  });

  console.log("✅ Seed completed! Login with admin@bgh.com / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
