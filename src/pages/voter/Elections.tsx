import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { electionApi, voteApi } from '../../services/api';
import { Vote, CheckCircle, Clock, Calendar, Search, ChevronRight } from 'lucide-react';

interface Election {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function VoterElections() {
  const [elections, setElections] = useState<Election[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [allElections, myVotes] = await Promise.all([electionApi.getAll(), voteApi.myVotes()]);
        setElections(allElections);
        setVotedIds(new Set(myVotes.map((v: { election: { _id?: string } }) =>
          typeof v.election === 'object' && '_id' in v.election ? v.election._id : '')));
      } catch (_) {}
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const now = new Date();
  const filtered = elections.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const isOngoing = e.isActive && new Date(e.startDate) <= now && new Date(e.endDate) >= now;
    if (filter === 'active') return matchSearch && isOngoing;
    if (filter === 'ended') return matchSearch && !isOngoing;
    return matchSearch;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatus = (e: Election) => {
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    if (!e.isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-600' };
    if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    if (now > end) return { label: 'Ended', color: 'bg-gray-100 text-gray-600' };
    return { label: 'Active', color: 'bg-green-100 text-green-700' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Elections</h1>
        <p className="text-gray-500 mt-1">Browse and participate in elections</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search elections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'ended'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Vote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No elections found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => {
            const status = getStatus(e);
            const isOngoing = e.isActive && new Date(e.startDate) <= now && new Date(e.endDate) >= now;
            const hasVoted = votedIds.has(e._id);
            return (
              <div key={e._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>{status.label}</span>
                  {hasVoted && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Voted
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 leading-snug">{e.title}</h3>
                {e.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{e.description}</p>}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Starts: {formatDate(e.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Ends: {formatDate(e.endDate)}</span>
                  </div>
                </div>
                {isOngoing && !hasVoted && (
                  <Link
                    to={`/voter/elections/${e._id}/vote`}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Vote className="w-4 h-4" /> Cast Your Vote <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                {hasVoted && (
                  <div className="flex items-center justify-center gap-2 w-full bg-green-50 text-green-700 py-2 rounded-lg text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" /> Vote Recorded
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
