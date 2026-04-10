import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  code: {
    type: String,
    default: '// Start coding here...\nconsole.log("Hello, LiveDesk!");'
  },
  language: {
    type: String,
    default: 'javascript',
    enum: ['javascript', 'python', 'java', 'cpp', 'typescript', 'html', 'css', 'json']
  },
  whiteboardData: {
    type: mongoose.Schema.Types.Mixed, // Stores Excalidraw JSON
    default: {}
  },
  users: [{
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      default: 'Anonymous'
    },
    color: {
      type: String,
      default: '#6366f1' // Default accent color
    },
    isMuted: {
      type: Boolean,
      default: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  adminId: {
    type: String,
    required: false
  },
  settings: {
    lockEditor: { type: Boolean, default: false },
    lockWhiteboard: { type: Boolean, default: false },
    lockMic: { type: Boolean, default: false },
    muteAll: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from creation
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  isEnded: {
    type: Boolean,
    default: false
  }
});

// Index for finding expired rooms
roomSchema.index({ expiresAt: 1 });
roomSchema.index({ lastActivityAt: -1 });
roomSchema.index({ isEnded: 1 });

roomSchema.virtual('activeUsers').get(function() {
  return this.users.length;
});

roomSchema.set('toJSON', { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

roomSchema.statics.findOrCreate = async function(roomId) {
  let room = await this.findOne({ roomId });
  if (!room) {
    room = await this.create({ roomId });
  }
  return room;
};

roomSchema.methods.updateCode = async function(newCode, userId) {
  this.code = newCode;
  this.lastActivityAt = new Date();
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Extend by 24 hours
  return await this.save();
};

roomSchema.methods.updateWhiteboard = async function(whiteboardData, userId) {
  this.whiteboardData = whiteboardData;
  this.lastActivityAt = new Date();
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return await this.save();
};

// Method to update activity timestamp
roomSchema.methods.updateActivity = async function() {
  this.lastActivityAt = new Date();
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return await this.save();
};

// Method to end a room
roomSchema.methods.endRoom = async function() {
  this.isEnded = true;
  this.users = [];
  return await this.save();
};

// Static method to clean up expired rooms
roomSchema.statics.cleanupExpiredRooms = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
    isEnded: false
  });
  if (result.deletedCount > 0) {
    console.log(`[Room Cleanup] Deleted ${result.deletedCount} expired rooms`);
  }
  return result;
};

// Static method to end rooms with no users
roomSchema.statics.endInactiveRooms = async function() {
  // Rooms with no users that haven't been updated in 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const result = await this.updateMany(
    {
      users: { $size: 0 },
      lastActivityAt: { $lt: oneHourAgo },
      isEnded: false
    },
    { $set: { isEnded: true } }
  );
  return result;
};

const Room = mongoose.model('Room', roomSchema);

export default Room;