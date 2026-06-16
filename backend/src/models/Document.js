const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: String,
    size: Number,
    storageKey: { type: String, required: true },
    storageProvider: { type: String, enum: ['minio', 's3'], default: 'minio' },
    bucket: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
    category: {
      type: String,
      enum: [
        'registration', 'ownership', 'affidavit', 'accreditation',
        'infrastructure', 'mou', 'building', 'cnic', 'certificate',
        'degree', 'license', 'salary_slip', 'inspection_photo',
        'inspection_video', 'renewal', 'resolution', 'other',
      ],
      default: 'other',
    },
    isEncrypted: { type: Boolean, default: false },
    encryptionKey: String,
    checksum: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ institution: 1, category: 1 });

module.exports = mongoose.model('Document', documentSchema);
