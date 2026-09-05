import React, { useState } from 'react';
import { 
  BookOpen, 
  History, 
  Compass, 
  HeartHandshake,
  PlusCircle, 
  LogOut, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types';
import { signOutUser } from '../firebase';

interface NavbarProps {
  user: UserProfile | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNewEntry: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  entriesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onNewEntry,
  saveStatus,
  entriesCount,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const goTo = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <header 
      id="main-navbar" 
      className="bg-[#F8F7FC]/95 backdrop-blur-md border-b border-[#E1DDF0] sticky top-0 z-40 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center space-x-6">
          <div 
            id="brand-logo"
            onClick={() => goTo('write')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#27234F] text-[#F8F7FC] flex items-center justify-center shadow-xs group-hover:bg-[#1D193D] transition-colors">
              <BookOpen className="w-5 h-5 text-[#C5A46D]" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-[#27234F] tracking-tight block leading-tight">
                Gemini Journal
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#6B647A] block">
                Reflection Companion
              </span>
            </div>
          </div>

          {user && (
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-[#E1DDF0]">
              <button
                id="nav-tab-write"
                onClick={() => setActiveTab('write')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'write'
                    ? 'bg-[#EEEAF8] text-[#51467D] shadow-xs'
                    : 'text-[#6B647A] hover:text-[#27234F] hover:bg-[#F1EFF8]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Journal Canvas</span>
              </button>

              <button
                id="nav-tab-history"
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-[#EEEAF8] text-[#51467D] shadow-xs'
                    : 'text-[#6B647A] hover:text-[#27234F] hover:bg-[#F1EFF8]'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Past Entries</span>
                {entriesCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[11px] rounded-full bg-[#E1DDF0] text-[#1F2937] font-mono">
                    {entriesCount}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-compass"
                onClick={() => setActiveTab('compass')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'compass'
                    ? 'bg-[#EEEAF8] text-[#51467D] shadow-xs'
                    : 'text-[#6B647A] hover:text-[#27234F] hover:bg-[#F1EFF8]'
                }`}
              >
                <Compass className="w-4 h-4 text-[#6B5B95]" />
                <span>Reflection Compass</span>
              </button>

              <button
                id="nav-tab-companion"
                onClick={() => setActiveTab('companion')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'companion'
                    ? 'bg-[#EEEAF8] text-[#51467D] shadow-xs'
                    : 'text-[#6B647A] hover:text-[#27234F] hover:bg-[#F1EFF8]'
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-[#C5A46D]" />
                <span>Wellbeing Companion</span>
              </button>
            </nav>
          )}
        </div>

        {/* Right: Actions & User Profile */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Save Status Indicator */}
              <div className="hidden sm:flex items-center text-xs font-mono text-[#6B647A] mr-2">
                {saveStatus === 'saving' && (
                  <span className="flex items-center text-[#C5A46D] space-x-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center text-[#6B5B95] space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Saved to Cloud</span>
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="flex items-center text-[#B34F6A] space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Save Error</span>
                  </span>
                )}
              </div>

              {/* New Entry Action Button (Hidden on write/canvas screen to avoid redundancy with the in-canvas + New Entry button) */}
              {activeTab !== 'write' && (
                <button
                  id="nav-new-entry-btn"
                  onClick={() => {
                    onNewEntry();
                    setActiveTab('write');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#27234F] hover:bg-[#1D193D] text-[#F8F7FC] rounded-md text-sm font-medium shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">New Reflection</span>
                </button>
              )}

              {/* Mobile navigation toggle */}
              <button
                type="button"
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((open) => !open)}
                className="md:hidden p-2 text-[#27234F] rounded-lg hover:bg-[#EEEAF8] transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* User Avatar & Logout */}
              <div className="hidden md:flex items-center space-x-2 pl-3 border-l border-[#E1DDF0]">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-[#C9C7EB] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#EEEAF8] text-[#1F2937] flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-[#27234F] max-w-[130px] truncate">
                    {user.displayName || 'Journaler'}
                  </div>
                  <div className="text-[10px] text-[#6B647A] max-w-[130px] truncate font-mono">
                    {user.email}
                  </div>
                </div>

                <button
                  id="nav-sign-out-btn"
                  onClick={() => signOutUser()}
                  title="Sign Out"
                  className="p-1.5 text-[#6B647A] hover:text-[#27234F] rounded-md hover:bg-[#F1EFF8] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-xs text-[#6B647A] font-mono">
              Secure Cloud Auth
            </div>
          )}
        </div>
      </div>

      {user && mobileOpen && (
        <nav className="md:hidden border-t border-[#E1DDF0] bg-[#F8F7FC]/98 backdrop-blur-md px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto grid gap-1">
            {[
              { tab: 'write' as ActiveTab, label: 'Journal Canvas', icon: BookOpen },
              { tab: 'history' as ActiveTab, label: `Past Entries${entriesCount ? ` (${entriesCount})` : ''}`, icon: History },
              { tab: 'compass' as ActiveTab, label: 'Reflection Compass', icon: Compass },
              { tab: 'companion' as ActiveTab, label: 'Wellbeing Companion', icon: HeartHandshake },
            ].map(({ tab, label, icon: Icon }) => (
              <button
                key={tab}
                onClick={() => goTo(tab)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-left transition-colors ${
                  activeTab === tab
                    ? 'bg-[#EEEAF8] text-[#27234F]'
                    : 'text-[#6B647A] hover:bg-[#F1EFF8] hover:text-[#27234F]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}

            {activeTab !== 'write' && (
              <button
                onClick={() => { onNewEntry(); goTo('write'); }}
                className="mt-1 w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-[#27234F] text-white text-sm font-medium"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Reflection</span>
              </button>
            )}

            <button
              onClick={() => signOutUser()}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-[#6B647A] hover:bg-[#F1EFF8]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
