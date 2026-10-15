const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const AuditLog = require('../models/AuditLog');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalElections, totalVotes, activeElections] = await Promise.all([
      User.countDocuments({ role: 'voter' }),
      Election.countDocuments(),
      Vote.countDocuments(),
      Election.countDocuments({ isActive: true, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } }),
    ]);
    res.json({ totalUsers, totalElections, totalVotes, activeElections });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
});

router.get('/results/:electionId', async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const candidates = await Candidate.find({ election: election._id }).sort({ voteCount: -1 });
    const totalVotes = await Vote.countDocuments({ election: election._id });

    const results = candidates.map((c) => ({
      id: c._id,
      name: c.name,
      party: c.party,
      voteCount: c.voteCount,
      percentage: totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : '0.0',
    }));

    res.json({ election, results, totalVotes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch results', error: err.message });
  }
});

router.get('/audit-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(),
    ]);

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('-password -otp -otpExpiry');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['voter', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await AuditLog.create({
      user: req.user._id,
      action: 'USER_ROLE_UPDATED',
      details: `Role updated for ${user.email} to ${role}`,
      ipAddress: req.ip,
      status: 'info',
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user role', error: err.message });
  }
});

module.exports = router;
