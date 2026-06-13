import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../context/AuthContext';
import { LayoutDashboard, Users, FileText, Activity, ShieldAlert, TrendingUp, Database } from 'lucide-react';

const AdminDashboard = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics');
      return res.data;
    }
  });

  if (isLoading) return (
    <div class="py-20 flex justify-center"><div class="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
  );

  const metrics = analytics?.metrics || {};
  const categoryBreakdown = analytics?.categoryBreakdown || [];

  const cards = [
    { label: 'Total Patients', value: metrics.patients || 0, icon: Users, color: 'text-primary bg-primary/10' },
    { label: 'Doctors', value: metrics.doctors || 0, icon: Activity, color: 'text-cyan-600 bg-cyan-100' },
    { label: 'Hospitals', value: metrics.hospitals || 0, icon: Database, color: 'text-indigo-600 bg-indigo-100' },
    { label: 'Caregivers', value: metrics.caregivers || 0, icon: ShieldAlert, color: 'text-emerald-600 bg-emerald-100' },
    { label: 'Medical Records', value: metrics.records || 0, icon: FileText, color: 'text-amber-600 bg-amber-100' },
    { label: 'Audit Log Entries', value: metrics.auditLogs || 0, icon: TrendingUp, color: 'text-rose-600 bg-rose-100' }
  ];

  return (
    <div class="space-y-7">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Admin Analytics Dashboard</h2>
        <p class="text-slate-500 text-sm mt-1">Real-time platform metrics and operational statistics</p>
      </div>

      {/* Metrics cards */}
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-standard">
              <div class={`h-10 w-10 ${card.color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon class="h-5 w-5" />
              </div>
              <div class="text-3xl font-extrabold text-slate-800">{card.value.toLocaleString()}</div>
              <div class="text-sm text-slate-500 mt-1 font-medium">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Records by category */}
      <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
        <h3 class="font-bold text-slate-800 mb-6">Records by Category</h3>
        <div class="space-y-4">
          {categoryBreakdown.map((cat) => {
            const max = Math.max(...categoryBreakdown.map(c => c.count), 1);
            const pct = Math.round((cat.count / max) * 100);
            return (
              <div key={cat.slug}>
                <div class="flex justify-between items-center mb-1.5 text-sm">
                  <span class="font-semibold text-slate-700">{cat.name}</span>
                  <span class="text-slate-400 font-medium">{cat.count} records</span>
                </div>
                <div class="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
