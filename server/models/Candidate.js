const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    party: { type: String, trim: true, default: 'Independent' },
    bio: { type: String, trim: true },
    imageUrl: { type: String, default: '' },
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    voteCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Candidate', candidateSchema);
