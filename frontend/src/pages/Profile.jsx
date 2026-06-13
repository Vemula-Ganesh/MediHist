import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, api } from '../context/AuthContext';
import { User, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    fullName: '', dob: '', gender: '', bloodGroup: '',
    height: '', weight: '', emergencyContact: '', address: '', insuranceInfo: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const res = await api.get('/profile');
      return res.data;
    },
    retry: false
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        dob: profile.dob || '',
        gender: profile.gender || '',
        bloodGroup: profile.bloodGroup || '',
        height: profile.height || '',
        weight: profile.weight || '',
        emergencyContact: profile.emergencyContact || '',
        address: profile.address || '',
        insuranceInfo: profile.insuranceInfo || ''
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.put('/profile', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setSuccess(`Profile saved. Health ID: ${data.healthId}`);
      setError('');
      setTimeout(() => setSuccess(''), 4000);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to save profile');
    }
  });

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) return (
    <div class="py-20 flex justify-center"><div class="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
  );

  const fields = [
    { name: 'fullName', label: 'Full Legal Name', placeholder: 'e.g. Jane Smith', type: 'text' },
    { name: 'dob', label: 'Date of Birth', placeholder: 'YYYY-MM-DD', type: 'date' },
    { name: 'gender', label: 'Gender', placeholder: 'e.g. Female / Male / Other', type: 'text' },
    { name: 'bloodGroup', label: 'Blood Group', placeholder: 'e.g. A+, B-, O+, AB+', type: 'text' },
    { name: 'height', label: 'Height', placeholder: 'e.g. 175cm', type: 'text' },
    { name: 'weight', label: 'Weight', placeholder: 'e.g. 70kg', type: 'text' },
    { name: 'emergencyContact', label: 'Emergency Contact (Name & Phone)', placeholder: 'e.g. John Smith +1234567890', type: 'text' },
    { name: 'address', label: 'Home Address', placeholder: 'e.g. 123 Maple Ave, New York, NY 10001', type: 'text' },
    { name: 'insuranceInfo', label: 'Insurance / Policy Number', placeholder: 'e.g. BlueCross #BCP-999-2024', type: 'text' }
  ];

  return (
    <div class="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">My Health Profile</h2>
        <p class="text-slate-500 text-sm mt-1">Fields are encrypted using AES-256 before storage. Only you can decrypt them.</p>
      </div>

      {/* Health ID badge */}
      {profile?.healthId && (
        <div class="flex items-center gap-3 p-4 bg-primary/5 border border-primary/15 rounded-2xl">
          <div class="h-9 w-9 bg-primary/10 text-primary flex items-center justify-center rounded-xl"><User class="h-5 w-5" /></div>
          <div>
            <span class="text-xs text-slate-500 font-medium">Your Unique Health ID</span>
            <p class="font-extrabold text-primary tracking-widest text-sm">{profile.healthId}</p>
          </div>
        </div>
      )}

      {success && (
        <div class="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded-r-xl flex items-center gap-2">
          <CheckCircle2 class="h-5 w-5 shrink-0" /><span>{success}</span>
        </div>
      )}
      {error && (
        <div class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl flex items-center gap-2">
          <AlertCircle class="h-5 w-5 shrink-0" /><span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} class="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 space-y-5">
        <div class="grid md:grid-cols-2 gap-5">
          {fields.map((f) => (
            <div key={f.name} class={f.name === 'address' || f.name === 'insuranceInfo' ? 'md:col-span-2' : ''}>
              <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{f.label}</label>
              <input
                type={f.type}
                name={f.name}
                value={formData[f.name]}
                onChange={handleChange}
                placeholder={f.placeholder}
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm transition-standard"
              />
            </div>
          ))}
        </div>

        <div class="border-t border-slate-100 pt-5 flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            class="bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-2.5 rounded-medihist shadow-md shadow-primary/20 transition-standard flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Save class="h-4 w-4" />
            {updateMutation.isPending ? 'Encrypting & Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Account info */}
      <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
        <h3 class="font-bold text-slate-800">Account Information</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="bg-slate-50 p-3.5 rounded-xl">
            <span class="text-xs text-slate-400 block">Email</span>
            <strong class="text-slate-700 mt-1 block">{user?.email}</strong>
          </div>
          <div class="bg-slate-50 p-3.5 rounded-xl">
            <span class="text-xs text-slate-400 block">Account Role</span>
            <strong class="text-slate-700 mt-1 block">{user?.role}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
