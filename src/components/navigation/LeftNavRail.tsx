import React from 'react';
import {
  Home,
  Users,
  MessageSquare,
  Compass,
  Bell,
  Crown,
  ShoppingBag,
  Shield,
  Plus,
  Settings,
  Globe,
  Terminal,
} from 'lucide-react';
import { Community, ActiveView, UserProfile } from '../../types';
import { isAdminOrAbove, generateInitialsAvatar } from '../../lib/dataService';

interface LeftNavRailProps {
  communities: Community[];
  activeView: ActiveView;
  currentUser: UserProfile;
  unreadDmCount: number;
  notificationCount?: number;
  onNavigateDashboard: () => void;
  onNavigateHome: () => void;
  onNavigateOrbs: () => void;
  onNavigateNotifications: () => void;
  onNavigateProfile: () => void;
  onNavigateNitro: () => void;
  onNavigateShop: () => void;
  onNavigateDeveloperPortal?: () => void;
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
  notificationCount = 0,
  onNavigateDashboard,
  onNavigateHome,
  onNavigateOrbs,
  onNavigateNotifications,
  onNavigateProfile,
  onNavigateNitro,
  onNavigateShop,
  onNavigateDeveloperPortal,
  onNavigateAdmin,
  onNavigateExplore,
  onSelectCommunity,
  onCreateCommunity,
  onOpenSettings,
}) => {
  const isHomeDashboardActive = activeView.type === 'home';
  const isFriendsActive = activeView.type === 'friends';
  const isDmActive = activeView.type === 'dm';
  const isOrbsActive = activeView.type === 'orbs';
  const isExploreActive = activeView.type === 'explore_communities';
  const isNotificationsActive = activeView.type === 'notifications';
  const isNitroActive = activeView.type === 'nitro';
  const isShopActive = activeView.type === 'shop';
  const isDeveloperActive = activeView.type === 'developer_portal';
  const isAdminActive = activeView.type === 'admin';
  const showAdmin = isAdminOrAbove(currentUser);

  const railBtnClass = (active: boolean) =>
    `relative group w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
      active
        ? 'bg-[#8957F5]/25 text-[#F5F3FA] border border-[#8957F5]/55 shadow-[0_0_20px_rgba(137,87,245,0.32)]'
        : 'bg-white/[0.035] text-[#A19DAD] hover:text-[#F5F3FA] hover:bg-white/[0.08] border border-white/[0.08]'
    }`;

  return (
    <nav
      aria-label="Primary Navigation Rail"
      className="w-[72px] h-full doom-glass-nav flex flex-col items-center py-3.5 select-none z-30 shrink-0 justify-between"
    >
      {/* Top & Primary Navigation Icons */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Official Doomcord Purple D Logo */}
        <button
          onClick={onNavigateDashboard}
          aria-label="DOOMCORD — Rise Above. Connect Beyond."
          title="DOOMCORD — Rise Above. Connect Beyond."
          className={`relative group w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden ${
            isHomeDashboardActive
              ? 'bg-[#15111F] border-2 border-[#8957F5] shadow-[0_0_24px_rgba(137,87,245,0.45)]'
              : 'bg-[#15111F]/90 border border-white/15 hover:border-[#A47BFF]/60'
          }`}
        >
          <img
            src="/assets/aistudio/doomcord-icon_378efdf9.png"
            alt="Doomcord Logo"
            className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </button>

        <div className="w-8 h-[1px] bg-white/10 my-1" />

        {/* Home */}
        <button
          onClick={onNavigateDashboard}
          title="Home"
          aria-label="Home"
          className={railBtnClass(isHomeDashboardActive)}
        >
          {isHomeDashboardActive && (
            <span className="absolute -left-2.5 w-1 h-5 rounded-r-full bg-[#8957F5]" />
          )}
          <Home size={19} />
        </button>

        {/* Friends */}
        <button
          onClick={onNavigateHome}
          title="Friends"
          aria-label="Friends"
          className={railBtnClass(isFriendsActive)}
        >
          {isFriendsActive && (
            <span className="absolute -left-2.5 w-1 h-5 rounded-r-full bg-[#8957F5]" />
          )}
          <Users size={19} />
        </button>

        {/* Messages */}
        <button
          onClick={onNavigateHome}
          title="Direct Messages"
          aria-label="Messages"
          className={railBtnClass(isDmActive)}
        >
          {isDmActive && (
            <span className="absolute -left-2.5 w-1 h-5 rounded-r-full bg-[#8957F5]" />
          )}
          <MessageSquare size={19} />
          {unreadDmCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#8957F5] text-white text-[10px] font-bold flex items-center justify-center border border-[#09080F]">
              {unreadDmCount > 9 ? '9+' : unreadDmCount}
            </span>
          )}
        </button>

        {/* Communities Discovery */}
        <button
          onClick={onNavigateExplore}
          title="Communities"
          aria-label="Communities"
          className={railBtnClass(isExploreActive)}
        >
          {isExploreActive && (
            <span className="absolute -left-2.5 w-1 h-5 rounded-r-full bg-[#8957F5]" />
          )}
          <Compass size={19} />
        </button>

        {/* Orbs Spatial Canvas */}
        <button
          onClick={onNavigateOrbs}
          title="Orbs Spatial Network"
          aria-label="Orbs"
          className={railBtnClass(isOrbsActive)}
        >
          {isOrbsActive && (
            <span className="absolute -left-2.5 w-1 h-5 rounded-r-full bg-[#8957F5]" />
          )}
          <Globe size={19} />
        </button>

        {/* Notifications */}
        <button
          onClick={onNavigateNotifications}
          title="Notifications"
          aria-label="Notifications"
          className={railBtnClass(isNotificationsActive)}
        >
          {isNotificationsActive && (
            <span className="absolute -left-2.5 w-1 h-5 rounded-r-full bg-[#8957F5]" />
          )}
          <Bell size={19} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#8957F5] text-white text-[10px] font-bold flex items-center justify-center border border-[#09080F]">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* APEX Membership */}
        <button
          onClick={onNavigateNitro}
          title="APEX Sovereign Membership"
          aria-label="APEX"
          className={railBtnClass(isNitroActive)}
        >
          {isNitroActive && (
            <span className="absolute -left-2.5 w-1 h-5 rounded-r-full bg-[#8957F5]" />
          )}
          <Crown
            size={19}
            className={isNitroActive ? 'text-[#C4B1FF]' : 'text-[#A47BFF]'}
          />
        </button>

        {/* APEX Collection Cosmetics Store */}
        <button
          onClick={onNavigateShop}
          title="APEX Collection Store"
          aria-label="APEX Collection"
          className={railBtnClass(isShopActive)}
        >
          {isShopActive && (
            <span className="absolute -left-2.5 w-1 h-5 rounded-r-full bg-[#8957F5]" />
          )}
          <ShoppingBag size={18} />
        </button>

        <div className="w-8 h-[1px] bg-white/10 my-1" />

        {/* Joined Communities Strip */}
        <div className="flex flex-col items-center gap-2 max-h-[180px] overflow-y-auto no-scrollbar w-full px-2">
          {communities.map((comm) => {
            const isSelected =
              activeView.type === 'community' &&
              activeView.communityId === comm.id;
            return (
              <button
                key={comm.id}
                onClick={() => onSelectCommunity(comm.id)}
                title={comm.name}
                className={`relative group w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 overflow-hidden ${
                  isSelected
                    ? 'ring-2 ring-[#8957F5] shadow-[0_0_16px_rgba(137,87,245,0.4)]'
                    : 'opacity-80 hover:opacity-100 border border-white/10'
                }`}
              >
                <img
                  src={comm.iconUrl || generateInitialsAvatar(comm.name)}
                  alt={comm.name}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}

          <button
            onClick={onCreateCommunity}
            title="Create Community"
            aria-label="Create Community"
            className="w-10 h-10 rounded-2xl bg-white/[0.04] hover:bg-[#8957F5]/20 text-[#C4B1FF] border border-dashed border-white/20 hover:border-[#8957F5]/50 flex items-center justify-center transition-all shrink-0"
          >
            <Plus size={17} />
          </button>
        </div>
      </div>

      {/* Bottom Governance, Developer, Settings & User Avatar */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/10 w-full">
        {onNavigateDeveloperPortal && (
          <button
            onClick={onNavigateDeveloperPortal}
            title="Developer Portal"
            aria-label="Developer Portal"
            className={railBtnClass(isDeveloperActive)}
          >
            <Terminal size={17} />
          </button>
        )}

        {showAdmin && (
          <button
            onClick={onNavigateAdmin}
            title="Administration Panel"
            aria-label="Admin"
            className={railBtnClass(isAdminActive)}
          >
            <Shield size={18} className="text-[#C4B1FF]" />
          </button>
        )}

        <button
          onClick={onOpenSettings}
          title="Settings & Security"
          aria-label="Settings"
          className="w-11 h-11 rounded-2xl bg-white/[0.035] hover:bg-white/[0.08] text-[#A19DAD] hover:text-[#F5F3FA] border border-white/[0.08] flex items-center justify-center transition-all"
        >
          <Settings size={18} />
        </button>

        <button
          onClick={onNavigateProfile}
          title={`${currentUser.displayName} (@${currentUser.username})`}
          className="relative group mt-0.5"
        >
          <img
            src={
              currentUser.photoURL ||
              generateInitialsAvatar(currentUser.displayName)
            }
            alt={currentUser.displayName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-[#8957F5]/50 group-hover:ring-[#C4B1FF] transition-all"
          />
          <span className="w-2.5 h-2.5 rounded-full bg-[#8957F5] ring-2 ring-[#09080F] absolute bottom-0 right-0" />
        </button>
      </div>
    </nav>
  );
};
