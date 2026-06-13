import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, Heart, Phone, ShieldAlert, User, Clock } from 'lucide-react';

// Public emergency page — no authentication required
// Fetched via direct API call (no auth headers needed)

const EmergencyPublic = () => {
  const { slug } = useParams();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['emergency-public', slug],
    queryFn: async () => {
      const res = await fetch(`/api/emergency/public/${slug}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Profile not found');
      }
      return res.json();
    },
    retry: false
  });

  if (isLoading) return (
    <div class="min-h-screen bg-red-50 flex items-center justify-center">
      <div class="text-center">
        <div class="h-10 w-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-red-700 font-bold">Loading Emergency Profile...</p>
      </div>
    </div>
  );

  if (error) return (
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div class="text-center max-w-md">
        <ShieldAlert class="h-16 w-16 text-slate-400 mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-slate-700">Profile Unavailable</h1>
        <p class="text-slate-500 mt-2">{error.message || 'This emergency profile could not be found or has been deactivated by the patient.'}</p>
      </div>
    </div>
  );

  const severityColor = (sev) => {
    if (sev === 'HIGH') return 'bg-red-600 text-white border-red-700';
    if (sev === 'MEDIUM') return 'bg-amber-500 text-white border-amber-600';
    return 'bg-blue-500 text-white border-blue-600';
  };

  return (
    <div class="min-h-screen bg-red-600">
      {/* Emergency Header Banner */}
      <div class="bg-red-700 text-white py-4 px-6 flex items-center justify-between shadow-lg">
        <div class="flex items-center gap-3">
          <Activity class="h-7 w-7 animate-pulse" />
          <div>
            <h1 class="font-extrabold text-xl tracking-tight">MediHist — EMERGENCY RESPONDER CARD</h1>
            <p class="text-red-200 text-xs">Critical patient information for first responders only</p>
          </div>
        </div>
        <div class="flex items-center gap-2 bg-red-800 px-3 py-1.5 rounded-lg text-xs font-bold text-red-200">
          <Clock class="h-4 w-4" />
          <span>Updated: {new Date(profile?.lastUpdated).toLocaleString()}</span>
        </div>
      </div>

      <div class="max-w-2xl mx-auto p-6 space-y-5">

        {/* Patient Name & Blood Type — Most visible */}
        <div class="bg-white rounded-3xl p-7 shadow-xl border-4 border-red-200">
          <div class="flex items-center gap-4 mb-6">
            <div class="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-extrabold border-2 border-red-200">
              {profile?.fullName?.charAt(0) || '?'}
            </div>
            <div>
              <h2 class="text-2xl font-extrabold text-slate-800">{profile?.fullName}</h2>
              <p class="text-slate-500 text-sm mt-1">MediHist Patient Profile</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-red-600 text-white p-5 rounded-2xl text-center">
              <span class="text-xs font-bold uppercase tracking-widest text-red-200 block">BLOOD TYPE</span>
              <strong class="text-4xl font-black mt-2 block">{profile?.bloodGroup || 'Unknown'}</strong>
            </div>
            <div class="bg-slate-800 text-white p-5 rounded-2xl">
              <span class="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">EMERGENCY CONTACT</span>
              <div class="flex items-center gap-2">
                <Phone class="h-5 w-5 text-green-400" />
                <strong class="font-bold text-lg">{profile?.emergencyContact || 'Not Provided'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Allergies Warning — Most Critical */}
        {profile?.allergies?.length > 0 && (
          <div class="bg-white rounded-3xl p-6 shadow-xl border-4 border-amber-300">
            <h3 class="font-extrabold text-red-700 flex items-center gap-2 mb-4 text-lg">
              <AlertTriangle class="h-6 w-6" /> KNOWN ALLERGY WARNINGS
            </h3>
            <div class="space-y-3">
              {profile.allergies.map((a, i) => (
                <div key={i} class={`flex items-center justify-between p-4 rounded-2xl border-2 font-bold ${severityColor(a.severity)}`}>
                  <div>
                    <strong class="text-lg">{a.allergen}</strong>
                    <span class="text-sm opacity-80 block">{a.type} Allergy</span>
                    {a.notes && <span class="text-xs opacity-70 block mt-1">{a.notes}</span>}
                  </div>
                  <span class="text-sm font-black px-3 py-1.5 rounded-lg bg-black/20 tracking-wider">
                    {a.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chronic Conditions */}
        {profile?.chronicConditions?.length > 0 && (
          <div class="bg-white rounded-3xl p-6 shadow-xl border border-slate-200">
            <h3 class="font-extrabold text-slate-800 flex items-center gap-2 mb-4">
              <Heart class="h-5 w-5 text-red-500" /> Active Medical Conditions
            </h3>
            <div class="space-y-2">
              {profile.chronicConditions.map((c, i) => (
                <div key={i} class="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <strong class="text-slate-800">{c.condition}</strong>
                  <span class="text-xs text-slate-500">{new Date(c.diagnosedDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Disclaimer */}
        <div class="text-center text-xs text-red-200 pb-6 space-y-1">
          <p class="font-bold">This card is generated by MediHist — Patient Digital Passport</p>
          <p>This view contains ONLY life-saving information. Personal addresses and insurance details are protected.</p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPublic;
