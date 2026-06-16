const nodemailer = require('nodemailer');
const config = require('../config');
const { Notification } = require('../models');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    if (config.notification.smtp.host) {
      this.transporter = nodemailer.createTransport({
        host: config.notification.smtp.host,
        port: config.notification.smtp.port,
        auth: {
          user: config.notification.smtp.user,
          pass: config.notification.smtp.pass,
        },
      });
    }
  }

  async send({ recipient, title, message, type, channels = ['inApp'], relatedEntity, metadata }) {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      relatedEntity,
      metadata,
      channels: {
        inApp: { sent: channels.includes('inApp'), sentAt: channels.includes('inApp') ? new Date() : undefined },
        email: { sent: false },
        sms: { sent: false },
        whatsapp: { sent: false },
      },
    });

    const promises = [];

    if (channels.includes('email')) {
      promises.push(this.sendEmail(recipient, title, message, notification));
    }
    if (channels.includes('sms')) {
      promises.push(this.sendSMS(recipient, message, notification));
    }
    if (channels.includes('whatsapp')) {
      promises.push(this.sendWhatsApp(recipient, message, notification));
    }

    await Promise.allSettled(promises);
    return notification;
  }

  async sendEmail(recipientId, title, message, notification) {
    try {
      const { User } = require('../models');
      const user = await User.findById(recipientId);
      if (!user?.email || !this.transporter) return;

      await this.transporter.sendMail({
        from: config.notification.smtp.user,
        to: user.email,
        subject: title,
        html: `<div style="font-family:Arial,sans-serif"><h2>${title}</h2><p>${message}</p></div>`,
      });

      notification.channels.email = { sent: true, sentAt: new Date() };
      await notification.save();
    } catch (err) {
      logger.error('Email send failed:', err.message);
      notification.channels.email = { sent: false, error: err.message };
      await notification.save();
    }
  }

  async sendSMS(recipientId, message, notification) {
    try {
      if (!config.notification.smsApiKey) return;
      // SMS API integration placeholder
      notification.channels.sms = { sent: true, sentAt: new Date() };
      await notification.save();
    } catch (err) {
      notification.channels.sms = { sent: false, error: err.message };
      await notification.save();
    }
  }

  async sendWhatsApp(recipientId, message, notification) {
    try {
      if (!config.notification.whatsappApiKey) return;
      // WhatsApp API integration placeholder
      notification.channels.whatsapp = { sent: true, sentAt: new Date() };
      await notification.save();
    } catch (err) {
      notification.channels.whatsapp = { sent: false, error: err.message };
      await notification.save();
    }
  }

  async notifyApproval(recipient, entityType, entityName) {
    return this.send({
      recipient,
      title: 'Application Approved',
      message: `Your ${entityType} application for ${entityName} has been approved.`,
      type: 'approval',
      channels: ['inApp', 'email'],
    });
  }

  async notifyRejection(recipient, entityType, reason) {
    return this.send({
      recipient,
      title: 'Application Rejected',
      message: `Your ${entityType} application has been rejected. Reason: ${reason}`,
      type: 'rejection',
      channels: ['inApp', 'email'],
    });
  }

  async notifyRenewalDue(recipient, entityType, dueDate) {
    return this.send({
      recipient,
      title: 'Renewal Due',
      message: `Your ${entityType} registration renewal is due on ${dueDate}. Please renew to avoid expiration.`,
      type: 'renewal_due',
      channels: ['inApp', 'email', 'sms'],
    });
  }

  async notifyAttendanceWarning(recipient, percentage) {
    return this.send({
      recipient,
      title: 'Attendance Warning',
      message: `Your attendance is at ${percentage}%. ${percentage < 60 ? 'You are not eligible for exams.' : 'Please improve your attendance.'}`,
      type: 'attendance_warning',
      channels: ['inApp', 'email'],
    });
  }
}

module.exports = new NotificationService();
