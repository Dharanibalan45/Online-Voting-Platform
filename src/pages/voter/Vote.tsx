import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { electionApi, voteApi } from '../../services/api';
import { Vote, CheckCircle, AlertCircle, ArrowLeft, User, Shield } from 'lucide-react';

interface Candidate {
  _id: string;
  name: string;
  party: string;
  bio: string;
  imageUrl: string;
}

interface Election {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function VoteElection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [selected, setSelected] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await electionApi.getById(id);
        setElection(data.election);
        setCandidates(data.candidates);
        setHasVoted(data.hasVoted);
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to load election');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleVote = async () => {
    if (!selected || !id) return;
    setIsSubmitting(true);
    setError('');
    try {
      await voteApi.cast({ electionId: id, candidateId: selected });
      setSuccess(true);
      setHasVoted(true);
      setConfirmModal(false);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to cast vote');
      setConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCandidate = candidates.find((c) => c._id === selected);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Election not found.</p>
        <button onClick={() => navigate('/voter/elections')} className="mt-4 text-blue-600 hover:underline text-sm">
          Back to Elections
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => navigate('/voter/elections')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Elections
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{election.title}</h1>
        {election.description && <p className="text-gray-500 mt-2 text-sm">{election.description}</p>}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-5 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success || hasVoted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-green-800 mb-2">Vote Recorded!</h2>
          <p className="text-green-700 text-sm mb-6">Your vote has been securely recorded. Thank you for participating.</p>
          <button
            onClick={() => navigate('/voter/elections')}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Back to Elections
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Select a Candidate</h2>
            <p className="text-sm text-gray-500">Your vote is anonymous and cannot be changed once submitted.</p>
          </div>

          <div className="space-y-3 mb-6">
            {candidates.map((c) => (
              <label
                key={c._id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selected === c._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="candidate"
                  value={c._id}
                  checked={selected === c._id}
                  onChange={() => setSelected(c._id)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected === c._id ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {selected === c._id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </div>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.party}</p>
                    {c.bio && <p className="text-xs text-gray-400 mt-0.5 truncate">{c.bio}</p>}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-2 mb-6">
            <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">Your vote is secured with end-to-end protection. You can only vote once per election.</p>
          </div>

          <button
            disabled={!selected}
            onClick={() => setConfirmModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            <Vote className="w-5 h-5" />
            {selected ? `Submit Vote for ${selectedCandidate?.name}` : 'Select a candidate to vote'}
          </button>
        </>
      )}

      {confirmModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <Vote className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Your Vote</h3>
              <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-5">
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">You are voting for</p>
              <p className="font-bold text-gray-900">{selectedCandidate.name}</p>
              <p className="text-sm text-gray-600">{selectedCandidate.party}</p>
              <p className="text-xs text-gray-500 mt-2">Election: {election.title}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVote}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:bg-blue-400"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Vote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
