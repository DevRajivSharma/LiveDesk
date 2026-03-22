import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  roomId: {
    type: String,
    default: 'personal'
  },
  isSnapshot: {
    type: Boolean,
    default: false
  },
  isBoardSnapshot: {
    type: Boolean,
    default: false
  },
  isFullSnapshot: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('File', fileSchema);
