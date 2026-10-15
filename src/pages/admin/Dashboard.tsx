import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, electionApi } from '../../services/api';
import { Users, Vote, BarChart2, Activity, Calendar, ChevronRight, Plus } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalElections: number;
  totalVotes: number;
  activeElections: number;
}

interface Election {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, e] = await Promise.all([adminApi.stats(), electionApi.getAll()]);
        setStats(s);
        setElections(e.slice(0, 5));
      } catch (_) {}
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const statCards = [
    { label: 'Total Voters', value: stats?.totalUsers ?? 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Elections', value: stats?.totalElections ?? 0, icon: Vote, color: 'bg-teal-100 text-teal-600' },
    { label: 'Votes Cast', value: stats?.totalVotes ?? 0, icon: BarChart2, color: 'bg-green-100 text-green-600' },
    { label: 'Active Elections', value: stats?.activeElections ?? 0, icon: Activity, color: 'bg-orange-100 text-orange-600' },
  ];

  const now = new Date();
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform overview and management</p>
        </div>
        <Link
          to="/admin/elections"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> New Election
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Recent Elections</h2>
            <Link to="/admin/elections" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {elections.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Vote className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No elections yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {elections.map((e) => {
                const isOngoing = e.isActive && new Date(e.startDate) <= now && new Date(e.endDate) >= now;
                return (
                  <div key={e._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{e.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">{formatDate(e.endDate)}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ml-3 ${
                      isOngoing ? 'bg-green-100 text-green-700' : e.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isOngoing ? 'Live' : e.isActive ? 'Scheduled' : 'Inactive'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            {[
              { to: '/admin/elections', icon: Vote, label: 'Manage Elections', desc: 'Create and configure elections' },
              { to: '/admin/candidates', icon: Users, label: 'Manage Candidates', desc: 'Add or edit candidates' },
              { to: '/admin/results', icon: BarChart2, label: 'View Results', desc: 'Live election results with charts' },
              { to: '/admin/audit-logs', icon: Activity, label: 'Audit Logs', desc: 'Review all platform activity' },
            ].map(({ to, icon: Icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
              >
                <div className="w-9 h-9 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                  <Icon className="w-4.5 h-4.5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 ml-auto transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
