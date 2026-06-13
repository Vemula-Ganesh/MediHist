import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RecordsList from './pages/RecordsList';
import Medications from './pages/Medications';
import Vaccinations from './pages/Vaccinations';
import Allergies from './pages/Allergies';
import Sharing from './pages/Sharing';
import Family from './pages/Family';
import EmergencyCardView from './pages/EmergencyCard';
import EmergencyPublic from './pages/EmergencyPublic';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AuditLogs from './pages/AuditLogs';
import UserAccountsList from './pages/UserAccountsList';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-brandBg">
        <div class="flex flex-col items-center gap-3">
          <div class="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span class="text-sm font-medium text-slate-500">Loading MediHist Secure Portal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public Emergency Responder Route (Un-authenticated) */}
          <Route path="/emergency/public/:slug" element={<EmergencyPublic />} />

          {/* Patient / Doctor / Clinic routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/records" 
            element={
              <ProtectedRoute>
                <RecordsList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/medications" 
            element={
              <ProtectedRoute allowedRoles={['PATIENT', 'CAREGIVER']}>
                <Medications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vaccinations" 
            element={
              <ProtectedRoute allowedRoles={['PATIENT', 'CAREGIVER']}>
                <Vaccinations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/allergies" 
            element={
              <ProtectedRoute allowedRoles={['PATIENT', 'CAREGIVER']}>
                <Allergies />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sharing" 
            element={
              <ProtectedRoute allowedRoles={['PATIENT', 'CAREGIVER']}>
                <Sharing />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/family" 
            element={
              <ProtectedRoute allowedRoles={['PATIENT', 'CAREGIVER']}>
                <Family />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/emergency" 
            element={
              <ProtectedRoute allowedRoles={['PATIENT', 'CAREGIVER']}>
                <EmergencyCardView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />

          {/* Admin routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/audit" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AuditLogs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UserAccountsList />
              </ProtectedRoute>
            } 
          />

          {/* 404 Route */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
