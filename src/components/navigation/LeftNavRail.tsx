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
  User,
  Globe,
  Terminal,
} from 'lucide-react';
import { Community, ActiveView, UserProfile } from '../../types';
import { isAdminOrAbove } from '../../lib/dataService';

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
  const isDashboardActive = activeView.type === 'home';
  const isFriendsOrDmActive = activeView.type === 'friends' || activeView.type === 'dm';
  const isOrbsActive = activeView.type === 'orbs';
  const isNotificationsActive = activeView.type === 'notifications';
  const isProfileActive =
    activeView.type === 'profile' &&
    (!activeView.userId || activeView.userId === currentUser.uid);
  const isNitroActive = activeView.type === 'nitro';
  const isShopActive = activeView.type === 'shop';
  const isDevPortalActive = activeView.type === 'developer_portal';
  const isAdminActive = activeView.type === 'admin';
  const isExploreActive = activeView.type === 'explore_communities';

  const isAdminOrOwner = isAdminOrAbove(currentUser);

  return (
    <aside className="w-[60px] h-full flex flex-col items-center py-3 bg-[#0D0D12] border-r border-[#282631] select-none shrink-0 z-30">
      {/* Official Doomcord Logo -> Home */}
      <button
        onClick={onNavigateDashboard}
        title="Doomcord Home"
        className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-opacity hover:opacity-90 mb-2.5 shrink-0"
      >
        <img
          src="/assets/aistudio/doomcord-icon_378efdf9.png"
          alt="Doomcord"
          className="w-8 h-8 object-contain"
        />
        {isDashboardActive && (
          <span className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#8957F5] rounded-r" />
        )}
      </button>

      <div className="w-5 h-[1px] bg-[#282631] mb-2" />

      {/* Primary Navigation Icons */}
      <nav className="flex flex-col items-center gap-1 mb-2">
        {/* Home */}
        <button
          onClick={onNavigateDashboard}
          title="Home"
          className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            isDashboardActive
              ? 'bg-[#22212C] text-[#8957F5]'
              : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
          }`}
        >
          <Home className="w-4 h-4" />
          {isDashboardActive && (
            <span className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-[#8957F5] rounded-r" />
          )}
        </button>

        {/* Messages & Friends */}
        <button
          onClick={onNavigateHome}
          title="Direct Messages"
          className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            isFriendsOrDmActive
              ? 'bg-[#22212C] text-[#8957F5]'
              : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
          }`}
        >
          {activeView.type === 'dm' ? (
            <MessageSquare className="w-4 h-4" />
          ) : (
            <Users className="w-4 h-4" />
          )}
          {isFriendsOrDmActive && (
            <span className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-[#8957F5] rounded-r" />
          )}
          {unreadDmCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#8957F5]" />
          )}
        </button>

        {/* Communities Directory */}
        <button
          onClick={onNavigateExplore}
          title="Explore Communities"
          className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            isExploreActive
              ? 'bg-[#22212C] text-[#8957F5]'
              : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
          }`}
        >
          <Globe className="w-4 h-4" />
          {isExploreActive && (
            <span className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-[#8957F5] rounded-r" />
          )}
        </button>

        {/* Orbs Discovery */}
        <button
          onClick={onNavigateOrbs}
          title="Orbs — Spatial Realms"
          className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            isOrbsActive
              ? 'bg-[#22212C] text-[#8957F5]'
              : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
          }`}
        >
          <Compass className="w-4 h-4" />
          {isOrbsActive && (
            <span className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-[#8957F5] rounded-r" />
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={onNavigateNotifications}
          title="Notifications"
          className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            isNotificationsActive
              ? 'bg-[#22212C] text-[#8957F5]'
              : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
          }`}
        >
          <Bell className="w-4 h-4" />
          {isNotificationsActive && (
            <span className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-[#8957F5] rounded-r" />
          )}
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#8957F5]" />
          )}
        </button>

        {/* DOOMCORD APEX */}
        <button
          onClick={onNavigateNitro}
          title="DOOMCORD APEX"
          className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            isNitroActive
              ? 'bg-[#8957F5] text-white'
              : 'text-[#C4B1FF] hover:bg-[#17171F] hover:text-[#F5F3FA]'
          }`}
        >
          <Crown className="w-4 h-4" />
          {isNitroActive && (
            <span className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-[#8957F5] rounded-r" />
          )}
        </button>

        {/* Cosmetics Shop */}
        <button
          onClick={onNavigateShop}
          title="Cosmetics Shop"
          className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            isShopActive
              ? 'bg-[#22212C] text-[#8957F5]'
              : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          {isShopActive && (
            <span className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-[#8957F5] rounded-r" />
          )}
        </button>

        {/* Developer Portal & Bots */}
        {onNavigateDeveloperPortal && (
          <button
            onClick={onNavigateDeveloperPortal}
            title="Developer Portal & Bots"
            className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              isDevPortalActive
                ? 'bg-[#22212C] text-[#8957F5]'
                : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            {isDevPortalActive && (
              <span className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-[#8957F5] rounded-r" />
            )}
          </button>
        )}

        {/* Admin Console (Owner & Admin only) */}
        {isAdminOrOwner && (
          <button
            onClick={onNavigateAdmin}
            title="Administration Console"
            className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              isAdminActive
                ? 'bg-[#8957F5] text-white'
                : 'text-[#8957F5] hover:bg-[#17171F]'
            }`}
          >
            <Shield className="w-4 h-4" />
            {isAdminActive && (
              <span className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-[#8957F5] rounded-r" />
            )}
          </button>
        )}
      </nav>

      <div className="w-5 h-[1px] bg-[#282631] mb-2" />

      {/* Communities Quick Switcher Rail */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-1.5 px-1.5 scrollbar-none">
        {communities.map((comm) => {
          const isActive =
            activeView.type === 'community' && activeView.communityId === comm.id;
          return (
            <div key={comm.id} className="relative flex items-center justify-center w-full">
              {isActive && (
                <span className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#8957F5] rounded-r" />
              )}
              <button
                onClick={() => onSelectCommunity(comm.id)}
                title={comm.name}
                className={`w-9 h-9 rounded-lg overflow-hidden transition-all flex items-center justify-center text-xs font-semibold ${
                  isActive
                    ? 'ring-1 ring-[#8957F5] text-white'
                    : 'text-[#A19DAD] hover:text-[#F5F3FA] bg-[#17171F] hover:bg-[#22212C] border border-[#282631]'
                }`}
              >
                {comm.iconUrl ? (
                  <img
                    src={comm.iconUrl}
                    alt={comm.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{comm.name.slice(0, 2).toUpperCase()}</span>
                )}
              </button>
            </div>
          );
        })}

        {/* Create Community Quick Action */}
        <button
          onClick={onCreateCommunity}
          title="Create Community"
          className="w-9 h-9 rounded-lg bg-[#101014] hover:bg-[#17171F] border border-dashed border-[#282631] hover:border-[#8957F5] text-[#A19DAD] hover:text-[#8957F5] flex items-center justify-center transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Profile & Settings */}
      <div className="flex flex-col items-center gap-1 pt-2.5 border-t border-[#282631] w-full shrink-0">
        <button
          onClick={onNavigateProfile}
          title="My Profile"
          className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isProfileActive
              ? 'bg-[#22212C] text-[#8957F5]'
              : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
          }`}
        >
          <User className="w-4 h-4" />
          {isProfileActive && (
            <span className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-[#8957F5] rounded-r" />
          )}
        </button>

        <button
          onClick={onOpenSettings}
          title="Settings"
          className="w-8 h-8 rounded-lg text-[#A19DAD] hover:text-[#F5F3FA] hover:bg-[#17171F] flex items-center justify-center transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
