import React, { useState } from 'react';
import {
  Home,
  Users,
  Hash,
  Volume2,
  Radio,
  Plus,
  Settings,
  Crown,
  ShoppingBag,
  Shield,
  Search,
  Bell,
  User,
  Compass,
  Megaphone,
  Box,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  Community,
  DirectMessageThread,
  OrbData,
  ActiveView,
  UserProfile,
  UserPresence,
} from '../../types';
import {
  generateInitialsAvatar,
  isRootOwner,
} from '../../lib/dataService';
import { calculateServerBoostState } from '../../lib/chatEnhancements';

interface ContextSidebarProps {
  activeView: ActiveView;
  communities: Community[];
  directMessages: DirectMessageThread[];
  orbs?: OrbData[];
  currentUser: UserProfile;
  notificationCount?: number;
  onNavigateDashboard: () => void;
  onNavigateFriends: (subTab?: 'online' | 'all' | 'pending' | 'blocked' | 'add') => void;
  onNavigateNotifications: () => void;
  onNavigateProfile: () => void;
  onNavigateNitro: () => void;
  onNavigateShop: () => void;
  onNavigateAdmin: () => void;
  onSelectDm: (dmId: string) => void;
  onSelectChannel: (communityId: string, channelId: string) => void;
  onCreateChannel: (communityId: string) => void;
  onBoostCommunity?: (communityId: string) => void;
  onOpenQuickSwitcher?: () => void;
  onSelectOrbView?: (view: ActiveView) => void;
  onOpenSettings: () => void;
  onChangePresence: (presence: UserPresence) => void;
}

export const ContextSidebar: React.FC<ContextSidebarProps> = ({
  activeView,
  communities,
  directMessages,
  orbs = [],
  currentUser,
  notificationCount = 0,
  onNavigateDashboard,
  onNavigateFriends,
  onNavigateNotifications,
  onNavigateProfile,
  onNavigateNitro,
  onNavigateShop,
  onNavigateAdmin,
  onSelectDm,
  onSelectChannel,
  onCreateChannel,
  onBoostCommunity,
  onOpenQuickSwitcher,
  onSelectOrbView,
  onOpenSettings,
  onChangePresence,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isCommunityView = activeView.type === 'community';
  const isOrbsView = activeView.type === 'orbs';

  const activeCommunity = isCommunityView
    ? communities.find((c) => c.id === activeView.communityId)
    : null;

  const boostState = activeCommunity
    ? calculateServerBoostState(activeCommunity.boostCount || 0)
    : null;

  const isOwner = isRootOwner(currentUser.uid);
  const hasApex =
    isOwner ||
    currentUser.nitroTier !== 'free' ||
    Boolean(currentUser.permanentEntitlement);

  const getPresenceColor = (presence: UserPresence) => {
    switch (presence) {
      case 'online':
        return 'bg-[#3BA55D]';
      case 'idle':
        return 'bg-[#FAA81A]';
      case 'dnd':
        return 'bg-[#ED4245]';
      case 'invisible':
      default:
        return 'bg-[#706C7B]';
    }
  };

  return (
    <aside className="w-60 h-full flex flex-col bg-[#0D0D12] border-r border-[#282631] select-none shrink-0 text-[#F5F3FA]">
      {/* Top Header */}
      <div className="h-14 px-3.5 flex items-center justify-between border-b border-[#282631] shrink-0">
        {isCommunityView && activeCommunity ? (
          <div className="w-full flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-semibold text-[#F5F3FA] truncate">
                  {activeCommunity.name}
                </h2>
                {boostState && boostState.level > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-[#8957F5]/20 border border-[#8957F5]/40 text-[9px] font-mono text-[#C4B1FF] tabular-nums shrink-0">
                    LVL {boostState.level}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono text-[#706C7B] tabular-nums">
                {activeCommunity.members?.length || 1} members ·{' '}
                {activeCommunity.channels?.length || 1} channels
              </p>
            </div>
            <button
              onClick={() => onCreateChannel(activeCommunity.id)}
              title="Create Channel"
              className="w-7 h-7 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[#8957F5] flex items-center justify-center transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : isOrbsView ? (
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/assets/aistudio/doomcord-icon_378efdf9.png"
                alt="Doomcord"
                className="w-5 h-5 object-contain"
              />
              <span className="text-xs font-semibold text-[#F5F3FA]">Orbs Spheres</span>
            </div>
            <Compass className="w-4 h-4 text-[#A47BFF]" />
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenQuickSwitcher}
            className="w-full h-8 px-2.5 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] flex items-center justify-between text-xs text-[#706C7B] hover:text-[#F5F3FA] transition-colors"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-[#8957F5] shrink-0" />
              <span className="truncate">Find or jump to...</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#101014] border border-[#282631] text-[9px] font-mono text-[#A19DAD] shrink-0">
              Ctrl K
            </kbd>
          </button>
        )}
      </div>

      {/* Middle Scrollable Section */}
      <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-4">
        {isCommunityView && activeCommunity ? (
          <>
            {/* Server Boost Bar */}
            {boostState && (
              <div className="p-2.5 rounded-lg bg-[#101014] border border-[#282631] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#C4B1FF] flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#8957F5]" />
                    <span>Level {boostState.level} Server</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#706C7B] tabular-nums">
                    {boostState.boostCount}/{boostState.nextLevelBoosts} Boosts
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#17171F] overflow-hidden">
                  <div
                    className="h-full bg-[#8957F5] transition-all duration-300"
                    style={{ width: `${boostState.progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] font-mono text-[#706C7B] tabular-nums">
                    {boostState.audioBitrateKbps}kbps · {boostState.uploadLimitMB}MB
                  </span>
                  {onBoostCommunity && (
                    <button
                      type="button"
                      onClick={() => onBoostCommunity(activeCommunity.id)}
                      className="px-2 py-0.5 rounded bg-[#8957F5] hover:bg-[#7846E4] text-[10px] font-semibold text-white transition-colors flex items-center gap-1"
                    >
                      <Zap className="w-2.5 h-2.5" />
                      <span>Boost</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Switcher Trigger inside Server */}
            {onOpenQuickSwitcher && (
              <button
                type="button"
                onClick={onOpenQuickSwitcher}
                className="w-full px-2.5 py-1.5 rounded-md bg-[#101014] hover:bg-[#17171F] border border-[#282631] flex items-center justify-between text-[11px] text-[#706C7B] hover:text-[#F5F3FA] transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-[#8957F5]" />
                  <span>Quick Switcher</span>
                </span>
                <span className="font-mono text-[9px] text-[#706C7B]">Ctrl+K</span>
              </button>
            )}

            {/* Announcement Channels */}
            {activeCommunity.channels?.some((c) => c.type === 'announcement') && (
              <div>
                <button
                  type="button"
                  onClick={() => toggleGroup('announcements')}
                  className="w-full flex items-center justify-between px-2 mb-1 text-[10px] font-mono uppercase tracking-wider text-[#706C7B] hover:text-[#F5F3FA]"
                >
                  <span className="flex items-center gap-1">
                    {collapsedGroups['announcements'] ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    <span>Announcements</span>
                  </span>
                </button>
                {!collapsedGroups['announcements'] && (
                  <div className="space-y-0.5">
                    {activeCommunity.channels
                      .filter((c) => c.type === 'announcement')
                      .map((ch) => {
                        const isActive =
                          activeView.type === 'community' && activeView.channelId === ch.id;
                        return (
                          <button
                            key={ch.id}
                            onClick={() => onSelectChannel(activeCommunity.id, ch.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors ${
                              isActive
                                ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                                : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                            }`}
                          >
                            <Megaphone className="w-3.5 h-3.5 shrink-0 text-[#A47BFF]" />
                            <span className="text-xs truncate">{ch.name}</span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Text Channels */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1">
                <button
                  type="button"
                  onClick={() => toggleGroup('text')}
                  className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#706C7B] hover:text-[#F5F3FA]"
                >
                  {collapsedGroups['text'] ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <span>Text Channels</span>
                </button>
                <button
                  onClick={() => onCreateChannel(activeCommunity.id)}
                  className="text-[#706C7B] hover:text-[#8957F5]"
                  title="New Channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {!collapsedGroups['text'] && (
                <div className="space-y-0.5">
                  {activeCommunity.channels
                    ?.filter((c) => c.type === 'text')
                    .map((ch) => {
                      const isActive =
                        activeView.type === 'community' && activeView.channelId === ch.id;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => onSelectChannel(activeCommunity.id, ch.id)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors ${
                            isActive
                              ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                              : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                          }`}
                        >
                          <Hash className="w-3.5 h-3.5 shrink-0 text-[#706C7B]" />
                          <span className="text-xs truncate">{ch.name}</span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Voice & Stage Channels */}
            <div>
              <button
                type="button"
                onClick={() => toggleGroup('voice')}
                className="w-full flex items-center justify-between px-2 mb-1 text-[10px] font-mono uppercase tracking-wider text-[#706C7B] hover:text-[#F5F3FA]"
              >
                <span className="flex items-center gap-1">
                  {collapsedGroups['voice'] ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <span>Voice & Stage Rooms</span>
                </span>
              </button>
              {!collapsedGroups['voice'] && (
                <div className="space-y-0.5">
                  {activeCommunity.channels
                    ?.filter((c) => c.type === 'voice' || c.type === 'stage')
                    .map((ch) => {
                      const isActive =
                        activeView.type === 'community' && activeView.channelId === ch.id;
                      const isStage = ch.type === 'stage';
                      return (
                        <button
                          key={ch.id}
                          onClick={() => onSelectChannel(activeCommunity.id, ch.id)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors ${
                            isActive
                              ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                              : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                          }`}
                        >
                          {isStage ? (
                            <Radio className="w-3.5 h-3.5 shrink-0 text-[#C4B1FF]" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 shrink-0 text-[#8957F5]" />
                          )}
                          <span className="text-xs truncate">{ch.name}</span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        ) : isOrbsView ? (
          /* Orbs Contextual Navigation */
          <div className="space-y-4">
            <div className="space-y-0.5">
              <button
                onClick={() =>
                  onSelectOrbView?.({ type: 'orbs', viewMode: 'explore' })
                }
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeView.viewMode === 'explore' || !activeView.viewMode
                    ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                    : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                }`}
              >
                <Compass className="w-4 h-4 text-[#8957F5]" />
                <span>Discover Orbs</span>
              </button>

              <button
                onClick={() => onSelectOrbView?.({ type: 'orbs', viewMode: '3d' })}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeView.viewMode === '3d'
                    ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                    : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                }`}
              >
                <Box className="w-4 h-4 text-[#A47BFF]" />
                <span>3D Spatial Constellation</span>
              </button>

              <button
                onClick={() =>
                  onSelectOrbView?.({ type: 'orbs', viewMode: 'create' })
                }
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeView.viewMode === 'create'
                    ? 'bg-[#8957F5] text-white font-semibold'
                    : 'text-[#A47BFF] hover:bg-[#17171F]'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Create New Orb</span>
              </button>
            </div>

            <div>
              <div className="px-2 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#706C7B]">
                Active Orbs ({orbs.length})
              </div>
              {orbs.length === 0 ? (
                <p className="px-2 text-xs text-[#706C7B]">
                  No Orbs created yet.
                </p>
              ) : (
                <div className="space-y-0.5">
                  {orbs.map((orb) => {
                    const isSelected =
                      activeView.type === 'orbs' && activeView.orbId === orb.id;
                    return (
                      <button
                        key={orb.id}
                        onClick={() =>
                          onSelectOrbView?.({
                            type: 'orbs',
                            orbId: orb.id,
                            viewMode: 'detail',
                          })
                        }
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors ${
                          isSelected
                            ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                            : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: orb.primaryColor || '#8957F5' }}
                          />
                          <span className="text-xs truncate">{orb.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#706C7B] tabular-nums">
                          {orb.memberCount || 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Personal Workspace Navigation + Direct Messages */
          <>
            <div className="space-y-0.5">
              <button
                onClick={onNavigateDashboard}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  activeView.type === 'home'
                    ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                    : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                }`}
              >
                <Home className="w-4 h-4 text-[#8957F5]" />
                <span>Home</span>
              </button>

              <button
                onClick={() => onNavigateFriends('online')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  activeView.type === 'friends'
                    ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                    : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                }`}
              >
                <Users className="w-4 h-4 text-[#A47BFF]" />
                <span>Friends</span>
              </button>

              <button
                onClick={onNavigateNotifications}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  activeView.type === 'notifications'
                    ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                    : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-[#C4B1FF]" />
                  <span>Notifications</span>
                </div>
                {notificationCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#8957F5] text-white font-mono font-bold text-[10px] tabular-nums">
                    {notificationCount}
                  </span>
                )}
              </button>

              <button
                onClick={onNavigateProfile}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  activeView.type === 'profile'
                    ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                    : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                }`}
              >
                <User className="w-4 h-4 text-[#706C7B]" />
                <span>My Profile</span>
              </button>

              <button
                onClick={onNavigateNitro}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  activeView.type === 'nitro'
                    ? 'bg-[#17171F] text-[#A47BFF] font-semibold'
                    : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                }`}
              >
                <Crown className="w-4 h-4 text-[#8957F5]" />
                <span>APEX Membership</span>
              </button>

              <button
                onClick={onNavigateShop}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  activeView.type === 'shop'
                    ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                    : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-[#C4B1FF]" />
                <span>Cosmetics Shop</span>
              </button>

              {(currentUser.role === 'root_owner' ||
                currentUser.role === 'secondary_owner' ||
                currentUser.role === 'owner' ||
                currentUser.role === 'admin') && (
                <button
                  onClick={onNavigateAdmin}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                    activeView.type === 'admin'
                      ? 'bg-[#8957F5]/20 text-[#A47BFF] font-semibold'
                      : 'text-[#8957F5] hover:bg-[#17171F]'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Console</span>
                </button>
              )}
            </div>

            {/* Direct Messages Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between px-2 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#706C7B]">
                <span>Direct Messages</span>
                <button
                  onClick={() => onNavigateFriends('add')}
                  title="New Direct Message"
                  className="text-[#706C7B] hover:text-[#8957F5] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {directMessages.length === 0 ? (
                <div className="px-3 py-3 rounded-md bg-[#101014] border border-[#282631] text-center space-y-1">
                  <p className="text-[11px] text-[#706C7B]">
                    No active direct messages
                  </p>
                  <button
                    onClick={() => onNavigateFriends('add')}
                    className="text-[11px] font-medium text-[#8957F5] hover:underline"
                  >
                    + Find a friend
                  </button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {directMessages.map((dm) => {
                    const isActive =
                      activeView.type === 'dm' && activeView.dmId === dm.id;
                    const recipient = dm.recipientProfile;

                    return (
                      <button
                        key={dm.id}
                        onClick={() => onSelectDm(dm.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                          isActive
                            ? 'bg-[#17171F] text-[#F5F3FA] font-medium'
                            : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={
                              recipient?.photoURL ||
                              generateInitialsAvatar(
                                recipient?.displayName || 'User'
                              )
                            }
                            alt={recipient?.displayName || 'User'}
                            className="w-7 h-7 rounded-md object-cover bg-[#17171F]"
                          />
                          {recipient && (
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0D0D12] ${getPresenceColor(
                                recipient.presence
                              )}`}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#F5F3FA] truncate">
                              {recipient?.displayName || 'Direct Message'}
                            </span>
                            {dm.unreadCount && dm.unreadCount > 0 ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#8957F5] text-white text-[9px] font-mono font-bold tabular-nums">
                                {dm.unreadCount}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-[#706C7B] truncate block">
                            {dm.lastMessageText || 'Open thread'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom User Identity Dock */}
      <div className="p-2.5 bg-[#0D0D12] border-t border-[#282631] flex items-center justify-between gap-1.5 shrink-0">
        <button
          onClick={onNavigateProfile}
          className="flex items-center gap-2 min-w-0 text-left hover:opacity-90 transition-opacity flex-1"
        >
          <div className="relative shrink-0">
            <img
              src={
                currentUser.photoURL ||
                generateInitialsAvatar(currentUser.displayName)
              }
              alt={currentUser.displayName}
              className="w-7 h-7 rounded-md object-cover bg-[#17171F]"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0D0D12] ${getPresenceColor(
                currentUser.presence
              )}`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-[#F5F3FA] truncate">
                {currentUser.displayName}
              </span>
              {hasApex && (
                <Crown className="w-3 h-3 text-[#A47BFF] shrink-0" />
              )}
            </div>
            <span className="text-[10px] font-mono text-[#706C7B] truncate block">
              @{currentUser.username}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <select
            value={currentUser.presence}
            onChange={(e) => onChangePresence(e.target.value as UserPresence)}
            className="text-[10px] bg-[#17171F] text-[#A19DAD] rounded px-1 py-1 border border-[#282631] outline-none cursor-pointer focus:border-[#8957F5]/50"
            title="Set Presence Status"
          >
            <option value="online">Online</option>
            <option value="idle">Idle</option>
            <option value="dnd">DND</option>
            <option value="invisible">Invisible</option>
          </select>

          <button
            onClick={onOpenSettings}
            title="Account & App Settings"
            className="p-1 rounded text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F] transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
