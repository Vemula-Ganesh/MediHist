import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => (
  <div class="min-h-screen bg-brandBg flex items-center justify-center p-6">
    <div class="text-center max-w-md">
      <div class="relative mb-8">
        <span class="text-9xl font-black text-slate-100 select-none block">404</span>
        <div class="absolute inset-0 flex items-center justify-center">
          <Activity class="h-16 w-16 text-primary/30 animate-pulse" />
        </div>
      </div>
      <h1 class="text-2xl font-extrabold text-slate-800 mb-2">Page Not Found</h1>
      <p class="text-slate-500 mb-8 leading-relaxed">
        The medical record or page you're looking for doesn't exist in this system. It may have been moved, deleted, or you may have typed an incorrect URL.
      </p>
      <div class="flex items-center justify-center gap-3">
        <Link to="/" class="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-medihist shadow-md shadow-primary/20 transition-standard text-sm">
          <Home class="h-4 w-4" /> Go Home
        </Link>
        <button onClick={() => window.history.back()} class="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold px-5 py-2.5 rounded-medihist transition-standard text-sm">
          <ArrowLeft class="h-4 w-4" /> Go Back
        </button>
      </div>
    </div>
  </div>
);

export default NotFound;
