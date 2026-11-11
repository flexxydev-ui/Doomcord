import React from 'react';
import {
  Compass,
  MessageSquare,
  Plus,
  Settings,
  Sparkles,
  Crown,
  ShoppingBag,
  Shield,
} from 'lucide-react';
import { Community, ActiveView, UserProfile } from '../../types';

interface LeftNavRailProps {
  communities: Community[];
  activeView: ActiveView;
  currentUser: UserProfile;
  unreadDmCount: number;
  onNavigateHome: () => void;
  onNavigateOrbs: () => void;
  onNavigateNitro: () => void;
  onNavigateShop: () => void;
  onNavigateAdmin: () => void;
  onNavigateExplore: () => void;
  onSelectCommunity: (communityId: string) => void;
  onCreateCommunity: () => void;
  onOpenSettings: () => void;
}

export const LeftNavRail: React.FC<LeftNavRailProps> = ({
  communities,
  activeView,
  currentUser,
  unreadDmCount,
  onNavigateHome,
  onNavigateOrbs,
  onNavigateNitro,
  onNavigateShop,
  onNavigateAdmin,
  onNavigateExplore,
  onSelectCommunity,
  onCreateCommunity,
  onOpenSettings,
}) => {
  const isHomeActive = activeView.type === 'friends' || activeView.type === 'dm';
  const isOrbsActive = activeView.type === 'orbs';
  const isNitroActive = activeView.type === 'nitro';
  const isShopActive = activeView.type === 'shop';
  const isAdminActive = activeView.type === 'admin';
  const isExploreActive = activeView.type === 'explore_communities';
  const isAdminOrOwner = currentUser.role === 'owner' || currentUser.role === 'admin';

  return (
    <div className="w-[72px] h-full flex flex-col items-center py-3 bg-[oklch(0.14_0.025_162)] border-r border-white/5 select-none shrink-0 z-30">
      {/* Doomcord Brand Icon */}
      <button
        onClick={onNavigateHome}
        title="Doomcord Home"
        className="relative group p-2.5 mb-3 rounded-2xl bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] shadow-lg shadow-black/30 hover:rounded-xl transition-all"
      >
        <span className="font-heading font-black text-xl text-white tracking-tighter block leading-none">
          D
        </span>
        {isHomeActive && (
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[oklch(0.85_0.12_165)] rounded-r-full" />
        )}
      </button>

      <div className="w-8 h-[1px] bg-white/10 mb-3" />

      {/* Primary Feature Rail Icons */}
      <div className="flex flex-col items-center gap-2 mb-3">
        {/* Direct Messages / Friends */}
        <button
          onClick={onNavigateHome}
          title="Friends & Direct Messages"
          className={`relative p-3 rounded-2xl transition-all ${
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
          className={`relative p-3 rounded-2xl transition-all ${
            isOrbsActive
              ? 'bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-white rounded-xl shadow-md'
              : 'text-[oklch(0.7_0.03_155)] hover:bg-[oklch(0.235_0.032_158)] hover:text-white hover:rounded-xl'
          }`}
        >
          <Sparkles className="w-5 h-5" />
        </button>

        {/* Doomcord Nitro */}
        <button
          onClick={onNavigateNitro}
          title="Doomcord Nitro Memberships"
          className={`relative p-3 rounded-2xl transition-all ${
            isNitroActive
              ? 'bg-gradient-to-tr from-[oklch(0.84_0.14_85)] to-[oklch(0.72_0.16_32)] text-black rounded-xl shadow-md'
              : 'text-[oklch(0.84_0.14_85)] hover:bg-[oklch(0.235_0.032_158)] hover:rounded-xl'
          }`}
        >
          <Crown className="w-5 h-5" />
        </button>

        {/* Doomcord Cosmetics & Decoration Shop */}
        <button
          onClick={onNavigateShop}
          title="Cosmetics & Decoration Shop"
          className={`relative p-3 rounded-2xl transition-all ${
            isShopActive
              ? 'bg-[oklch(0.235_0.032_158)] text-[oklch(0.85_0.12_165)] rounded-xl shadow-md'
              : 'text-[oklch(0.7_0.03_155)] hover:bg-[oklch(0.235_0.032_158)] hover:text-white hover:rounded-xl'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
        </button>

        {/* Admin & Owner Monetization Dashboard (Restricted to Owner/Admin) */}
        {isAdminOrOwner && (
          <button
            onClick={onNavigateAdmin}
            title="Owner & Admin Dashboard"
            className={`relative p-3 rounded-2xl transition-all ${
              isAdminActive
                ? 'bg-[oklch(0.84_0.14_85)] text-black rounded-xl shadow-md'
                : 'text-[oklch(0.84_0.14_85)] bg-[oklch(0.84_0.14_85)]/10 hover:bg-[oklch(0.84_0.14_85)]/20 hover:rounded-xl'
            }`}
          >
            <Shield className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="w-8 h-[1px] bg-white/10 mb-3" />

      {/* Real User-Created Communities List */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-2 scrollbar-none px-2">
        {communities.map((comm) => {
          const isActive = activeView.type === 'community' && activeView.communityId === comm.id;
          return (
            <div key={comm.id} className="relative group flex items-center justify-center w-full">
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

        {/* Create Community Button */}
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
            isExploreActive
              ? 'rounded-xl border-[oklch(0.85_0.12_165)] text-[oklch(0.85_0.12_165)]'
              : 'text-[oklch(0.7_0.03_155)] hover:text-white'
          }`}
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Settings Trigger */}
      <div className="flex flex-col items-center gap-2 mt-auto pt-3 border-t border-white/5 w-full">
        <button
          onClick={onOpenSettings}
          title="Account & Application Settings"
          className="p-2.5 rounded-xl text-[oklch(0.7_0.03_155)] hover:text-white hover:bg-[oklch(0.235_0.032_158)] transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
