const express = require('express');
const router = express.Router();
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const AuditLog = require('../models/AuditLog');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
    res.json(elections);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch elections', error: err.message });
  }
});

router.get('/active', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const elections = await Election.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ endDate: 1 });
    res.json(elections);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch active elections', error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id).populate('createdBy', 'name email');
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const candidates = await Candidate.find({ election: election._id });
    const hasVoted = await Vote.findOne({ voter: req.user._id, election: election._id });

    res.json({ election, candidates, hasVoted: !!hasVoted });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch election', error: err.message });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, startDate, endDate } = req.body;
    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Title, start date, and end date are required' });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const election = await Election.create({ title, description, startDate, endDate, createdBy: req.user._id });

    await AuditLog.create({
      user: req.user._id,
      action: 'ELECTION_CREATED',
      details: `Election created: ${title}`,
      ipAddress: req.ip,
      status: 'success',
    });

    res.status(201).json(election);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create election', error: err.message });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, startDate, endDate, isActive } = req.body;
    const election = await Election.findByIdAndUpdate(
      req.params.id,
      { title, description, startDate, endDate, isActive },
      { new: true, runValidators: true }
    );
    if (!election) return res.status(404).json({ message: 'Election not found' });

    await AuditLog.create({
      user: req.user._id,
      action: 'ELECTION_UPDATED',
      details: `Election updated: ${election.title}`,
      ipAddress: req.ip,
      status: 'success',
    });

    res.json(election);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update election', error: err.message });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    await Candidate.deleteMany({ election: election._id });
    await Vote.deleteMany({ election: election._id });
    await Election.findByIdAndDelete(election._id);

    await AuditLog.create({
      user: req.user._id,
      action: 'ELECTION_DELETED',
      details: `Election deleted: ${election.title}`,
      ipAddress: req.ip,
      status: 'info',
    });

    res.json({ message: 'Election deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete election', error: err.message });
  }
});

module.exports = router;
