import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, api } from '../context/AuthContext';
import { 
  Plus, 
  Share2, 
  Trash2, 
  AlertCircle,
  Calendar,
  Lock,
  Mail,
  UserCheck,
  CheckCircle,
  X
} from 'lucide-react';

const Sharing = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [permissions, setPermissions] = useState(['read']);
  const [error, setError] = useState('');

  // 1. Fetch active doctor accesses
  const { data: accesses = [], isLoading } = useQuery({
    queryKey: ['doctor-accesses'],
    queryFn: async () => {
      const res = await api.get('/sharing/accesses');
      return res.data;
    }
  });

  // 2. Grant Access Mutation
  const grantMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/sharing/grant', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-accesses'] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to grant clinical access');
    }
  });

  // 3. Revoke Access Mutation
  const revokeMutation = useMutation({
    mutationFn: async (accessId) => {
      await api.delete(`/sharing/revoke/${accessId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-accesses'] });
    }
  });

  const resetForm = () => {
    setDoctorEmail('');
    setExpiryDate('');
    setPermissions(['read']);
    setError('');
  };

  const handleGrantSubmit = (e) => {
    e.preventDefault();
    if (!doctorEmail || !expiryDate) {
      setError('Please provide the doctor email and access expiry date');
      return;
    }

    grantMutation.mutate({
      doctorEmail,
      permissions,
      expiryDate
    });
  };

  return (
    <div class="space-y-6">
      
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Doctor Access Consent Sharing</h2>
          <p class="text-slate-500 text-sm mt-1">Grant or revoke clinical access permissions for medical practitioners</p>
        </div>
        
        <button
          onClick={() => setModalOpen(true)}
          class="bg-primary hover:bg-primary-dark text-white font-semibold px-4.5 py-2.5 rounded-medihist shadow-md shadow-primary/20 transition-standard flex items-center gap-2 text-sm"
        >
          <Plus class="h-4.5 w-4.5" />
          <span>Authorize Practitioner</span>
        </button>
      </div>

      {/* Access description board */}
      <div class="p-5 bg-white border border-slate-100 rounded-3xl flex items-start gap-4 shadow-sm">
        <div class="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl shrink-0">
          <Lock class="h-5 w-5" />
        </div>
        <div class="text-sm">
          <h4 class="font-bold text-slate-800">Patient-Controlled Consent Architecture</h4>
          <p class="text-slate-500 mt-1 leading-relaxed">
            By authorizing clinical access, targeted doctors will be able to review your medical timelines, look up reports, write prescriptions, and append clinical summaries. You retain the ability to instantly revoke authorization at any time.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div class="py-20 flex justify-center">
          <div class="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : accesses.length === 0 ? (
        <div class="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <Share2 class="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 class="font-bold text-slate-700">No active clinic consents</h3>
          <p class="text-slate-400 text-sm mt-1">Authorized practitioners will appear here with active expiration dates</p>
        </div>
      ) : (
        <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th class="p-4 pl-6">Doctor Details</th>
                  <th class="p-4">Specialization</th>
                  <th class="p-4">Facility / Hospital</th>
                  <th class="p-4">Access Status</th>
                  <th class="p-4">Expires</th>
                  <th class="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                {accesses.map((acc) => {
                  const doctorProfile = acc.doctor?.user?.profile;
                  const doctorEmailStr = acc.doctor?.user?.email || 'Unknown';
                  const doctorName = doctorProfile ? doctorProfile.fullName : doctorEmailStr;
                  const isActive = acc.accessGranted && new Date(acc.expiryDate) > new Date() && !acc.revokedAt;
                  
                  return (
                    <tr key={acc.id} class="hover:bg-slate-55 transition-standard">
                      <td class="p-4 pl-6 font-semibold text-slate-800">
                        Dr. {doctorName}
                        <span class="block text-xs text-slate-400 font-normal mt-0.5">{doctorEmailStr}</span>
                      </td>
                      <td class="p-4 text-slate-600">{acc.doctor?.specialization}</td>
                      <td class="p-4 text-slate-600">{acc.doctor?.facilityName}</td>
                      <td class="p-4">
                        <span class={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 border rounded-full ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {isActive ? 'ACTIVE' : 'EXPIRED/REVOKED'}
                        </span>
                      </td>
                      <td class="p-4 text-slate-500">{new Date(acc.expiryDate).toLocaleDateString()}</td>
                      <td class="p-4 pr-6 text-right">
                        {isActive && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Revoke clinical record access immediately for Dr. ${doctorName}?`)) {
                                revokeMutation.mutate(acc.id);
                              }
                            }}
                            class="text-red-500 hover:text-red-700 flex items-center justify-end gap-1.5 text-xs font-semibold hover:underline ml-auto"
                          >
                            <Trash2 class="h-4 w-4" />
                            <span>Revoke</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUTHORIZE PRACTITIONER DIALOG */}
      {modalOpen && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4">
          <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-scale-in">
            <div class="px-6 py-4.5 border-b flex justify-between items-center bg-slate-50">
              <h3 class="font-bold text-slate-800">Grant Clinical Consent</h3>
              <button onClick={() => setModalOpen(false)} class="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600">
                <X class="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGrantSubmit} class="p-6 space-y-4">
              {error && (
                <div class="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r-lg flex items-center gap-2">
                  <AlertCircle class="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Practitioner Email</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail class="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="doctor@clinic.com"
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    class="w-full pl-9.5 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Access Expiration Date</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Calendar class="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    class="w-full pl-9.5 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Share Permissions</label>
                <div class="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="view"
                      checked={permissions.includes('read')}
                      disabled
                      class="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary/20"
                    />
                    <label htmlFor="view" class="font-semibold select-none">Read medical timeline & reports (Required)</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="write"
                      checked={permissions.includes('write')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPermissions([...permissions, 'write']);
                        } else {
                          setPermissions(permissions.filter(p => p !== 'write'));
                        }
                      }}
                      class="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary/20"
                    />
                    <label htmlFor="write" class="font-semibold select-none">Allow uploading consultation logs & scripts</label>
                  </div>
                </div>
              </div>

              <div class="pt-4 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-standard"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grantMutation.isPending}
                  class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/20 transition-standard"
                >
                  {grantMutation.isPending ? 'Sending Notification...' : 'Authorize Access'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Sharing;
