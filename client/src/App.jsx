import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { GuidedDemoBar } from './components/GuidedDemoBar.jsx';
import { AiAssistantModal } from './components/AiAssistantModal.jsx';
import { Sparkles, Bot } from 'lucide-react';

import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { StudentDashboard } from './pages/StudentDashboard.jsx';
import { ExploreResources } from './pages/ExploreResources.jsx';
import { ResourceDetail } from './pages/ResourceDetail.jsx';
import { BookingRequest } from './pages/BookingRequest.jsx';
import { MyBookings } from './pages/MyBookings.jsx';
import { BookingDetail } from './pages/BookingDetail.jsx';
import { CheckinPage } from './pages/CheckinPage.jsx';
import { ReturnPage } from './pages/ReturnPage.jsx';
import { OwnerDashboard } from './pages/OwnerDashboard.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';
import { PassportPage } from './pages/PassportPage.jsx';
import { IncidentsPage } from './pages/IncidentsPage.jsx';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="py-20 text-center text-slate-400">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const [isAiOpen, setIsAiOpen] = useState(false);

  const isLoginPage = location.pathname === '/login';
  const isLandingPage = location.pathname === '/' || location.pathname === '/home';

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Navbar onOpenAi={() => setIsAiOpen(true)} />

      <div className="flex-1 flex">
        {/* Render sidebar when logged in and not on public splash or login */}
        {user && !isLoginPage && !isLandingPage && <Sidebar />}

        <main className={`flex-1 ${user && !isLoginPage && !isLandingPage ? 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full' : ''}`}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/explore" element={<ExploreResources />} />
            <Route path="/resources/:id" element={<ResourceDetail />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/book/:id" element={
              <ProtectedRoute>
                <BookingRequest />
              </ProtectedRoute>
            } />
            <Route path="/my-bookings" element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            } />
            <Route path="/bookings/:id" element={
              <ProtectedRoute>
                <BookingDetail />
              </ProtectedRoute>
            } />
            <Route path="/bookings/:id/checkin" element={
              <ProtectedRoute>
                <CheckinPage />
              </ProtectedRoute>
            } />
            <Route path="/bookings/:id/return" element={
              <ProtectedRoute>
                <ReturnPage />
              </ProtectedRoute>
            } />
            <Route path="/passport" element={
              <ProtectedRoute>
                <PassportPage />
              </ProtectedRoute>
            } />

            {/* Owner/Manager Routes */}
            <Route path="/owner/requests" element={
              <ProtectedRoute allowedRoles={['owner', 'manager', 'admin']}>
                <OwnerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/incidents" element={
              <ProtectedRoute allowedRoles={['user', 'owner', 'manager', 'admin']}>
                <IncidentsPage />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Floating Interactive AI Assistant Trigger Button */}
      <button
        onClick={() => setIsAiOpen(true)}
        className="fixed bottom-20 md:bottom-24 right-4 md:right-6 z-40 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-extrabold text-xs shadow-2xl shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/20 group"
      >
        <div className="relative">
          <Bot className="w-4 h-4 text-amber-300" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </div>
        <span>Ask AI Assistant</span>
        <Sparkles className="w-3.5 h-3.5 text-purple-200 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Floating Guided Demo Bar for hackathon judges */}
      <GuidedDemoBar />

      {/* Global AI Assistant Modal */}
      <AiAssistantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
}
