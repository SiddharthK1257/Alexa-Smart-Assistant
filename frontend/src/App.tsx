import React, { useState } from 'react';
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
import { useAuth } from './context/AuthContext';

// Inner shell component to access router hooks
const AppShell: React.FC = () => {
  const { user, profile, signOut, quickDemoLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Assistant', path: '/app', icon: Bot },
    { label: 'Tasks', path: '/app/tasks', icon: CheckSquare },
    { label: 'Reminders', path: '/app/reminders', icon: Bell },
    { label: 'Notes', path: '/app/notes', icon: FileText },
    { label: 'Activity', path: '/app/activity', icon: History },
    { label: 'MCP & Specs', path: '/app/mcp', icon: Cpu },
    { label: 'Settings', path: '/app/settings', icon: Sliders },
  ];

  const handleLaunchAssistant = () => {
    navigate('/app');
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    navigate('/app');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-gray-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Independent Prototype Notice */}
      <DisclaimerBanner />

      {/* 2. Top Navigation Bar */}
      <header className="border-b border-gray-800/80 bg-[#111827]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 animate-pulse-slow p-0.5 group-hover:scale-105 transition-transform">
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
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Supabase MCP Edition
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#0B0F19] border border-gray-800 p-1 rounded-xl text-xs">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold shadow-md'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Auth Status */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-gray-200">
                    {profile?.display_name || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Supabase Connected
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
              className="lg:hidden p-2 rounded-xl bg-[#1F2937] border border-gray-700 text-gray-400 hover:text-gray-200"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-800 bg-[#0B0F19] px-4 py-3 space-y-1">
            {navItems.map(item => {
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
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#161F30]'
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
              <div className="flex-1 flex overflow-hidden h-[calc(100vh-6.5rem)]">
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
            }
          />

          {/* Task Manager View */}
          <Route path="/app/tasks" element={<TaskManager />} />

          {/* Reminders Manager View */}
          <Route path="/app/reminders" element={<ReminderManager />} />

          {/* Notes Manager View */}
          <Route path="/app/notes" element={<NoteManager />} />

          {/* Activity Log Trail View */}
          <Route path="/app/activity" element={<ActivityLogView />} />

          {/* MCP Developer Inspector View */}
          <Route path="/app/mcp" element={<MCPInspector />} />

          {/* Settings & Voice Preferences View */}
          <Route path="/app/settings" element={<SettingsView />} />

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
