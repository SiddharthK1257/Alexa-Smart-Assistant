import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  CheckSquare,
  Bell,
  FileText,
  Cpu,
  User,
  LogOut,
  Sparkles,
  History,
  Sliders,
  Home,
  Menu,
  X,
  Music,
  Utensils,
  Calendar as CalendarIcon,
  Hotel,
  UtensilsCrossed,
  Wifi,
  Play,
  Pause,
  Disc3,
} from 'lucide-react';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { LandingPage } from './components/LandingPage';
import { ChatView } from './components/ChatView';
import { ConversationSidebar } from './components/ConversationSidebar';
import { TaskManager } from './components/TaskManager';
import { ReminderManager } from './components/ReminderManager';
import { NoteManager } from './components/NoteManager';
import { MCPInspector } from './components/MCPInspector';
import { ActivityLogView } from './components/ActivityLogView';
import { SettingsView } from './components/SettingsView';
import { PrivacyView } from './components/PrivacyView';
import { TermsView } from './components/TermsView';
import { AuthModal } from './components/AuthModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MusicPlayerView } from './components/MusicPlayerView';
import { RecipeHubView } from './components/RecipeHubView';
import { DevicesHubView } from './components/DevicesHubView';
import { OpenTableView } from './components/OpenTableView';
import { HotelsView } from './components/HotelsView';
import { CalendarView } from './components/CalendarView';
import { AlexaBeastSplash } from './components/AlexaBeastSplash';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';

// Inner shell component to access router hooks
const AppShell: React.FC = () => {
  const { user, profile, signOut, quickDemoLogin, isPasswordRecovery, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Beast Font Opening Splash State (Opens in fade showing Alexa in beast font with animations)
  const [showBeastSplash, setShowBeastSplash] = useState(true);

  // Quick Status Bar Live States
  const [isOpenTableLinked, setIsOpenTableLinked] = useState(false);
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<any | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Listen to music status updates from voice or assistant
  useEffect(() => {
    const handleMusicUpdate = (e?: any) => {
      if (e?.detail?.current_track) {
        setCurrentPlayingTrack(e.detail.current_track);
        setIsMusicPlaying(e.detail.is_playing ?? true);
      } else if (token) {
        api.getMusicStatus(token).then(res => {
          setCurrentPlayingTrack(res.current_track);
          setIsMusicPlaying(res.is_playing);
        }).catch(() => {});
      }
    };
    window.addEventListener('music-status-updated', handleMusicUpdate);
    return () => window.removeEventListener('music-status-updated', handleMusicUpdate);
  }, [token]);

  useEffect(() => {
    if (token) {
      api.getOpenTableAccount(token).then(res => setIsOpenTableLinked(res.isLinked)).catch(() => {});
      api.getMusicStatus(token).then(res => {
        setCurrentPlayingTrack(res.current_track);
        setIsMusicPlaying(res.is_playing);
      }).catch(() => {});
    }
  }, [token, location.pathname]);

  // Automatically open auth modal when password recovery hash is detected
  useEffect(() => {
    if (isPasswordRecovery) {
      setIsAuthModalOpen(true);
    }
  }, [isPasswordRecovery]);

  const primaryNavItems = [
    { label: 'Assistant', path: '/app', icon: Bot },
    { label: 'Calendar', path: '/app/calendar', icon: CalendarIcon },
    { label: 'Music', path: '/app/music', icon: Music },
    { label: 'Recipes & Safety', path: '/app/recipes', icon: Utensils },
    { label: 'Devices', path: '/app/devices', icon: Wifi },
    { label: 'OpenTable', path: '/app/dining', icon: UtensilsCrossed },
    { label: 'Hotels', path: '/app/hotels', icon: Hotel },
  ];

  const secondaryNavItems = [
    { label: 'Tasks', path: '/app/tasks', icon: CheckSquare },
    { label: 'Reminders', path: '/app/reminders', icon: Bell },
    { label: 'Notes', path: '/app/notes', icon: FileText },
    { label: 'Activity', path: '/app/activity', icon: History },
    { label: 'MCP Spec', path: '/app/mcp', icon: Cpu },
    { label: 'Settings', path: '/app/settings', icon: Sliders },
  ];

  const allNavItems = [
    { label: 'Home', path: '/', icon: Home },
    ...primaryNavItems,
    ...secondaryNavItems,
  ];

  const handleLaunchAssistant = () => {
    navigate('/app');
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    navigate('/app');
  };

  const toggleHeaderMusic = async () => {
    const nextState = !isMusicPlaying;
    setIsMusicPlaying(nextState);
    if (token) {
      api.controlMusic(nextState ? 'resume' : 'pause', undefined, token).catch(console.error);
    }
  };

  const isAppRoute = location.pathname.startsWith('/app');

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-gray-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 0. Alexa Beast Font Figma Opening Animation */}
      {showBeastSplash && (
        <AlexaBeastSplash onComplete={() => setShowBeastSplash(false)} />
      )}

      {/* 1. Independent Prototype Notice */}
      <DisclaimerBanner />

      {/* 2. Top Navigation Bar (Figma Alexa+ Design) */}
      <header className="border-b border-gray-800/80 bg-[#111827]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand with Iridescent Orb */}
          <Link
            to="/"
            onClick={() => setShowBeastSplash(true)}
            className="flex items-center gap-3 group shrink-0 cursor-pointer"
            title="Click to replay Alexa Beast Opening Animation"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 animate-pulse-slow p-0.5 group-hover:scale-105 transition-transform shadow-[0_0_14px_rgba(0,202,255,0.4)]">
                <div className="w-full h-full bg-[#0B0F19] rounded-full flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#00CAFF]" />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center">
                  Alexa<span className="text-cyan-400">+</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 group-hover:bg-cyan-500/20 transition-colors">
                  Beast Edition
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links (Primary Alexa+ Features) */}
          <nav className="hidden xl:flex items-center gap-1 bg-[#0B0F19] border border-gray-800 p-1 rounded-2xl text-xs overflow-x-auto">
            {primaryNavItems.map(item => {
              const Icon = item.icon;
              const isActive =
                item.path === '/app'
                  ? location.pathname === '/app'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions & Live Widget Status */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Header Mini Music Pill (Visible when on app) */}
            {user && currentPlayingTrack && (
              <div
                onClick={() => navigate('/app/music')}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#0B0F19] border border-cyan-500/30 hover:border-cyan-400 text-xs cursor-pointer transition-all"
                title="Open Music Player"
              >
                <Disc3 className={`w-3.5 h-3.5 text-cyan-400 ${isMusicPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                <span className="text-[11px] font-semibold text-gray-200 truncate max-w-[100px]">
                  {currentPlayingTrack.title}
                </span>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    toggleHeaderMusic();
                  }}
                  className="p-1 rounded-full text-cyan-400 hover:bg-cyan-500/20"
                >
                  {isMusicPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                </button>
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-gray-200">
                    {profile?.display_name || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Echo Studio Active
                  </span>
                </div>

                <button
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-[#1F2937] hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors border border-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => quickDemoLogin()}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F2937] hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Instant Demo</span>
                </button>

                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs transition-all shadow-md active:scale-95"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-[#1F2937] border border-gray-700 text-gray-400 hover:text-gray-200"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Secondary Alexa+ Echo Ecosystem Bar (Figma UX Spec) */}
        {isAppRoute && (
          <div className="border-t border-gray-800/60 bg-[#0B0F19]/90 px-4 py-1.5 text-xs">
            <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00CAFF] animate-pulse" />
                  Echo Studio (Living Room)
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-[11px] text-gray-400 hidden md:inline">
                  Spatial Audio 96kHz
                </span>
                <span className="text-gray-600 hidden md:inline">•</span>
                <Link
                  to="/app/dining"
                  className={`text-[11px] flex items-center gap-1 font-mono transition-colors ${
                    isOpenTableLinked ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <UtensilsCrossed className="w-3 h-3" />
                  <span>{isOpenTableLinked ? 'OpenTable VIP Linked' : 'Connect OpenTable'}</span>
                </Link>
              </div>

              {/* Quick Sub-navigation Chips */}
              <div className="flex items-center gap-2 shrink-0 text-[11px]">
                {secondaryNavItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-2 py-0.5 rounded-lg transition-colors ${
                      location.pathname.startsWith(item.path)
                        ? 'text-cyan-300 font-bold bg-cyan-500/10'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-gray-800 bg-[#111827] px-4 py-3 space-y-1">
            {allNavItems.map(item => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* 3. Main Application Routing Area */}
      <main className="flex-1 flex flex-col min-h-0">
        <Routes>
          {/* Landing Marketing Page */}
          <Route
            path="/"
            element={
              <LandingPage
                onLaunch={handleLaunchAssistant}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            }
          />

          {/* Assistant Conversation Workspace with History Sidebar */}
          <Route
            path="/app"
            element={
              <ProtectedRoute fallbackTitle="Sign In to Access Alexa+ Assistant">
                <div className="flex-1 flex overflow-hidden h-[calc(100vh-8.5rem)]">
                  <ConversationSidebar
                    currentConversationId={currentConversationId}
                    onSelectConversation={id => setCurrentConversationId(id)}
                    onNewConversation={handleNewConversation}
                    isOpen={isSidebarOpen}
                    onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
                  />
                  <div className="flex-1 flex flex-col overflow-y-auto">
                    <ChatView
                      currentConversationId={currentConversationId}
                      onConversationCreated={id => setCurrentConversationId(id)}
                    />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* 📅 Unified Calendar View */}
          <Route
            path="/app/calendar"
            element={
              <ProtectedRoute fallbackTitle="Calendar Schedule Requires Authentication">
                <CalendarView />
              </ProtectedRoute>
            }
          />

          {/* 🎵 Music Player View */}
          <Route
            path="/app/music"
            element={
              <ProtectedRoute fallbackTitle="Music Player Requires Authentication">
                <MusicPlayerView />
              </ProtectedRoute>
            }
          />

          {/* 🍳 Kitchen Recipes & Safety View */}
          <Route
            path="/app/recipes"
            element={
              <ProtectedRoute fallbackTitle="Kitchen Recipes Require Authentication">
                <RecipeHubView />
              </ProtectedRoute>
            }
          />

          {/* 📱 Smart Devices Hub View */}
          <Route
            path="/app/devices"
            element={
              <ProtectedRoute fallbackTitle="Smart Devices Require Authentication">
                <DevicesHubView />
              </ProtectedRoute>
            }
          />

          {/* 🍽️ OpenTable Dining View */}
          <Route
            path="/app/dining"
            element={
              <ProtectedRoute fallbackTitle="OpenTable Dining Requires Authentication">
                <OpenTableView />
              </ProtectedRoute>
            }
          />

          {/* 🏨 Hotels & Travel Concierge View */}
          <Route
            path="/app/hotels"
            element={
              <ProtectedRoute fallbackTitle="Hotels & Travel Require Authentication">
                <HotelsView />
              </ProtectedRoute>
            }
          />

          {/* Task Manager View */}
          <Route
            path="/app/tasks"
            element={
              <ProtectedRoute fallbackTitle="Tasks Require Authentication">
                <TaskManager />
              </ProtectedRoute>
            }
          />

          {/* Reminders Manager View */}
          <Route
            path="/app/reminders"
            element={
              <ProtectedRoute fallbackTitle="Reminders Require Authentication">
                <ReminderManager />
              </ProtectedRoute>
            }
          />

          {/* Notes Manager View */}
          <Route
            path="/app/notes"
            element={
              <ProtectedRoute fallbackTitle="Notes Require Authentication">
                <NoteManager />
              </ProtectedRoute>
            }
          />

          {/* Activity Log Trail View */}
          <Route
            path="/app/activity"
            element={
              <ProtectedRoute fallbackTitle="Security Activity Log Requires Authentication">
                <ActivityLogView />
              </ProtectedRoute>
            }
          />

          {/* MCP Developer Inspector View */}
          <Route path="/app/mcp" element={<MCPInspector />} />

          {/* Settings & Voice Preferences View */}
          <Route
            path="/app/settings"
            element={
              <ProtectedRoute fallbackTitle="Account Settings Require Authentication">
                <SettingsView />
              </ProtectedRoute>
            }
          />

          {/* Public Compliance Pages */}
          <Route path="/privacy" element={<PrivacyView />} />
          <Route path="/terms" element={<TermsView />} />

          {/* Fallback to Home */}
          <Route path="*" element={<LandingPage onLaunch={handleLaunchAssistant} onOpenAuth={() => setIsAuthModalOpen(true)} />} />
        </Routes>
      </main>

      {/* 4. Global Footer */}
      <footer className="border-t border-gray-900 bg-[#070A11] py-3 text-center text-[11px] text-gray-500 shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Alexa+ Smart Assistant (Supabase Edition) — Model Context Protocol Streamable HTTP & Gemini AI
          </span>
          <div className="flex items-center gap-4">
            <a href="/health" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
              Health Status
            </a>
            <a href="/mcp" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
              MCP Spec
            </a>
            <Link to="/privacy" className="hover:text-cyan-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-cyan-400 transition-colors">
              Terms of Use
            </Link>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
};
