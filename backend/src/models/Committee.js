const mongoose = require('mongoose');
const { COMMITTEE_TYPES } = require('../config/constants');

const meetingSchema = new mongoose.Schema(
  {
    title: String,
    scheduledAt: Date,
    location: String,
    agenda: [String],
    minutes: String,
    attendees: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        present: Boolean,
        signedAt: Date,
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
  },
  { _id: true, timestamps: true }
);

const committeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: COMMITTEE_TYPES, required: true },
    description: String,
    chairperson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    meetings: [meetingSchema],
  },
  { timestamps: true }
);

committeeSchema.index({ type: 1 });

module.exports = mongoose.model('Committee', committeeSchema);
