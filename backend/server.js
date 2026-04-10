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
import { connectRedis, client as redis } from './config/redis.js';
import jwt from 'jsonwebtoken';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

const ALLOWED_ORIGINS = [
  'https://livedesk-live.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://192.168.1.7:5173'
];

// Security: Rate limiting map (simple in-memory implementation)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Max requests per window

const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  const record = rateLimitMap.get(ip);

  if (now > record.resetTime) {
    // Reset the counter
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }

  record.count++;
  rateLimitMap.set(ip, record);
  next();
};

// Security: Input sanitization
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj) return obj;
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS vectors
        obj[key] = obj[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      }
    }
    return obj;
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
};

await connectRedis();

// Room cleanup scheduler - runs every hour to clean up expired rooms
setInterval(async () => {
  try {
    await Room.cleanupExpiredRooms();
    await Room.endInactiveRooms();
  } catch (error) {
    console.error('[Room Cleanup] Error cleaning up rooms:', error);
  }
}, 60 * 60 * 1000); // Every hour

// Initial cleanup on server start
Room.cleanupExpiredRooms().catch(err => console.error('[Room Cleanup] Initial cleanup failed:', err));

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security middleware
app.use(rateLimitMiddleware);
app.use(sanitizeInput);

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss: http: https:;");
  next();
});

app.use(express.json({ limit: '50mb' })); // Increased limit for whiteboard data

app.use('/api/auth', authRoutes);

app.get('/api/files', verifyToken, async (req, res) => {
  try {
    const files = await File.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

app.post('/api/files', verifyToken, async (req, res) => {
  try {
    const { name, type, size, content, roomId, isSnapshot, isBoardSnapshot, isFullSnapshot } = req.body;
    
    let file = await File.findOne({ userId: req.userId, name, roomId });
    
    if (file) {
      file.content = content;
      file.size = size;
      file.type = type;
      file.timestamp = new Date();
      await file.save();
    } else {
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

const PORT = process.env.PORT || 3001;
console.log('This is mongoose',process.env.MONGO_URI)
const MONGO_URI = process.env.MONGO_URI ;
const DB_NAME = process.env.DB_NAME ;

mongoose.connect(`${MONGO_URI}/${DB_NAME}`)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const generateRoomId = () => {
  return `${uuidv4().slice(0, 4)}-${uuidv4().slice(4, 8)}-${uuidv4().slice(8, 12)}`;
};

const getRandomColor = () => {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

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

app.post('/api/execute', async (req, res) => {
  try {
    const { code, language, roomId } = req.body;
    console.log(`[Code Execution] Room: ${roomId}, Language: ${language}`);

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    const configs = {
      javascript: { ext: 'js', command: 'node' },
      python: { ext: 'py', command: 'python' },
    };

    const config = configs[language];

    if (!config) {
      return res.json({
        output: `Execution for ${language} is not yet fully implemented on the server. Coming soon!`,
        exitCode: 0
      });
    }

    const tempDir = path.join(process.cwd(), 'temp_exec');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const fileName = `exec_${roomId}_${Date.now()}.${config.ext}`;
    const filePath = path.join(tempDir, fileName);

    fs.writeFileSync(filePath, code);

    try {
      const { stdout, stderr } = await execPromise(`${config.command} ${filePath}`, {
        timeout: 5000,
        maxBuffer: 1024 * 1024 // 1MB
      });

      fs.unlinkSync(filePath);

      res.json({
        output: stdout + (stderr ? `\nError Output:\n${stderr}` : ''),
        exitCode: 0,
        executionTime: 'N/A'
      });
    } catch (error) {
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

const userSockets = new Map(); // socketId -> { roomId, userId, userName }

io.on('connection', async (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Verify session on connection
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    console.log(`🔌 Socket ${socket.id} rejected: No token provided`);
    socket.emit('error', { message: 'Authentication required' });
    socket.disconnect();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'livedesk_secret');
    const { id: userId, sessionId } = decoded;

    if (!sessionId) {
      console.log(`🔌 Socket ${socket.id} rejected: No session ID`);
      socket.emit('error', { message: 'Invalid token. Please login again.' });
      socket.disconnect();
      return;
    }

    const sessionData = await redis.get(`session_${sessionId}`);
    if (!sessionData) {
      console.log(`🔌 Socket ${socket.id} rejected: Session expired`);
      socket.emit('error', { message: 'Session expired. Please login again.' });
      socket.disconnect();
      return;
    }

    const session = JSON.parse(sessionData);
    if (session.userId !== userId) {
      console.log(`🔌 Socket ${socket.id} rejected: Invalid session`);
      socket.emit('error', { message: 'Invalid session.' });
      socket.disconnect();
      return;
    }

    // Store verified user info in socket
    socket.data.userId = userId;
    socket.data.sessionId = sessionId;
    console.log(`🔌 Socket ${socket.id} authenticated for user ${userId}`);

  } catch (err) {
    console.log(`🔌 Socket ${socket.id} rejected: Invalid token - ${err.message}`);
    socket.emit('error', { message: 'Invalid token.' });
    socket.disconnect();
    return;
  }

  socket.on('join-room', async ({ roomId, userName, userId: providedUserId }) => {
    try {
      let room = await Room.findOne({ roomId });
      
      const userId = providedUserId || uuidv4();
      const userColor = getRandomColor();
      const user = { 
        id: userId, 
        name: userName , 
        color: userColor, 
        isMuted: true, // Default to muted
        joinedAt: new Date() 
      };

      if (!room) {
        room = new Room({ 
          roomId, 
          whiteboardData: {}, 
          code: '// Start coding here', 
          language: 'javascript',
          adminId: userId // The person creating the room is the admin
        });
      } else if (!room.adminId) {
        room.adminId = userId;
      }

      await room.save();

      // Update room activity when user joins
      await Room.findOneAndUpdate(
        { roomId },
        {
          lastActivityAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isEnded: false
        }
      );

      const userExists = room.users.some(u => u.id === userId);
      
      if (!userExists) {
        room.users.push(user);
        await room.save();

        socket.to(roomId).emit('user-joined', user);
        console.log(`👤 New user ${user.name} joined room ${roomId}`);
      } else {
        console.log(`👤 User ${user.name} reconnected to room ${roomId}`);
      }

      const existingSocketInfo = userSockets.get(socket.id);
      if (existingSocketInfo) {
        if (existingSocketInfo.roomId === roomId) {
          console.log(`👤 Socket ${socket.id} already recorded in room ${roomId}`);
        } else {
          await Room.findOneAndUpdate(
            { roomId: existingSocketInfo.roomId },
            { $pull: { users: { id: existingSocketInfo.userId } } }
          );
          socket.leave(existingSocketInfo.roomId);
          socket.to(existingSocketInfo.roomId).emit('user-left', { userId: existingSocketInfo.userId });
        }
      }

      socket.join(roomId);
      userSockets.set(socket.id, { roomId, userId, userName: user.name, color: userColor });

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

  
  socket.on('code-change', async ({ roomId, code, language }) => {
    try {
      const userInfo = userSockets.get(socket.id);
      if (!userInfo) return;

      socket.to(roomId).emit('code-update', { code, language, userId: userInfo.userId });

      await Room.findOneAndUpdate(
        { roomId },
        { code, language, updatedAt: new Date(), lastActivityAt: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error('Error syncing code:', error);
    }
  });

  
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

  const whiteboardSaveTimers = new Map(); // roomId -> timer

  
  socket.on('room-settings-update', async ({ roomId, settings }) => {
    try {
      await Room.findOneAndUpdate({ roomId }, { settings });
      socket.to(roomId).emit('room-settings-sync', settings);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  });

  
  socket.on('admin-kick-user', ({ roomId, targetUserId }) => {
    io.to(roomId).emit('user-kicked', { targetUserId });
  });

  
  socket.on('admin-terminate-room', async ({ roomId }) => {
    try {
      // Mark room as ended instead of deleting
      await Room.findOneAndUpdate(
        { roomId },
        { isEnded: true, users: [] }
      );
      io.to(roomId).emit('room-terminated');
    } catch (error) {
      console.error('Error terminating room:', error);
    }
  });

  
  socket.on('whiteboard-update', async ({ roomId, whiteboardData }) => {
    try {
      const parsedData = typeof whiteboardData === 'string' ? JSON.parse(whiteboardData) : whiteboardData;

      socket.to(roomId).emit('whiteboard-sync', { whiteboardData: parsedData });

      if (!whiteboardSaveTimers.has(roomId)) {
        const timer = setTimeout(async () => {
          try {
            await Room.findOneAndUpdate(
              { roomId },
              {
                whiteboardData: parsedData,
                updatedAt: new Date(),
                lastActivityAt: new Date()
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

  
  socket.on('mic-status-change', async ({ roomId, userId, isMuted }) => {
    try {
      const userInfo = userSockets.get(socket.id);
      if (userInfo) userInfo.isMuted = isMuted;

      await Room.findOneAndUpdate(
        { roomId, 'users.id': userId },
        { $set: { 'users.$.isMuted': isMuted } }
      );

      socket.to(roomId).emit('mic-status-update', { userId, isMuted });
    } catch (error) {
      console.error('Error syncing mic status:', error);
    }
  });

  
  socket.on('speaking-state-change', ({ roomId, userId, isSpeaking }) => {
    socket.to(roomId).emit('speaking-update', { userId, isSpeaking });
  });

  
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

  
  socket.on('webrtc-offer', ({ roomId, offer, targetUserId, fromUserId }) => {
    console.log(`[WebRTC] Offer: ${fromUserId} -> ${targetUserId}`);
    
    for (const [sId, info] of userSockets.entries()) {
      if (info.userId === targetUserId && info.roomId === roomId) {
        io.to(sId).emit('webrtc-offer', { offer, fromUserId, targetUserId });
        return;
      }
    }
  });

  
  socket.on('webrtc-answer', ({ roomId, answer, targetUserId, fromUserId }) => {
    console.log(`[WebRTC] Answer: ${fromUserId} -> ${targetUserId}`);
    
    for (const [sId, info] of userSockets.entries()) {
      if (info.userId === targetUserId && info.roomId === roomId) {
        io.to(sId).emit('webrtc-answer', { answer, fromUserId, targetUserId });
        return;
      }
    }
  });

  
  socket.on('webrtc-ice-candidate', ({ roomId, candidate, targetUserId, fromUserId }) => {
    for (const [sId, info] of userSockets.entries()) {
      if (info.userId === targetUserId && info.roomId === roomId) {
        io.to(sId).emit('webrtc-ice-candidate', { candidate, fromUserId, targetUserId });
        return;
      }
    }
  });

  
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

  
  socket.on('disconnect', async () => {
    try {
      const userInfo = userSockets.get(socket.id);

      if (userInfo) {
        const { roomId, userId, userName } = userInfo;

        const hasOtherSockets = Array.from(userSockets.entries()).some(
          ([sId, info]) => sId !== socket.id && info.roomId === roomId && info.userId === userId
        );

        if (!hasOtherSockets) {
          await Room.findOneAndUpdate(
            { roomId },
            {
              $pull: { users: { id: userId } },
              lastActivityAt: new Date()
            }
          );
          socket.to(roomId).emit('user-left', { userId, userName });
        }

        socket.leave(roomId);
        userSockets.delete(socket.id);

        console.log(`👋 Socket ${socket.id} (${userName}) disconnected from room ${roomId}`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  
  socket.on('leave-room', async ({ roomId }) => {
    try {
      const userInfo = userSockets.get(socket.id);

      if (userInfo) {
        await Room.findOneAndUpdate(
          { roomId },
          {
            $pull: { users: { id: userInfo.userId } },
            lastActivityAt: new Date()
          }
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

httpServer.listen(PORT,'0.0.0.0', () => {
  
});