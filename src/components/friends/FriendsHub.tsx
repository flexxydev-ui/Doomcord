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
} from 'lucide-react';
import { UserProfile, FriendRequest, UserPresence } from '../../types';
import { generateInitialsAvatar } from '../../lib/dataService';

interface FriendsHubProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  friends: UserProfile[];
  pendingRequests: FriendRequest[];
  subTab: 'online' | 'all' | 'pending' | 'blocked' | 'add';
  onSubTabChange: (tab: 'online' | 'all' | 'pending' | 'blocked' | 'add') => void;
  onOpenDmWithUser: (user: UserProfile) => void;
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

  // Real registered users directory search for Add Friend
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
    <div className="flex-1 flex flex-col h-full bg-[oklch(0.2_0.03_160)] overflow-hidden">
      {/* Top Navigation & Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-[oklch(0.17_0.028_161)] border-b border-white/5 z-10">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Users className="w-5 h-5 text-[oklch(0.85_0.12_165)]" />
            <span>Friends</span>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Sub-Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSubTabChange('online')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                subTab === 'online'
                  ? 'bg-[oklch(0.235_0.032_158)] text-white font-semibold'
                  : 'text-[oklch(0.7_0.03_155)] hover:text-white'
              }`}
            >
              Online ({onlineCount})
            </button>

            <button
              onClick={() => onSubTabChange('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                subTab === 'all'
                  ? 'bg-[oklch(0.235_0.032_158)] text-white font-semibold'
                  : 'text-[oklch(0.7_0.03_155)] hover:text-white'
              }`}
            >
              All ({friends.length})
            </button>

            <button
              onClick={() => onSubTabChange('pending')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                subTab === 'pending'
                  ? 'bg-[oklch(0.235_0.032_158)] text-white font-semibold'
                  : 'text-[oklch(0.7_0.03_155)] hover:text-white'
              }`}
            >
              Pending ({pendingRequests.length})
            </button>

            <button
              onClick={() => onSubTabChange('blocked')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                subTab === 'blocked'
                  ? 'bg-[oklch(0.235_0.032_158)] text-white font-semibold'
                  : 'text-[oklch(0.7_0.03_155)] hover:text-white'
              }`}
            >
              Blocked ({blockedUsersList.length})
            </button>

            <button
              onClick={() => onSubTabChange('add')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                subTab === 'add'
                  ? 'bg-[oklch(0.85_0.12_165)] text-black shadow-md'
                  : 'bg-[oklch(0.85_0.12_165)]/20 text-[oklch(0.85_0.12_165)] hover:bg-[oklch(0.85_0.12_165)]/30'
              }`}
            >
              Add Friend
            </button>
          </div>
        </div>

        {/* Search Friend Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.7_0.03_155)]" />
          <input
            type="text"
            placeholder="Filter friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-[oklch(0.235_0.032_158)] rounded-xl border border-white/5 text-white placeholder-[oklch(0.7_0.03_155)] outline-none w-48"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {subTab === 'add' ? (
          <div className="max-w-2xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                Find & Connect with Registered Users
              </h3>
              <p className="text-xs text-[oklch(0.7_0.03_155)]">
                Search real registered Doomcord accounts by username or display name.
              </p>
            </div>

            <div className="flex items-center p-2 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-white/10">
              <Search className="w-4 h-4 text-[oklch(0.7_0.03_155)] ml-2" />
              <input
                type="text"
                placeholder="Search by @username or display name..."
                value={addSearchInput}
                onChange={(e) => setAddSearchInput(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white placeholder-[oklch(0.7_0.03_155)] px-3 py-1.5 outline-none"
              />
            </div>

            {addFeedback && (
              <div className="p-3 rounded-xl bg-[oklch(0.85_0.12_165)]/20 border border-[oklch(0.85_0.12_165)]/30 text-xs text-[oklch(0.85_0.12_165)] font-medium">
                {addFeedback}
              </div>
            )}

            <div className="space-y-2">
              <span className="text-xs font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider block">
                Registered Accounts ({directoryResults.length})
              </span>

              {directoryResults.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-white/5 text-center text-xs text-[oklch(0.7_0.03_155)]">
                  No other registered user accounts match your search yet. Register another account to test real multi-user connections!
                </div>
              ) : (
                directoryResults.map((targetUser) => {
                  const isAlreadyFriend = friends.some((f) => f.uid === targetUser.uid);
                  return (
                    <div
                      key={targetUser.uid}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            targetUser.photoURL ||
                            generateInitialsAvatar(targetUser.displayName)
                          }
                          alt={targetUser.displayName}
                          className="w-10 h-10 rounded-xl object-cover bg-black/20"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {targetUser.displayName}
                          </span>
                          <span className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono">
                            @{targetUser.username} · {targetUser.role.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenDmWithUser(targetUser)}
                          className="px-3 py-1.5 rounded-xl bg-[oklch(0.235_0.032_158)] hover:bg-[oklch(0.26_0.035_156)] text-xs font-semibold text-white border border-white/5"
                        >
                          Message
                        </button>

                        {!isAlreadyFriend && (
                          <button
                            onClick={async () => {
                              await onSendFriendRequest(targetUser);
                              setAddFeedback(
                                `Sent friend request to @${targetUser.username}.`
                              );
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[oklch(0.85_0.12_165)] text-black text-xs font-bold"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add Friend</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : subTab === 'pending' ? (
          <div>
            <h3 className="text-xs font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider mb-4">
              Pending Friend Requests — {pendingRequests.length}
            </h3>

            {pendingRequests.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/5 text-center text-xs text-[oklch(0.7_0.03_155)]">
                There are no pending incoming or outgoing friend requests.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req) => {
                  const isIncoming = req.toUid === currentUser.uid;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            req.fromPhotoURL ||
                            generateInitialsAvatar(req.fromDisplayName || req.fromUsername)
                          }
                          alt={req.fromUsername}
                          className="w-10 h-10 rounded-xl object-cover bg-black/20"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {isIncoming
                              ? req.fromDisplayName || req.fromUsername
                              : `@${req.toUsername}`}
                          </span>
                          <span className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono">
                            {isIncoming
                              ? `Incoming Request from @${req.fromUsername}`
                              : `Outgoing Request to @${req.toUsername}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isIncoming && (
                          <button
                            onClick={() => onAcceptRequest(req)}
                            className="p-2 rounded-xl bg-[oklch(0.85_0.12_165)]/20 border border-[oklch(0.85_0.12_165)]/30 text-[oklch(0.85_0.12_165)]"
                            title="Accept Request"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onRejectRequest(req.id)}
                          className="p-2 rounded-xl bg-[oklch(0.72_0.15_355)]/20 border border-[oklch(0.72_0.15_355)]/30 text-[oklch(0.72_0.15_355)]"
                          title={isIncoming ? 'Reject Request' : 'Cancel Outgoing Request'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : subTab === 'blocked' ? (
          <div>
            <h3 className="text-xs font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider mb-4">
              Blocked Users — {blockedUsersList.length}
            </h3>
            {blockedUsersList.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/5 text-center text-xs text-[oklch(0.7_0.03_155)]">
                You have not blocked any accounts.
              </div>
            ) : (
              <div className="space-y-2">
                {blockedUsersList.map((u) => (
                  <div
                    key={u.uid}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-white/5"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{u.displayName}</span>
                      <span className="text-[11px] font-mono text-[oklch(0.7_0.03_155)]">
                        @{u.username}
                      </span>
                    </div>
                    <button
                      onClick={() => onUnblockUser(u.uid)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-xs text-white"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 className="text-xs font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider mb-4">
              {subTab === 'online'
                ? `Online Friends — ${filteredFriends.length}`
                : `All Friends — ${filteredFriends.length}`}
            </h3>

            {filteredFriends.length === 0 ? (
              <div className="p-10 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/5 text-center space-y-3">
                <Users className="w-8 h-8 text-[oklch(0.85_0.12_165)] mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-white">No Friends Connected Yet</h4>
                  <p className="text-xs text-[oklch(0.7_0.03_155)] mt-1 max-w-md mx-auto">
                    Your friends list starts completely clean with zero fake accounts. Click below to browse registered accounts and send a friend request.
                  </p>
                </div>
                <button
                  onClick={() => onSubTabChange('add')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-black bg-[oklch(0.85_0.12_165)]"
                >
                  Find Registered Users
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.uid}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[oklch(0.17_0.028_161)]/70 hover:bg-[oklch(0.17_0.028_161)] border border-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={
                            friend.photoURL ||
                            generateInitialsAvatar(friend.displayName)
                          }
                          alt={friend.displayName}
                          className="w-10 h-10 rounded-xl object-cover bg-black/20"
                        />
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[oklch(0.17_0.028_161)] ${getPresenceColor(
                            friend.presence
                          )}`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {friend.displayName}
                          </span>
                          <span className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono">
                            @{friend.username}
                          </span>
                        </div>
                        <span className="text-xs text-[oklch(0.7_0.03_155)] block truncate max-w-md">
                          {friend.statusMessage || friend.bio || 'Online'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenDmWithUser(friend)}
                        className="p-2 rounded-xl bg-[oklch(0.235_0.032_158)] text-white hover:bg-[oklch(0.26_0.035_156)] border border-white/5"
                        title="Open Direct Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onRemoveFriend(friend.uid)}
                        className="p-2 rounded-xl bg-[oklch(0.235_0.032_158)] text-[oklch(0.7_0.03_155)] hover:text-[oklch(0.72_0.15_355)] border border-white/5"
                        title="Remove Friend"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onBlockUser(friend.uid)}
                        className="p-2 rounded-xl bg-[oklch(0.235_0.032_158)] text-[oklch(0.7_0.03_155)] hover:text-[oklch(0.72_0.15_355)] border border-white/5"
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
