const {
  BiometricDevice,
  BiometricEvent,
  StudentAttendance,
  FacultyAttendance,
  Student,
  Faculty,
} = require('../models');
const logger = require('../utils/logger');

class BiometricVendorAdapter {
  async pullLogs(device, fromDate, toDate) {
    throw new Error('pullLogs() must be implemented');
  }
  parseLog(rawLog) {
    throw new Error('parseLog() must be implemented');
  }
}

class ZKTecoAdapter extends BiometricVendorAdapter {
  async pullLogs(device, fromDate, toDate) {
    // ZKTeco SDK/API integration placeholder
    logger.info(`Pulling ZKTeco logs from ${device.deviceId}`);
    return [];
  }
  parseLog(rawLog) {
    return {
      deviceUserId: rawLog.userId || rawLog.pin,
      timestamp: new Date(rawLog.timestamp || rawLog.time),
      eventType: rawLog.state === 1 ? 'check_in' : 'check_out',
    };
  }
}

class ESSLAdapter extends BiometricVendorAdapter {
  async pullLogs(device, fromDate, toDate) {
    logger.info(`Pulling eSSL logs from ${device.deviceId}`);
    return [];
  }
  parseLog(rawLog) {
    return {
      deviceUserId: rawLog.EmployeeCode,
      timestamp: new Date(rawLog.LogDate),
      eventType: rawLog.Direction === 'IN' ? 'check_in' : 'check_out',
    };
  }
}

class SupremaAdapter extends BiometricVendorAdapter {
  async pullLogs(device, fromDate, toDate) {
    logger.info(`Pulling Suprema logs from ${device.deviceId}`);
    return [];
  }
  parseLog(rawLog) {
    return {
      deviceUserId: rawLog.user_id,
      timestamp: new Date(rawLog.datetime),
      eventType: rawLog.type === 1 ? 'check_in' : 'check_out',
    };
  }
}

class BiometricService {
  constructor() {
    this.adapters = {
      zkteco: new ZKTecoAdapter(),
      essl: new ESSLAdapter(),
      suprema: new SupremaAdapter(),
    };
  }

  async syncDevice(deviceId, fromDate, toDate) {
    const device = await BiometricDevice.findOne({ deviceId }).populate('institution');
    if (!device) throw new Error('Device not found');

    const adapter = this.adapters[device.vendor];
    const rawLogs = await adapter.pullLogs(device, fromDate, toDate);
    const events = [];

    for (const raw of rawLogs) {
      const parsed = adapter.parseLog(raw);
      const mapping = device.userMappings.find(
        (m) => m.deviceUserId === parsed.deviceUserId && m.isActive
      );

      const event = await BiometricEvent.create({
        device: device._id,
        deviceId: device.deviceId,
        deviceUserId: parsed.deviceUserId,
        entityType: mapping?.entityType || 'unknown',
        entityId: mapping?.entityId,
        timestamp: parsed.timestamp,
        eventType: parsed.eventType,
        rawData: raw,
      });
      events.push(event);
    }

    device.lastSyncAt = new Date();
    await device.save();

    return events;
  }

  async processEvent(eventId) {
    const event = await BiometricEvent.findById(eventId).populate('device');
    if (!event || event.processed) return;

    if (event.entityType === 'student' && event.entityId) {
      await this.recordStudentAttendance(event);
    } else if (event.entityType === 'faculty' && event.entityId) {
      await this.recordFacultyAttendance(event);
    }

    event.processed = true;
    event.processedAt = new Date();
    await event.save();
  }

  async recordStudentAttendance(event) {
    const student = await Student.findById(event.entityId);
    if (!student) return;

    const date = new Date(event.timestamp);
    date.setHours(0, 0, 0, 0);

    const status = event.eventType === 'check_in' ? 'present' : 'present';
    const update = event.eventType === 'check_in'
      ? { checkIn: event.timestamp, status }
      : { checkOut: event.timestamp };

    await StudentAttendance.findOneAndUpdate(
      { student: event.entityId, date },
      {
        $set: {
          institution: student.institution,
          source: 'biometric',
          biometricDevice: event.device._id,
          deviceUserId: event.deviceUserId,
          ...update,
        },
      },
      { upsert: true, new: true }
    );
  }

  async recordFacultyAttendance(event) {
    const faculty = await Faculty.findById(event.entityId);
    if (!faculty) return;

    const date = new Date(event.timestamp);
    date.setHours(0, 0, 0, 0);

    const update = event.eventType === 'check_in'
      ? { checkIn: event.timestamp, status: 'present' }
      : { checkOut: event.timestamp };

    await FacultyAttendance.findOneAndUpdate(
      { faculty: event.entityId, date },
      {
        $set: {
          institution: faculty.institution,
          source: 'biometric',
          biometricDevice: event.device._id,
          deviceUserId: event.deviceUserId,
          ...update,
        },
      },
      { upsert: true, new: true }
    );
  }

  async mapUser(deviceId, deviceUserId, entityType, entityId) {
    const device = await BiometricDevice.findOne({ deviceId });
    if (!device) throw new Error('Device not found');

    device.userMappings.push({ deviceUserId, entityType, entityId });
    await device.save();

    if (entityType === 'student') {
      await Student.findByIdAndUpdate(entityId, { biometricId: deviceUserId });
    } else {
      await Faculty.findByIdAndUpdate(entityId, { biometricId: deviceUserId });
    }

    return device;
  }

  async receiveRealtimeEvent(deviceId, payload) {
    const device = await BiometricDevice.findOne({ deviceId });
    if (!device) return;

    const adapter = this.adapters[device.vendor];
    const parsed = adapter.parseLog(payload);
    const mapping = device.userMappings.find(
      (m) => m.deviceUserId === parsed.deviceUserId && m.isActive
    );

    const event = await BiometricEvent.create({
      device: device._id,
      deviceId,
      deviceUserId: parsed.deviceUserId,
      entityType: mapping?.entityType || 'unknown',
      entityId: mapping?.entityId,
      timestamp: parsed.timestamp,
      eventType: parsed.eventType,
      rawData: payload,
    });

    await this.processEvent(event._id);
    return event;
  }
}

module.exports = new BiometricService();
