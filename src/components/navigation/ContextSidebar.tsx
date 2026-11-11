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
  formatRoleLabel,
} from '../../lib/dataService';

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
  onSelectOrbView,
  onOpenSettings,
  onChangePresence,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const isCommunityView = activeView.type === 'community';
  const isOrbsView = activeView.type === 'orbs';

  const activeCommunity = isCommunityView
    ? communities.find((c) => c.id === activeView.communityId)
    : null;

  const isOwner = isRootOwner(currentUser.uid);
  const hasApex =
    isOwner ||
    currentUser.nitroTier !== 'free' ||
    Boolean(currentUser.permanentEntitlement);

  const getPresenceColor = (presence: UserPresence) => {
    switch (presence) {
      case 'online':
        return 'bg-[#6DD5A5]';
      case 'idle':
        return 'bg-[#E4B869]';
      case 'dnd':
        return 'bg-[#E57373]';
      case 'invisible':
      default:
        return 'bg-[#718478]';
    }
  };

  const filteredDms = directMessages.filter((dm) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = dm.recipientProfile?.displayName?.toLowerCase() || '';
    const uname = dm.recipientProfile?.username?.toLowerCase() || '';
    return name.includes(q) || uname.includes(q);
  });

  return (
    <aside className="w-64 h-full flex flex-col bg-[#141F1B] border-r border-white/[0.06] select-none shrink-0">
      {/* Top Contextual Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
        {isCommunityView && activeCommunity ? (
          <div className="w-full flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-display font-bold text-[#F0F5F1] truncate">
                {activeCommunity.name}
              </h2>
              <p className="text-[11px] font-mono text-[#718478] tabular-nums">
                {activeCommunity.members?.length || 1} members ·{' '}
                {activeCommunity.channels?.length || 1} channels
              </p>
            </div>
            <button
              onClick={() => onCreateChannel(activeCommunity.id)}
              title="Create Channel"
              className="w-8 h-8 rounded-lg bg-[#192620] hover:bg-[#24362C] border border-white/[0.07] text-[#8BE2B8] flex items-center justify-center transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : isOrbsView ? (
          <div className="w-full flex items-center justify-between">
            <div>
              <h2 className="text-sm font-display font-bold text-[#F0F5F1]">
                Orbs Discovery
              </h2>
              <p className="text-[11px] text-[#718478]">
                Interactive community spheres
              </p>
            </div>
            <Compass className="w-4 h-4 text-[#E9987B]" />
          </div>
        ) : (
          <div className="w-full">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#718478] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter conversations..."
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-[#101A17] border border-white/[0.07] focus:border-[#8BE2B8]/50 text-xs text-[#F0F5F1] placeholder-[#718478] outline-none transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Middle Contextual Content */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
        {isCommunityView && activeCommunity ? (
          <>
            {/* Community Description Banner */}
            {activeCommunity.description && (
              <div className="px-3 py-2.5 rounded-lg bg-[#192620] border border-white/[0.05] text-xs text-[#9BAEA2] leading-relaxed">
                {activeCommunity.description}
              </div>
            )}

            {/* Announcement Channels */}
            {activeCommunity.channels?.some((c) => c.type === 'announcement') && (
              <div>
                <div className="px-2 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#718478]">
                  Announcements
                </div>
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
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                            isActive
                              ? 'bg-[#24362C] text-[#F0F5F1] font-semibold'
                              : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
                          }`}
                        >
                          <Megaphone className="w-3.5 h-3.5 shrink-0 text-[#E9987B]" />
                          <span className="text-xs truncate">{ch.name}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Text Channels */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#718478]">
                  Text Channels
                </span>
                <button
                  onClick={() => onCreateChannel(activeCommunity.id)}
                  className="text-[#718478] hover:text-[#8BE2B8]"
                  title="New Channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
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
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                          isActive
                            ? 'bg-[#24362C] text-[#F0F5F1] font-semibold'
                            : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
                        }`}
                      >
                        <Hash className="w-3.5 h-3.5 shrink-0 text-[#8BE2B8]" />
                        <span className="text-xs truncate">{ch.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Voice & Stage Channels */}
            <div>
              <div className="px-2 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#718478]">
                Voice & Stage Rooms
              </div>
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
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                          isActive
                            ? 'bg-[#24362C] text-[#8BE2B8] font-semibold'
                            : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
                        }`}
                      >
                        {isStage ? (
                          <Radio className="w-3.5 h-3.5 shrink-0 text-[#D9BB79]" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 shrink-0 text-[#8BE2B8]" />
                        )}
                        <span className="text-xs truncate">{ch.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </>
        ) : isOrbsView ? (
          /* Orbs Contextual Navigation */
          <div className="space-y-5">
            <div className="space-y-1">
              <button
                onClick={() =>
                  onSelectOrbView?.({ type: 'orbs', viewMode: 'explore' })
                }
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeView.viewMode === 'explore' || !activeView.viewMode
                    ? 'bg-[#24362C] text-[#F0F5F1]'
                    : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
                }`}
              >
                <Compass className="w-4 h-4 text-[#8BE2B8]" />
                <span>Discover Orbs</span>
              </button>

              <button
                onClick={() => onSelectOrbView?.({ type: 'orbs', viewMode: '3d' })}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeView.viewMode === '3d'
                    ? 'bg-[#24362C] text-[#F0F5F1]'
                    : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
                }`}
              >
                <Box className="w-4 h-4 text-[#E9987B]" />
                <span>3D Spatial Constellation</span>
              </button>

              <button
                onClick={() =>
                  onSelectOrbView?.({ type: 'orbs', viewMode: 'create' })
                }
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeView.viewMode === 'create'
                    ? 'bg-[#8BE2B8] text-[#101A17] font-semibold'
                    : 'text-[#8BE2B8] hover:bg-[#192620]'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Create New Orb</span>
              </button>
            </div>

            <div>
              <div className="px-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-[#718478]">
                Active Orbs ({orbs.length})
              </div>
              {orbs.length === 0 ? (
                <p className="px-2 text-xs text-[#718478]">
                  No Orbs created yet.
                </p>
              ) : (
                <div className="space-y-1">
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
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-[#24362C] text-[#F0F5F1] font-semibold'
                            : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: orb.primaryColor || '#8BE2B8' }}
                          />
                          <span className="text-xs truncate">{orb.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#718478] tabular-nums">
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
            <div className="space-y-1">
              <button
                onClick={onNavigateDashboard}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
                  activeView.type === 'home'
                    ? 'bg-[#24362C] text-[#F0F5F1] font-semibold'
                    : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
                }`}
              >
                <Home className="w-4 h-4 text-[#8BE2B8]" />
                <span>Home Command</span>
              </button>

              <button
                onClick={() => onNavigateFriends('online')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
                  activeView.type === 'friends'
                    ? 'bg-[#24362C] text-[#F0F5F1] font-semibold'
                    : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
                }`}
              >
                <Users className="w-4 h-4 text-[#8BE2B8]" />
                <span>Friends</span>
              </button>

              <button
                onClick={onNavigateNotifications}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                  activeView.type === 'notifications'
                    ? 'bg-[#24362C] text-[#F0F5F1] font-semibold'
                    : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-[#8BE2B8]" />
                  <span>Notifications</span>
                </div>
                {notificationCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-[#E9987B] text-[#101A17] font-mono font-bold text-[10px] tabular-nums">
                    {notificationCount}
                  </span>
                )}
              </button>

              <button
                onClick={onNavigateProfile}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
                  activeView.type === 'profile'
                    ? 'bg-[#24362C] text-[#F0F5F1] font-semibold'
                    : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
                }`}
              >
                <User className="w-4 h-4 text-[#8BE2B8]" />
                <span>My Profile</span>
              </button>

              <button
                onClick={onNavigateNitro}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
                  activeView.type === 'nitro'
                    ? 'bg-[#24362C] text-[#D9BB79] font-semibold'
                    : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
                }`}
              >
                <Crown className="w-4 h-4 text-[#D9BB79]" />
                <span>DOOMCORD APEX</span>
              </button>

              <button
                onClick={onNavigateShop}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
                  activeView.type === 'shop'
                    ? 'bg-[#24362C] text-[#F0F5F1] font-semibold'
                    : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-[#E9987B]" />
                <span>APEX Collection</span>
              </button>

              {(currentUser.role === 'root_owner' ||
                currentUser.role === 'secondary_owner' ||
                currentUser.role === 'owner' ||
                currentUser.role === 'admin') && (
                <button
                  onClick={onNavigateAdmin}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
                    activeView.type === 'admin'
                      ? 'bg-[#8BE2B8]/20 text-[#8BE2B8] font-semibold'
                      : 'text-[#8BE2B8] hover:bg-[#192620]'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Console</span>
                </button>
              )}
            </div>

            {/* Direct Messages Section */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-[#718478]">
                <span>Direct Messages ({filteredDms.length})</span>
                <button
                  onClick={() => onNavigateFriends('add')}
                  title="New Direct Message"
                  className="text-[#8BE2B8] hover:text-[#F0F5F1]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {filteredDms.length === 0 ? (
                <div className="px-3 py-4 rounded-lg bg-[#101A17] border border-white/[0.05] text-center space-y-1.5">
                  <p className="text-[11px] text-[#9BAEA2]">
                    {searchQuery
                      ? 'No matching conversations'
                      : 'No active direct messages'}
                  </p>
                  <button
                    onClick={() => onNavigateFriends('add')}
                    className="text-[11px] font-medium text-[#8BE2B8] hover:underline"
                  >
                    + Start a conversation
                  </button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredDms.map((dm) => {
                    const isActive =
                      activeView.type === 'dm' && activeView.dmId === dm.id;
                    const recipient = dm.recipientProfile;

                    return (
                      <button
                        key={dm.id}
                        onClick={() => onSelectDm(dm.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                          isActive
                            ? 'bg-[#24362C] text-[#F0F5F1] font-semibold'
                            : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
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
                            className="w-7 h-7 rounded-lg object-cover bg-[#1D2B24]"
                          />
                          {recipient && (
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#141F1B] ${getPresenceColor(
                                recipient.presence
                              )}`}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#F0F5F1] truncate">
                              {recipient?.displayName || 'Direct Message'}
                            </span>
                            {dm.unreadCount && dm.unreadCount > 0 ? (
                              <span className="px-1.5 py-0.5 rounded bg-[#E9987B] text-[#101A17] text-[9px] font-mono font-bold tabular-nums">
                                {dm.unreadCount}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-[#718478] truncate block">
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
      <div className="p-3 bg-[#111B17] border-t border-white/[0.06] flex items-center justify-between gap-2 shrink-0">
        <button
          onClick={onNavigateProfile}
          className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition-opacity"
        >
          <div className="relative shrink-0">
            <img
              src={
                currentUser.photoURL ||
                generateInitialsAvatar(currentUser.displayName)
              }
              alt={currentUser.displayName}
              className="w-8 h-8 rounded-lg object-cover bg-[#1D2B24]"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#111B17] ${getPresenceColor(
                currentUser.presence
              )}`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-[#F0F5F1] truncate">
                {currentUser.displayName}
              </span>
              {hasApex && (
                <Crown className="w-3 h-3 text-[#D9BB79] shrink-0" />
              )}
            </div>
            <span className="text-[10px] font-mono text-[#718478] truncate block">
              @{currentUser.username} · {formatRoleLabel(currentUser.role, currentUser.uid)}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <select
            value={currentUser.presence}
            onChange={(e) => onChangePresence(e.target.value as UserPresence)}
            className="text-[10px] bg-[#192620] text-[#F0F5F1] rounded-md px-1.5 py-1 border border-white/[0.07] outline-none cursor-pointer"
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
            className="p-1.5 rounded-md text-[#9BAEA2] hover:text-[#F0F5F1] hover:bg-[#192620] transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
