import React from 'react';
import {
  MessageSquare,
  Users,
  Compass,
  Crown,
  Sparkles,
  Plus,
  UserPlus,
  Bell,
  ArrowUpRight,
  Shield,
  Hash,
  Receipt,
  Gift,
  User,
} from 'lucide-react';
import {
  UserProfile,
  DirectMessageThread,
  Community,
  OrbData,
  FriendRequest,
  GiftRecord,
  ReceiptRecord,
  ActiveView,
} from '../../types';
import { isRootOwner, isSecondaryOwner, formatRoleLabel } from '../../lib/dataService';

interface HomeDashboardViewProps {
  profile: UserProfile;
  allUsers: UserProfile[];
  dmThreads: DirectMessageThread[];
  communities: Community[];
  orbs: OrbData[];
  friendRequests: FriendRequest[];
  gifts: GiftRecord[];
  receipts: ReceiptRecord[];
  onSelectView: (view: ActiveView) => void;
  onStartDM: (targetUser: UserProfile) => void;
  onOpenCreateCommunity: () => void;
  onOpenCreateOrb: () => void;
  onOpenReceipt: (receipt: ReceiptRecord) => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  profile,
  allUsers,
  dmThreads,
  communities,
  orbs,
  friendRequests,
  gifts,
  receipts,
  onSelectView,
  onStartDM,
  onOpenCreateCommunity,
  onOpenCreateOrb,
  onOpenReceipt,
}) => {
  const isOwner = isRootOwner(profile);
  const isSecOwner = isSecondaryOwner(profile);
  const hasApexPlus =
    isOwner ||
    profile.nitroTier === 'nitro' ||
    profile.permanentEntitlement === 'OWNER_PERMANENT_APEX' ||
    profile.permanentEntitlement === 'LIFETIME_APEX_PLUS';
  const hasApexBasic = profile.nitroTier === 'basic' || profile.permanentEntitlement === 'LIFETIME_APEX';

  const joinedCommunities = communities.filter((c) => c.members?.includes(profile.uid));
  const friendIds = profile.friends || [];
  const friends = allUsers.filter((u) => friendIds.includes(u.uid));
  const onlineFriends = friends.filter((u) => u.presence !== 'invisible');

  const pendingIncomingRequests = friendRequests.filter(
    (r) => r.toUid === profile.uid && r.status === 'pending'
  );

  const unclaimedGiftsForMe = gifts.filter(
    (g) =>
      g.status === 'unclaimed' &&
      ((g.restrictedRecipientUid && g.restrictedRecipientUid === profile.uid) ||
        (g.restrictedRecipientUsername &&
          g.restrictedRecipientUsername.toLowerCase() === profile.username.toLowerCase()) ||
        (g.restrictedRecipientEmail &&
          g.restrictedRecipientEmail.toLowerCase() === profile.email.toLowerCase()))
  );

  const myReceipts = receipts.filter(
    (r) =>
      r.customerUid === profile.uid ||
      r.customerEmail?.toLowerCase() === profile.email?.toLowerCase()
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101A17] text-[#F0F5F1]">
      {/* Top Workspace Header */}
      <header className="sticky top-0 z-20 h-16 px-8 bg-[#101A17]/95 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#8BE2B8]">
            Workspace
          </span>
          <span className="text-[#718478]">/</span>
          <h1 className="font-display font-bold text-base text-[#F0F5F1]">Home Command</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onSelectView({ type: 'notifications' })}
            className="h-9 px-3.5 rounded-lg bg-[#192620] hover:bg-[#24362C] border border-white/[0.07] text-xs font-medium text-[#F0F5F1] flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5 text-[#8BE2B8]" />
            <span>Inbox</span>
            {pendingIncomingRequests.length + unclaimedGiftsForMe.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-[#E9987B] text-[#101A17] font-mono font-bold text-[10px] tabular-nums">
                {pendingIncomingRequests.length + unclaimedGiftsForMe.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectView({ type: 'profile', userId: profile.uid })}
            className="h-9 px-3.5 rounded-lg bg-[#192620] hover:bg-[#24362C] border border-white/[0.07] text-xs font-medium text-[#F0F5F1] flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <User className="w-3.5 h-3.5 text-[#9BAEA2]" />
            <span>My Profile</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
        {/* Identity & Quick Launch Banner */}
        <section className="rounded-xl bg-[#141F1B] border border-white/[0.07] p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-xl bg-[#1D2B24] border border-[#8BE2B8]/30 flex items-center justify-center text-lg font-display font-bold text-[#8BE2B8] overflow-hidden">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.displayName?.slice(0, 2).toUpperCase() || 'DC'
                )}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#141F1B] ${
                  profile.presence === 'online'
                    ? 'bg-[#6DD5A5]'
                    : profile.presence === 'idle'
                    ? 'bg-[#E4B869]'
                    : profile.presence === 'dnd'
                    ? 'bg-[#E57373]'
                    : 'bg-[#718478]'
                }`}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-display font-bold text-[#F0F5F1]">
                  {greeting}, {profile.displayName}
                </h2>
                {isOwner && (
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#D9BB79] border-l border-white/15 pl-2.5">
                    ROOT OWNER
                  </span>
                )}
                {!isOwner && isSecOwner && (
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#8BE2B8] border-l border-white/15 pl-2.5">
                    {formatRoleLabel(profile.role, profile.uid)}
                  </span>
                )}
                {hasApexPlus && (
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#8BE2B8] border-l border-white/15 pl-2.5 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-[#D9BB79]" />
                    APEX+ ACTIVE
                  </span>
                )}
                {!hasApexPlus && hasApexBasic && (
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#8BE2B8] border-l border-white/15 pl-2.5">
                    APEX ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9BAEA2] mt-1">
                @{profile.username} · {profile.statusMessage || 'Ready to connect across Doomcord communities and Orbs'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onSelectView({ type: 'friends', subTab: 'add' })}
              className="h-9 px-3.5 rounded-lg bg-[#8BE2B8] hover:bg-[#7AD4A8] text-[#101A17] font-semibold text-xs flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Friend</span>
            </button>

            <button
              onClick={onOpenCreateCommunity}
              className="h-9 px-3.5 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.08] text-[#F0F5F1] font-medium text-xs flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-[#8BE2B8]" />
              <span>Create Community</span>
            </button>

            <button
              onClick={onOpenCreateOrb}
              className="h-9 px-3.5 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.08] text-[#F0F5F1] font-medium text-xs flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 text-[#E9987B]" />
              <span>Create Orb</span>
            </button>

            <button
              onClick={() => onSelectView({ type: 'nitro' })}
              className="h-9 px-3.5 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-[#D9BB79]/30 text-[#D9BB79] font-medium text-xs flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>DOOMCORD APEX</span>
            </button>
          </div>
        </section>

        {/* Key Platform Metrics Strip (Real Data) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onSelectView({ type: 'friends', subTab: 'all' })}
            className="text-left rounded-xl bg-[#141F1B] hover:bg-[#192620] border border-white/[0.06] p-4 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-[#9BAEA2] mb-2">
              <span>Connected Friends</span>
              <Users className="w-4 h-4 text-[#8BE2B8]" />
            </div>
            <div className="text-2xl font-display font-bold text-[#F0F5F1] tabular-nums">
              {friends.length}
            </div>
            <div className="text-[11px] text-[#718478] mt-1 tabular-nums">
              {onlineFriends.length} currently active
            </div>
          </button>

          <button
            onClick={() =>
              dmThreads.length > 0
                ? onSelectView({ type: 'dm', dmId: dmThreads[0].id })
                : onSelectView({ type: 'friends', subTab: 'all' })
            }
            className="text-left rounded-xl bg-[#141F1B] hover:bg-[#192620] border border-white/[0.06] p-4 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-[#9BAEA2] mb-2">
              <span>Direct Conversations</span>
              <MessageSquare className="w-4 h-4 text-[#8BE2B8]" />
            </div>
            <div className="text-2xl font-display font-bold text-[#F0F5F1] tabular-nums">
              {dmThreads.length}
            </div>
            <div className="text-[11px] text-[#718478] mt-1">
              Encrypted direct threads
            </div>
          </button>

          <button
            onClick={() => onSelectView({ type: 'explore_communities' })}
            className="text-left rounded-xl bg-[#141F1B] hover:bg-[#192620] border border-white/[0.06] p-4 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-[#9BAEA2] mb-2">
              <span>Joined Communities</span>
              <Hash className="w-4 h-4 text-[#E9987B]" />
            </div>
            <div className="text-2xl font-display font-bold text-[#F0F5F1] tabular-nums">
              {joinedCommunities.length}
            </div>
            <div className="text-[11px] text-[#718478] mt-1 tabular-nums">
              {communities.length} public spaces available
            </div>
          </button>

          <button
            onClick={() => onSelectView({ type: 'orbs', viewMode: 'explore' })}
            className="text-left rounded-xl bg-[#141F1B] hover:bg-[#192620] border border-white/[0.06] p-4 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-[#9BAEA2] mb-2">
              <span>Active Orbs</span>
              <Compass className="w-4 h-4 text-[#D9BB79]" />
            </div>
            <div className="text-2xl font-display font-bold text-[#F0F5F1] tabular-nums">
              {orbs.length}
            </div>
            <div className="text-[11px] text-[#718478] mt-1">
              Interactive interest spheres
            </div>
          </button>
        </section>

        {/* Main Two-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Recent Conversations & Communities */}
          <div className="lg:col-span-7 space-y-6">
            {/* Recent Conversations */}
            <div className="rounded-xl bg-[#141F1B] border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-display font-bold text-[#F0F5F1]">
                    Recent Conversations
                  </h3>
                  <p className="text-xs text-[#718478] mt-0.5">
                    Continue where you left off in direct messages
                  </p>
                </div>
                <button
                  onClick={() => onSelectView({ type: 'friends', subTab: 'all' })}
                  className="text-xs font-medium text-[#8BE2B8] hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                  <span>All Friends</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {dmThreads.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-8 h-8 text-[#718478] mx-auto mb-2.5 opacity-60" />
                  <p className="text-sm font-medium text-[#F0F5F1]">
                    No direct conversations yet
                  </p>
                  <p className="text-xs text-[#9BAEA2] mt-1 max-w-sm mx-auto">
                    Add a friend by username or select a member from any community to start a direct conversation.
                  </p>
                  <button
                    onClick={() => onSelectView({ type: 'friends', subTab: 'add' })}
                    className="mt-4 h-8 px-3.5 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.08] text-xs font-medium text-[#8BE2B8] inline-flex items-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Find Friends</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {dmThreads.slice(0, 5).map((dm) => {
                    const otherUid =
                      dm.participants.find((id) => id !== profile.uid) || dm.participants[0];
                    const peer =
                      dm.recipientProfile ||
                      allUsers.find((u) => u.uid === otherUid);
                    const peerName = peer?.displayName || 'Doomcord Member';
                    const peerUsername = peer?.username || 'member';

                    return (
                      <button
                        key={dm.id}
                        onClick={() => onSelectView({ type: 'dm', dmId: dm.id })}
                        className="w-full px-5 py-3.5 hover:bg-[#192620] flex items-center justify-between gap-4 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-[#1D2B24] border border-white/10 flex items-center justify-center text-xs font-bold text-[#8BE2B8] shrink-0 overflow-hidden">
                            {peer?.photoURL ? (
                              <img
                                src={peer.photoURL}
                                alt={peerName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              peerName.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#F0F5F1] truncate">
                                {peerName}
                              </span>
                              <span className="text-[11px] font-mono text-[#718478] truncate">
                                @{peerUsername}
                              </span>
                            </div>
                            <p className="text-xs text-[#9BAEA2] truncate mt-0.5">
                              {dm.lastMessageText || 'Open conversation thread'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {dm.lastMessageAt && (
                            <span className="text-[11px] font-mono text-[#718478] tabular-nums">
                              {new Date(dm.lastMessageAt).toLocaleDateString()}
                            </span>
                          )}
                          <ArrowUpRight className="w-4 h-4 text-[#718478]" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Joined Communities */}
            <div className="rounded-xl bg-[#141F1B] border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-display font-bold text-[#F0F5F1]">
                    Your Communities
                  </h3>
                  <p className="text-xs text-[#718478] mt-0.5">
                    Real-time channels, announcements, and voice rooms
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectView({ type: 'explore_communities' })}
                    className="text-xs font-medium text-[#9BAEA2] hover:text-[#F0F5F1] transition-colors"
                  >
                    Directory
                  </button>
                  <button
                    onClick={onOpenCreateCommunity}
                    className="h-7 px-2.5 rounded-md bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.08] text-xs font-medium text-[#8BE2B8] flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                </div>
              </div>

              {joinedCommunities.length === 0 ? (
                <div className="p-8 text-center">
                  <Hash className="w-8 h-8 text-[#718478] mx-auto mb-2.5 opacity-60" />
                  <p className="text-sm font-medium text-[#F0F5F1]">
                    You haven't joined any communities yet
                  </p>
                  <p className="text-xs text-[#9BAEA2] mt-1 max-w-sm mx-auto">
                    Create your own community workspace or explore public communities built by real users.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2.5">
                    <button
                      onClick={onOpenCreateCommunity}
                      className="h-8 px-3.5 rounded-lg bg-[#8BE2B8] text-[#101A17] text-xs font-semibold"
                    >
                      Create Community
                    </button>
                    <button
                      onClick={() => onSelectView({ type: 'explore_communities' })}
                      className="h-8 px-3.5 rounded-lg bg-[#1D2B24] text-[#F0F5F1] text-xs font-medium border border-white/[0.08]"
                    >
                      Browse Directory
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                  {joinedCommunities.map((comm) => {
                    const firstChannelId = comm.channels?.[0]?.id || 'general';
                    return (
                      <button
                        key={comm.id}
                        onClick={() =>
                          onSelectView({
                            type: 'community',
                            communityId: comm.id,
                            channelId: firstChannelId,
                          })
                        }
                        className="p-4 rounded-xl bg-[#192620] hover:bg-[#24362C] border border-white/[0.06] text-left transition-colors flex items-start gap-3.5"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-sm text-[#101A17] shrink-0"
                          style={{ backgroundColor: comm.themeColor || '#8BE2B8' }}
                        >
                          {comm.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-[#F0F5F1] truncate">
                            {comm.name}
                          </h4>
                          <p className="text-xs text-[#9BAEA2] line-clamp-1 mt-0.5">
                            {comm.description || 'Community workspace'}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-[#718478] tabular-nums">
                            <span>{comm.members?.length || 1} members</span>
                            <span>·</span>
                            <span>{comm.channels?.length || 1} channels</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Notifications/Activity, Orbs & Quick Links */}
          <div className="lg:col-span-5 space-y-6">
            {/* Notifications & Pending Actions Summary */}
            <div className="rounded-xl bg-[#141F1B] border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#8BE2B8]" />
                  <h3 className="text-sm font-display font-bold text-[#F0F5F1]">
                    Notifications & Activity
                  </h3>
                </div>
                <button
                  onClick={() => onSelectView({ type: 'notifications' })}
                  className="text-xs font-medium text-[#8BE2B8] hover:underline"
                >
                  Open Inbox
                </button>
              </div>

              <div className="p-4 space-y-2.5">
                {pendingIncomingRequests.length === 0 &&
                unclaimedGiftsForMe.length === 0 &&
                myReceipts.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-[#9BAEA2]">
                      You're all caught up. Incoming friend requests, gifts, and billing receipts appear here.
                    </p>
                  </div>
                ) : (
                  <>
                    {pendingIncomingRequests.slice(0, 3).map((req) => (
                      <button
                        key={req.id}
                        onClick={() => onSelectView({ type: 'friends', subTab: 'pending' })}
                        className="w-full p-3 rounded-lg bg-[#192620] hover:bg-[#24362C] border border-white/[0.06] flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserPlus className="w-4 h-4 text-[#8BE2B8] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#F0F5F1] truncate">
                              Friend request from @{req.fromUsername}
                            </p>
                            <p className="text-[11px] text-[#9BAEA2]">Click to review request</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#718478] shrink-0" />
                      </button>
                    ))}

                    {unclaimedGiftsForMe.slice(0, 2).map((gift) => (
                      <button
                        key={gift.id}
                        onClick={() =>
                          onSelectView({
                            type: 'gift_redeem',
                            token: gift.claimToken || gift.tokenPreview,
                          })
                        }
                        className="w-full p-3 rounded-lg bg-[#192620] hover:bg-[#24362C] border border-[#D9BB79]/30 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Gift className="w-4 h-4 text-[#D9BB79] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#F0F5F1] truncate">
                              Unclaimed DOOMCORD APEX Gift from {gift.creatorName}
                            </p>
                            <p className="text-[11px] text-[#D9BB79]">Click to claim your gift</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#D9BB79] shrink-0" />
                      </button>
                    ))}

                    {myReceipts.slice(0, 2).map((rcp) => (
                      <button
                        key={rcp.id}
                        onClick={() => onOpenReceipt(rcp)}
                        className="w-full p-3 rounded-lg bg-[#192620] hover:bg-[#24362C] border border-white/[0.06] flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Receipt className="w-4 h-4 text-[#8BE2B8] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#F0F5F1] truncate">
                              Receipt {rcp.receiptNumber} · {rcp.title}
                            </p>
                            <p className="text-[11px] font-mono text-[#9BAEA2] tabular-nums">
                              ₹{rcp.totalAmountINR} · {rcp.paymentStatus}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#718478] shrink-0" />
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Featured Orbs */}
            <div className="rounded-xl bg-[#141F1B] border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-display font-bold text-[#F0F5F1]">
                    Featured Orbs
                  </h3>
                  <p className="text-xs text-[#718478] mt-0.5">
                    Interactive interest spaces & 3D constellation
                  </p>
                </div>
                <button
                  onClick={() => onSelectView({ type: 'orbs', viewMode: 'explore' })}
                  className="text-xs font-medium text-[#8BE2B8] hover:underline"
                >
                  Explore All
                </button>
              </div>

              {orbs.length === 0 ? (
                <div className="p-6 text-center">
                  <Compass className="w-7 h-7 text-[#718478] mx-auto mb-2 opacity-60" />
                  <p className="text-xs text-[#9BAEA2]">
                    No Orbs created yet. Launch the first interactive Orb for your interest group.
                  </p>
                  <button
                    onClick={onOpenCreateOrb}
                    className="mt-3 h-8 px-3.5 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.08] text-xs font-medium text-[#E9987B]"
                  >
                    + Create First Orb
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {orbs.slice(0, 4).map((orb) => (
                    <button
                      key={orb.id}
                      onClick={() =>
                        onSelectView({ type: 'orbs', orbId: orb.id, viewMode: 'detail' })
                      }
                      className="w-full px-5 py-3.5 hover:bg-[#192620] flex items-center justify-between gap-3 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#101A17] shrink-0"
                          style={{ backgroundColor: orb.primaryColor || '#8BE2B8' }}
                        >
                          {orb.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#F0F5F1] truncate">
                              {orb.name}
                            </span>
                            <span className="text-[10px] font-mono uppercase text-[#9BAEA2]">
                              {orb.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#718478] truncate mt-0.5">
                            {orb.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#9BAEA2] tabular-nums shrink-0">
                        {orb.memberCount || 1} joined
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cosmetics & Admin Console Shortcut */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onSelectView({ type: 'shop' })}
                className="p-4 rounded-xl bg-[#141F1B] hover:bg-[#192620] border border-white/[0.06] text-left transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#E9987B] mb-2" />
                <div className="text-xs font-semibold text-[#F0F5F1]">Cosmetics Shop</div>
                <p className="text-[11px] text-[#718478] mt-0.5">
                  Avatar frames, effects & themes
                </p>
              </button>

              {(isOwner || isSecOwner || profile.role === 'admin') && (
                <button
                  onClick={() => onSelectView({ type: 'admin' })}
                  className="p-4 rounded-xl bg-[#141F1B] hover:bg-[#192620] border border-[#8BE2B8]/25 text-left transition-colors"
                >
                  <Shield className="w-4 h-4 text-[#8BE2B8] mb-2" />
                  <div className="text-xs font-semibold text-[#F0F5F1]">Admin Console</div>
                  <p className="text-[11px] text-[#718478] mt-0.5">
                    Owners, Gifts, Receipts & Security
                  </p>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
