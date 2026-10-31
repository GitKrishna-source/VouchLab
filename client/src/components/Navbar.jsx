import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useDemoGuide } from '../context/DemoGuideContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { api } from '../services/api.js';
import {
  Bell, Search, User, LogOut, Shield, ChevronDown, CheckCheck,
  Compass, ExternalLink, Sparkles, Layers, CheckCircle2, Clock,
  Phone, HelpCircle, ArrowRight, Laptop, Award, Cpu, Bot
} from 'lucide-react';

export function Navbar({ onOpenAi }) {
  const { user, logout, demoLogin } = useAuth();
  const { setIsOpen: setGuideOpen } = useDemoGuide();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPortalsMenu, setShowPortalsMenu] = useState(false);

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

  const isFrontpage = location.pathname === '/' || location.pathname === '/home';

  // Scroll listener to hide upper utility bar and make lower bar float with opacity
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 transition-all duration-300">
      {/* 1. TOP UTILITY STRIP - glides upward and disappears when scrolling down */}
      <div
        className={`bg-[var(--bg-main)] text-[11px] text-[var(--text-muted)] px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out overflow-hidden ${
          isScrolled
            ? 'max-h-0 opacity-0 -translate-y-full py-0 border-b-0 pointer-events-none'
            : 'max-h-14 opacity-100 translate-y-0 py-1.5 border-b border-[var(--border-main)]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left contact info */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5 font-bold text-[var(--text-main)] hover:text-indigo-500 transition-colors">
              <Phone className="w-3 h-3 text-indigo-500" />
              <span>0333 234 0011</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[var(--text-muted)]">
              <HelpCircle className="w-3 h-3 text-emerald-500" />
              <span>Campus Remote Lab Support • Active 24/7</span>
            </div>
          </div>

          {/* Right utility options */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Direct AI Assistant Trigger in Top Bar */}
            <button
              type="button"
              onClick={onOpenAi}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 font-bold transition-all text-[11px] border border-indigo-500/30"
            >
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <span>Ask AI Assistant</span>
            </button>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            {/* Portals Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPortalsMenu(!showPortalsMenu)}
                className="flex items-center gap-1.5 font-bold text-[var(--text-main)] hover:text-indigo-500 transition-colors"
              >
                <User className="w-3 h-3 text-indigo-500" />
                <span>Portals</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {showPortalsMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-main)] p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-main)]">
                    Switch Campus Portal
                  </div>
                  <div className="space-y-1 mt-1">
                    <button
                      onClick={() => { demoLogin({ email: 'student1@demo.edu' }); setShowPortalsMenu(false); navigate('/dashboard'); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[var(--bg-subtle)] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[var(--text-main)]">Student Portal</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Keerat (Alex) • Fair-Share</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">Student</span>
                    </button>

                    <button
                      onClick={() => { demoLogin({ email: 'owner1@demo.edu' }); setShowPortalsMenu(false); navigate('/owner/requests'); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[var(--bg-subtle)] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[var(--text-main)]">Lab Owner Portal</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Dr. Vance • Fab Lab Director</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">Owner</span>
                    </button>

                    <button
                      onClick={() => { demoLogin({ email: 'manager1@demo.edu' }); setShowPortalsMenu(false); navigate('/owner/requests'); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[var(--bg-subtle)] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[var(--text-main)]">Manager Desk</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Sarah • Sign-offs & Check-ins</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">Manager</span>
                    </button>

                    <button
                      onClick={() => { demoLogin({ email: 'admin@demo.edu' }); setShowPortalsMenu(false); navigate('/admin'); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[var(--bg-subtle)] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[var(--text-main)]">Central Facilities Admin</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Dean Rice • SHA-256 Ledger</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">Admin</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            {/* Theme Toggle Component (Light / Dark / Purple) */}
            <ThemeToggle compact={true} />
          </div>
        </div>
      </div>

      {/* 2. MAIN BRAND NAVIGATION BAR - Stays visible, floats up with smooth translucent opacity */}
      <div
        className={`border-b border-[var(--border-main)] transition-all duration-300 ${
          isScrolled
            ? 'navbar-scrolled'
            : 'bg-[var(--bg-surface)] shadow-sm opacity-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-2.5 flex items-center justify-between gap-4">
          
          {/* Brand / Logo (Wavenet style with geometric slash) */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              {/* Custom geometric logo mark */}
              <div className="relative flex items-center justify-center">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter select-none font-mono">
                  \\
                </span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-main)] group-hover:text-indigo-500 transition-colors">
                  vouchlab
                </span>
              </div>
              <div className="hidden xl:flex items-center">
                <span className="h-4 w-px bg-[var(--border-main)] mx-2"></span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">
                  Campus Trust Layer
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-[var(--text-muted)]">
              {/* Frontpage link always visible! */}
              <Link
                to="/"
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  isFrontpage
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                    : 'hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                Frontpage
              </Link>

              <Link
                to="/explore"
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  location.pathname === '/explore'
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                    : 'hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                Our Solutions
              </Link>

              <Link
                to="/explore?category=Equipment"
                className="px-3.5 py-2 rounded-xl hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-all flex items-center gap-1"
              >
                Equipment
              </Link>

              <Link
                to="/explore?category=Labs"
                className="px-3.5 py-2 rounded-xl hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-all flex items-center gap-1"
              >
                Labs & Spaces
              </Link>

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-3.5 py-2 rounded-xl transition-all ${
                      location.pathname === '/dashboard'
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                        : 'hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    My Dashboard
                  </Link>

                  <Link
                    to="/passport"
                    className={`px-3.5 py-2 rounded-xl transition-all ${
                      location.pathname === '/passport'
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                        : 'hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    Safety Passport
                  </Link>

                  <Link
                    to="/my-bookings"
                    className={`px-3.5 py-2 rounded-xl transition-all ${
                      location.pathname === '/my-bookings'
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                        : 'hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    My Bookings
                  </Link>

                  {(user.role === 'owner' || user.role === 'manager' || user.role === 'admin') && (
                    <Link
                      to="/owner/requests"
                      className={`px-3.5 py-2 rounded-xl transition-all ${
                        location.pathname === '/owner/requests'
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                          : 'hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      Request Queue
                    </Link>
                  )}

                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className={`px-3.5 py-2 rounded-xl transition-all ${
                        location.pathname === '/admin'
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                          : 'hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      Audit Ledger
                    </Link>
                  )}
                </>
              ) : null}
            </nav>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs mx-2">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search equipment or 'cut acrylic'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] focus:bg-[var(--bg-surface)] text-xs text-[var(--text-main)] rounded-xl border border-transparent focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </form>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* AI Assistant Pill in Main Bar */}
            <button
              type="button"
              onClick={onOpenAi}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">AI Assistant</span>
            </button>

            {/* Guided Demo Tour Pill */}
            <button
              onClick={() => setGuideOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] text-[var(--text-main)] text-xs font-bold rounded-xl border border-[var(--border-main)] transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>Demo Tour</span>
            </button>

            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] relative transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[var(--bg-surface)]">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown */}
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-main)] py-2 z-50 animate-fadeIn">
                      <div className="px-4 py-2 border-b border-[var(--border-main)] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-[var(--text-main)]">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                          >
                            <CheckCheck className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-main)]">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-3.5 hover:bg-[var(--bg-subtle)] transition-colors ${
                                !n.read ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-[var(--text-main)]">{n.title}</span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">{n.message}</p>
                              {n.link && (
                                <Link
                                  to={n.link}
                                  onClick={() => setShowNotifs(false)}
                                  className="inline-block mt-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  View details →
                                </Link>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/30"
                    />
                    <span className="hidden sm:inline-block text-xs font-bold text-[var(--text-main)]">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-main)] py-2 z-50 animate-fadeIn">
                      <div className="px-4 py-2 border-b border-[var(--border-main)]">
                        <div className="font-bold text-xs text-[var(--text-main)]">{user.name}</div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 capitalize">
                            {user.role}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {user.category?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="p-2 space-y-0.5">
                        <Link
                          to="/"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-subtle)] block"
                        >
                          View Frontpage
                        </Link>
                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)] block"
                        >
                          My Dashboard
                        </Link>
                        <Link
                          to="/passport"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)] block"
                        >
                          Safety Passport
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-[var(--border-main)]">
                        <button
                          onClick={() => { logout(); setShowUserMenu(false); navigate('/login'); }}
                          className="w-full px-4 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 font-semibold flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Public Call-to-Action with Signature Angle Badge */
              <div className="flex items-center gap-2">
                <Link
                  to="/explore"
                  className="hidden sm:inline-flex px-3.5 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-indigo-500 transition-colors"
                >
                  Explore Catalog
                </Link>

                <Link
                  to="/login"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition-all duration-300 hover:scale-[1.02]"
                >
                  <span className="flex items-center gap-2 px-3.5 py-2 text-xs">
                    <span>Demo Portal</span>
                    <span className="bg-yellow-400 text-slate-950 font-extrabold text-[10px] px-1.5 py-0.5 rounded shadow-sm group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Enter <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </span>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
