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
    <div className="flex-1 flex flex-col h-full bg-[#09090D] text-[#F5F3FA] overflow-hidden">
      {/* Top Navigation Header */}
      <header className="h-14 px-6 bg-[#09090D] border-b border-[#282631] flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[#F5F3FA] font-semibold text-xs">
            <Users className="w-4 h-4 text-[#8957F5]" />
            <span>Friends</span>
          </div>

          <span className="h-4 w-[1px] bg-[#282631]" />

          {/* Primary Tabs */}
          <div className="flex items-center gap-1 bg-[#101014] p-1 rounded-md border border-[#282631]">
            <button
              onClick={() => onSubTabChange('online')}
              className={`h-6 px-2.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                subTab === 'online'
                  ? 'bg-[#17171F] text-[#F5F3FA]'
                  : 'text-[#A19DAD] hover:text-[#F5F3FA]'
              }`}
            >
              Online <span className="font-mono tabular-nums ml-0.5">({onlineCount})</span>
            </button>

            <button
              onClick={() => onSubTabChange('all')}
              className={`h-6 px-2.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                subTab === 'all'
                  ? 'bg-[#17171F] text-[#F5F3FA]'
                  : 'text-[#A19DAD] hover:text-[#F5F3FA]'
              }`}
            >
              All Friends <span className="font-mono tabular-nums ml-0.5">({friends.length})</span>
            </button>

            <button
              onClick={() => onSubTabChange('pending')}
              className={`h-6 px-2.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                subTab === 'pending'
                  ? 'bg-[#17171F] text-[#F5F3FA]'
                  : 'text-[#A19DAD] hover:text-[#F5F3FA]'
              }`}
            >
              Requests <span className="font-mono tabular-nums ml-0.5">({pendingRequests.length})</span>
            </button>

            <button
              onClick={() => onSubTabChange('blocked')}
              className={`h-6 px-2.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                subTab === 'blocked'
                  ? 'bg-[#17171F] text-[#F5F3FA]'
                  : 'text-[#A19DAD] hover:text-[#F5F3FA]'
              }`}
            >
              Blocked <span className="font-mono tabular-nums ml-0.5">({blockedUsersList.length})</span>
            </button>
          </div>

          <button
            onClick={() => onSubTabChange('add')}
            className={`h-7 px-3 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              subTab === 'add'
                ? 'bg-[#8957F5] text-white shadow-sm'
                : 'bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[#A47BFF]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative hidden sm:block">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#706C7B]" />
          <input
            type="text"
            placeholder="Filter friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 pr-2.5 text-xs bg-[#101014] rounded-md border border-[#282631] focus:border-[#8957F5]/50 text-[#F5F3FA] placeholder-[#706C7B] outline-none w-44 transition-colors"
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto">
        {subTab === 'add' ? (
          <div className="space-y-5">
            <div className="p-5 rounded-xl bg-[#101014] border border-[#282631] space-y-3.5">
              <div>
                <h2 className="text-sm font-semibold text-[#F5F3FA]">
                  Add Friend by Username
                </h2>
                <p className="text-xs text-[#706C7B] mt-0.5">
                  Search registered Doomcord accounts by @username, display name, or email.
                </p>
              </div>

              <div className="flex items-center px-3 h-9 rounded-lg bg-[#17171F] border border-[#282631] focus-within:border-[#8957F5]/60 transition-colors">
                <Search className="w-3.5 h-3.5 text-[#706C7B] mr-2" />
                <input
                  type="text"
                  placeholder="Search @username or name..."
                  value={addSearchInput}
                  onChange={(e) => setAddSearchInput(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-[#F5F3FA] placeholder-[#706C7B] outline-none"
                />
              </div>

              {addFeedback && (
                <div className="p-2.5 rounded-md bg-[#8957F5]/10 border border-[#8957F5]/30 text-xs text-[#C4B1FF] font-medium">
                  {addFeedback}
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#706C7B]">
                <span>Registered Directory ({directoryResults.length})</span>
              </div>

              {directoryResults.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#101014] border border-[#282631] text-center text-xs text-[#706C7B]">
                  No registered accounts match your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {directoryResults.map((targetUser) => {
                    const isAlreadyFriend = friends.some((f) => f.uid === targetUser.uid);
                    const isOwner = isRootOwner(targetUser.uid);
                    return (
                      <div
                        key={targetUser.uid}
                        className="flex items-center justify-between p-3.5 rounded-lg bg-[#101014] hover:bg-[#17171F] border border-[#282631] transition-colors gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={
                              targetUser.photoURL ||
                              generateInitialsAvatar(targetUser.displayName)
                            }
                            alt={targetUser.displayName}
                            className="w-9 h-9 rounded-md object-cover bg-[#17171F] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-[#F5F3FA] truncate">
                                {targetUser.displayName}
                              </span>
                              {isOwner && (
                                <Shield className="w-3 h-3 text-[#A47BFF] shrink-0" />
                              )}
                              {targetUser.nitroTier !== 'free' && (
                                <Crown className="w-3 h-3 text-[#C4B1FF] shrink-0" />
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-[#706C7B] block truncate">
                              @{targetUser.username} ·{' '}
                              {formatRoleLabel(targetUser.role, targetUser.uid)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onViewProfile && (
                            <button
                              onClick={() => onViewProfile(targetUser.uid)}
                              title="View Profile"
                              className="h-7 px-2 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs text-[#A19DAD] hover:text-[#F5F3FA]"
                            >
                              <User className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenDmWithUser(targetUser)}
                            className="h-7 px-2.5 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#F5F3FA]"
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
                              className="h-7 px-2.5 rounded bg-[#8957F5] hover:bg-[#7a4be6] text-white text-xs font-medium flex items-center gap-1 shadow-sm"
                            >
                              <UserPlus className="w-3 h-3" />
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
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#706C7B] tabular-nums">
                Friend Requests — {displayedRequests.length}
              </h3>

              <div className="flex items-center gap-1 bg-[#101014] p-0.5 rounded-md border border-[#282631]">
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
                    className={`h-6 px-2 rounded text-xs font-medium transition-colors ${
                      pendingDirection === t.id
                        ? 'bg-[#17171F] text-[#F5F3FA]'
                        : 'text-[#A19DAD] hover:text-[#F5F3FA]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {displayedRequests.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#101014] border border-[#282631] text-center text-xs text-[#706C7B]">
                No pending friend requests in this category.
              </div>
            ) : (
              <div className="space-y-1.5">
                {displayedRequests.map((req) => {
                  const isIncoming = req.toUid === currentUser.uid;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-[#101014] border border-[#282631]"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            req.fromPhotoURL ||
                            generateInitialsAvatar(
                              req.fromDisplayName || req.fromUsername
                            )
                          }
                          alt={req.fromUsername}
                          className="w-9 h-9 rounded-md object-cover bg-[#17171F]"
                        />
                        <div>
                          <span className="text-xs font-semibold text-[#F5F3FA] block">
                            {isIncoming
                              ? req.fromDisplayName || req.fromUsername
                              : `@${req.toUsername}`}
                          </span>
                          <span className="text-[11px] font-mono text-[#706C7B]">
                            {isIncoming
                              ? `Incoming request from @${req.fromUsername}`
                              : `Sent request to @${req.toUsername}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isIncoming && (
                          <button
                            onClick={() => onAcceptRequest(req)}
                            className="h-7 px-2.5 rounded bg-[#8957F5] hover:bg-[#7a4be6] text-white text-xs font-medium flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Accept</span>
                          </button>
                        )}
                        <button
                          onClick={() => onRejectRequest(req.id)}
                          className="h-7 px-2.5 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[#A19DAD] hover:text-[#ED4245] text-xs font-medium flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
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
          <div className="space-y-3.5">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#706C7B] tabular-nums">
              Blocked Users — {blockedUsersList.length}
            </h3>
            {blockedUsersList.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#101014] border border-[#282631] text-center text-xs text-[#706C7B]">
                No blocked accounts.
              </div>
            ) : (
              <div className="space-y-1.5">
                {blockedUsersList.map((u) => (
                  <div
                    key={u.uid}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-[#101014] border border-[#282631]"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#F5F3FA] block">
                        {u.displayName}
                      </span>
                      <span className="text-[11px] font-mono text-[#706C7B]">
                        @{u.username}
                      </span>
                    </div>
                    <button
                      onClick={() => onUnblockUser(u.uid)}
                      className="h-7 px-3 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#F5F3FA]"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#706C7B] tabular-nums">
              {subTab === 'online'
                ? `Online Friends — ${filteredFriends.length}`
                : `All Friends — ${filteredFriends.length}`}
            </h3>

            {filteredFriends.length === 0 ? (
              <div className="p-10 rounded-xl bg-[#101014] border border-[#282631] text-center space-y-2.5">
                <Users className="w-7 h-7 text-[#8957F5] mx-auto opacity-80" />
                <div>
                  <h4 className="text-xs font-semibold text-[#F5F3FA]">
                    No Friends in This View
                  </h4>
                  <p className="text-[11px] text-[#706C7B] mt-0.5 max-w-md mx-auto">
                    Connect with registered Doomcord users to start conversations.
                  </p>
                </div>
                <button
                  onClick={() => onSubTabChange('add')}
                  className="h-7 px-3 rounded text-xs font-medium text-white bg-[#8957F5] hover:bg-[#7a4be6] transition-colors"
                >
                  Find Users
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.uid}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#101014] hover:bg-[#17171F] border border-[#282631] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={
                            friend.photoURL ||
                            generateInitialsAvatar(friend.displayName)
                          }
                          alt={friend.displayName}
                          className="w-9 h-9 rounded-md object-cover bg-[#17171F]"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#101014] ${getPresenceColor(
                            friend.presence
                          )}`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-[#F5F3FA] truncate">
                            {friend.displayName}
                          </span>
                          <span className="text-[10px] font-mono text-[#706C7B]">
                            @{friend.username}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#706C7B] block truncate max-w-md">
                          {friend.statusMessage || friend.bio || 'Available'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onViewProfile && (
                        <button
                          onClick={() => onViewProfile(friend.uid)}
                          className="w-7 h-7 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[#706C7B] hover:text-[#F5F3FA] flex items-center justify-center"
                          title="View Profile"
                        >
                          <User className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onOpenDmWithUser(friend)}
                        className="h-7 px-2.5 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#F5F3FA] flex items-center gap-1"
                        title="Open Message"
                      >
                        <MessageSquare className="w-3 h-3 text-[#8957F5]" />
                        <span>Message</span>
                      </button>

                      <button
                        onClick={() => onRemoveFriend(friend.uid)}
                        className="w-7 h-7 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[#706C7B] hover:text-[#ED4245] flex items-center justify-center"
                        title="Remove Friend"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onBlockUser(friend.uid)}
                        className="w-7 h-7 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[#706C7B] hover:text-[#ED4245] flex items-center justify-center"
                        title="Block User"
                      >
                        <Ban className="w-3.5 h-3.5" />
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
