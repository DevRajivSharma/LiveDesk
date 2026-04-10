import jwt from 'jsonwebtoken';
import { client as redis } from '../config/redis.js';

// Enhanced token verification that also checks session validity
// This is now the default - all routes must verify sessions
export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'livedesk_secret');
    const { id: userId, sessionId } = decoded;

    // Check if session exists in Redis (required for security)
    if (!sessionId) {
      // No session ID in token - reject it (old token before session implementation)
      return res.status(401).json({ message: 'Invalid token. Please login again.' });
    }

    const sessionData = await redis.get(`session_${sessionId}`);
    if (!sessionData) {
      return res.status(401).json({ message: 'Session expired. Another login detected. Please login again.' });
    }

    const session = JSON.parse(sessionData);
    // Verify session belongs to the same user
    if (session.userId !== userId) {
      return res.status(401).json({ message: 'Invalid session.' });
    }

    req.userId = userId;
    req.sessionId = sessionId;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Keep verifyTokenWithSession as alias for backwards compatibility
export const verifyTokenWithSession = verifyToken;