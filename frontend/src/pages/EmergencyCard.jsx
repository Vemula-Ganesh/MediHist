import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, api } from '../context/AuthContext';
import { QrCode, Shield, Eye, EyeOff, AlertTriangle, ShieldCheck, Phone, Activity, Heart, Syringe } from 'lucide-react';

// Simple QR code display using a free QR generation API (no npm package needed)
const QRDisplay = ({ value }) => {
  const size = 180;
  const encodedValue = encodeURIComponent(value);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&format=png&margin=10`;
  return (
    <div class="p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-inner inline-block">
      <img src={qrUrl} alt="Emergency QR Code" width={size} height={size} class="rounded-lg" />
    </div>
  );
};

const EmergencyCard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: emergencyData, isLoading } = useQuery({
    queryKey: ['emergency-card'],
    queryFn: async () => {
      const res = await api.get('/emergency');
      return res.data;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (isPublicActive) => {
      const res = await api.put('/emergency/toggle', { isPublicActive });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emergency-card'] })
  });

  if (isLoading) return (
    <div class="py-20 flex justify-center"><div class="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
  );

  const card = emergencyData?.card;
  const info = emergencyData?.criticalInfo;
  const isActive = card?.isPublicActive;
  const publicUrl = card ? `${window.location.origin}/emergency/public/${card.publicProfileSlug}` : '';

  return (
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Emergency QR Medical Card</h2>
        <p class="text-slate-500 text-sm mt-1">First responders can scan this code to access critical life-saving information</p>
      </div>

      {/* Main card layout */}
      <div class="grid lg:grid-cols-2 gap-6">

        {/* QR Card panel */}
        <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 flex flex-col items-center text-center gap-5">
          <div class="flex items-center gap-2">
            <Activity class="h-5 w-5 text-accent animate-pulse" />
            <span class="font-extrabold text-lg text-secondary tracking-tight">MediHist Emergency Card</span>
          </div>

          {card ? (
            <>
              <QRDisplay value={publicUrl} />
              <p class="text-xs text-slate-400 font-mono break-all max-w-xs">{publicUrl}</p>
              <div class={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {isActive ? <ShieldCheck class="h-4 w-4" /> : <AlertTriangle class="h-4 w-4" />}
                <span>{isActive ? 'Public Emergency Access: ACTIVE' : 'Public Access: DEACTIVATED'}</span>
              </div>
              <button
                onClick={() => toggleMutation.mutate(!isActive)}
                disabled={toggleMutation.isPending}
                class={`w-full py-3 rounded-xl font-bold text-sm transition-standard ${isActive ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'}`}
              >
                {toggleMutation.isPending ? 'Updating...' : isActive ? 'Deactivate Public Profile' : 'Activate Public Profile'}
              </button>
            </>
          ) : (
            <div class="py-8 text-slate-400 text-sm">Loading emergency profile...</div>
          )}
        </div>

        {/* Emergency Info Preview */}
        <div class="space-y-4">
          <div class="bg-red-50 border border-red-200 rounded-2xl p-5">
            <h3 class="font-bold text-red-800 flex items-center gap-2 mb-4">
              <Heart class="h-5 w-5" /> Critical Responder Information
            </h3>
            <div class="space-y-3">
              <div class="bg-white rounded-xl p-4 border border-red-100">
                <span class="text-[10px] text-red-500 font-bold uppercase tracking-wider block">Blood Type</span>
                <strong class="text-2xl font-extrabold text-red-700 mt-1 block">{info?.bloodGroup || 'Not Set'}</strong>
              </div>
              <div class="bg-white rounded-xl p-4 border border-red-100">
                <span class="text-[10px] text-red-500 font-bold uppercase tracking-wider block">Emergency Contact</span>
                <div class="flex items-center gap-2 mt-1">
                  <Phone class="h-4 w-4 text-slate-400" />
                  <strong class="font-bold text-slate-800">{info?.emergencyContact || 'Not Configured'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Allergies summary */}
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h4 class="font-bold text-slate-800 flex items-center gap-2 mb-3 text-sm">
              <AlertTriangle class="h-4 w-4 text-amber-500" /> Active Allergy Alerts
            </h4>
            {info?.allergies?.length === 0 ? (
              <p class="text-slate-400 text-xs">No allergies recorded — update your Allergies profile to protect yourself</p>
            ) : (
              <div class="space-y-2">
                {info?.allergies?.map((a, i) => (
                  <div key={i} class={`flex items-center justify-between p-2.5 rounded-xl text-xs border ${a.severity === 'HIGH' ? 'bg-red-50 border-red-200 text-red-800' : a.severity === 'MEDIUM' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                    <strong>{a.allergen}</strong>
                    <span class="font-bold uppercase tracking-wide">{a.severity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conditions summary */}
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h4 class="font-bold text-slate-800 flex items-center gap-2 mb-3 text-sm">
              <Activity class="h-4 w-4 text-primary" /> Active Chronic Conditions
            </h4>
            {info?.conditions?.length === 0 ? (
              <p class="text-slate-400 text-xs">No active diagnoses — update your clinical profile to complete your emergency card</p>
            ) : (
              <div class="flex flex-wrap gap-2">
                {info?.conditions?.map((c, i) => (
                  <span key={i} class="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold">{c}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyCard;
