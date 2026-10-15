const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');
const AuditLog = require('../models/AuditLog');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/election/:electionId', authenticate, async (req, res) => {
  try {
    const candidates = await Candidate.find({ election: req.params.electionId }).sort({ name: 1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch candidates', error: err.message });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, party, bio, imageUrl, electionId } = req.body;
    if (!name || !electionId) return res.status(400).json({ message: 'Name and election are required' });

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const candidate = await Candidate.create({ name, party, bio, imageUrl, election: electionId });

    await AuditLog.create({
      user: req.user._id,
      action: 'CANDIDATE_ADDED',
      details: `Candidate added: ${name} to ${election.title}`,
      ipAddress: req.ip,
      status: 'success',
    });

    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add candidate', error: err.message });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, party, bio, imageUrl } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { name, party, bio, imageUrl },
      { new: true, runValidators: true }
    );
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    await AuditLog.create({
      user: req.user._id,
      action: 'CANDIDATE_UPDATED',
      details: `Candidate updated: ${candidate.name}`,
      ipAddress: req.ip,
      status: 'success',
    });

    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update candidate', error: err.message });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    await AuditLog.create({
      user: req.user._id,
      action: 'CANDIDATE_DELETED',
      details: `Candidate deleted: ${candidate.name}`,
      ipAddress: req.ip,
      status: 'info',
    });

    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete candidate', error: err.message });
  }
});

module.exports = router;
