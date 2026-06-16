const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: String, enum: ['approve', 'reject', 'abstain'] },
    comments: String,
    votedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const resolutionSchema = new mongoose.Schema(
  {
    resolutionNumber: { type: String, required: true, unique: true },
    title: String,
    description: String,
    meetingDate: Date,
    decision: String,
    votes: [voteSchema],
    votingResults: {
      approve: { type: Number, default: 0 },
      reject: { type: Number, default: 0 },
      abstain: { type: Number, default: 0 },
    },
    relatedEntity: {
      entityType: String,
      entityId: mongoose.Schema.Types.ObjectId,
    },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    status: {
      type: String,
      enum: ['draft', 'approved', 'published'],
      default: 'draft',
    },
  },
  { _id: true, timestamps: true }
);

const councilMeetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    meetingDate: { type: Date, required: true },
    location: String,
    agenda: [String],
    minutes: String,
    attendees: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        present: Boolean,
      },
    ],
    resolutions: [resolutionSchema],
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    chairedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

councilMeetingSchema.index({ meetingDate: -1 });

module.exports = mongoose.model('CouncilMeeting', councilMeetingSchema);
