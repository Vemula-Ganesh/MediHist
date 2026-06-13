import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Calendar, 
  Settings, 
  Activity, 
  LogOut, 
  UserSquare2, 
  Menu, 
  X, 
  Users, 
  Share2, 
  ShieldAlert, 
  HeartHandshake,
  ActivitySquare,
  AlertTriangle
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, selectedProfileId, selectedProfileName, switchProfileScope } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role || 'PATIENT';

  // Navigation Links based on role
  const getNavLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Analytics', path: '/admin', icon: LayoutDashboard },
          { name: 'Audit Logs', path: '/admin/audit', icon: ShieldAlert },
          { name: 'User Accounts', path: '/admin/users', icon: Users },
          { name: 'Profile Settings', path: '/profile', icon: Settings }
        ];
      case 'DOCTOR':
        return [
          { name: 'Doctor Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Patients Timeline', path: '/records', icon: FileSpreadsheet },
          { name: 'Appointments', path: '/appointments', icon: Calendar },
          { name: 'Clinical Profile', path: '/profile', icon: UserSquare2 }
        ];
      case 'HOSPITAL':
        return [
          { name: 'Facility Hub', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Submit Records', path: '/records/upload', icon: FileSpreadsheet },
          { name: 'Physician Roster', path: '/profile', icon: UserSquare2 }
        ];
      case 'CAREGIVER':
      case 'PATIENT':
      default:
        return [
          { name: 'Health Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Medical Timeline', path: '/records', icon: FileSpreadsheet },
          { name: 'Prescriptions & Meds', path: '/medications', icon: Activity },
          { name: 'Immunizations', path: '/vaccinations', icon: HeartHandshake },
          { name: 'Allergies Profile', path: '/allergies', icon: ShieldAlert },
          { name: 'Doctor Sharing', path: '/sharing', icon: Share2 },
          { name: 'Family Accounts', path: '/family', icon: Users },
          { name: 'Emergency Card', path: '/emergency', icon: ActivitySquare },
          { name: 'My Profile', path: '/profile', icon: UserSquare2 }
        ];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeClass = "bg-primary text-white font-medium shadow-md shadow-primary/20";
  const inactiveClass = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

  return (
    <div class="min-h-screen bg-brandBg flex flex-col md:flex-row">
      {/* Mobile Top Navigation */}
      <header class="md:hidden bg-secondary text-white px-4 py-3 flex items-center justify-between shadow-md z-30">
        <div class="flex items-center gap-2">
          <Activity class="h-6 w-6 text-accent" />
          <span class="font-bold text-lg tracking-tight">MediHist</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} class="p-1.5 hover:bg-slate-800 rounded-lg">
          {mobileMenuOpen ? <X class="h-6 w-6" /> : <Menu class="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div class="md:hidden fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <aside class="w-64 bg-white h-full flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div class="p-4 border-b flex items-center gap-2 bg-secondary text-white">
              <Activity class="h-6 w-6 text-accent" />
              <span class="font-bold text-lg">MediHist</span>
            </div>
            
            <nav class="flex-1 p-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    class={`flex items-center gap-3 px-3 py-2.5 rounded-medihist transition-standard ${isActive ? activeClass : inactiveClass}`}
                  >
                    <Icon class="h-5 w-5" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div class="p-4 border-t">
              <button onClick={handleLogout} class="w-full flex items-center gap-3 px-3 py-2.5 rounded-medihist text-red-600 hover:bg-red-50 transition-standard">
                <LogOut class="h-5 w-5" />
                <span class="font-medium">Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside class="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 shadow-sm z-20">
        <div class="p-6 border-b flex items-center gap-3 bg-secondary text-white">
          <Activity class="h-7 w-7 text-accent animate-pulse" />
          <div>
            <h1 class="font-bold text-lg tracking-tight">MediHist</h1>
            <span class="text-xs text-slate-400">Digital Patient Passport</span>
          </div>
        </div>

        <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                class={`flex items-center gap-3 px-3.5 py-2.5 rounded-medihist transition-standard ${isActive ? activeClass : inactiveClass}`}
              >
                <Icon class="h-5 w-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div class="p-4 border-t border-slate-100 bg-slate-50">
          <div class="flex items-center gap-3 mb-3">
            <div class="h-9 w-9 bg-primary/10 text-primary flex items-center justify-center font-bold rounded-full border border-primary/20">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div class="overflow-hidden">
              <p class="font-semibold text-sm truncate">{user?.fullName || 'User Profile'}</p>
              <p class="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} class="w-full flex items-center justify-center gap-2 py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 font-medium text-sm rounded-medihist transition-standard">
            <LogOut class="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Canvas */}
      <main class="flex-1 flex flex-col min-w-0">
        {/* Profile Context Delegation Warning Header Banner */}
        {selectedProfileId && (
          <div class="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-amber-800 text-sm font-medium z-10 animate-fade-in">
            <div class="flex items-center gap-2">
              <AlertTriangle class="h-5 w-5 text-amber-500 shrink-0" />
              <span>
                Viewing delegated timeline of: <strong>{selectedProfileName || 'Dependent Profile'}</strong>
              </span>
            </div>
            <button
              onClick={() => switchProfileScope(user.id)}
              class="text-xs bg-amber-600 text-white hover:bg-amber-700 px-2.5 py-1 rounded-md transition-standard shadow-sm"
            >
              Switch Back
            </button>
          </div>
        )}

        <div class="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
