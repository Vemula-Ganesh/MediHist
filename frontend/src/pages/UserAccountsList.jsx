import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../context/AuthContext';
import { Users, Search, ShieldCheck, ShieldOff, CheckCircle2, AlertCircle } from 'lucide-react';

const UserAccountsList = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ban }) => {
      const res = await api.put(`/admin/users/${id}/status`, { ban });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setToast({ type: 'success', msg: data.message });
      setTimeout(() => setToast(null), 3500);
    },
    onError: (err) => {
      setToast({ type: 'error', msg: err.response?.data?.error || 'Failed to update status' });
      setTimeout(() => setToast(null), 3500);
    }
  });

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.profile?.fullName || '').toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role) => {
    const map = {
      PATIENT: 'bg-blue-50 text-blue-700 border-blue-200',
      DOCTOR: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      ADMIN: 'bg-red-50 text-red-700 border-red-200',
      HOSPITAL: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      CAREGIVER: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    return map[role] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div class="space-y-6">
      {/* Toast */}
      {toast && (
        <div class={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {toast.type === 'success' ? <CheckCircle2 class="h-5 w-5" /> : <AlertCircle class="h-5 w-5" />}
          {toast.msg}
        </div>
      )}

      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">User Accounts</h2>
          <p class="text-slate-500 text-sm mt-1">Manage platform user statuses and access roles</p>
        </div>
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Search class="h-4 w-4" /></span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            class="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-medihist outline-none focus:border-primary text-sm shadow-sm w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <div class="py-20 flex justify-center"><div class="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th class="p-4 pl-6">User</th>
                  <th class="p-4">Role</th>
                  <th class="p-4">Health ID</th>
                  <th class="p-4">Joined</th>
                  <th class="p-4">Status</th>
                  <th class="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                {filtered.map((u) => {
                  const isActive = !u.deletedAt;
                  return (
                    <tr key={u.id} class={`hover:bg-slate-50 transition-standard ${!isActive ? 'opacity-50' : ''}`}>
                      <td class="p-4 pl-6">
                        <div class="flex items-center gap-3">
                          <div class="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">{u.email.charAt(0).toUpperCase()}</div>
                          <div>
                            <p class="font-semibold text-slate-800">{u.profile?.fullName || 'Profile Incomplete'}</p>
                            <p class="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td class="p-4">
                        <span class={`text-[10px] font-bold px-2 py-0.5 border rounded-md uppercase tracking-wider ${roleBadge(u.role)}`}>{u.role}</span>
                      </td>
                      <td class="p-4 text-xs font-mono text-slate-500">{u.profile?.healthId || '—'}</td>
                      <td class="p-4 text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td class="p-4">
                        <span class={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {isActive ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </td>
                      <td class="p-4 pr-6 text-right">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => {
                              const msg = isActive ? `Deactivate ${u.email}?` : `Reactivate ${u.email}?`;
                              if (window.confirm(msg)) toggleMutation.mutate({ id: u.id, ban: isActive });
                            }}
                            class={`flex items-center gap-1.5 text-xs font-semibold ml-auto transition-standard hover:underline ${isActive ? 'text-red-500' : 'text-green-600'}`}
                          >
                            {isActive ? <ShieldOff class="h-4 w-4" /> : <ShieldCheck class="h-4 w-4" />}
                            {isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div class="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {users.length} accounts
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccountsList;
