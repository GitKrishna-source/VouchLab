import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useDemoGuide } from '../context/DemoGuideContext.jsx';
import { api } from '../services/api.js';
import {
  Bell, Search, User, LogOut, Shield, ChevronDown, CheckCheck,
  Compass, ExternalLink, Sparkles, Layers, CheckCircle2, Clock
} from 'lucide-react';

export function Navbar() {
  const { user, logout, demoLogin } = useAuth();
  const { setIsOpen: setGuideOpen } = useDemoGuide();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, location.pathname]);

  async function loadNotifications() {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {
      // ignore
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    } catch (e) {}
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                ShareSpace
              </span>
              <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                VouchLab
              </span>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link
              to="/explore"
              className={`px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors ${
                location.pathname === '/explore' ? 'text-indigo-600 font-semibold bg-indigo-50/50' : ''
              }`}
            >
              Explore Equipment
            </Link>
            {user && (
              <>
                <Link
                  to="/my-bookings"
                  className={`px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors ${
                    location.pathname === '/my-bookings' ? 'text-indigo-600 font-semibold bg-indigo-50/50' : ''
                  }`}
                >
                  My Bookings
                </Link>
                <Link
                  to="/passport"
                  className={`px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors ${
                    location.pathname === '/passport' ? 'text-indigo-600 font-semibold bg-indigo-50/50' : ''
                  }`}
                >
                  Eligibility Passport
                </Link>
              </>
            )}
            {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'admin') && (
              <Link
                to="/owner/requests"
                className={`px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors ${
                  location.pathname === '/owner/requests' ? 'text-indigo-600 font-semibold bg-indigo-50/50' : ''
                }`}
              >
                Request Queue
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors ${
                  location.pathname === '/admin' ? 'text-indigo-600 font-semibold bg-indigo-50/50' : ''
                }`}
              >
                Audit & Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search equipment or try natural language ('cut acrylic')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white text-xs text-slate-900 rounded-xl border border-transparent focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
            />
          </div>
        </form>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2.5">
          {/* Guided Tour Pill */}
          <button
            onClick={() => setGuideOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Guided Demo Tour</span>
          </button>

          {user ? (
            <>
              {/* Notification Center Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 relative transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] text-indigo-600 hover:underline font-medium flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 hover:bg-slate-50 transition-colors ${
                              !n.read ? 'bg-indigo-50/30' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900">{n.title}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                            {n.link && (
                              <Link
                                to={n.link}
                                onClick={() => setShowNotifs(false)}
                                className="inline-block mt-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                              >
                                View booking details →
                              </Link>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-600/20"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                    <div className="text-[10px] font-medium text-slate-500 capitalize">{user.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-bold text-xs text-slate-900">{user.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 capitalize">
                          {user.role}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {user.category?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Quick Demo Role Switcher */}
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Quick Demo Switch
                      </div>
                      <div className="space-y-1">
                        <button
                          onClick={() => { demoLogin({ email: 'student1@demo.edu' }); setShowUserMenu(false); }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-50 flex items-center justify-between"
                        >
                          <span className="font-medium text-slate-700">Keerat (Student 1)</span>
                          <span className="text-[10px] text-indigo-600 font-semibold">User</span>
                        </button>
                        <button
                          onClick={() => { demoLogin({ email: 'owner1@demo.edu' }); setShowUserMenu(false); }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-50 flex items-center justify-between"
                        >
                          <span className="font-medium text-slate-700">Dr. Vikram Rao</span>
                          <span className="text-[10px] text-indigo-600 font-semibold">Owner</span>
                        </button>
                        <button
                          onClick={() => { demoLogin({ email: 'admin@demo.edu' }); setShowUserMenu(false); }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-50 flex items-center justify-between"
                        >
                          <span className="font-medium text-slate-700">Facilities Admin</span>
                          <span className="text-[10px] text-indigo-600 font-semibold">Admin</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); navigate('/login'); }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
              >
                Sign In / Demo
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

