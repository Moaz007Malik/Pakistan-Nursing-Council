require('../config/loadEnv');
const connectDB = require('../config/database');
const {
  User,
  Institution,
  InstitutionApplication,
  Committee,
  Student,
  Faculty,
  BiometricDevice,
  CameraStream,
  Payment,
  Renewal,
  Notification,
  StudentAttendance,
  FacultyAttendance,
  FieldInspection,
} = require('../models');
const { ROLES, COMMITTEE_TYPES } = require('../config/constants');
const {
  assignStudentRegistration,
  assignFacultyRegistration,
  activateStudentMembership,
  activateFacultyMembership,
} = require('../services/registration.service');
const logger = require('../utils/logger');

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const inDays = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const seedUsers = [
  { email: 'admin@pnmc.com', password: 'Admin@123', firstName: 'Super', lastName: 'Admin', role: ROLES.SUPER_ADMIN },
  { email: 'council@pnmc.com', password: 'Council@123', firstName: 'Council', lastName: 'Member', role: ROLES.COUNCIL_MEMBER },
  { email: 'committee@pnmc.com', password: 'Committee@123', firstName: 'Committee', lastName: 'Member', role: ROLES.COMMITTEE_MEMBER },
  { email: 'field@pnmc.com', password: 'Field@123', firstName: 'Field', lastName: 'Officer', role: ROLES.FIELD_OFFICER },
  { email: 'finance@pnmc.com', password: 'Finance@123', firstName: 'Finance', lastName: 'Officer', role: ROLES.FINANCE_OFFICER },
  { email: 'monitoring@pnmc.com', password: 'Monitor@123', firstName: 'Monitoring', lastName: 'Officer', role: ROLES.MONITORING_OFFICER },
];

const extraStudents = [
  {
    email: 'ali.raza@pnmc.com',
    password: 'Student@123',
    firstName: 'Ali',
    lastName: 'Raza',
    personalInfo: {
      fullName: 'Ali Raza',
      fatherHusbandName: 'Ahmed Raza',
      cnic: '35202-2345678-2',
      dateOfBirth: new Date('1999-08-20'),
      contact: '+92-321-1112233',
      address: 'G-9/4, Islamabad',
      gender: 'male',
    },
    programInfo: { course: 'BSN', degree: 'Bachelor of Science in Nursing', session: '2023-2027', semester: 4, batch: '2023-B' },
    status: 'active',
  },
  {
    email: 'fatima.noor@pnmc.com',
    password: 'Student@123',
    firstName: 'Fatima',
    lastName: 'Noor',
    personalInfo: {
      fullName: 'Fatima Noor',
      fatherHusbandName: 'Noor Hussain',
      cnic: '35202-3456789-3',
      dateOfBirth: new Date('2001-02-10'),
      contact: '+92-333-4445566',
      address: 'F-10 Markaz, Islamabad',
      gender: 'female',
    },
    programInfo: { course: 'Diploma', degree: 'Diploma in Nursing', session: '2025-2027', semester: 1, batch: '2025-A' },
    status: 'committee_verification',
    workflow: [
      { step: 'institution_verification', status: 'completed', completedAt: daysAgo(5) },
      { step: 'committee_verification', status: 'in_progress' },
    ],
  },
  {
    email: 'omar.siddiqui@pnmc.com',
    password: 'Student@123',
    firstName: 'Omar',
    lastName: 'Siddiqui',
    personalInfo: {
      fullName: 'Omar Siddiqui',
      fatherHusbandName: 'Siddiqui Ahmed',
      cnic: '35202-4567890-4',
      dateOfBirth: new Date('1998-11-30'),
      contact: '+92-345-6677889',
      address: 'Blue Area, Islamabad',
      gender: 'male',
    },
    programInfo: { course: 'BSN', degree: 'Bachelor of Science in Nursing', session: '2022-2026', semester: 6, batch: '2022-A' },
    status: 'pending_renewal',
    expiresAt: inDays(14),
    renewalDueDate: inDays(14),
  },
];

const extraFaculty = [
  {
    email: 'zainab.malik@pnmc.com',
    password: 'Faculty@123',
    firstName: 'Zainab',
    lastName: 'Malik',
    personalInfo: {
      fullName: 'Ms. Zainab Malik',
      cnic: '35202-8765432-1',
      contact: '+92-300-2223344',
      email: 'zainab.malik@pnmc.com',
      gender: 'female',
    },
    professionalInfo: {
      qualification: 'MSN',
      specialization: 'Pediatric Nursing',
      teachingExperience: 8,
      designation: 'Lecturer',
      department: 'Pediatric Nursing',
      joiningDate: new Date('2018-01-15'),
    },
    status: 'active',
  },
  {
    email: 'tariq.ahmed@pnmc.com',
    password: 'Faculty@123',
    firstName: 'Tariq',
    lastName: 'Ahmed',
    personalInfo: {
      fullName: 'Mr. Tariq Ahmed',
      cnic: '35202-9876543-2',
      contact: '+92-301-3334455',
      email: 'tariq.ahmed@pnmc.com',
      gender: 'male',
    },
    professionalInfo: {
      qualification: 'BSN',
      specialization: 'Community Health',
      teachingExperience: 5,
      designation: 'Clinical Instructor',
      department: 'Community Health Nursing',
      joiningDate: new Date('2020-09-01'),
    },
    status: 'institution_approval',
    workflow: [{ step: 'institution_approval', status: 'in_progress' }],
  },
];

const createStudentWithUser = async (institutionId, entry, approvedBy) => {
  const user = await User.create({
    email: entry.email,
    password: entry.password,
    firstName: entry.firstName,
    lastName: entry.lastName,
    role: ROLES.STUDENT,
    institution: institutionId,
  });

  const studentData = {
    user: user._id,
    institution: institutionId,
    personalInfo: entry.personalInfo,
    academicInfo: entry.academicInfo || {
      matric: { board: 'FBISE', year: 2017, marks: 800, totalMarks: 1100, percentage: 72.7 },
      fsc: { board: 'FBISE', year: 2019, marks: 880, totalMarks: 1100, percentage: 80.0, biologyMarks: 175 },
    },
    programInfo: entry.programInfo,
    status: entry.status || 'draft',
    workflow: entry.workflow || [],
    expiresAt: entry.expiresAt,
    renewalDueDate: entry.renewalDueDate,
  };

  await assignStudentRegistration(studentData);
  if (studentData.status === 'active') {
    activateStudentMembership(studentData, approvedBy);
  }
  const student = await Student.create(studentData);
  return { user, student };
};

const createFacultyWithUser = async (institutionId, entry, approvedBy) => {
  const user = await User.create({
    email: entry.email,
    password: entry.password,
    firstName: entry.firstName,
    lastName: entry.lastName,
    role: ROLES.FACULTY,
    institution: institutionId,
  });

  const facultyData = {
    user: user._id,
    institution: institutionId,
    personalInfo: entry.personalInfo,
    professionalInfo: entry.professionalInfo,
    status: entry.status || 'draft',
    workflow: entry.workflow || [],
    expiresAt: entry.expiresAt,
    renewalDueDate: entry.renewalDueDate,
  };

  await assignFacultyRegistration(facultyData);
  if (facultyData.status === 'active') {
    activateFacultyMembership(facultyData, approvedBy);
  }
  const faculty = await Faculty.create(facultyData);
  return { user, faculty };
};

const seedAttendance = async (student, faculty, institutionId, deviceId) => {
  const statuses = ['present', 'present', 'present', 'late', 'absent'];
  for (let i = 0; i < 5; i++) {
    const date = atMidnight(daysAgo(i + 1));
    const status = statuses[i];
    await StudentAttendance.create({
      student: student._id,
      institution: institutionId,
      date,
      status,
      source: i % 2 === 0 ? 'biometric' : 'manual',
      checkIn: status !== 'absent' ? new Date(date.getTime() + 8 * 60 * 60 * 1000) : undefined,
      checkOut: status === 'present' ? new Date(date.getTime() + 16 * 60 * 60 * 1000) : undefined,
      lateMinutes: status === 'late' ? 15 : 0,
      biometricDevice: deviceId,
      semester: String(student.programInfo?.semester || 1),
      session: student.programInfo?.session,
    });

    await FacultyAttendance.create({
      faculty: faculty._id,
      institution: institutionId,
      date,
      status: i === 4 ? 'leave' : 'present',
      source: 'biometric',
      checkIn: i === 4 ? undefined : new Date(date.getTime() + 7.5 * 60 * 60 * 1000),
      checkOut: i === 4 ? undefined : new Date(date.getTime() + 15.5 * 60 * 60 * 1000),
      biometricDevice: deviceId,
    });
  }
};

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
      Payment.deleteMany({}),
      Renewal.deleteMany({}),
      Notification.deleteMany({}),
      StudentAttendance.deleteMany({}),
      FacultyAttendance.deleteMany({}),
      FieldInspection.deleteMany({}),
    ]);

    const users = await User.create(seedUsers);
    const admin = users[0];
    const fieldOfficer = users[3];
    const financeOfficer = users[4];

    const institution = await Institution.create({
      name: 'Pakistan Institute of Nursing Sciences',
      institutionType: 'college_of_nursing',
      email: 'info@pnmc.com',
      phone: '+92-300-1234567',
      address: { street: 'Sector H-8/1', city: 'Islamabad', province: 'ICT', country: 'Pakistan' },
      principalName: 'Dr. Sarah Ahmed',
      establishedYear: 1995,
      status: 'approved',
      registrationNumber: 'INST-2026-00001',
      admin: admin._id,
      approvedAt: new Date(),
      expiresAt: inDays(365),
      renewalDueDate: inDays(330),
    });

    const institution2 = await Institution.create({
      name: 'Karachi School of Nursing',
      institutionType: 'school_of_nursing',
      email: 'info@kson.edu.pk',
      phone: '+92-21-34567890',
      address: { street: 'Clifton Block 5', city: 'Karachi', province: 'Sindh', country: 'Pakistan' },
      principalName: 'Dr. Nadia Farooq',
      establishedYear: 2008,
      status: 'field_inspection_pending',
      registrationNumber: 'INST-2026-00002',
      approvedAt: null,
    });

    await User.create({
      email: 'institution@pnmc.com',
      password: 'Inst@123',
      firstName: 'Institution',
      lastName: 'Admin',
      role: ROLES.INSTITUTION_ADMIN,
      institution: institution._id,
    });

    await User.create({
      email: 'institution2@pnmc.com',
      password: 'Inst@123',
      firstName: 'Karachi',
      lastName: 'Admin',
      role: ROLES.INSTITUTION_ADMIN,
      institution: institution2._id,
    });

    const instAdmin = await User.findOne({ email: 'institution@pnmc.com' });
    const inst2Admin = await User.findOne({ email: 'institution2@pnmc.com' });

    const application1 = await InstitutionApplication.create({
      institution: institution._id,
      submittedBy: instAdmin._id,
      status: 'committee_review',
      workflow: [
        { step: 'institution_submission', status: 'completed', completedAt: daysAgo(30) },
        { step: 'field_inspection', status: 'completed', completedAt: daysAgo(20) },
        { step: 'committee_review', status: 'in_progress' },
        { step: 'council_review', status: 'pending' },
      ],
    });

    const application2 = await InstitutionApplication.create({
      institution: institution2._id,
      submittedBy: inst2Admin._id,
      status: 'field_inspection_pending',
      workflow: [
        { step: 'institution_submission', status: 'completed', completedAt: daysAgo(10) },
        { step: 'field_inspection', status: 'in_progress' },
        { step: 'committee_review', status: 'pending' },
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

    const { student: primaryStudent } = await createStudentWithUser(
      institution._id,
      {
        email: 'student@pnmc.com',
        password: 'Student@123',
        firstName: 'Ayesha',
        lastName: 'Khan',
        personalInfo: {
          fullName: 'Ayesha Khan',
          fatherHusbandName: 'Muhammad Khan',
          cnic: '35202-1234567-1',
          dateOfBirth: new Date('2000-05-15'),
          contact: '+92-300-9876543',
          address: 'House 45, Street 12, Islamabad',
          gender: 'female',
        },
        academicInfo: {
          matric: { board: 'FBISE', year: 2018, marks: 850, totalMarks: 1100, percentage: 77.3 },
          fsc: { board: 'FBISE', year: 2020, marks: 920, totalMarks: 1100, percentage: 83.6, biologyMarks: 185 },
        },
        programInfo: { course: 'BSN', degree: 'Bachelor of Science in Nursing', session: '2024-2028', semester: 3, batch: '2024-A' },
        status: 'active',
      },
      admin._id
    );

    const createdStudents = [primaryStudent];
    for (const entry of extraStudents) {
      const { student } = await createStudentWithUser(institution._id, entry, admin._id);
      createdStudents.push(student);
    }

    const { faculty: primaryFaculty } = await createFacultyWithUser(
      institution._id,
      {
        email: 'faculty@pnmc.com',
        password: 'Faculty@123',
        firstName: 'Dr. Hassan',
        lastName: 'Raza',
        personalInfo: {
          fullName: 'Dr. Hassan Raza',
          cnic: '35202-7654321-9',
          contact: '+92-300-5551234',
          email: 'faculty@pnmc.com',
          gender: 'male',
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
      },
      admin._id
    );

    const createdFaculty = [primaryFaculty];
    for (const entry of extraFaculty) {
      const { faculty } = await createFacultyWithUser(institution._id, entry, admin._id);
      createdFaculty.push(faculty);
    }

    await createStudentWithUser(institution2._id, {
      email: 'sana.khan@kson.edu.pk',
      password: 'Student@123',
      firstName: 'Sana',
      lastName: 'Khan',
      personalInfo: {
        fullName: 'Sana Khan',
        fatherHusbandName: 'Imran Khan',
        cnic: '42101-1122334-5',
        dateOfBirth: new Date('2002-04-18'),
        contact: '+92-322-9988776',
        address: 'DHA Phase 5, Karachi',
        gender: 'female',
      },
      programInfo: { course: 'Diploma', degree: 'Diploma in Nursing', session: '2025-2027', semester: 1, batch: '2025-K' },
      status: 'draft',
    });

    await createFacultyWithUser(institution2._id, {
      email: 'dr.ameen@kson.edu.pk',
      password: 'Faculty@123',
      firstName: 'Dr. Ameen',
      lastName: 'Shah',
      personalInfo: {
        fullName: 'Dr. Ameen Shah',
        cnic: '42101-5566778-9',
        contact: '+92-321-5544332',
        email: 'dr.ameen@kson.edu.pk',
        gender: 'male',
      },
      professionalInfo: {
        qualification: 'MSN',
        specialization: 'Psychiatric Nursing',
        teachingExperience: 6,
        designation: 'Senior Lecturer',
        department: 'Psychiatric Nursing',
        joiningDate: new Date('2019-03-01'),
      },
      status: 'draft',
    });

    const device = await BiometricDevice.create({
      name: 'Main Entrance ZKTeco',
      deviceId: 'ZK-001-PINS',
      vendor: 'zkteco',
      institution: institution._id,
      ipAddress: '192.168.1.100',
      port: 4370,
      location: 'Main Entrance',
      isActive: true,
    });

    await BiometricDevice.create({
      name: 'Lab Wing eSSL',
      deviceId: 'ESL-002-PINS',
      vendor: 'essl',
      institution: institution._id,
      ipAddress: '192.168.1.101',
      port: 4370,
      location: 'Skills Lab',
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

    await CameraStream.create({
      name: 'Skills Lab - Live',
      institution: institution._id,
      location: 'lab',
      locationDetail: 'Building B, Skills Lab',
      streamUrl: 'rtsp://camera.local/skills-lab',
      isActive: true,
    });

    await FieldInspection.create({
      institution: institution._id,
      application: application1._id,
      fieldOfficer: fieldOfficer._id,
      status: 'submitted',
      scheduledDate: daysAgo(22),
      visitDate: daysAgo(20),
      geolocation: { latitude: 33.6844, longitude: 73.0479, accuracy: 12, capturedAt: daysAgo(20) },
      sections: {
        infrastructure: { name: 'Infrastructure', score: 88, maxScore: 100, compliant: true, remarks: 'Well maintained campus' },
        faculty: { name: 'Faculty', score: 92, maxScore: 100, compliant: true },
        labs: { name: 'Labs', score: 85, maxScore: 100, compliant: true },
        library: { name: 'Library', score: 80, maxScore: 100, compliant: true },
        hostel: { name: 'Hostel', score: 78, maxScore: 100, compliant: true },
        hospitalAffiliation: { name: 'Hospital Affiliation', score: 90, maxScore: 100, compliant: true },
        studentRecords: { name: 'Student Records', score: 86, maxScore: 100, compliant: true },
      },
      overallScore: 86,
      recommendation: 'recommended',
      summary: 'Institution meets PNMC standards with minor hostel improvements suggested.',
      submittedAt: daysAgo(18),
    });

    await FieldInspection.create({
      institution: institution2._id,
      application: application2._id,
      fieldOfficer: fieldOfficer._id,
      status: 'assigned',
      scheduledDate: inDays(3),
    });

    const renewalStudent = createdStudents.find((s) => s.status === 'pending_renewal');
    const renewalPayment = await Payment.create({
      invoiceNumber: 'INV-2026-00001',
      paymentType: 'student_renewal',
      gateway: 'bypass',
      amount: 5000,
      currency: 'PKR',
      status: 'completed',
      payer: renewalStudent.user,
      institution: institution._id,
      relatedEntity: { entityType: 'student', entityId: renewalStudent._id },
      gatewayTransactionId: 'BYPASS-SEED-001',
      receiptNumber: 'RCP-2026-00001',
      paidAt: daysAgo(2),
    });

    await Renewal.create({
      entityType: 'student',
      entityId: renewalStudent._id,
      institution: institution._id,
      requestedBy: renewalStudent.user,
      renewalYear: new Date().getFullYear(),
      status: 'payment_completed',
      payment: renewalPayment._id,
      previousExpiryDate: renewalStudent.expiresAt,
      newExpiryDate: inDays(365),
    });

    await Payment.create({
      invoiceNumber: 'INV-2026-00002',
      paymentType: 'faculty_renewal',
      gateway: 'bypass',
      amount: 7500,
      currency: 'PKR',
      status: 'pending',
      payer: primaryFaculty.user,
      institution: institution._id,
      relatedEntity: { entityType: 'faculty', entityId: primaryFaculty._id },
    });

    await Payment.create({
      invoiceNumber: 'INV-2026-00003',
      paymentType: 'institution_registration',
      gateway: 'bypass',
      amount: 25000,
      currency: 'PKR',
      status: 'completed',
      payer: inst2Admin._id,
      institution: institution2._id,
      relatedEntity: { entityType: 'institution', entityId: institution2._id },
      paidAt: daysAgo(10),
      receiptNumber: 'RCP-2026-00002',
    });

    await Notification.create([
      {
        recipient: admin._id,
        title: 'New institution application',
        message: 'Karachi School of Nursing submitted a registration application.',
        type: 'general',
        channels: { inApp: { sent: true, sentAt: new Date() } },
        relatedEntity: { entityType: 'institution', entityId: institution2._id },
      },
      {
        recipient: instAdmin._id,
        title: 'Student renewal due',
        message: 'Omar Siddiqui membership expires in 14 days. Please initiate renewal.',
        type: 'renewal_due',
        channels: { inApp: { sent: true, sentAt: new Date() } },
        relatedEntity: { entityType: 'student', entityId: renewalStudent._id },
      },
      {
        recipient: renewalStudent.user,
        title: 'Payment received',
        message: 'Your renewal payment of PKR 5,000 was received successfully.',
        type: 'payment_success',
        isRead: true,
        readAt: daysAgo(1),
        channels: { inApp: { sent: true, sentAt: daysAgo(2) } },
        relatedEntity: { entityType: 'payment', entityId: renewalPayment._id },
      },
      {
        recipient: fieldOfficer._id,
        title: 'Inspection assigned',
        message: 'Field inspection scheduled for Karachi School of Nursing.',
        type: 'inspection_assigned',
        channels: { inApp: { sent: true, sentAt: new Date() } },
        relatedEntity: { entityType: 'institution', entityId: institution2._id },
      },
      {
        recipient: financeOfficer._id,
        title: 'Pending faculty renewal payment',
        message: 'Dr. Hassan Raza has a pending faculty renewal payment of PKR 7,500.',
        type: 'general',
        channels: { inApp: { sent: true, sentAt: new Date() } },
      },
    ]);

    await seedAttendance(primaryStudent, primaryFaculty, institution._id, device._id);

    const counts = {
      users: await User.countDocuments(),
      institutions: await Institution.countDocuments(),
      students: await Student.countDocuments(),
      faculty: await Faculty.countDocuments(),
      payments: await Payment.countDocuments(),
      renewals: await Renewal.countDocuments(),
      notifications: await Notification.countDocuments(),
      attendance: await StudentAttendance.countDocuments(),
    };

    logger.info('Seed completed successfully!');
    logger.info(`JSON database: ${connectDB.DATA_DIR}`);
    logger.info(`Counts: ${JSON.stringify(counts)}`);
    logger.info('--- Default Credentials ---');
    seedUsers.forEach((u) => logger.info(`${u.role}: ${u.email} / ${u.password}`));
    logger.info('institution_admin: institution@pnmc.com / Inst@123');
    logger.info('institution_admin (Karachi): institution2@pnmc.com / Inst@123');
    logger.info('student: student@pnmc.com / Student@123');
    logger.info('student (renewal due): omar.siddiqui@pnmc.com / Student@123');
    logger.info('faculty: faculty@pnmc.com / Faculty@123');

    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
