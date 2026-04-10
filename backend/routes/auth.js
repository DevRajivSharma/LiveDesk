import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { client as redis } from '../config/redis.js';
import { sendOTP, sendResetLink } from '../utils/mailer.js';
import crypto from 'crypto';
import { verifyToken, verifyTokenWithSession } from '../middleware/auth.js';
import axios from 'axios';

const router = express.Router();

const getUserPayload = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  authProvider: user.authProvider || 'local',
  authProviders: Array.isArray(user.authProviders) ? user.authProviders : [user.authProvider || 'local']
});

const ensureProviderLinked = (user, provider) => {
  if (!Array.isArray(user.authProviders) || user.authProviders.length === 0) {
    user.authProviders = [user.authProvider || 'local'];
  }
  if (!user.authProviders.includes(provider)) {
    user.authProviders.push(provider);
  }
};

const getOAuthCallbackUrl = (req, provider) => {
  const envKey = provider === 'google' ? 'GOOGLE_CALLBACK_URL' : 'GITHUB_CALLBACK_URL';
  let callbackUrl = (process.env[envKey] || '').trim();

  // Handle malformed env values like "GOOGLE_CALLBACK_URL=http://..."
  if (callbackUrl.includes('=')) {
    callbackUrl = callbackUrl.substring(callbackUrl.lastIndexOf('=') + 1).trim();
  }

  if (callbackUrl.startsWith('http://') || callbackUrl.startsWith('https://')) {
    return callbackUrl.replace('://localhost:3001/auth/', '://localhost:3001/api/auth/');
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${protocol}://${req.get('host')}/api/auth/${provider}/callback`;
};

const getFrontendBaseUrl = () => {
  const raw = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
  return raw.replace(/\/+$/, '');
};

const createSessionToken = async (user) => {
  const sessionId = generateSessionId();
  const sessionData = {
    userId: user._id.toString(),
    email: user.email,
    createdAt: Date.now()
  };

  await redis.set(`session_${sessionId}`, JSON.stringify(sessionData), { EX: 7 * 24 * 60 * 60 });

  // Invalidate any existing sessions (single session policy)
  const existingSessions = await redis.get(`user_sessions_${user._id}`);
  if (existingSessions) {
    const sessions = JSON.parse(existingSessions);
    for (const oldSessionId of sessions) {
      await redis.del(`session_${oldSessionId}`);
    }
  }
  await redis.set(`user_sessions_${user._id}`, JSON.stringify([sessionId]), { EX: 7 * 24 * 60 * 60 });

  const token = jwt.sign(
    { id: user._id, sessionId },
    process.env.JWT_SECRET || 'livedesk_secret',
    { expiresIn: '7d' }
  );

  return token;
};

// GitHub OAuth
router.get('/github', (req, res) => {
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = getOAuthCallbackUrl(req, 'github');
  const frontendUrl = getFrontendBaseUrl();

  if (!githubClientId) {
    return res.status(500).json({ message: 'GitHub OAuth not configured' });
  }

  const scope = 'user:email';
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${scope}`;

  res.redirect(redirectUrl);
});

router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  const frontendUrl = getFrontendBaseUrl();
  const callbackUrl = getOAuthCallbackUrl(req, 'github');

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=github_auth_failed`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl
    }, {
      headers: {
        Accept: 'application/json'
      }
    });

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res.redirect(`${frontendUrl}/login?error=github_token_failed`);
    }

    // Get user info from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const githubUser = userResponse.data;
    const githubId = String(githubUser.id);

    // Get user email (may need separate request)
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const primaryEmail = emailResponse.data.find(e => e.primary);
      email = primaryEmail?.email;
    }

    if (!email) {
      return res.redirect(`${frontendUrl}/login?error=github_email_required`);
    }

    email = email.toLowerCase();

    // Find or create user
    let user = await User.findOne({ githubId });

    if (!user) {
      // Check if user exists with same email
      user = await User.findOne({ email });

      if (user) {
        // Link GitHub to existing account
        user.githubId = githubId;
        ensureProviderLinked(user, 'github');
        if (!user.authProvider || user.authProvider === 'local') user.authProvider = 'github';
        await user.save();
      } else {
        // Create new user
        user = new User({
          username: githubUser.login,
          email,
          password: crypto.randomBytes(20).toString('hex'), // Random password for OAuth users
          isVerified: true,
          githubId,
          authProvider: 'github',
          authProviders: ['github'],
          avatarColor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
        });
        await user.save();
      }
    }

    const token = await createSessionToken(user);

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/oauth/callback?token=${token}`);
  } catch (err) {
    console.error('GitHub OAuth error:', err.response?.data || err.message);
    res.redirect(`${frontendUrl}/login?error=github_auth_failed`);
  }
});

// Google OAuth
router.get('/google', (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl = getOAuthCallbackUrl(req, 'google');
  const frontendUrl = getFrontendBaseUrl();

  if (!googleClientId) {
    return res.status(500).json({ message: 'Google OAuth not configured' });
  }

  const scope = 'email profile';
  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  res.redirect(redirectUrl);
});

router.get('/google/callback', async (req, res) => {
  const rawQuery = req.originalUrl.includes('?') ? req.originalUrl.split('?')[1] : '';
  const rawCode = rawQuery ? new URLSearchParams(rawQuery).get('code') : null;
  const code = rawCode || req.query.code;
  const frontendUrl = getFrontendBaseUrl();
  const callbackUrl = getOAuthCallbackUrl(req, 'google');

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }

  try {
    // Exchange auth code using form-encoded payload (Google OAuth requirement)
    const normalizedCode = String(code).trim().replace(/ /g, '+');
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code: normalizedCode,
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl
    });
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res.redirect(`${frontendUrl}/login?error=google_token_failed`);
    }

    // Get user info from Google
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const googleUser = userResponse.data;
    const googleId = String(googleUser.id);
    const email = googleUser.email.toLowerCase();

    if (!email) {
      return res.redirect(`${frontendUrl}/login?error=google_email_required`);
    }

    // Find or create user
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists with same email
      user = await User.findOne({ email });

      if (user) {
        // Link Google to existing account
        user.googleId = googleId;
        ensureProviderLinked(user, 'google');
        if (!user.authProvider || user.authProvider === 'local') user.authProvider = 'google';
        await user.save();
      } else {
        // Create new user
        user = new User({
          username: googleUser.name || googleUser.email.split('@')[0],
          email,
          password: crypto.randomBytes(20).toString('hex'), // Random password for OAuth users
          isVerified: true,
          googleId,
          authProvider: 'google',
          authProviders: ['google'],
          avatarColor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
        });
        await user.save();
      }
    }

    const token = await createSessionToken(user);

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/oauth/callback?token=${token}`);
  } catch (err) {
    console.error('Google OAuth error:', err.response?.data || err.message);
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 chars'),
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password } = req.body;

  // Sanitize inputs
  const sanitizedEmail = email.toLowerCase().trim();
  const sanitizedUsername = username.trim();

  try {
    let user = await User.findOne({ $or: [{ email: sanitizedEmail }, { username: sanitizedUsername }] });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const otp = generateOTP();
    const registrationData = { username: sanitizedUsername, email: sanitizedEmail, password, otp };

    await redis.set(`reg_${sanitizedEmail}`, JSON.stringify(registrationData), { EX: 600 });

    const emailSent = await sendOTP(sanitizedEmail, otp);
    if (!emailSent) return res.status(500).json({ message: 'Error sending verification email' });

    res.status(200).json({ message: 'OTP sent to your email. Please verify.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const dataStr = await redis.get(`reg_${email}`);
    if (!dataStr) return res.status(400).json({ message: 'OTP expired or not found' });

    const data = JSON.parse(dataStr);
    if (data.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    const user = new User({
      username: data.username,
      email: data.email,
      password: data.password,
      isVerified: true,
      authProvider: 'local',
      authProviders: ['local']
    });

    await user.save();

    await redis.del(`reg_${email}`);

    const token = await createSessionToken(user);

    res.status(201).json({ 
      token, 
      user: getUserPayload(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// Generate a unique session ID
const generateSessionId = () => crypto.randomBytes(32).toString('hex');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Password minimum length check
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const hasLocalAuth = (Array.isArray(user.authProviders) && user.authProviders.includes('local')) || user.authProvider === 'local';
    if (!hasLocalAuth) {
      return res.status(400).json({ message: `This account uses ${user.authProvider?.toUpperCase() || 'OAUTH'} login. Please continue with social sign in.` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = await createSessionToken(user);

    res.json({
      token,
      user: getUserPayload(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const emailSent = await sendResetLink(email, resetToken);
    if (!emailSent) return res.status(500).json({ message: 'Error sending reset email' });

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during forgot password' });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Logout - invalidate session
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'livedesk_secret');
      const { sessionId, id: userId } = decoded;

      if (sessionId) {
        // Delete the session
        await redis.del(`session_${sessionId}`);

        // Remove from user's session list
        const existingSessions = await redis.get(`user_sessions_${userId}`);
        if (existingSessions) {
          const sessions = JSON.parse(existingSessions).filter(s => s !== sessionId);
          if (sessions.length > 0) {
            await redis.set(`user_sessions_${userId}`, JSON.stringify(sessions), { EX: 7 * 24 * 60 * 60 });
          } else {
            await redis.del(`user_sessions_${userId}`);
          }
        }
      }
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const {
      username, bio, github, twitter,
      website, location, occupation, skills
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ message: 'Username already taken' });
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;
    if (github !== undefined) user.github = github;
    if (twitter !== undefined) user.twitter = twitter;
    if (website !== undefined) user.website = website;
    if (location !== undefined) user.location = location;
    if (occupation !== undefined) user.occupation = occupation;
    if (skills !== undefined) user.skills = skills;

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

export default router;
