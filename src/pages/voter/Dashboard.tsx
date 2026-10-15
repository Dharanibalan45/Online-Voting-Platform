import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { electionApi, voteApi } from '../../services/api';
import { Vote, CheckCircle, Clock, Calendar, ChevronRight, Shield } from 'lucide-react';

interface Election {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface MyVote {
  _id: string;
  election: { title: string; startDate: string; endDate: string };
  candidate: { name: string; party: string };
  createdAt: string;
}

export default function VoterDashboard() {
  const { user } = useAuth();
  const [activeElections, setActiveElections] = useState<Election[]>([]);
  const [myVotes, setMyVotes] = useState<MyVote[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [elections, votes] = await Promise.all([electionApi.getActive(), voteApi.myVotes()]);
        setActiveElections(elections);
        setMyVotes(votes);
        setVotedIds(new Set(votes.map((v: MyVote & { election: { _id?: string } & { title: string } }) =>
          typeof v.election === 'object' && '_id' in v.election ? v.election._id : '')));
      } catch (_) {}
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
        <p className="text-gray-500 mt-1">Your voting dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Elections</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{activeElections.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Vote className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Votes Cast</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{myVotes.length}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Votes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{activeElections.filter(e => !votedIds.has(e._id)).length}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Elections</h2>
            <Link to="/voter/elections" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {activeElections.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Vote className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No active elections</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeElections.slice(0, 4).map((e) => (
                <Link
                  key={e._id}
                  to={`/voter/elections/${e._id}/vote`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{e.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Ends {formatDate(e.endDate)}</p>
                  </div>
                  {votedIds.has(e._id) ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full ml-2">
                      <CheckCircle className="w-3 h-3" /> Voted
                    </span>
                  ) : (
                    <span className="text-xs text-blue-600 font-medium group-hover:underline ml-2">Vote Now</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Voting History</h2>
          {myVotes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Shield className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No votes cast yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myVotes.slice(0, 5).map((v) => (
                <div key={v._id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{v.election.title}</p>
                    <p className="text-xs text-gray-500">{v.candidate.name} &bull; {v.candidate.party}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-400">{formatDate(v.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
