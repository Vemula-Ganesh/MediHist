import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

const OTPVerification = () => {
  const { verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const purpose = location.state?.purpose || 'Verification';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes (600s)

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      await verifyOTP(email, code);
      setSuccess('Verification successful! Redirecting to login page...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        
        <div class="flex flex-col items-center text-center mb-8">
          <div class="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <KeyRound class="h-6 w-6" />
          </div>
          <h2 class="text-2xl font-bold text-slate-800">Verify Your Identity</h2>
          <p class="text-slate-500 text-sm mt-1">
            We have sent a security verification code to <strong class="text-slate-800">{email}</strong>
          </p>
        </div>

        {error && (
          <div class="mb-5 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl flex items-center gap-2">
            <AlertCircle class="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div class="mb-5 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded-r-xl flex items-center gap-2">
            <CheckCircle2 class="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-6">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Enter 6-Digit Passcode
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              class="w-full text-center tracking-widest text-3xl font-bold py-3.5 bg-slate-50 border border-slate-200 rounded-medihist focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-standard"
            />
          </div>

          <div class="text-center text-sm text-slate-500">
            {timer > 0 ? (
              <span>Code expires in: <strong class="text-slate-700">{formatTime(timer)}</strong></span>
            ) : (
              <span class="text-red-500 font-medium">OTP Code Expired</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || timer <= 0}
            class="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-medihist shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-standard flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div class="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Confirm Passcode'
            )}
          </button>
        </form>

        <div class="text-center mt-6">
          <button
            onClick={() => navigate('/login')}
            class="text-xs text-slate-400 hover:text-slate-600 transition-standard hover:underline"
          >
            Back to login
          </button>
        </div>

      </div>
    </div>
  );
};

export default OTPVerification;
