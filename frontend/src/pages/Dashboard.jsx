import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth, api } from '../context/AuthContext';
import { 
  FileText, 
  ShieldAlert, 
  QrCode, 
  Activity, 
  UserCircle, 
  TrendingUp,
  Brain,
  AlertTriangle,
  ArrowRight,
  ClipboardList
} from 'lucide-react';

const Dashboard = () => {
  const { user, selectedProfileId } = useAuth();
  const navigate = useNavigate();

  const queryUserId = selectedProfileId || user?.id;

  // 1. Fetch Profile
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ['profile', queryUserId],
    queryFn: async () => {
      const res = await api.get(`/profile?userId=${queryUserId}`);
      return res.data;
    },
    retry: false
  });

  // 2. Fetch Allergies
  const { data: allergies = [] } = useQuery({
    queryKey: ['allergies', queryUserId],
    queryFn: async () => {
      const res = await api.get(`/profile/allergies?userId=${queryUserId}`);
      return res.data;
    }
  });

  // 3. Fetch Latest Records
  const { data: records = [] } = useQuery({
    queryKey: ['records', queryUserId],
    queryFn: async () => {
      const res = await api.get(`/records?userId=${queryUserId}`);
      return res.data;
    }
  });

  // 4. Fetch AI Insights
  const { data: aiInsights, isLoading: isAiLoading } = useQuery({
    queryKey: ['ai-insights', queryUserId],
    queryFn: async () => {
      const res = await api.get(`/ai/timeline-insights?userId=${queryUserId}`);
      return res.data;
    },
    enabled: records.length > 0 // Only run if records exist
  });

  const hasAllergies = allergies.length > 0;
  const severeAllergies = allergies.filter(a => a.severity === 'HIGH');

  // Loading state
  if (isProfileLoading && !profileError) {
    return (
      <div class="h-96 flex items-center justify-center">
        <div class="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Profile setup required
  if (profileError && profileError.response?.status === 404) {
    return (
      <div class="max-w-2xl mx-auto text-center py-16 px-4 bg-white rounded-3xl border border-slate-100 shadow-sm mt-8">
        <UserCircle class="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h2 class="text-2xl font-bold text-slate-800">Initialize Your Profile</h2>
        <p class="text-slate-500 mt-2 max-w-md mx-auto">
          Welcome to MediHist! Please complete your digital patient profile to begin tracking medications, scanning QR cards, and generating AI summaries.
        </p>
        <button
          onClick={() => navigate('/profile')}
          class="mt-6 bg-primary text-white font-semibold px-6 py-3 rounded-medihist shadow-md shadow-primary/20 hover:bg-primary-dark transition-standard"
        >
          Complete Profile Setup
        </button>
      </div>
    );
  }

  return (
    <div class="space-y-6 animate-fade-in">
      
      {/* Top Banner Greeting */}
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">
            Hello, {profile?.fullName || user?.email}
          </h2>
          <p class="text-slate-500 text-sm mt-1">Here is a summary of your digital health passport</p>
        </div>
        <div class="bg-white px-4 py-2 border border-slate-100 rounded-xl flex items-center gap-3 shadow-sm">
          <div class="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-xs font-semibold text-slate-500">HEALTH ID: <strong class="text-slate-800">{profile?.healthId}</strong></span>
        </div>
      </div>

      {/* Allergies Highlight Warning Banner (Severe) */}
      {severeAllergies.length > 0 && (
        <div class="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm animate-bounce-subtle">
          <AlertTriangle class="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 class="font-bold text-sm">CRITICAL WARNING: Severe Allergies Active</h4>
            <p class="text-xs text-red-700 mt-1">
              Patient exhibits severe hypersensitivity triggers to:{' '}
              <strong class="text-red-950 font-bold">
                {severeAllergies.map(a => `${a.allergen} (${a.allergyType})`).join(', ')}
              </strong>. This data is pinned to your emergency QR passport.
            </p>
          </div>
        </div>
      )}

      {/* Quick Access Actions Cards */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/records" class="bg-white p-5 rounded-2xl border border-slate-100 hover:border-primary/30 shadow-sm hover:shadow-md transition-standard group">
          <div class="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-105 transition-standard">
            <FileText class="h-5 w-5" />
          </div>
          <h4 class="font-bold text-sm text-slate-800">Upload Record</h4>
          <p class="text-xs text-slate-500 mt-1">Add reports or scripts</p>
        </Link>

        <Link to="/emergency" class="bg-white p-5 rounded-2xl border border-slate-100 hover:border-primary/30 shadow-sm hover:shadow-md transition-standard group">
          <div class="h-10 w-10 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600 mb-4 group-hover:scale-105 transition-standard">
            <QrCode class="h-5 w-5" />
          </div>
          <h4 class="font-bold text-sm text-slate-800">QR Emergency Card</h4>
          <p class="text-xs text-slate-500 mt-1">Access public responder page</p>
        </Link>

        <Link to="/sharing" class="bg-white p-5 rounded-2xl border border-slate-100 hover:border-primary/30 shadow-sm hover:shadow-md transition-standard group">
          <div class="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-105 transition-standard">
            <ClipboardList class="h-5 w-5" />
          </div>
          <h4 class="font-bold text-sm text-slate-800">Doctor Access</h4>
          <p class="text-xs text-slate-500 mt-1">Manage clinical consents</p>
        </Link>

        <Link to="/profile" class="bg-white p-5 rounded-2xl border border-slate-100 hover:border-primary/30 shadow-sm hover:shadow-md transition-standard group">
          <div class="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-105 transition-standard">
            <UserCircle class="h-5 w-5" />
          </div>
          <h4 class="font-bold text-sm text-slate-800">Edit Profile</h4>
          <p class="text-xs text-slate-500 mt-1">Update encrypted PII info</p>
        </Link>
      </div>

      {/* Grid: Health indicators & AI trends */}
      <div class="grid lg:grid-cols-3 gap-6">

        {/* Vital stats / Profile card */}
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
          <h3 class="font-bold text-base text-slate-800">Vital & Body Statistics</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-slate-50 rounded-2xl">
              <span class="text-xs text-slate-400 font-medium block">Blood Type</span>
              <strong class="text-lg font-bold text-slate-800 mt-1 block">{profile?.bloodGroup || 'N/A'}</strong>
            </div>
            <div class="p-4 bg-slate-50 rounded-2xl">
              <span class="text-xs text-slate-400 font-medium block">Age / DOB</span>
              <strong class="text-lg font-bold text-slate-800 mt-1 block truncate">{profile?.dob || 'N/A'}</strong>
            </div>
            <div class="p-4 bg-slate-50 rounded-2xl">
              <span class="text-xs text-slate-400 font-medium block">Height</span>
              <strong class="text-lg font-bold text-slate-800 mt-1 block">{profile?.height || 'N/A'}</strong>
            </div>
            <div class="p-4 bg-slate-50 rounded-2xl">
              <span class="text-xs text-slate-400 font-medium block">Weight</span>
              <strong class="text-lg font-bold text-slate-800 mt-1 block">{profile?.weight || 'N/A'}</strong>
            </div>
          </div>

          <div class="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
            <span class="text-xs text-primary font-semibold block">Emergency Contact</span>
            <p class="font-bold text-sm text-slate-800 mt-1.5">{profile?.emergencyContact || 'None Configured'}</p>
          </div>
        </div>

        {/* AI Medical Assistant & Insights */}
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="h-8 w-8 bg-primary/10 text-primary flex items-center justify-center rounded-lg">
                <Brain class="h-4.5 w-4.5" />
              </div>
              <h3 class="font-bold text-base text-slate-800">MediHist AI Assistant</h3>
            </div>

            {records.length === 0 ? (
              <div class="text-center py-8 text-slate-400 text-sm">
                <p>Upload medical records to unlock health trend predictions, risk indicators, and medication logs.</p>
              </div>
            ) : isAiLoading ? (
              <div class="space-y-3 py-4">
                <div class="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
                <div class="h-4 bg-slate-100 rounded animate-pulse w-5/6"></div>
                <div class="h-4 bg-slate-100 rounded animate-pulse w-2/3"></div>
              </div>
            ) : (
              <div class="space-y-4 text-sm">
                <div>
                  <h5 class="font-semibold text-slate-700 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-1">
                    <TrendingUp class="h-4 w-4 text-primary" /> Health Trends & Progress
                  </h5>
                  <p class="text-slate-600 leading-relaxed text-xs">{aiInsights?.healthTrends || 'No trends identified yet.'}</p>
                </div>
                <div>
                  <h5 class="font-semibold text-slate-700 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-1">
                    <ShieldAlert class="h-4 w-4 text-cyan-600" /> Active Risk Adjustments
                  </h5>
                  <p class="text-slate-600 leading-relaxed text-xs">{aiInsights?.riskIndicators || 'No active clinical warnings.'}</p>
                </div>
                <div>
                  <h5 class="font-semibold text-slate-700 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-1">
                    <Activity class="h-4 w-4 text-emerald-600" /> Medication Compliance
                  </h5>
                  <p class="text-slate-600 leading-relaxed text-xs">{aiInsights?.medicationAdherence || 'Standard regimen monitoring active.'}</p>
                </div>
              </div>
            )}
          </div>

          <div class="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-xs">
            <span class="text-slate-400">Powered by OpenAI GPT-4o-mini</span>
            <Link to="/records" class="text-primary hover:underline font-semibold flex items-center gap-1">
              <span>View full medical timeline</span> <ArrowRight class="h-3 w-3" />
            </Link>
          </div>
        </div>

      </div>

      {/* Latest Timeline card */}
      <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-base text-slate-800">Recent Medical Timeline</h3>
          <Link to="/records" class="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
            <span>Explore all {records.length} files</span> <ArrowRight class="h-3 w-3" />
          </Link>
        </div>

        {records.length === 0 ? (
          <div class="text-center py-10 text-slate-400 text-sm">
            <p>Your timeline is empty. Upload your first laboratory result or prescription to start your passport.</p>
          </div>
        ) : (
          <div class="space-y-4">
            {records.slice(0, 3).map((rec) => (
              <div key={rec.id} class="flex items-start gap-4 p-4 border border-slate-50 rounded-2xl hover:bg-slate-50 transition-standard">
                <div class="h-9 w-9 bg-slate-100 text-slate-600 flex items-center justify-center rounded-xl font-bold shrink-0">
                  {rec.category?.name?.charAt(0)}
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-sm text-slate-800 truncate">{rec.title}</h4>
                  <p class="text-xs text-slate-500 mt-0.5">{rec.category?.name} • {new Date(rec.uploadDate).toLocaleDateString()}</p>
                  <p class="text-xs text-slate-600 mt-2 line-clamp-1">{rec.summary || rec.description}</p>
                </div>
                <div class="text-xs bg-primary/5 text-primary border border-primary/10 px-2.5 py-1 rounded-md">
                  {rec.recordType}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
