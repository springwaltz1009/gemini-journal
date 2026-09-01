import React from 'react';
import { 
  BookOpen, 
  History, 
  Compass, 
  HeartHandshake,
  PlusCircle, 
  LogOut, 
  CheckCircle2, 
  Loader2, 
  AlertCircle 
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
  return (
    <header 
      id="main-navbar" 
      className="bg-[#FDFCF0]/95 backdrop-blur-md border-b border-[#E5E0D5] sticky top-0 z-40 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center space-x-6">
          <div 
            id="brand-logo"
            onClick={() => setActiveTab('write')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#3D3631] text-[#FDFCF0] flex items-center justify-center shadow-xs group-hover:bg-[#2B2521] transition-colors">
              <BookOpen className="w-5 h-5 text-[#DDBEA9]" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-[#3D3631] tracking-tight block leading-tight">
                Gemini Journal
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#7A726D] block">
                Reflection Companion
              </span>
            </div>
          </div>

          {user && (
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-[#E5E0D5]">
              <button
                id="nav-tab-write"
                onClick={() => setActiveTab('write')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'write'
                    ? 'bg-[#ECEFE6] text-[#3F4739] shadow-xs'
                    : 'text-[#7A726D] hover:text-[#3D3631] hover:bg-[#F5F2EA]'
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
                    ? 'bg-[#ECEFE6] text-[#3F4739] shadow-xs'
                    : 'text-[#7A726D] hover:text-[#3D3631] hover:bg-[#F5F2EA]'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Past Entries</span>
                {entriesCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[11px] rounded-full bg-[#E5E0D5] text-[#4A433F] font-mono">
                    {entriesCount}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-compass"
                onClick={() => setActiveTab('compass')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'compass'
                    ? 'bg-[#ECEFE6] text-[#3F4739] shadow-xs'
                    : 'text-[#7A726D] hover:text-[#3D3631] hover:bg-[#F5F2EA]'
                }`}
              >
                <Compass className="w-4 h-4 text-[#6B705C]" />
                <span>Reflection Compass</span>
              </button>

              <button
                id="nav-tab-companion"
                onClick={() => setActiveTab('companion')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'companion'
                    ? 'bg-[#ECEFE6] text-[#3F4739] shadow-xs'
                    : 'text-[#7A726D] hover:text-[#3D3631] hover:bg-[#F5F2EA]'
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-[#CB997E]" />
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
              <div className="hidden sm:flex items-center text-xs font-mono text-[#7A726D] mr-2">
                {saveStatus === 'saving' && (
                  <span className="flex items-center text-[#CB997E] space-x-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center text-[#588157] space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Saved to Cloud</span>
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="flex items-center text-[#C85A54] space-x-1">
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
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#3D3631] hover:bg-[#2B2521] text-[#FDFCF0] rounded-md text-sm font-medium shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">New Reflection</span>
                </button>
              )}

              {/* User Avatar & Logout */}
              <div className="flex items-center space-x-2 pl-3 border-l border-[#E5E0D5]">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-[#D5CEBF] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#EAE5D9] text-[#4A433F] flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-[#3D3631] max-w-[130px] truncate">
                    {user.displayName || 'Journaler'}
                  </div>
                  <div className="text-[10px] text-[#7A726D] max-w-[130px] truncate font-mono">
                    {user.email}
                  </div>
                </div>

                <button
                  id="nav-sign-out-btn"
                  onClick={() => signOutUser()}
                  title="Sign Out"
                  className="p-1.5 text-[#7A726D] hover:text-[#3D3631] rounded-md hover:bg-[#F5F2EA] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-xs text-[#7A726D] font-mono">
              Secure Cloud Auth
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
