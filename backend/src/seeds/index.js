const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const {
  User, Institution, InstitutionApplication, Committee, Student, Faculty, BiometricDevice, CameraStream,
} = require('../models');
const { ROLES, COMMITTEE_TYPES } = require('../config/constants');
const logger = require('../utils/logger');

const seedUsers = [
  { email: 'admin@pnmc.com', password: 'Admin@123', firstName: 'Super', lastName: 'Admin', role: ROLES.SUPER_ADMIN },
  { email: 'council@pnmc.com', password: 'Council@123', firstName: 'Council', lastName: 'Member', role: ROLES.COUNCIL_MEMBER },
  { email: 'committee@pnmc.com', password: 'Committee@123', firstName: 'Committee', lastName: 'Member', role: ROLES.COMMITTEE_MEMBER },
  { email: 'field@pnmc.com', password: 'Field@123', firstName: 'Field', lastName: 'Officer', role: ROLES.FIELD_OFFICER },
  { email: 'finance@pnmc.com', password: 'Finance@123', firstName: 'Finance', lastName: 'Officer', role: ROLES.FINANCE_OFFICER },
  { email: 'monitoring@pnmc.com', password: 'Monitor@123', firstName: 'Monitoring', lastName: 'Officer', role: ROLES.MONITORING_OFFICER },
];

const seed = async () => {
  try {
    await connectDB();
    logger.info('Seeding database...');

    await Promise.all([
      User.deleteMany({}),
      Institution.deleteMany({}),
      InstitutionApplication.deleteMany({}),
      Committee.deleteMany({}),
      Student.deleteMany({}),
      Faculty.deleteMany({}),
      BiometricDevice.deleteMany({}),
      CameraStream.deleteMany({}),
    ]);

    const users = await User.create(seedUsers);
    const admin = users[0];

    const institution = await Institution.create({
      name: 'Pakistan Institute of Nursing Sciences',
      institutionType: 'college_of_nursing',
      email: 'info@pnmc.com',
      phone: '+92-300-1234567',
      address: { city: 'Islamabad', province: 'ICT', country: 'Pakistan' },
      principalName: 'Dr. Sarah Ahmed',
      establishedYear: 1995,
      status: 'approved',
      registrationNumber: 'INST-2026-00001',
      admin: admin._id,
      approvedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    await User.create({
      email: 'institution@pnmc.com',
      password: 'Inst@123',
      firstName: 'Institution',
      lastName: 'Admin',
      role: ROLES.INSTITUTION_ADMIN,
      institution: institution._id,
    });

    const instAdmin = await User.findOne({ email: 'institution@pnmc.com' });

    await InstitutionApplication.create({
      institution: institution._id,
      submittedBy: instAdmin._id,
      status: 'committee_review',
      workflow: [
        { step: 'institution_submission', status: 'completed', completedAt: new Date() },
        { step: 'field_inspection', status: 'completed', completedAt: new Date() },
        { step: 'committee_review', status: 'in_progress' },
        { step: 'council_review', status: 'pending' },
      ],
    });

    await User.create({
      email: 'principal@pnmc.com',
      password: 'Principal@123',
      firstName: 'Dr. Sarah',
      lastName: 'Ahmed',
      role: ROLES.PRINCIPAL,
      institution: institution._id,
    });

    for (const type of COMMITTEE_TYPES) {
      await Committee.create({
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Committee`,
        type,
        chairperson: users[2]._id,
        members: [users[2]._id, users[1]._id],
        isActive: true,
      });
    }

    const studentUser = await User.create({
      email: 'student@pnmc.com',
      password: 'Student@123',
      firstName: 'Ayesha',
      lastName: 'Khan',
      role: ROLES.STUDENT,
      institution: institution._id,
    });

    await Student.create({
      user: studentUser._id,
      institution: institution._id,
      registrationNumber: 'STD-2026-00001',
      personalInfo: {
        fullName: 'Ayesha Khan',
        fatherHusbandName: 'Muhammad Khan',
        cnic: '35202-1234567-1',
        dateOfBirth: new Date('2000-05-15'),
        contact: '+92-300-9876543',
        address: 'House 45, Street 12, Islamabad',
        nationality: 'Pakistani',
        gender: 'female',
      },
      academicInfo: {
        matric: { board: 'FBISE', year: 2018, marks: 850, totalMarks: 1100, percentage: 77.3 },
        fsc: { board: 'FBISE', year: 2020, marks: 920, totalMarks: 1100, percentage: 83.6, biologyMarks: 185 },
      },
      programInfo: {
        course: 'BSN',
        degree: 'Bachelor of Science in Nursing',
        session: '2024-2028',
        semester: 3,
        batch: '2024-A',
      },
      status: 'active',
      approvedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    const facultyUser = await User.create({
      email: 'faculty@pnmc.com',
      password: 'Faculty@123',
      firstName: 'Dr. Hassan',
      lastName: 'Raza',
      role: ROLES.FACULTY,
      institution: institution._id,
    });

    await Faculty.create({
      user: facultyUser._id,
      institution: institution._id,
      registrationNumber: 'FAC-2026-00001',
      personalInfo: {
        fullName: 'Dr. Hassan Raza',
        cnic: '35202-7654321-9',
        contact: '+92-300-5551234',
        email: 'faculty@pnmc.com',
      },
      professionalInfo: {
        qualification: 'PhD Nursing',
        specialization: 'Medical-Surgical Nursing',
        teachingExperience: 12,
        designation: 'Associate Professor',
        department: 'Medical-Surgical Nursing',
        joiningDate: new Date('2015-08-01'),
      },
      status: 'active',
      approvedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    await BiometricDevice.create({
      name: 'Main Entrance ZKTeco',
      deviceId: 'ZK-001-PINS',
      vendor: 'zkteco',
      institution: institution._id,
      ipAddress: '192.168.1.100',
      port: 4370,
      location: 'Main Entrance',
      isActive: true,
    });

    await CameraStream.create({
      name: 'Classroom A - Live',
      institution: institution._id,
      location: 'classroom',
      locationDetail: 'Building A, Room 101',
      streamUrl: 'rtsp://camera.local/classroom-a',
      isActive: true,
    });

    logger.info('Seed completed successfully!');
    logger.info('--- Default Credentials ---');
    seedUsers.forEach((u) => logger.info(`${u.role}: ${u.email} / ${u.password}`));
    logger.info(`institution_admin: institution@pnmc.com / Inst@123`);
    logger.info(`student: student@pnmc.com / Student@123`);
    logger.info(`faculty: faculty@pnmc.com / Faculty@123`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
