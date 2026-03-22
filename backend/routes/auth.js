import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { client as redis } from '../config/redis.js';
import { sendOTP, sendResetLink } from '../utils/mailer.js';
import crypto from 'crypto';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * POST /api/auth/register
 * User registration with email verification
 */
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 chars'),
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const otp = generateOTP();
    const registrationData = { username, email, password, otp };

    // ✅ redis uses SET with EX option instead of setex
    await redis.set(`reg_${email}`, JSON.stringify(registrationData), { EX: 600 });

    const emailSent = await sendOTP(email, otp);
    if (!emailSent) return res.status(500).json({ message: 'Error sending verification email' });

    res.status(200).json({ message: 'OTP sent to your email. Please verify.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and create user
 */
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    // ✅ redis GET works the same way
    const dataStr = await redis.get(`reg_${email}`);
    if (!dataStr) return res.status(400).json({ message: 'OTP expired or not found' });

    const data = JSON.parse(dataStr);
    if (data.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    const user = new User({
      username: data.username,
      email: data.email,
      password: data.password,
      isVerified: true
    });

    await user.save();

    // ✅ redis DEL works the same way
    await redis.del(`reg_${email}`);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'livedesk_secret', { expiresIn: '7d' });

    res.status(201).json({ 
      token, 
      user: { id: user._id, username: user.username, email: user.email } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('This is user', await User.find({ email }));
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'livedesk_secret', { expiresIn: '7d' });

    res.json({ 
      token, 
      user: { id: user._id, username: user.username, email: user.email } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
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

/**
 * POST /api/auth/reset-password/:token
 * Reset password using token
 */
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

/**
 * GET /api/auth/profile
 * Fetch user profile data
 */
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

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const {
      username, bio, github, twitter,
      website, location, occupation, skills
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if new username is already taken
    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ message: 'Username already taken' });
      user.username = username;
    }

    // Update other fields
    if (bio !== undefined) user.bio = bio;
    if (github !== undefined) user.github = github;
    if (twitter !== undefined) user.twitter = twitter;
    if (website !== undefined) user.website = website;
    if (location !== undefined) user.location = location;
    if (occupation !== undefined) user.occupation = occupation;
    if (skills !== undefined) user.skills = skills;

    await user.save();

    // Don't send back password
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

export default router;