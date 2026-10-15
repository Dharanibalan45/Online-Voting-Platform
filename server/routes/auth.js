const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendOTPEmail, generateOTP } = require('../utils/email');
const { authenticate } = require('../middleware/auth');

const signToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const logAction = async (userId, action, details, req, status = 'info') => {
  try {
    await AuditLog.create({
      user: userId || null,
      action,
      details,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status,
    });
  } catch (_) {}
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);

    const user = await User.create({ name, email, password, otp, otpExpiry });

    await sendOTPEmail(email, name, otp);
    await logAction(user._id, 'REGISTER', `New user registered: ${email}`, req, 'success');

    res.status(201).json({
      message: 'Registration successful. Check your email for the OTP.',
      userId: user._id,
      email: user.email,
    });
  } catch (err) {
    await logAction(null, 'REGISTER_FAILED', err.message, req, 'failure');
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry +otpAttempts');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Account already verified' });

    if (user.otpAttempts >= 5) {
      return res.status(429).json({ message: 'Too many failed attempts. Request a new OTP.' });
    }

    if (!user.otp || !user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp !== otp) {
      await User.findByIdAndUpdate(user._id, { $inc: { otpAttempts: 1 } });
      await logAction(user._id, 'OTP_FAILED', `Wrong OTP for ${email}`, req, 'failure');
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      otp: null,
      otpExpiry: null,
      otpAttempts: 0,
    });

    await logAction(user._id, 'OTP_VERIFIED', `Email verified: ${email}`, req, 'success');
    const token = signToken(user._id, user.role);

    res.json({ message: 'Email verified successfully', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Account already verified' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, { otp, otpExpiry, otpAttempts: 0 });
    await sendOTPEmail(email, user.name, otp);

    await logAction(user._id, 'OTP_RESENT', `OTP resent to ${email}`, req, 'info');
    res.json({ message: 'New OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resend OTP', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      await logAction(null, 'LOGIN_FAILED', `Unknown email: ${email}`, req, 'failure');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAction(user._id, 'LOGIN_FAILED', `Wrong password for ${email}`, req, 'failure');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);
      await User.findByIdAndUpdate(user._id, { otp, otpExpiry, otpAttempts: 0 });
      await sendOTPEmail(email, user.name, otp);
      return res.status(403).json({
        message: 'Account not verified. A new OTP has been sent to your email.',
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = signToken(user._id, user.role);
    await logAction(user._id, 'LOGIN', `User logged in: ${email}`, req, 'success');

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
