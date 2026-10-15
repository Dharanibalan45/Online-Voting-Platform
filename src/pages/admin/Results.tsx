import { useState, useEffect } from 'react';
import { adminApi, electionApi } from '../../services/api';
import { BarChart2, Trophy, Users, Vote } from 'lucide-react';

interface Election { _id: string; title: string; }
interface CandidateResult {
  id: string;
  name: string;
  party: string;
  voteCount: number;
  percentage: string;
}
interface ResultData {
  election: Election;
  results: CandidateResult[];
  totalVotes: number;
}

const COLORS = ['bg-blue-500', 'bg-teal-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500'];

export default function AdminResults() {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    electionApi.getAll().then((data) => {
      setElections(data);
      if (data.length > 0) setSelectedElection(data[0]._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedElection) return;
    setIsLoading(true);
    adminApi.results(selectedElection).then(setResultData).catch(() => setResultData(null)).finally(() => setIsLoading(false));
  }, [selectedElection]);

  const winner = resultData?.results[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Election Results</h1>
        <p className="text-gray-500 mt-1">Live vote counts and percentages</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Election</label>
        <select
          value={selectedElection}
          onChange={(e) => setSelectedElection(e.target.value)}
          className="w-full sm:w-80 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {elections.length === 0 && <option>No elections available</option>}
          {elections.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !resultData ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Select an election to view results</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Votes Cast</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{resultData.totalVotes}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Vote className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Candidates</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{resultData.results.length}</p>
                </div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-teal-600" />
                </div>
              </div>
            </div>
            {winner && resultData.totalVotes > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-amber-600 font-medium">Current Leader</p>
                    <p className="font-bold text-gray-900 mt-1 truncate">{winner.name}</p>
                    <p className="text-sm text-gray-500">{winner.percentage}% ({winner.voteCount} votes)</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                    <Trophy className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {resultData.results.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No candidates or votes yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">Vote Distribution</h2>
                <div className="space-y-4">
                  {resultData.results.map((c, i) => (
                    <div key={c.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${COLORS[i % COLORS.length]}`} />
                          <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                          <span className="text-xs text-gray-400 flex-shrink-0">{c.party}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <span className="text-sm font-semibold text-gray-900">{c.voteCount}</span>
                          <span className="text-xs text-gray-500 w-10 text-right">{c.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-700 ${COLORS[i % COLORS.length]}`}
                          style={{ width: `${c.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">Pie Chart</h2>
                {resultData.totalVotes === 0 ? (
                  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No votes yet</div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-48 h-48">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {(() => {
                          let offset = 0;
                          return resultData.results.map((c, i) => {
                            const pct = parseFloat(c.percentage);
                            const dashArray = `${pct} ${100 - pct}`;
                            const el = (
                              <circle
                                key={c.id}
                                cx="50" cy="50" r="15.915"
                                fill="transparent"
                                stroke={['#3b82f6','#14b8a6','#22c55e','#f97316','#ef4444','#a855f7','#ec4899','#eab308'][i % 8]}
                                strokeWidth="31.83"
                                strokeDasharray={dashArray}
                                strokeDashoffset={-offset}
                              />
                            );
                            offset += pct;
                            return el;
                          });
                        })()}
                      </svg>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
                      {resultData.results.map((c, i) => (
                        <div key={c.id} className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${COLORS[i % COLORS.length]}`} />
                          <span className="text-xs text-gray-600 truncate">{c.name}</span>
                          <span className="text-xs font-semibold text-gray-900 ml-auto">{c.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">Detailed Standings</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-3 pr-4">Rank</th>
                        <th className="pb-3 pr-4">Candidate</th>
                        <th className="pb-3 pr-4">Party</th>
                        <th className="pb-3 pr-4">Votes</th>
                        <th className="pb-3">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {resultData.results.map((c, i) => (
                        <tr key={c.id} className={i === 0 && resultData.totalVotes > 0 ? 'bg-amber-50' : ''}>
                          <td className="py-3 pr-4">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              i === 0 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-medium text-gray-900">{c.name} {i === 0 && resultData.totalVotes > 0 && <span className="text-amber-500 text-xs ml-1">Leader</span>}</td>
                          <td className="py-3 pr-4 text-gray-500">{c.party}</td>
                          <td className="py-3 pr-4 font-semibold">{c.voteCount.toLocaleString()}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${COLORS[i % COLORS.length]}`} style={{ width: `${c.percentage}%` }} />
                              </div>
                              <span className="text-gray-700 text-xs">{c.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
