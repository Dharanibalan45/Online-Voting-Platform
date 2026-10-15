import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { FileText, ChevronLeft, ChevronRight, Search, CheckCircle, XCircle, Info } from 'lucide-react';

interface AuditLog {
  _id: string;
  user: { name: string; email: string; role: string } | null;
  action: string;
  details: string;
  ipAddress: string;
  status: 'success' | 'failure' | 'info';
  createdAt: string;
}

const actionColors: Record<string, string> = {
  REGISTER: 'bg-blue-100 text-blue-700',
  LOGIN: 'bg-green-100 text-green-700',
  LOGIN_FAILED: 'bg-red-100 text-red-700',
  REGISTER_FAILED: 'bg-red-100 text-red-700',
  OTP_VERIFIED: 'bg-green-100 text-green-700',
  OTP_FAILED: 'bg-red-100 text-red-700',
  OTP_RESENT: 'bg-yellow-100 text-yellow-700',
  VOTE_CAST: 'bg-teal-100 text-teal-700',
  ELECTION_CREATED: 'bg-blue-100 text-blue-700',
  ELECTION_UPDATED: 'bg-yellow-100 text-yellow-700',
  ELECTION_DELETED: 'bg-red-100 text-red-700',
  CANDIDATE_ADDED: 'bg-blue-100 text-blue-700',
  CANDIDATE_UPDATED: 'bg-yellow-100 text-yellow-700',
  CANDIDATE_DELETED: 'bg-red-100 text-red-700',
  USER_ROLE_UPDATED: 'bg-orange-100 text-orange-700',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = async (p: number) => {
    setIsLoading(true);
    try {
      const data = await adminApi.auditLogs(p);
      setLogs(data.logs);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (_) {}
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(page); }, [page]);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q) ||
      (l.user?.email || '').toLowerCase().includes(q) ||
      (l.ipAddress || '').includes(q)
    );
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'failure') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Info className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500 mt-1">{total} total events recorded</p>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by action, email, details, or IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No audit logs found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Action</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Details</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">IP Address</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <StatusIcon status={log.status} />
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-gray-900">{log.user.name}</p>
                          <p className="text-xs text-gray-500">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Anonymous</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <p className="text-gray-600 max-w-xs truncate">{log.details}</p>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-gray-500 text-xs font-mono">{log.ipAddress || '-'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-500 text-xs whitespace-nowrap">{formatDate(log.createdAt)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} &bull; {total} total events
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
