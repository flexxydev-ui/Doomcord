import React, { useState } from 'react';
import {
  Users,
  Check,
  X,
  MessageSquare,
  Search,
  Ban,
  Trash2,
  UserPlus,
  User,
  Crown,
  Shield,
} from 'lucide-react';
import { UserProfile, FriendRequest, UserPresence } from '../../types';
import {
  generateInitialsAvatar,
  isRootOwner,
  formatRoleLabel,
} from '../../lib/dataService';

interface FriendsHubProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  friends: UserProfile[];
  pendingRequests: FriendRequest[];
  subTab: 'online' | 'all' | 'pending' | 'blocked' | 'add';
  onSubTabChange: (tab: 'online' | 'all' | 'pending' | 'blocked' | 'add') => void;
  onOpenDmWithUser: (user: UserProfile) => void;
  onViewProfile?: (userId: string) => void;
  onSendFriendRequest: (targetUser: UserProfile) => Promise<void>;
  onAcceptRequest: (req: FriendRequest) => Promise<void>;
  onRejectRequest: (reqId: string) => Promise<void>;
  onRemoveFriend: (uid: string) => Promise<void>;
  onBlockUser: (uid: string) => Promise<void>;
  onUnblockUser: (uid: string) => Promise<void>;
}

export const FriendsHub: React.FC<FriendsHubProps> = ({
  currentUser,
  allUsers,
  friends,
  pendingRequests,
  subTab,
  onSubTabChange,
  onOpenDmWithUser,
  onViewProfile,
  onSendFriendRequest,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  onBlockUser,
  onUnblockUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addSearchInput, setAddSearchInput] = useState('');
  const [addFeedback, setAddFeedback] = useState<string | null>(null);
  const [pendingDirection, setPendingDirection] = useState<'all' | 'incoming' | 'sent'>('all');

  const blockedUids = currentUser.blockedUsers || [];
  const blockedUsersList = allUsers.filter((u) => blockedUids.includes(u.uid));

  const filteredFriends = friends.filter((f) => {
    if (blockedUids.includes(f.uid)) return false;
    const matchesSearch =
      f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (subTab === 'online') {
      return f.presence === 'online' || f.presence === 'idle' || f.presence === 'dnd';
    }
    return true;
  });

  const onlineCount = friends.filter(
    (f) =>
      !blockedUids.includes(f.uid) &&
      (f.presence === 'online' || f.presence === 'idle' || f.presence === 'dnd')
  ).length;

  const incomingRequests = pendingRequests.filter((r) => r.toUid === currentUser.uid);
  const sentRequests = pendingRequests.filter((r) => r.fromUid === currentUser.uid);

  const displayedRequests =
    pendingDirection === 'incoming'
      ? incomingRequests
      : pendingDirection === 'sent'
      ? sentRequests
      : pendingRequests;

  const directoryResults = allUsers.filter((u) => {
    if (u.uid === currentUser.uid) return false;
    if (!addSearchInput.trim()) return true;
    const q = addSearchInput.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#101A17] text-[#F0F5F1] overflow-hidden">
      {/* Top Navigation Header */}
      <header className="h-16 px-6 bg-[#101A17] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-4 shrink-0 z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[#F0F5F1] font-display font-bold text-sm">
            <Users className="w-4 h-4 text-[#8BE2B8]" />
            <span>Friends</span>
          </div>

          <span className="h-4 w-[1px] bg-white/[0.08]" />

          {/* Primary Tabs */}
          <div className="flex items-center gap-1 bg-[#141F1B] p-1 rounded-lg border border-white/[0.06]">
            <button
              onClick={() => onSubTabChange('online')}
              className={`h-7 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                subTab === 'online'
                  ? 'bg-[#24362C] text-[#F0F5F1]'
                  : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
              }`}
            >
              Online <span className="font-mono tabular-nums ml-1">({onlineCount})</span>
            </button>

            <button
              onClick={() => onSubTabChange('all')}
              className={`h-7 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                subTab === 'all'
                  ? 'bg-[#24362C] text-[#F0F5F1]'
                  : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
              }`}
            >
              All Friends <span className="font-mono tabular-nums ml-1">({friends.length})</span>
            </button>

            <button
              onClick={() => onSubTabChange('pending')}
              className={`h-7 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                subTab === 'pending'
                  ? 'bg-[#24362C] text-[#F0F5F1]'
                  : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
              }`}
            >
              Requests <span className="font-mono tabular-nums ml-1">({pendingRequests.length})</span>
            </button>

            <button
              onClick={() => onSubTabChange('blocked')}
              className={`h-7 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                subTab === 'blocked'
                  ? 'bg-[#24362C] text-[#F0F5F1]'
                  : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
              }`}
            >
              Blocked <span className="font-mono tabular-nums ml-1">({blockedUsersList.length})</span>
            </button>
          </div>

          <button
            onClick={() => onSubTabChange('add')}
            className={`h-8 px-3.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'add'
                ? 'bg-[#8BE2B8] text-[#101A17]'
                : 'bg-[#192620] hover:bg-[#24362C] border border-[#8BE2B8]/30 text-[#8BE2B8]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative hidden sm:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#718478]" />
          <input
            type="text"
            placeholder="Filter friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-3 text-xs bg-[#141F1B] rounded-lg border border-white/[0.07] focus:border-[#8BE2B8]/50 text-[#F0F5F1] placeholder-[#718478] outline-none w-48"
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 max-w-5xl w-full mx-auto">
        {subTab === 'add' ? (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-[#141F1B] border border-white/[0.06] space-y-4">
              <div>
                <h2 className="text-base font-display font-bold text-[#F0F5F1]">
                  Add Friend by Username
                </h2>
                <p className="text-xs text-[#9BAEA2] mt-0.5">
                  Search real registered Doomcord accounts by @username, display name, or email.
                </p>
              </div>

              <div className="flex items-center px-3.5 h-11 rounded-xl bg-[#101A17] border border-white/[0.08] focus-within:border-[#8BE2B8]/60">
                <Search className="w-4 h-4 text-[#718478] mr-2.5" />
                <input
                  type="text"
                  placeholder="Enter a Doomcord @username or display name..."
                  value={addSearchInput}
                  onChange={(e) => setAddSearchInput(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-[#F0F5F1] placeholder-[#718478] outline-none"
                />
              </div>

              {addFeedback && (
                <div className="p-3 rounded-lg bg-[#192620] border border-[#8BE2B8]/30 text-xs text-[#8BE2B8] font-medium">
                  {addFeedback}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#718478]">
                <span>Registered Directory ({directoryResults.length})</span>
              </div>

              {directoryResults.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#141F1B] border border-white/[0.06] text-center text-xs text-[#9BAEA2]">
                  No registered user accounts match your search query.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {directoryResults.map((targetUser) => {
                    const isAlreadyFriend = friends.some((f) => f.uid === targetUser.uid);
                    const isOwner = isRootOwner(targetUser.uid);
                    return (
                      <div
                        key={targetUser.uid}
                        className="flex items-center justify-between p-4 rounded-xl bg-[#141F1B] hover:bg-[#192620] border border-white/[0.06] transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              targetUser.photoURL ||
                              generateInitialsAvatar(targetUser.displayName)
                            }
                            alt={targetUser.displayName}
                            className="w-10 h-10 rounded-lg object-cover bg-[#1D2B24] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-[#F0F5F1] truncate">
                                {targetUser.displayName}
                              </span>
                              {isOwner && (
                                <Shield className="w-3.5 h-3.5 text-[#D9BB79] shrink-0" />
                              )}
                              {targetUser.nitroTier !== 'free' && (
                                <Crown className="w-3.5 h-3.5 text-[#D9BB79] shrink-0" />
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-[#718478] block truncate">
                              @{targetUser.username} ·{' '}
                              {formatRoleLabel(targetUser.role, targetUser.uid)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {onViewProfile && (
                            <button
                              onClick={() => onViewProfile(targetUser.uid)}
                              title="View Profile"
                              className="h-8 px-2.5 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.07] text-xs text-[#9BAEA2] hover:text-[#F0F5F1]"
                            >
                              <User className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenDmWithUser(targetUser)}
                            className="h-8 px-3 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.07] text-xs font-medium text-[#F0F5F1]"
                          >
                            Message
                          </button>

                          {!isAlreadyFriend && (
                            <button
                              onClick={async () => {
                                await onSendFriendRequest(targetUser);
                                setAddFeedback(
                                  `Friend request sent to @${targetUser.username}.`
                                );
                              }}
                              className="h-8 px-3 rounded-lg bg-[#8BE2B8] hover:bg-[#7AD4A8] text-[#101A17] text-xs font-semibold flex items-center gap-1.5"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : subTab === 'pending' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#9BAEA2] tabular-nums">
                Friend Requests — {displayedRequests.length}
              </h3>

              <div className="flex items-center gap-1 bg-[#141F1B] p-1 rounded-lg border border-white/[0.06]">
                {(
                  [
                    { id: 'all', label: `All (${pendingRequests.length})` },
                    { id: 'incoming', label: `Incoming (${incomingRequests.length})` },
                    { id: 'sent', label: `Sent (${sentRequests.length})` },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPendingDirection(t.id)}
                    className={`h-7 px-2.5 rounded text-xs font-medium transition-colors ${
                      pendingDirection === t.id
                        ? 'bg-[#24362C] text-[#F0F5F1]'
                        : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {displayedRequests.length === 0 ? (
              <div className="p-10 rounded-xl bg-[#141F1B] border border-white/[0.06] text-center text-xs text-[#9BAEA2]">
                No pending friend requests in this category.
              </div>
            ) : (
              <div className="space-y-2">
                {displayedRequests.map((req) => {
                  const isIncoming = req.toUid === currentUser.uid;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#141F1B] border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            req.fromPhotoURL ||
                            generateInitialsAvatar(
                              req.fromDisplayName || req.fromUsername
                            )
                          }
                          alt={req.fromUsername}
                          className="w-10 h-10 rounded-lg object-cover bg-[#1D2B24]"
                        />
                        <div>
                          <span className="text-sm font-semibold text-[#F0F5F1] block">
                            {isIncoming
                              ? req.fromDisplayName || req.fromUsername
                              : `@${req.toUsername}`}
                          </span>
                          <span className="text-xs font-mono text-[#718478]">
                            {isIncoming
                              ? `Incoming request from @${req.fromUsername}`
                              : `Sent request to @${req.toUsername}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isIncoming && (
                          <button
                            onClick={() => onAcceptRequest(req)}
                            className="h-8 px-3 rounded-lg bg-[#8BE2B8] hover:bg-[#7AD4A8] text-[#101A17] text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        )}
                        <button
                          onClick={() => onRejectRequest(req.id)}
                          className="h-8 px-3 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.08] text-[#9BAEA2] hover:text-[#E57373] text-xs font-medium flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{isIncoming ? 'Decline' : 'Cancel'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : subTab === 'blocked' ? (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#9BAEA2] tabular-nums">
              Blocked Users — {blockedUsersList.length}
            </h3>
            {blockedUsersList.length === 0 ? (
              <div className="p-10 rounded-xl bg-[#141F1B] border border-white/[0.06] text-center text-xs text-[#9BAEA2]">
                You haven't blocked any accounts.
              </div>
            ) : (
              <div className="space-y-2">
                {blockedUsersList.map((u) => (
                  <div
                    key={u.uid}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#141F1B] border border-white/[0.06]"
                  >
                    <div>
                      <span className="text-sm font-semibold text-[#F0F5F1] block">
                        {u.displayName}
                      </span>
                      <span className="text-xs font-mono text-[#718478]">
                        @{u.username}
                      </span>
                    </div>
                    <button
                      onClick={() => onUnblockUser(u.uid)}
                      className="h-8 px-3.5 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.08] text-xs font-medium text-[#F0F5F1]"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#9BAEA2] tabular-nums">
              {subTab === 'online'
                ? `Online Friends — ${filteredFriends.length}`
                : `All Friends — ${filteredFriends.length}`}
            </h3>

            {filteredFriends.length === 0 ? (
              <div className="p-12 rounded-xl bg-[#141F1B] border border-white/[0.06] text-center space-y-3">
                <Users className="w-8 h-8 text-[#8BE2B8] mx-auto opacity-80" />
                <div>
                  <h4 className="text-sm font-display font-bold text-[#F0F5F1]">
                    No Friends in This View Yet
                  </h4>
                  <p className="text-xs text-[#9BAEA2] mt-1 max-w-md mx-auto">
                    Connect with real registered Doomcord users to start direct conversations and collaborate across communities.
                  </p>
                </div>
                <button
                  onClick={() => onSubTabChange('add')}
                  className="h-9 px-4 rounded-lg text-xs font-semibold text-[#101A17] bg-[#8BE2B8] hover:bg-[#7AD4A8] transition-colors"
                >
                  Find Registered Users
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.uid}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#141F1B] hover:bg-[#192620] border border-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={
                            friend.photoURL ||
                            generateInitialsAvatar(friend.displayName)
                          }
                          alt={friend.displayName}
                          className="w-10 h-10 rounded-lg object-cover bg-[#1D2B24]"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#141F1B] ${getPresenceColor(
                            friend.presence
                          )}`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#F0F5F1] truncate">
                            {friend.displayName}
                          </span>
                          <span className="text-xs font-mono text-[#718478]">
                            @{friend.username}
                          </span>
                        </div>
                        <span className="text-xs text-[#9BAEA2] block truncate max-w-md">
                          {friend.statusMessage || friend.bio || 'Available'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onViewProfile && (
                        <button
                          onClick={() => onViewProfile(friend.uid)}
                          className="w-8 h-8 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.07] text-[#9BAEA2] hover:text-[#F0F5F1] flex items-center justify-center"
                          title="View Profile"
                        >
                          <User className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onOpenDmWithUser(friend)}
                        className="h-8 px-3 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.07] text-xs font-medium text-[#F0F5F1] flex items-center gap-1.5"
                        title="Open Direct Message"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#8BE2B8]" />
                        <span>Message</span>
                      </button>

                      <button
                        onClick={() => onRemoveFriend(friend.uid)}
                        className="w-8 h-8 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.07] text-[#9BAEA2] hover:text-[#E57373] flex items-center justify-center"
                        title="Remove Friend"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onBlockUser(friend.uid)}
                        className="w-8 h-8 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.07] text-[#9BAEA2] hover:text-[#E57373] flex items-center justify-center"
                        title="Block User"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
