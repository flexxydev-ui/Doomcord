import React, { useState } from 'react';
import { 
  Users, UserPlus, Check, X, MessageSquare, 
  ShieldAlert, ShieldCheck, Search, Sparkles, 
  Clock, MoreVertical, Ban, Trash2 
} from 'lucide-react';
import { UserProfile, FriendRequest, UserPresence } from '../../types';

interface FriendsHubProps {
  currentUser: UserProfile;
  friends: UserProfile[];
  pendingRequests: FriendRequest[];
  subTab: 'online' | 'all' | 'pending' | 'blocked' | 'add';
  onSubTabChange: (tab: 'online' | 'all' | 'pending' | 'blocked' | 'add') => void;
  onOpenDmWithUser: (user: UserProfile) => void;
  onSendFriendRequest: (targetUsername: string) => void;
  onAcceptRequest: (reqId: string) => void;
  onRejectRequest: (reqId: string) => void;
  onRemoveFriend: (uid: string) => void;
  onBlockUser: (uid: string) => void;
  onUnblockUser: (uid: string) => void;
}

export const FriendsHub: React.FC<FriendsHubProps> = ({
  currentUser,
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
  onUnblockUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addUsernameInput, setAddUsernameInput] = useState('');
  const [addFeedback, setAddFeedback] = useState<string | null>(null);

  // Filter friends based on subTab & search query
  const filteredFriends = friends.filter((f) => {
    const matchesSearch = f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.username.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (subTab === 'online') return f.presence === 'online' || f.presence === 'idle' || f.presence === 'dnd';
    if (subTab === 'blocked') return currentUser.blockedUsers?.includes(f.uid);
    return true;
  });

  const onlineCount = friends.filter(f => f.presence === 'online' || f.presence === 'idle' || f.presence === 'dnd').length;

  const handleSendAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsernameInput.trim()) return;

    onSendFriendRequest(addUsernameInput.trim());
    setAddFeedback(`Friend request sent to @${addUsernameInput.trim()}!`);
    setAddUsernameInput('');
    setTimeout(() => setAddFeedback(null), 4000);
  };

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
    <div className="flex-1 flex flex-col h-full bg-[oklch(0.2_0.03_160)] overflow-hidden">
      {/* Top Navigation & Sub-Tabs */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[oklch(0.17_0.028_161)] border-b border-white/5 z-10">
        <div className="flex items-center gap-6">
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
                  ? 'bg-[oklch(0.235_0.032_158)] text-white shadow-sm font-semibold'
                  : 'text-[oklch(0.7_0.03_155)] hover:text-white'
              }`}
            >
              Online ({onlineCount})
            </button>

            <button
              onClick={() => onSubTabChange('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                subTab === 'all'
                  ? 'bg-[oklch(0.235_0.032_158)] text-white shadow-sm font-semibold'
                  : 'text-[oklch(0.7_0.03_155)] hover:text-white'
              }`}
            >
              All ({friends.length})
            </button>

            <button
              onClick={() => onSubTabChange('pending')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all relative ${
                subTab === 'pending'
                  ? 'bg-[oklch(0.235_0.032_158)] text-white shadow-sm font-semibold'
                  : 'text-[oklch(0.7_0.03_155)] hover:text-white'
              }`}
            >
              Pending
              {pendingRequests.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[oklch(0.72_0.16_32)] text-white font-mono">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => onSubTabChange('blocked')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                subTab === 'blocked'
                  ? 'bg-[oklch(0.235_0.032_158)] text-white shadow-sm font-semibold'
                  : 'text-[oklch(0.7_0.03_155)] hover:text-white'
              }`}
            >
              Blocked
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
            className="pl-8 pr-3 py-1.5 text-xs bg-[oklch(0.235_0.032_158)] rounded-xl border border-white/5 text-white placeholder-[oklch(0.7_0.03_155)] outline-none w-48 focus:w-60 transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {subTab === 'add' ? (
          /* Add Friend Form */
          <div className="max-w-xl">
            <h3 className="text-base font-bold text-white mb-1">Add Friend</h3>
            <p className="text-xs text-[oklch(0.7_0.03_155)] mb-4">
              You can add friends with their unique Doomcord username.
            </p>

            <form onSubmit={handleSendAdd} className="relative mb-4">
              <div className="flex items-center p-2 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-white/10 focus-within:border-[oklch(0.85_0.12_165)] transition-all">
                <input
                  type="text"
                  placeholder="Enter a username (e.g. seraph_mint, cipher_zero)..."
                  value={addUsernameInput}
                  onChange={(e) => setAddUsernameInput(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white placeholder-[oklch(0.7_0.03_155)] px-3 outline-none"
                />
                <button
                  type="submit"
                  disabled={!addUsernameInput.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] rounded-xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 transition-all"
                >
                  Send Friend Request
                </button>
              </div>
            </form>

            {addFeedback && (
              <div className="p-3 rounded-xl bg-[oklch(0.85_0.12_165)]/20 border border-[oklch(0.85_0.12_165)]/30 text-xs text-[oklch(0.85_0.12_165)] font-medium">
                {addFeedback}
              </div>
            )}

            {/* Quick Suggestions for Demo */}
            <div className="mt-8 p-5 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-white/5">
              <span className="text-xs font-bold text-white block mb-3">
                Suggested Connections
              </span>
              <div className="space-y-3">
                {[
                  { username: 'seraph_mint', name: 'Seraphina Vale', desc: 'Spatial UI & Audio' },
                  { username: 'cipher_zero', name: 'Cipher', desc: 'Protocols & Three.js' },
                  { username: 'elena_sky', name: 'Elena Rostova', desc: '3D VFX & Shaders' }
                ].map((sug) => (
                  <div key={sug.username} className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">{sug.name}</span>
                      <span className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono">@{sug.username} · {sug.desc}</span>
                    </div>
                    <button
                      onClick={() => onSendFriendRequest(sug.username)}
                      className="px-3 py-1 text-xs font-medium bg-[oklch(0.235_0.032_158)] hover:bg-[oklch(0.26_0.035_156)] text-white rounded-lg border border-white/5 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : subTab === 'pending' ? (
          /* Pending Requests View */
          <div>
            <h3 className="text-xs font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider mb-4">
              Pending Requests — {pendingRequests.length}
            </h3>

            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-[oklch(0.7_0.03_155)]">
                There are no pending friend requests at this time.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={req.fromPhotoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.fromUid}&backgroundColor=0d382e`}
                        alt={req.fromUsername}
                        className="w-10 h-10 rounded-xl object-cover bg-black/20"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {req.fromDisplayName || req.fromUsername}
                        </span>
                        <span className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono">
                          Incoming Request · @{req.fromUsername}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAcceptRequest(req.id)}
                        className="p-2 rounded-xl bg-[oklch(0.85_0.12_165)]/20 border border-[oklch(0.85_0.12_165)]/30 text-[oklch(0.85_0.12_165)] hover:bg-[oklch(0.85_0.12_165)]/30 transition-all"
                        title="Accept Request"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRejectRequest(req.id)}
                        className="p-2 rounded-xl bg-[oklch(0.72_0.15_355)]/20 border border-[oklch(0.72_0.15_355)]/30 text-[oklch(0.72_0.15_355)] hover:bg-[oklch(0.72_0.15_355)]/30 transition-all"
                        title="Ignore Request"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Online or All Friends List */
          <div>
            <h3 className="text-xs font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider mb-4">
              {subTab === 'online' ? `Online Friends — ${filteredFriends.length}` : `All Friends — ${filteredFriends.length}`}
            </h3>

            {filteredFriends.length === 0 ? (
              <div className="p-8 text-center text-xs text-[oklch(0.7_0.03_155)]">
                No friends found in this section. Invite someone to start chatting!
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.uid}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[oklch(0.17_0.028_161)]/70 hover:bg-[oklch(0.17_0.028_161)] border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={friend.photoURL}
                          alt={friend.displayName}
                          className="w-10 h-10 rounded-xl object-cover bg-black/20"
                        />
                        <div 
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[oklch(0.17_0.028_161)] ${getPresenceColor(friend.presence)}`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-[oklch(0.85_0.12_165)] transition-colors">
                            {friend.displayName}
                          </span>
                          <span className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono">
                            @{friend.username}
                          </span>
                        </div>
                        <span className="text-xs text-[oklch(0.7_0.03_155)] block truncate max-w-md">
                          {friend.statusMessage || friend.bio || 'Exploring the Doomcord realm'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenDmWithUser(friend)}
                        className="p-2 rounded-xl bg-[oklch(0.235_0.032_158)] text-[oklch(0.95_0.015_150)] hover:text-white hover:bg-[oklch(0.26_0.035_156)] border border-white/5 transition-all"
                        title="Open Direct Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onRemoveFriend(friend.uid)}
                        className="p-2 rounded-xl bg-[oklch(0.235_0.032_158)] text-[oklch(0.7_0.03_155)] hover:text-[oklch(0.72_0.15_355)] hover:bg-[oklch(0.26_0.035_156)] border border-white/5 transition-all"
                        title="Remove Friend"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onBlockUser(friend.uid)}
                        className="p-2 rounded-xl bg-[oklch(0.235_0.032_158)] text-[oklch(0.7_0.03_155)] hover:text-[oklch(0.72_0.15_355)] hover:bg-[oklch(0.26_0.035_156)] border border-white/5 transition-all"
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
