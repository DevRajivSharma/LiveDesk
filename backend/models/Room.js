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
  }
});

roomSchema.index({ updatedAt: -1 });

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
  return await this.save();
};

roomSchema.methods.updateWhiteboard = async function(whiteboardData, userId) {
  this.whiteboardData = whiteboardData;
  return await this.save();
};

const Room = mongoose.model('Room', roomSchema);

export default Room;