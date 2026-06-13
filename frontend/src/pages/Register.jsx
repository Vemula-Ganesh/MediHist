import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Register = () => {
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      await registerUser(email, password, role);
      // Account created and auto-logged in — go straight to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div class="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2">
        
        {/* Branding Sidebar */}
        <div class="bg-secondary text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div class="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
          <div class="absolute -left-12 -top-12 w-48 h-48 bg-accent/20 rounded-full blur-2xl"></div>

          <div class="flex items-center gap-2 relative z-10">
            <Activity class="h-8 w-8 text-accent" />
            <span class="font-extrabold text-xl tracking-tight">MediHist</span>
          </div>

          <div class="space-y-4 my-8 relative z-10">
            <h2 class="text-3xl font-extrabold leading-tight">Create your secure digital Health Wallet.</h2>
            <p class="text-slate-300 text-sm leading-relaxed">
              MediHist uses military-grade end-to-end field encryption to shield your records and diagnostic results.
            </p>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-400 relative z-10">
            <ShieldCheck class="h-4 w-4 text-accent" />
            <span>AES-256 Record Protection</span>
          </div>
        </div>

        {/* Input Form Panel */}
        <div class="p-8 md:p-12 flex flex-col justify-center">
          <div class="mb-6">
            <h3 class="text-2xl font-bold text-slate-800">Get Started</h3>
            <p class="text-slate-500 text-sm mt-1">Register your secure medical passport</p>
          </div>

          {error && (
            <div class="mb-5 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl flex items-center gap-2">
              <AlertCircle class="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Register As</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('PATIENT')}
                  class={`py-2 px-3 border rounded-xl font-medium text-xs transition-standard ${role === 'PATIENT' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole('DOCTOR')}
                  class={`py-2 px-3 border rounded-xl font-medium text-xs transition-standard ${role === 'DOCTOR' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Practitioner
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail class="h-5 w-5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  class="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-medihist focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-standard text-sm"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock class="h-5 w-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  class="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-medihist focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-standard text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-standard"
                >
                  {showPassword ? <EyeOff class="h-5 w-5" /> : <Eye class="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              class="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-medihist shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-standard flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-5"
            >
              {loading ? (
                <div class="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p class="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" class="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
