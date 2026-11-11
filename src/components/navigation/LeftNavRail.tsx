import React from 'react';
import { 
  Compass, MessageSquare, Plus, Settings, 
  Sparkles, Radio, Users, Shield, Layers, UserCheck 
} from 'lucide-react';
import { Community, ActiveView, UserProfile } from '../../types';

interface LeftNavRailProps {
  communities: Community[];
  activeView: ActiveView;
  currentUser: UserProfile;
  unreadDmCount: number;
  onNavigateHome: () => void;
  onNavigateOrbs: () => void;
  onNavigateExplore: () => void;
  onSelectCommunity: (communityId: string) => void;
  onCreateCommunity: () => void;
  onOpenSettings: () => void;
  onSwitchPersona: (personaIndex: number) => void;
}

export const LeftNavRail: React.FC<LeftNavRailProps> = ({
  communities,
  activeView,
  currentUser,
  unreadDmCount,
  onNavigateHome,
  onNavigateOrbs,
  onNavigateExplore,
  onSelectCommunity,
  onCreateCommunity,
  onOpenSettings,
  onSwitchPersona
}) => {
  const isHomeActive = activeView.type === 'friends' || activeView.type === 'dm';
  const isOrbsActive = activeView.type === 'orbs';
  const isExploreActive = activeView.type === 'explore_communities';

  return (
    <div className="w-[72px] h-full flex flex-col items-center py-3 bg-[oklch(0.14_0.025_162)] border-r border-white/5 select-none shrink-0 z-30">
      {/* Doomcord Brand Icon */}
      <button
        onClick={onNavigateHome}
        title="Doomcord Home"
        className="relative group p-2 mb-3 rounded-2xl bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] shadow-lg shadow-black/30 hover:rounded-xl transition-all"
      >
        <span className="font-heading font-black text-xl text-white tracking-tighter block leading-none">
          D
        </span>
        {/* Active Pill Indicator */}
        {isHomeActive && (
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[oklch(0.85_0.12_165)] rounded-r-full" />
        )}
      </button>

      <div className="w-8 h-[1px] bg-white/10 mb-3" />

      {/* Primary Navigation Icons */}
      <div className="flex flex-col items-center gap-2 mb-3">
        {/* Direct Messages / Friends */}
        <button
          onClick={onNavigateHome}
          title="Friends & Direct Messages"
          className={`relative p-3 rounded-2xl transition-all group ${
            isHomeActive
              ? 'bg-[oklch(0.235_0.032_158)] text-[oklch(0.85_0.12_165)] rounded-xl'
              : 'text-[oklch(0.7_0.03_155)] hover:bg-[oklch(0.235_0.032_158)] hover:text-white hover:rounded-xl'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadDmCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[oklch(0.72_0.16_32)] text-white shadow-sm font-mono">
              {unreadDmCount}
            </span>
          )}
        </button>

        {/* 3D Spatial Orbs Discovery */}
        <button
          onClick={onNavigateOrbs}
          title="Spatial Orbs Nexus"
          className={`relative p-3 rounded-2xl transition-all group ${
            isOrbsActive
              ? 'bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-white rounded-xl shadow-md'
              : 'text-[oklch(0.7_0.03_155)] hover:bg-[oklch(0.235_0.032_158)] hover:text-white hover:rounded-xl'
          }`}
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>

      <div className="w-8 h-[1px] bg-white/10 mb-3" />

      {/* Community Server Icons List */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-2 scrollbar-none px-2">
        {communities.map((comm) => {
          const isActive = activeView.type === 'community' && activeView.communityId === comm.id;
          return (
            <div key={comm.id} className="relative group flex items-center justify-center w-full">
              {/* Active rail pill */}
              {isActive && (
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full" />
              )}
              <button
                onClick={() => onSelectCommunity(comm.id)}
                title={comm.name}
                className={`relative w-12 h-12 rounded-2xl overflow-hidden transition-all duration-200 border ${
                  isActive
                    ? 'rounded-xl border-[oklch(0.85_0.12_165)] shadow-md'
                    : 'border-white/5 hover:rounded-xl hover:border-white/20'
                }`}
              >
                {comm.iconUrl ? (
                  <img
                    src={comm.iconUrl}
                    alt={comm.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: comm.themeColor || 'oklch(0.235 0.032 158)' }}
                  >
                    {comm.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {/* Add Community Button */}
        <button
          onClick={onCreateCommunity}
          title="Create a Community"
          className="w-12 h-12 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-dashed border-white/20 hover:border-[oklch(0.85_0.12_165)] text-[oklch(0.85_0.12_165)] hover:rounded-xl flex items-center justify-center transition-all group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Explore Communities */}
        <button
          onClick={onNavigateExplore}
          title="Explore Public Communities"
          className={`w-12 h-12 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-white/5 hover:rounded-xl flex items-center justify-center transition-all ${
            isExploreActive ? 'rounded-xl border-[oklch(0.85_0.12_165)] text-[oklch(0.85_0.12_165)]' : 'text-[oklch(0.7_0.03_155)] hover:text-white'
          }`}
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Switch Persona & Settings */}
      <div className="flex flex-col items-center gap-2 mt-auto pt-3 border-t border-white/5 w-full">
        {/* Quick Demo Switcher (Alex / Seraphina / Cipher) */}
        <div className="group relative">
          <button
            title="Switch Testing Persona (Test messaging between accounts)"
            className="p-2.5 rounded-xl bg-[oklch(0.235_0.032_158)] text-[oklch(0.85_0.12_165)] hover:text-white border border-white/5 transition-colors"
          >
            <UserCheck className="w-4 h-4" />
          </button>

          {/* Persona Menu on Hover */}
          <div className="absolute left-full bottom-0 ml-2 hidden group-hover:flex flex-col w-56 p-2 rounded-2xl bg-[oklch(0.14_0.025_162)] border border-white/10 shadow-2xl z-50">
            <span className="text-[10px] font-bold text-[oklch(0.7_0.03_155)] px-2 py-1 uppercase tracking-wider">
              Switch Test Account
            </span>
            <button
              onClick={() => onSwitchPersona(0)}
              className="flex items-center gap-2 p-2 rounded-xl text-left hover:bg-white/5 transition-colors"
            >
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=AlexThorne&backgroundColor=0d382e" className="w-6 h-6 rounded-lg" alt="Alex" />
              <div>
                <span className="text-xs font-bold text-white block">Alex Thorne</span>
                <span className="text-[10px] text-[oklch(0.7_0.03_155)]">@shadow_weaver</span>
              </div>
            </button>
            <button
              onClick={() => onSwitchPersona(1)}
              className="flex items-center gap-2 p-2 rounded-xl text-left hover:bg-white/5 transition-colors"
            >
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=SeraphMint&backgroundColor=154338" className="w-6 h-6 rounded-lg" alt="Seraphina" />
              <div>
                <span className="text-xs font-bold text-white block">Seraphina Vale</span>
                <span className="text-[10px] text-[oklch(0.7_0.03_155)]">@seraph_mint</span>
              </div>
            </button>
            <button
              onClick={() => onSwitchPersona(2)}
              className="flex items-center gap-2 p-2 rounded-xl text-left hover:bg-white/5 transition-colors"
            >
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=CipherZero&backgroundColor=2e3a1f" className="w-6 h-6 rounded-lg" alt="Cipher" />
              <div>
                <span className="text-xs font-bold text-white block">Cipher</span>
                <span className="text-[10px] text-[oklch(0.7_0.03_155)]">@cipher_zero</span>
              </div>
            </button>
          </div>
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Account Settings"
          className="p-2.5 rounded-xl text-[oklch(0.7_0.03_155)] hover:text-white hover:bg-[oklch(0.235_0.032_158)] transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
