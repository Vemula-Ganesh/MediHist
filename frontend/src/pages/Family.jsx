import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, api } from '../context/AuthContext';
import { 
  Plus, Users, Trash2, AlertCircle, UserCheck, 
  Mail, Shield, Eye, ChevronRight, X, UserCircle
} from 'lucide-react';

const Family = () => {
  const { user, switchProfileScope, selectedProfileId } = useAuth();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState('CHILD');
  const [accessLevel, setAccessLevel] = useState('VIEW_ONLY');
  const [error, setError] = useState('');

  const { data: family, isLoading } = useQuery({
    queryKey: ['family'],
    queryFn: async () => {
      const res = await api.get('/sharing/family');
      return res.data;
    }
  });

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/sharing/family/add', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to link family member')
  });

  const removeMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/sharing/family/member/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family'] })
  });

  const resetForm = () => { setEmail(''); setRelation('CHILD'); setAccessLevel('VIEW_ONLY'); setError(''); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    addMutation.mutate({ email, relation, accessLevel });
  };

  const accessBadge = (level) => {
    const map = {
      ADMIN: 'bg-red-50 text-red-700 border-red-200',
      FULL_ACCESS: 'bg-amber-50 text-amber-700 border-amber-200',
      VIEW_ONLY: 'bg-blue-50 text-blue-700 border-blue-200'
    };
    return map[level] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Family Health Accounts</h2>
          <p class="text-slate-500 text-sm mt-1">Link dependents and manage access scopes for caregiving</p>
        </div>
        <button onClick={() => setModalOpen(true)} class="bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-2.5 rounded-medihist shadow-md shadow-primary/20 transition-standard flex items-center gap-2 text-sm">
          <Plus class="h-4 w-4" /><span>Add Member</span>
        </button>
      </div>

      {/* Info panel */}
      <div class="p-5 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-4">
        <Shield class="h-9 w-9 text-primary shrink-0 mt-0.5" />
        <div class="text-sm">
          <h4 class="font-bold text-slate-800">Profile Scope Switching</h4>
          <p class="text-slate-500 mt-1">Click "View Records" on a family member to switch into their profile scope. A banner will appear at the top while you are managing their timeline.</p>
        </div>
      </div>

      {isLoading ? (
        <div class="py-20 flex justify-center"><div class="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : !family || !family.members || family.members.length === 0 ? (
        <div class="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <Users class="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 class="font-bold text-slate-700">No family members linked</h3>
          <p class="text-slate-400 text-sm mt-1">Add a child, parent, or caregiver to manage their medical records</p>
        </div>
      ) : (
        <div class="grid md:grid-cols-2 gap-5">
          {family.members.map((member) => {
            const memberProfile = member.user?.profile;
            const name = memberProfile?.fullName || member.user?.email || 'Member';
            const isCurrentScope = selectedProfileId === member.userId;
            return (
              <div key={member.id} class={`bg-white rounded-2xl border p-5 shadow-sm transition-standard ${isCurrentScope ? 'border-primary/30 ring-2 ring-primary/10' : 'border-slate-100 hover:border-primary/20 hover:shadow-md'}`}>
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="h-11 w-11 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-lg">{name.charAt(0).toUpperCase()}</div>
                    <div>
                      <h4 class="font-bold text-slate-800">{name}</h4>
                      <span class="text-xs text-slate-500">{member.user?.email}</span>
                    </div>
                  </div>
                  <button onClick={() => { if(window.confirm('Remove this family link?')) removeMutation.mutate(member.id); }} class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-standard">
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>

                <div class="flex items-center gap-2 mb-4">
                  <span class="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-md">{member.relation}</span>
                  <span class={`text-[10px] font-bold px-2.5 py-1 border rounded-md ${accessBadge(member.accessLevel)}`}>{member.accessLevel.replace('_', ' ')}</span>
                  {memberProfile?.healthId && <span class="text-[10px] text-slate-400 ml-auto font-mono">{memberProfile.healthId}</span>}
                </div>

                <button
                  onClick={() => switchProfileScope(member.userId, name)}
                  class={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-standard ${isCurrentScope ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-50 text-primary border border-primary/20 hover:bg-primary/5'}`}
                >
                  {isCurrentScope ? (<><UserCheck class="h-4 w-4" /><span>Currently Viewing</span></>) : (<><Eye class="h-4 w-4" /><span>View Their Records</span><ChevronRight class="h-3 w-3" /></>)}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4">
          <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div class="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 class="font-bold text-slate-800">Link Family Member</h3>
              <button onClick={() => setModalOpen(false)} class="p-1 hover:bg-slate-200 rounded-lg text-slate-400"><X class="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} class="p-6 space-y-4">
              {error && <div class="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-lg flex items-center gap-2"><AlertCircle class="h-4 w-4" /><span>{error}</span></div>}
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Member Email Address</label>
                <div class="relative"><span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Mail class="h-4 w-4" /></span>
                  <input type="email" required placeholder="family@example.com" value={email} onChange={(e) => setEmail(e.target.value)} class="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Relationship</label>
                  <select value={relation} onChange={(e) => setRelation(e.target.value)} class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm">
                    <option value="CHILD">Child</option>
                    <option value="PARENT">Parent / Elder</option>
                    <option value="CAREGIVER">Caregiver</option>
                    <option value="DEPENDENT">Dependent</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Access Level</label>
                  <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)} class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm">
                    <option value="VIEW_ONLY">View Only</option>
                    <option value="FULL_ACCESS">Full Access</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div class="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-standard">Cancel</button>
                <button type="submit" disabled={addMutation.isPending} class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/20 transition-standard">
                  {addMutation.isPending ? 'Linking...' : 'Link Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Family;
