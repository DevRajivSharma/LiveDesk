import mongoose from 'mongoose';

/**
 * Room Schema - Stores collaborative workspace state
 *
 * Fields:
 * - roomId: Unique identifier (e.g., "abc-123-def")
 * - code: Current code in Monaco editor (string)
 * - whiteboardData: Serialized Excalidraw canvas state (JSON)
 * - language: Programming language for Monaco (default: 'javascript')
 * - users: Array of connected user objects
 * - createdAt: Timestamp
 * - updatedAt: Last modification timestamp
 */
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
      required: true
    },
    name: {
      type: String,
      default: 'Anonymous'
    },
    color: {
      type: String,
      default: '#6366f1' // Default accent color
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
  }
});

// Index for efficient queries
roomSchema.index({ updatedAt: -1 });

// Virtual for active user count
roomSchema.virtual('activeUsers').get(function() {
  return this.users.length;
});

// Ensure virtuals are included in JSON
roomSchema.set('toJSON', { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

/**
 * Static method to find or create a room
 */
roomSchema.statics.findOrCreate = async function(roomId) {
  let room = await this.findOne({ roomId });
  if (!room) {
    room = await this.create({ roomId });
  }
  return room;
};

/**
 * Method to update code and auto-save
 */
roomSchema.methods.updateCode = async function(newCode, userId) {
  this.code = newCode;
  return await this.save();
};

/**
 * Method to update whiteboard data
 */
roomSchema.methods.updateWhiteboard = async function(whiteboardData, userId) {
  this.whiteboardData = whiteboardData;
  return await this.save();
};

const Room = mongoose.model('Room', roomSchema);

export default Room;