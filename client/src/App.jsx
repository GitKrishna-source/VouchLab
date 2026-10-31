import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { GuidedDemoBar } from './components/GuidedDemoBar.jsx';

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

  const isPublicLanding = location.pathname === '/' && !user;
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        {/* Render sidebar when logged in and not on public splash or login */}
        {user && !isLoginPage && <Sidebar />}

        <main className={`flex-1 ${user && !isLoginPage ? 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full' : ''}`}>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
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

      {/* Floating Guided Demo Bar for hackathon judges */}
      <GuidedDemoBar />
    </div>
  );
}

