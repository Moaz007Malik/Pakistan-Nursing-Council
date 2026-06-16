const mongoose = require('mongoose');

const recordingLogSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['snapshot', 'recording_start', 'recording_stop'] },
    capturedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fileUrl: String,
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    timestamp: { type: Date, default: Date.now },
    duration: Number,
  },
  { _id: true }
);

const cameraStreamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    location: {
      type: String,
      enum: ['classroom', 'lab', 'examination_hall', 'nursing_practice', 'other'],
      required: true,
    },
    locationDetail: String,
    streamUrl: String,
    rtspUrl: String,
    webrtcEndpoint: String,
    isActive: { type: Boolean, default: true },
    isLive: { type: Boolean, default: false },
    lastActiveAt: Date,
    recordingLogs: [recordingLogSchema],
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

cameraStreamSchema.index({ institution: 1, isActive: 1 });

module.exports = mongoose.model('CameraStream', cameraStreamSchema);
