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
} from 'lucide-react';
import { Community, ActiveView, UserProfile } from '../../types';

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
  const isAdminActive = activeView.type === 'admin';
  const isExploreActive = activeView.type === 'explore_communities';

  const isAdminOrOwner =
    currentUser.role === 'root_owner' ||
    currentUser.role === 'secondary_owner' ||
    currentUser.role === 'owner' ||
    currentUser.role === 'admin';

  return (
    <aside className="w-[68px] h-full flex flex-col items-center py-3.5 bg-[#111B17] border-r border-white/[0.06] select-none shrink-0 z-30">
      {/* Doomcord Architectural Brand Mark -> Home Dashboard */}
      <button
        onClick={onNavigateDashboard}
        title="Doomcord Home Dashboard"
        className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all mb-3 border ${
          isDashboardActive
            ? 'bg-[#8BE2B8] text-[#101A17] border-[#8BE2B8] shadow-md'
            : 'bg-[#192620] text-[#8BE2B8] border-white/[0.08] hover:bg-[#24362C]'
        }`}
      >
        <span className="font-display font-extrabold text-lg tracking-tight leading-none">
          D
        </span>
        {isDashboardActive && (
          <span className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-1 h-6 bg-[#8BE2B8] rounded-r" />
        )}
      </button>

      <div className="w-7 h-[1px] bg-white/[0.07] mb-3" />

      {/* Primary Platform Navigation Rail */}
      <nav className="flex flex-col items-center gap-1.5 mb-3">
        {/* Home Command */}
        <button
          onClick={onNavigateDashboard}
          title="Home Dashboard"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isDashboardActive
              ? 'bg-[#24362C] text-[#8BE2B8]'
              : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
          }`}
        >
          <Home className="w-4 h-4" />
        </button>

        {/* Friends & Direct Messages */}
        <button
          onClick={onNavigateHome}
          title="Friends & Direct Messages"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isFriendsOrDmActive
              ? 'bg-[#24362C] text-[#8BE2B8]'
              : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
          }`}
        >
          {activeView.type === 'dm' ? (
            <MessageSquare className="w-4 h-4" />
          ) : (
            <Users className="w-4 h-4" />
          )}
          {unreadDmCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded bg-[#E9987B] text-[#101A17] text-[10px] font-mono font-bold tabular-nums">
              {unreadDmCount}
            </span>
          )}
        </button>

        {/* Orbs Discovery & 3D Space */}
        <button
          onClick={onNavigateOrbs}
          title="Orbs — Interest Spaces"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isOrbsActive
              ? 'bg-[#24362C] text-[#E9987B]'
              : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
          }`}
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Notifications Center */}
        <button
          onClick={onNavigateNotifications}
          title="Notifications Inbox"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isNotificationsActive
              ? 'bg-[#24362C] text-[#8BE2B8]'
              : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
          }`}
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded bg-[#E9987B] text-[#101A17] text-[10px] font-mono font-bold tabular-nums">
              {notificationCount}
            </span>
          )}
        </button>

        {/* DOOMCORD APEX */}
        <button
          onClick={onNavigateNitro}
          title="DOOMCORD APEX Membership"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isNitroActive
              ? 'bg-[#D9BB79] text-[#101A17]'
              : 'text-[#D9BB79] hover:bg-[#192620]'
          }`}
        >
          <Crown className="w-4 h-4" />
        </button>

        {/* Cosmetics Shop */}
        <button
          onClick={onNavigateShop}
          title="Cosmetics & Customization Shop"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isShopActive
              ? 'bg-[#24362C] text-[#8BE2B8]'
              : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
        </button>

        {/* Admin Console */}
        {isAdminOrOwner && (
          <button
            onClick={onNavigateAdmin}
            title="Platform Administration Console"
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isAdminActive
                ? 'bg-[#8BE2B8] text-[#101A17]'
                : 'text-[#8BE2B8] bg-[#8BE2B8]/10 hover:bg-[#8BE2B8]/20'
            }`}
          >
            <Shield className="w-4 h-4" />
          </button>
        )}
      </nav>

      <div className="w-7 h-[1px] bg-white/[0.07] mb-3" />

      {/* Communities Switcher Rail */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-2 px-2">
        {communities.map((comm) => {
          const isActive =
            activeView.type === 'community' && activeView.communityId === comm.id;
          return (
            <div key={comm.id} className="relative flex items-center justify-center w-full">
              {isActive && (
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#8BE2B8] rounded-r" />
              )}
              <button
                onClick={() => onSelectCommunity(comm.id)}
                title={comm.name}
                className={`w-10 h-10 rounded-xl overflow-hidden transition-all border flex items-center justify-center ${
                  isActive
                    ? 'border-[#8BE2B8] shadow-sm'
                    : 'border-white/[0.07] hover:border-white/25'
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
                    className="w-full h-full flex items-center justify-center font-display font-bold text-xs text-[#101A17]"
                    style={{ backgroundColor: comm.themeColor || '#8BE2B8' }}
                  >
                    {comm.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {/* Create Community */}
        <button
          onClick={onCreateCommunity}
          title="Create Community"
          className="w-10 h-10 rounded-xl bg-[#192620] hover:bg-[#24362C] border border-dashed border-white/15 hover:border-[#8BE2B8] text-[#8BE2B8] flex items-center justify-center transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Public Communities Directory */}
        <button
          onClick={onNavigateExplore}
          title="Explore Communities Directory"
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors shrink-0 ${
            isExploreActive
              ? 'bg-[#24362C] border-[#8BE2B8] text-[#8BE2B8]'
              : 'bg-[#192620] border-white/[0.07] text-[#9BAEA2] hover:text-[#F0F5F1]'
          }`}
        >
          <Globe className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Profile & Settings */}
      <div className="flex flex-col items-center gap-1.5 pt-3 border-t border-white/[0.06] w-full">
        <button
          onClick={onNavigateProfile}
          title="My User Profile"
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            isProfileActive
              ? 'bg-[#24362C] text-[#8BE2B8]'
              : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
          }`}
        >
          <User className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          title="Settings"
          className="w-9 h-9 rounded-lg text-[#9BAEA2] hover:text-[#F0F5F1] hover:bg-[#192620] flex items-center justify-center transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
