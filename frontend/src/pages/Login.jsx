import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const user = await login(email, password);
      
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
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
            <Activity class="h-8 w-8 text-accent animate-pulse" />
            <span class="font-extrabold text-xl tracking-tight">MediHist</span>
          </div>

          <div class="space-y-4 my-8 relative z-10">
            <h2 class="text-3xl font-extrabold leading-tight">Your Lifelong Health Passport.</h2>
            <p class="text-slate-300 text-sm leading-relaxed">
              MediHist centralizes your complete medical records history, giving you full control over clinic sharing permissions and emergency diagnostics visibility.
            </p>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-400 relative z-10">
            <ShieldCheck class="h-4 w-4 text-accent" />
            <span>End-to-End Field Encryption (AES-256)</span>
          </div>
        </div>

        {/* Input Form Panel */}
        <div class="p-8 md:p-12 flex flex-col justify-center">
          <div class="mb-8">
            <h3 class="text-2xl font-bold text-slate-800">Welcome Back</h3>
            <p class="text-slate-500 text-sm mt-1">Sign in to access your digital health record</p>
          </div>

          {error && (
            <div class="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl flex items-center gap-2">
              <AlertCircle class="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} class="space-y-5">
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
                  class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-medihist focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-standard text-sm"
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
                  class="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-medihist focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-standard text-sm"
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
              class="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-medihist shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-standard flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <div class="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p class="text-center text-sm text-slate-500 mt-8">
            Don't have an account?{' '}
            <Link to="/register" class="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
