import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../context/AuthContext';
import { ShieldAlert, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const AuditLogs = () => {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', search, action, page],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs', {
        params: { search: search || undefined, action: action || undefined, page, limit: 50 }
      });
      return res.data;
    }
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  const actionBadge = (act) => {
    const map = {
      LOGIN: 'bg-green-50 text-green-700 border-green-200',
      LOGOUT: 'bg-slate-50 text-slate-600 border-slate-200',
      RECORD_ACCESS: 'bg-blue-50 text-blue-700 border-blue-200',
      RECORD_DOWNLOAD: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      PERMISSION_CHANGE: 'bg-amber-50 text-amber-700 border-amber-200',
      LOGIN_FAILED: 'bg-red-50 text-red-700 border-red-200',
      REGISTER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      PASSWORD_RESET: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return map[act] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">System Audit Logs</h2>
        <p class="text-slate-500 text-sm mt-1">Track all platform security events and clinical access trails</p>
      </div>

      {/* Filters */}
      <div class="flex flex-wrap gap-3">
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Search class="h-4 w-4" /></span>
          <input
            type="text"
            placeholder="Search log details..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            class="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-medihist outline-none focus:border-primary text-sm shadow-sm w-64"
          />
        </div>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          class="px-3.5 py-2.5 bg-white border border-slate-200 rounded-medihist outline-none focus:border-primary text-sm shadow-sm"
        >
          <option value="">All Actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
          <option value="RECORD_ACCESS">RECORD ACCESS</option>
          <option value="RECORD_DOWNLOAD">RECORD DOWNLOAD</option>
          <option value="PERMISSION_CHANGE">PERMISSION CHANGE</option>
          <option value="LOGIN_FAILED">LOGIN FAILED</option>
          <option value="REGISTER">REGISTER</option>
        </select>
      </div>

      {isLoading ? (
        <div class="py-20 flex justify-center"><div class="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : logs.length === 0 ? (
        <div class="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <ShieldAlert class="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 class="font-bold text-slate-700">No audit logs found</h3>
        </div>
      ) : (
        <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th class="p-4 pl-6">Timestamp</th>
                  <th class="p-4">Action</th>
                  <th class="p-4">User</th>
                  <th class="p-4">IP Address</th>
                  <th class="p-4 pr-6">Details</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                {logs.map((log) => (
                  <tr key={log.id} class="hover:bg-slate-50 transition-standard">
                    <td class="p-4 pl-6 text-xs text-slate-500 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td class="p-4">
                      <span class={`text-[10px] font-bold px-2 py-0.5 border rounded-md uppercase tracking-wide ${actionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td class="p-4 text-xs text-slate-600">{log.user?.email || <span class="text-slate-400 italic">Unauthenticated</span>}</td>
                    <td class="p-4 text-xs font-mono text-slate-500">{log.ipAddress}</td>
                    <td class="p-4 pr-6 text-xs text-slate-600 max-w-xs truncate" title={log.details}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div class="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 text-sm text-slate-500">
            <span>Page {page} of {totalPages} · {data?.count || 0} total events</span>
            <div class="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} class="p-2 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-standard">
                <ChevronLeft class="h-4 w-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} class="p-2 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-standard">
                <ChevronRight class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
