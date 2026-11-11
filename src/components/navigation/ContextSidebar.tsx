import React from 'react';
import { 
  Users, Hash, Volume2, Radio, Plus, Settings, 
  ChevronDown, Mic, MicOff, VolumeX, Shield, 
  Compass, Sparkles, MessageSquare 
} from 'lucide-react';
import { 
  Community, Channel, DirectMessageThread, 
  ActiveView, UserProfile, UserPresence 
} from '../../types';

interface ContextSidebarProps {
  activeView: ActiveView;
  communities: Community[];
  directMessages: DirectMessageThread[];
  currentUser: UserProfile;
  onNavigateFriends: (subTab?: 'online' | 'all' | 'pending' | 'blocked' | 'add') => void;
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
  onSelectDm,
  onSelectChannel,
  onCreateChannel,
  onOpenSettings,
  onChangePresence
}) => {
  const isHome = activeView.type === 'friends' || activeView.type === 'dm';
  const activeCommunity = activeView.type === 'community' 
    ? communities.find(c => c.id === activeView.communityId)
    : null;

  const getPresenceColor = (presence: UserPresence) => {
    switch (presence) {
      case 'online': return 'bg-[oklch(0.85_0.12_165)]';
      case 'idle': return 'bg-[oklch(0.84_0.14_85)]';
      case 'dnd': return 'bg-[oklch(0.72_0.15_355)]';
      case 'invisible':
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="w-60 h-full flex flex-col bg-[oklch(0.17_0.028_161)] border-r border-white/5 select-none shrink-0">
      {/* Top Header Section */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 shadow-sm">
        {isHome ? (
          <button
            onClick={() => onNavigateFriends()}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
              activeView.type === 'friends'
                ? 'bg-[oklch(0.235_0.032_158)] text-white font-semibold'
                : 'text-[oklch(0.7_0.03_155)] hover:bg-[oklch(0.235_0.032_158)] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
            <span className="text-xs font-bold">Friends Hub</span>
          </button>
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

      {/* Middle Channel or DM List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {isHome ? (
          /* Direct Messages List */
          <div>
            <div className="flex items-center justify-between px-2 mb-2 text-[10px] font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider">
              <span>Direct Messages</span>
            </div>

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
                        src={recipient?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${dm.id}&backgroundColor=0d382e`}
                        alt={recipient?.displayName || 'User'}
                        className="w-7 h-7 rounded-lg object-cover bg-black/20"
                      />
                      {recipient && (
                        <div 
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[oklch(0.17_0.028_161)] ${getPresenceColor(recipient.presence)}`}
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
                        {dm.lastMessageText || 'No messages yet'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : activeCommunity ? (
          /* Community Channels List */
          <div className="space-y-4">
            {/* Text & Announcement Channels */}
            <div>
              <div className="px-2 mb-1.5 text-[10px] font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider">
                Text Channels
              </div>
              <div className="space-y-0.5">
                {activeCommunity.channels?.filter(c => c.type === 'text' || c.type === 'announcement').map((ch) => {
                  const isActive = activeView.type === 'community' && activeView.channelId === ch.id;
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
                {activeCommunity.channels?.filter(c => c.type === 'voice' || c.type === 'stage').map((ch) => {
                  const isActive = activeView.type === 'community' && activeView.channelId === ch.id;
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
                      {isStage && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded bg-[oklch(0.76_0.11_230)]/20 text-[oklch(0.76_0.11_230)] font-mono">
                          STAGE
                        </span>
                      )}
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
              src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}&backgroundColor=0d382e`}
              alt={currentUser.displayName}
              className="w-8 h-8 rounded-xl object-cover bg-black/20"
            />
            {/* Presence selector dropdown toggle */}
            <div 
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[oklch(0.14_0.025_162)] ${getPresenceColor(currentUser.presence)}`}
            />
          </div>

          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate">
              {currentUser.displayName}
            </span>
            <span className="text-[10px] text-[oklch(0.7_0.03_155)] font-mono block truncate">
              @{currentUser.username}
            </span>
          </div>
        </div>

        {/* Status / Settings Trigger */}
        <div className="flex items-center gap-1">
          {/* Quick Presence Toggle */}
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
