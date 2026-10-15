import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import OTPVerification from './pages/OTPVerification';

import VoterDashboard from './pages/voter/Dashboard';
import VoterElections from './pages/voter/Elections';
import VoteElection from './pages/voter/Vote';

import AdminDashboard from './pages/admin/Dashboard';
import AdminElections from './pages/admin/ManageElections';
import AdminCandidates from './pages/admin/ManageCandidates';
import AdminResults from './pages/admin/Results';
import AdminAuditLogs from './pages/admin/AuditLogs';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<OTPVerification />} />

      <Route
        path="/voter/*"
        element={
          <ProtectedRoute role="voter">
            <Navbar />
            <Routes>
              <Route path="dashboard" element={<VoterDashboard />} />
              <Route path="elections" element={<VoterElections />} />
              <Route path="elections/:id/vote" element={<VoteElection />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="admin">
            <Navbar />
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="elections" element={<AdminElections />} />
              <Route path="candidates" element={<AdminCandidates />} />
              <Route path="results" element={<AdminResults />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/voter/dashboard'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
