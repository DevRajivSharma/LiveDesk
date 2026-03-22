import dotenv from 'dotenv';
dotenv.config();
console.log('EMAIL_API_URL URL:',process.env.EMAIL_API_URL)
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import Room from './models/Room.js';
import File from './models/File.js';
import authRoutes from './routes/auth.js';
import { verifyToken } from './middleware/auth.js';
import { connectRedis } from './config/redis.js';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

const ALLOWED_ORIGINS = [
  'https://livedesk-nine.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://192.168.1.7:5173'
];

await connectRedis();
// Configuration
const app = express();
const httpServer = createServer(app);

// Socket.io CORS configuration - allow frontend origin
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for whiteboard data

// Routes
app.use('/api/auth', authRoutes);

/**
 * FILE SYSTEM API
 */

// Get all files for a user
app.get('/api/files', verifyToken, async (req, res) => {
  try {
    const files = await File.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Save/Upload a file
app.post('/api/files', verifyToken, async (req, res) => {
  try {
    const { name, type, size, content, roomId, isSnapshot, isBoardSnapshot, isFullSnapshot } = req.body;
    
    // Check if file with same name exists for this user in this room
    let file = await File.findOne({ userId: req.userId, name, roomId });
    
    if (file) {
      // Update existing file
      file.content = content;
      file.size = size;
      file.type = type;
      file.timestamp = new Date();
      await file.save();
    } else {
      // Create new file
      file = await File.create({
        userId: req.userId,
        name, type, size, content, roomId,
        isSnapshot, isBoardSnapshot, isFullSnapshot
      });
    }
    
    res.status(201).json(file);
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// Delete a file
app.delete('/api/files/:fileId', verifyToken, async (req, res) => {
  try {
    const file = await File.findOneAndDelete({ _id: req.params.fileId, userId: req.userId });
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Environment variables
const PORT = process.env.PORT || 3001;
console.log('This is mongoose',process.env.MONGO_URI)
const MONGO_URI = process.env.MONGO_URI ;
const DB_NAME = process.env.DB_NAME ;
// ============================================================================
// DATABASE CONNECTIONz
// ============================================================================

mongoose.connect(`${MONGO_URI}/${DB_NAME}`)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique room ID
 * Format: xxxx-xxxx-xxxx
 */
const generateRoomId = () => {
  return `${uuidv4().slice(0, 4)}-${uuidv4().slice(4, 8)}-${uuidv4().slice(8, 12)}`;
};

/**
 * Generate random user color
 */
const getRandomColor = () => {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// ============================================================================
// REST API ROUTES
// ============================================================================

/**
 * GET /api/room/:roomId
 * Fetch room data for persistence
 */
app.get('/api/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

/**
 * POST /api/room
 * Create a new room
 */
app.post('/api/room', async (req, res) => {
  try {
    const roomId = generateRoomId();
    const room = await Room.create({ roomId });
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

/**
 * DELETE /api/room/:roomId
 * Delete a room (cleanup)
 */
app.delete('/api/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    await Room.findOneAndDelete({ roomId });
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

/**
 * POST /api/execute
 * Execute code
 */
app.post('/api/execute', async (req, res) => {
  try {
    const { code, language, roomId } = req.body;
    console.log(`[Code Execution] Room: ${roomId}, Language: ${language}`);

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    // Supported languages and their execution commands
    const configs = {
      javascript: { ext: 'js', command: 'node' },
      python: { ext: 'py', command: 'python' },
    };

    const config = configs[language];

    if (!config) {
      // Fallback for unsupported languages
      return res.json({
        output: `Execution for ${language} is not yet fully implemented on the server. Coming soon!`,
        exitCode: 0
      });
    }

    // Create a temporary file
    const tempDir = path.join(process.cwd(), 'temp_exec');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const fileName = `exec_${roomId}_${Date.now()}.${config.ext}`;
    const filePath = path.join(tempDir, fileName);

    fs.writeFileSync(filePath, code);

    try {
      // Execute with a timeout of 5 seconds
      const { stdout, stderr } = await execPromise(`${config.command} ${filePath}`, {
        timeout: 5000,
        maxBuffer: 1024 * 1024 // 1MB
      });

      // Cleanup
      fs.unlinkSync(filePath);

      res.json({
        output: stdout + (stderr ? `\nError Output:\n${stderr}` : ''),
        exitCode: 0,
        executionTime: 'N/A'
      });
    } catch (error) {
      // Cleanup on error too
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      res.json({
        output: error.stderr || error.message,
        exitCode: error.code || 1,
        error: error.message
      });
    }

  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ error: 'Code execution failed' });
  }
});

// ============================================================================
// SOCKET.IO REAL-TIME HANDLERS
// ============================================================================

// Store active socket connections
const userSockets = new Map(); // socketId -> { roomId, userId, userName }

/**
 * Socket connection handler
 */
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  /**
   * EVENT: join-room
   * User joins a collaborative room
   */
  socket.on('join-room', async ({ roomId, userName, userId: providedUserId }) => {
    try {
      // Find or create room in database
      let room = await Room.findOne({ roomId });
      
      // Use provided ID or generate one
      const userId = providedUserId || uuidv4();
      const userColor = getRandomColor();
      const user = { 
        id: userId, 
        name: userName , 
        color: userColor, 
        isMuted: true, // Default to muted
        joinedAt: new Date() 
      };

      // Create room if it doesn't exist or assign admin if missing
      if (!room) {
        room = new Room({ 
          roomId, 
          whiteboardData: {}, 
          code: '// Start coding here', 
          language: 'javascript',
          adminId: userId // The person creating the room is the admin
        });
      } else if (!room.adminId) {
        // If room exists but has no admin, this user becomes admin
        room.adminId = userId;
      }

      await room.save();

      // Check if user is already in the users list for this room (prevents duplication)
      const userExists = room.users.some(u => u.id === userId);
      
      if (!userExists) {
        // Add user to room (in-memory + DB)
        room.users.push(user);
        await room.save();

        // Notify others in room ONLY if this is a new unique user
        socket.to(roomId).emit('user-joined', user);
        console.log(`👤 New user ${user.name} joined room ${roomId}`);
      } else {
        console.log(`👤 User ${user.name} reconnected to room ${roomId}`);
      }

      // Check if this socket is already in a room and clean up
      const existingSocketInfo = userSockets.get(socket.id);
      if (existingSocketInfo) {
        if (existingSocketInfo.roomId === roomId) {
          console.log(`👤 Socket ${socket.id} already recorded in room ${roomId}`);
        } else {
          // If in a different room, clean up that one
          await Room.findOneAndUpdate(
            { roomId: existingSocketInfo.roomId },
            { $pull: { users: { id: existingSocketInfo.userId } } }
          );
          socket.leave(existingSocketInfo.roomId);
          socket.to(existingSocketInfo.roomId).emit('user-left', { userId: existingSocketInfo.userId });
        }
      }

      // Join socket room
      socket.join(roomId);
      userSockets.set(socket.id, { roomId, userId, userName: user.name, color: userColor });

      // Send current room state to new user
      socket.emit('room-state', {
        code: room.code,
        language: room.language,
        whiteboardData: room.whiteboardData,
        users: room.users,
        adminId: room.adminId,
        settings: room.settings,
        userId,
        userColor
      });

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  /**
   * EVENT: code-change
   * Monaco editor text changed
   * Real-time broadcast to other users in room
   */
  socket.on('code-change', async ({ roomId, code, language }) => {
    try {
      // Update in-memory socket state
      const userInfo = userSockets.get(socket.id);
      if (!userInfo) return;

      // Broadcast to others in the room (exclude sender)
      socket.to(roomId).emit('code-update', { code, language, userId: userInfo.userId });

      // Debounced save to database (save every 2 seconds if changes occur)
      // In production, use a proper debounce/throttle mechanism
      await Room.findOneAndUpdate(
        { roomId },
        { code, language, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error('Error syncing code:', error);
    }
  });

  /**
   * EVENT: code-complete
   * Code change is complete (cursor moved, etc.)
   * More aggressive save to DB
   */
  socket.on('code-complete', async ({ roomId, code, language }) => {
    try {
      await Room.findOneAndUpdate(
        { roomId },
        { code, language, updatedAt: new Date() }
      );
    } catch (error) {
      console.error('Error saving code:', error);
    }
  });

  // Throttled DB save for whiteboard to keep UI responsive
  const whiteboardSaveTimers = new Map(); // roomId -> timer

  /**
   * EVENT: room-settings-update
   * Admin updated room settings (lock editor, etc.)
   */
  socket.on('room-settings-update', async ({ roomId, settings }) => {
    try {
      await Room.findOneAndUpdate({ roomId }, { settings });
      socket.to(roomId).emit('room-settings-sync', settings);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  });

  /**
   * EVENT: admin-kick-user
   * Admin removed a user from the room
   */
  socket.on('admin-kick-user', ({ roomId, targetUserId }) => {
    io.to(roomId).emit('user-kicked', { targetUserId });
  });

  /**
   * EVENT: admin-terminate-room
   * Admin deleted the entire room
   */
  socket.on('admin-terminate-room', async ({ roomId }) => {
    try {
      await Room.findOneAndDelete({ roomId });
      io.to(roomId).emit('room-terminated');
    } catch (error) {
      console.error('Error terminating room:', error);
    }
  });

  /**
   * EVENT: whiteboard-update
   * Excalidraw canvas elements changed
   * Real-time broadcast to other users
   */
  socket.on('whiteboard-update', async ({ roomId, whiteboardData }) => {
    try {
      // Parse data if it's a string to ensure consistency
      const parsedData = typeof whiteboardData === 'string' ? JSON.parse(whiteboardData) : whiteboardData;

      // 1. BROADCAST IMMEDIATELY (Use consistent object format)
      socket.to(roomId).emit('whiteboard-sync', { whiteboardData: parsedData });

      // 2. THROTTLED DB SAVE
      if (!whiteboardSaveTimers.has(roomId)) {
        const timer = setTimeout(async () => {
          try {
            await Room.findOneAndUpdate(
              { roomId },
              { 
                whiteboardData: parsedData, 
                updatedAt: new Date() 
              }
            );
            whiteboardSaveTimers.delete(roomId);
          } catch (e) {
            console.error('Background DB save error:', e);
          }
        }, 2000);
        whiteboardSaveTimers.set(roomId, timer);
      }
    } catch (error) {
      console.error('Error syncing whiteboard:', error);
    }
  });

  /**
   * EVENT: language-change
   * User changed the programming language
   */
  socket.on('language-change', async ({ roomId, language }) => {
    try {
      await Room.findOneAndUpdate(
        { roomId },
        { language }
      );

      socket.to(roomId).emit('language-update', { language });
    } catch (error) {
      console.error('Error changing language:', error);
    }
  });

  /**
   * EVENT: mic-status-change
   * User toggled their microphone
   */
  socket.on('mic-status-change', async ({ roomId, userId, isMuted }) => {
    try {
      // Update in-memory user list if necessary
      const userInfo = userSockets.get(socket.id);
      if (userInfo) userInfo.isMuted = isMuted;

      // Update database
      await Room.findOneAndUpdate(
        { roomId, 'users.id': userId },
        { $set: { 'users.$.isMuted': isMuted } }
      );

      // Broadcast to others
      socket.to(roomId).emit('mic-status-update', { userId, isMuted });
    } catch (error) {
      console.error('Error syncing mic status:', error);
    }
  });

  /**
   * EVENT: mouse-move
   * Broadcast user cursor position
   */
  socket.on('mouse-move', ({ roomId, x, y }) => {
    const userInfo = userSockets.get(socket.id);
    if (userInfo) {
      socket.to(roomId).emit('cursor-update', {
        userId: userInfo.userId,
        userName: userInfo.userName,
        color: userInfo.color,
        x,
        y
      });
    }
  });

  // ========================================================================
  // FUTURE SCOPE: WEBRTC VOICE/VIDEO SIGNALING
  // ========================================================================

  /**
   * EVENT: webrtc-offer
   * WebRTC signaling - User A wants to call User B
   *
   * Future implementation for voice/video:
   * 1. User A sends offer to signaling server
   * 2. Server forwards to User B
   * 3. User B responds with answer
   * 4. Direct peer connection established
   */
  socket.on('webrtc-offer', ({ roomId, offer, targetUserId, fromUserId }) => {
    console.log(`[WebRTC] Offer from ${fromUserId} to ${targetUserId}`);
    socket.to(roomId).emit('webrtc-offer', { offer, fromUserId, targetUserId });
  });

  /**
   * EVENT: webrtc-answer
   * WebRTC signaling - User B responds to offer
   */
  socket.on('webrtc-answer', ({ roomId, answer, targetUserId, fromUserId }) => {
    console.log(`[WebRTC] Answer from ${fromUserId} to ${targetUserId}`);
    socket.to(roomId).emit('webrtc-answer', { answer, fromUserId, targetUserId });
  });

  /**
   * EVENT: webrtc-ice-candidate
   * WebRTC ICE candidate exchange
   */
  socket.on('webrtc-ice-candidate', ({ roomId, candidate, targetUserId, fromUserId }) => {
    socket.to(roomId).emit('webrtc-ice-candidate', { candidate, fromUserId, targetUserId });
  });

  /**
   * EVENT: webrtc-join-call / webrtc-leave-call
   * Notify others when user starts/stops video call
   */
  socket.on('webrtc-join-call', ({ roomId }) => {
    const userInfo = userSockets.get(socket.id);
    if (userInfo) {
      socket.to(roomId).emit('user-joined-call', {
        userId: userInfo.userId,
        userName: userInfo.userName
      });
    }
  });

  socket.on('webrtc-leave-call', ({ roomId }) => {
    const userInfo = userSockets.get(socket.id);
    if (userInfo) {
      socket.to(roomId).emit('user-left-call', {
        userId: userInfo.userId
      });
    }
  });

  // ========================================================================
  // DISCONNECTION HANDLER
  // ========================================================================

  /**
   * EVENT: disconnect
   * User leaves the application
   */
  socket.on('disconnect', async () => {
    try {
      const userInfo = userSockets.get(socket.id);

      if (userInfo) {
        const { roomId, userId, userName } = userInfo;

        // Check if this user has other active sockets in the same room
        const hasOtherSockets = Array.from(userSockets.entries()).some(
          ([sId, info]) => sId !== socket.id && info.roomId === roomId && info.userId === userId
        );

        if (!hasOtherSockets) {
          // Remove user from room in database ONLY if no other tabs are open
          await Room.findOneAndUpdate(
            { roomId },
            { $pull: { users: { id: userId } } }
          );
          // Notify others in room
          socket.to(roomId).emit('user-left', { userId, userName });
        }

        // Leave socket room
        socket.leave(roomId);
        userSockets.delete(socket.id);

        console.log(`👋 Socket ${socket.id} (${userName}) disconnected from room ${roomId}`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  /**
   * EVENT: leave-room
   * User explicitly leaves a room
   */
  socket.on('leave-room', async ({ roomId }) => {
    try {
      const userInfo = userSockets.get(socket.id);

      if (userInfo) {
        await Room.findOneAndUpdate(
          { roomId },
          { $pull: { users: { id: userInfo.userId } } }
        );

        socket.to(roomId).emit('user-left', {
          userId: userInfo.userId,
          userName: userInfo.userName
        });

        socket.leave(roomId);
        userSockets.delete(socket.id);
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });
});

// ============================================================================
// START SERVER
// ============================================================================

httpServer.listen(PORT,'0.0.0.0', () => {
  
});