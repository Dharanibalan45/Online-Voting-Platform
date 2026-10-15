const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');
const AuditLog = require('../models/AuditLog');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;
    if (!electionId || !candidateId) {
      return res.status(400).json({ message: 'Election and candidate are required' });
    }

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const now = new Date();
    if (!election.isActive || now < election.startDate || now > election.endDate) {
      return res.status(400).json({ message: 'Election is not currently active' });
    }

    const candidate = await Candidate.findOne({ _id: candidateId, election: electionId });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found in this election' });

    const existingVote = await Vote.findOne({ voter: req.user._id, election: electionId });
    if (existingVote) {
      return res.status(409).json({ message: 'You have already voted in this election' });
    }

    const vote = await Vote.create({
      voter: req.user._id,
      election: electionId,
      candidate: candidateId,
      ipAddress: req.ip,
    });

    await Candidate.findByIdAndUpdate(candidateId, { $inc: { voteCount: 1 } });

    await AuditLog.create({
      user: req.user._id,
      action: 'VOTE_CAST',
      details: `Vote cast in election: ${election.title}`,
      ipAddress: req.ip,
      status: 'success',
    });

    res.status(201).json({ message: 'Vote cast successfully', vote: { id: vote._id, createdAt: vote.createdAt } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already voted in this election' });
    }
    res.status(500).json({ message: 'Failed to cast vote', error: err.message });
  }
});

router.get('/my-votes', authenticate, async (req, res) => {
  try {
    const votes = await Vote.find({ voter: req.user._id })
      .populate('election', 'title startDate endDate')
      .populate('candidate', 'name party')
      .sort({ createdAt: -1 });
    res.json(votes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch votes', error: err.message });
  }
});

router.get('/check/:electionId', authenticate, async (req, res) => {
  try {
    const vote = await Vote.findOne({ voter: req.user._id, election: req.params.electionId });
    res.json({ hasVoted: !!vote, vote: vote || null });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check vote', error: err.message });
  }
});

module.exports = router;
