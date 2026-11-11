import React from 'react';
import {
  Users,
  Hash,
  Volume2,
  Radio,
  Plus,
  Settings,
  Crown,
  ShoppingBag,
  Sparkles,
  Shield,
} from 'lucide-react';
import {
  Community,
  DirectMessageThread,
  ActiveView,
  UserProfile,
  UserPresence,
} from '../../types';
import { generateInitialsAvatar } from '../../lib/dataService';

interface ContextSidebarProps {
  activeView: ActiveView;
  communities: Community[];
  directMessages: DirectMessageThread[];
  currentUser: UserProfile;
  onNavigateFriends: (subTab?: 'online' | 'all' | 'pending' | 'blocked' | 'add') => void;
  onNavigateNitro: () => void;
  onNavigateShop: () => void;
  onNavigateAdmin: () => void;
  onSelectDm: (dmId: string) => void;
  onSelectChannel: (communityId: string, channelId: string) => void;
  onCreateChannel: (communityId: string) => void;
  onOpenSettings: () => void;
  onChangePresence: (presence: UserPresence) => void;
}

export const ContextSidebar: React.FC<ContextSidebarProps> = ({
  activeView,
  communities,
  directMessages,
  currentUser,
  onNavigateFriends,
  onNavigateNitro,
  onNavigateShop,
  onNavigateAdmin,
  onSelectDm,
  onSelectChannel,
  onCreateChannel,
  onOpenSettings,
  onChangePresence,
}) => {
  const isHome =
    activeView.type === 'friends' ||
    activeView.type === 'dm' ||
    activeView.type === 'nitro' ||
    activeView.type === 'shop' ||
    activeView.type === 'admin';

  const activeCommunity =
    activeView.type === 'community'
      ? communities.find((c) => c.id === activeView.communityId)
      : null;

  const getPresenceColor = (presence: UserPresence) => {
    switch (presence) {
      case 'online':
        return 'bg-[oklch(0.85_0.12_165)]';
      case 'idle':
        return 'bg-[oklch(0.84_0.14_85)]';
      case 'dnd':
        return 'bg-[oklch(0.72_0.15_355)]';
      case 'invisible':
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="w-60 h-full flex flex-col bg-[oklch(0.17_0.028_161)] border-r border-white/5 select-none shrink-0">
      {/* Top Header Section */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 shadow-sm">
        {isHome ? (
          <div className="flex items-center gap-2 text-white text-xs font-bold">
            <Sparkles className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
            <span>Doomcord Personal Hub</span>
          </div>
        ) : activeCommunity ? (
          <div className="w-full flex items-center justify-between">
            <span className="text-sm font-bold text-white tracking-wide truncate max-w-[170px]">
              {activeCommunity.name}
            </span>
            <button
              onClick={() => onCreateChannel(activeCommunity.id)}
              title="Add Channel"
              className="p-1.5 rounded-lg hover:bg-white/5 text-[oklch(0.7_0.03_155)] hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white text-xs font-bold">
            <Sparkles className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
            <span>Doomcord Nexus</span>
          </div>
        )}
      </div>

      {/* Middle Navigation / Channel / DM List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {isHome ? (
          <>
            {/* Hub Navigation Links */}
            <div className="space-y-1">
              <button
                onClick={() => onNavigateFriends('online')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                  activeView.type === 'friends'
                    ? 'bg-[oklch(0.235_0.032_158)] text-white font-semibold'
                    : 'text-[oklch(0.7_0.03_155)] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
                <span className="text-xs">Friends</span>
              </button>

              <button
                onClick={onNavigateNitro}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                  activeView.type === 'nitro'
                    ? 'bg-[oklch(0.235_0.032_158)] text-white font-semibold'
                    : 'text-[oklch(0.7_0.03_155)] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Crown className="w-4 h-4 text-[oklch(0.84_0.14_85)]" />
                <span className="text-xs">Doomcord Nitro</span>
              </button>

              <button
                onClick={onNavigateShop}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                  activeView.type === 'shop'
                    ? 'bg-[oklch(0.235_0.032_158)] text-white font-semibold'
                    : 'text-[oklch(0.7_0.03_155)] hover:bg-white/5 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-[oklch(0.72_0.16_32)]" />
                <span className="text-xs">Cosmetics Shop</span>
              </button>

              {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
                <button
                  onClick={onNavigateAdmin}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                    activeView.type === 'admin'
                      ? 'bg-[oklch(0.84_0.14_85)]/20 text-[oklch(0.84_0.14_85)] font-semibold'
                      : 'text-[oklch(0.84_0.14_85)]/80 hover:bg-white/5 hover:text-[oklch(0.84_0.14_85)]'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Owner Admin Console</span>
                </button>
              )}
            </div>

            {/* Direct Messages List */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2 text-[10px] font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider">
                <span>Direct Messages ({directMessages.length})</span>
                <button
                  onClick={() => onNavigateFriends('add')}
                  title="Start New Conversation"
                  className="text-[oklch(0.85_0.12_165)] hover:text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {directMessages.length === 0 ? (
                <div className="px-3 py-4 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-1">
                  <span className="text-[11px] text-[oklch(0.7_0.03_155)] block">
                    No active direct messages yet.
                  </span>
                  <button
                    onClick={() => onNavigateFriends('add')}
                    className="text-[11px] font-semibold text-[oklch(0.85_0.12_165)] hover:underline"
                  >
                    Find a user to message
                  </button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {directMessages.map((dm) => {
                    const isActive = activeView.type === 'dm' && activeView.dmId === dm.id;
                    const recipient = dm.recipientProfile;

                    return (
                      <button
                        key={dm.id}
                        onClick={() => onSelectDm(dm.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                          isActive
                            ? 'bg-[oklch(0.235_0.032_158)] text-white font-semibold shadow-sm'
                            : 'text-[oklch(0.7_0.03_155)] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={
                              recipient?.photoURL ||
                              generateInitialsAvatar(recipient?.displayName || 'User')
                            }
                            alt={recipient?.displayName || 'User'}
                            className="w-7 h-7 rounded-lg object-cover bg-black/20"
                          />
                          {recipient && (
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[oklch(0.17_0.028_161)] ${getPresenceColor(
                                recipient.presence
                              )}`}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white truncate">
                              {recipient?.displayName || 'Direct Message'}
                            </span>
                            {dm.unreadCount && dm.unreadCount > 0 ? (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[oklch(0.72_0.16_32)] text-white font-mono">
                                {dm.unreadCount}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-[oklch(0.7_0.03_155)] truncate block">
                            {dm.lastMessageText || 'Open conversation'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : activeCommunity ? (
          <div className="space-y-4">
            {/* Text & Announcement Channels */}
            <div>
              <div className="px-2 mb-1.5 text-[10px] font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider">
                Text Channels
              </div>
              <div className="space-y-0.5">
                {activeCommunity.channels
                  ?.filter((c) => c.type === 'text' || c.type === 'announcement')
                  .map((ch) => {
                    const isActive =
                      activeView.type === 'community' && activeView.channelId === ch.id;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => onSelectChannel(activeCommunity.id, ch.id)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition-all ${
                          isActive
                            ? 'bg-[oklch(0.235_0.032_158)] text-white font-semibold'
                            : 'text-[oklch(0.7_0.03_155)] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Hash className="w-4 h-4 shrink-0 text-[oklch(0.85_0.12_165)]" />
                        <span className="text-xs truncate">{ch.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Voice & Stage Channels */}
            <div>
              <div className="px-2 mb-1.5 text-[10px] font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider">
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
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition-all ${
                          isActive
                            ? 'bg-[oklch(0.235_0.032_158)] text-[oklch(0.85_0.12_165)] font-semibold'
                            : 'text-[oklch(0.7_0.03_155)] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {isStage ? (
                          <Radio className="w-4 h-4 shrink-0 text-[oklch(0.76_0.11_230)]" />
                        ) : (
                          <Volume2 className="w-4 h-4 shrink-0 text-[oklch(0.85_0.12_165)]" />
                        )}
                        <span className="text-xs truncate">{ch.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-xs text-[oklch(0.7_0.03_155)]">
            Select a community or navigate to Friends to view channels and conversations.
          </div>
        )}
      </div>

      {/* User Dock at Bottom */}
      <div className="p-2.5 bg-[oklch(0.14_0.025_162)] border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={
                currentUser.photoURL || generateInitialsAvatar(currentUser.displayName)
              }
              alt={currentUser.displayName}
              className="w-8 h-8 rounded-xl object-cover bg-black/20"
            />
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[oklch(0.14_0.025_162)] ${getPresenceColor(
                currentUser.presence
              )}`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white block truncate">
                {currentUser.displayName}
              </span>
              {currentUser.nitroTier !== 'free' && (
                <Crown className="w-3 h-3 text-[oklch(0.84_0.14_85)] shrink-0" />
              )}
            </div>
            <span className="text-[10px] text-[oklch(0.7_0.03_155)] font-mono block truncate">
              @{currentUser.username} · {currentUser.role.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <select
            value={currentUser.presence}
            onChange={(e) => onChangePresence(e.target.value as UserPresence)}
            className="text-[10px] bg-[oklch(0.235_0.032_158)] text-white rounded-lg px-1.5 py-1 border border-white/5 outline-none cursor-pointer"
            title="Set presence"
          >
            <option value="online">Online</option>
            <option value="idle">Idle</option>
            <option value="dnd">DND</option>
            <option value="invisible">Invisible</option>
          </select>

          <button
            onClick={onOpenSettings}
            title="User Settings"
            className="p-1.5 rounded-lg text-[oklch(0.7_0.03_155)] hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
