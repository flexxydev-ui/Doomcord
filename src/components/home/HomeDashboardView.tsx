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
import { isRootOwner, isSecondaryOwner, isAdminOrAbove, formatRoleLabel } from '../../lib/dataService';

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
    <div className="flex-1 h-full overflow-y-auto bg-[#09090D] text-[#F5F3FA]">
      {/* Top Header */}
      <header className="sticky top-0 z-20 h-14 px-6 bg-[#09090D]/90 backdrop-blur-md border-b border-[#282631] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono uppercase tracking-wider text-[#8957F5]">
            Overview
          </span>
          <span className="text-[#282631]">/</span>
          <h1 className="font-semibold text-sm text-[#F5F3FA]">Home Command</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectView({ type: 'notifications' })}
            className="h-8 px-3 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#F5F3FA] flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5 text-[#8957F5]" />
            <span>Inbox</span>
            {pendingIncomingRequests.length + unclaimedGiftsForMe.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#8957F5] text-white font-mono font-bold text-[10px] tabular-nums">
                {pendingIncomingRequests.length + unclaimedGiftsForMe.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectView({ type: 'profile', userId: profile.uid })}
            className="h-8 px-3 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#F5F3FA] flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <User className="w-3.5 h-3.5 text-[#A19DAD]" />
            <span>My Profile</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Identity & Quick Launch Banner */}
        <section className="rounded-xl bg-[#101014] border border-[#282631] p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-lg bg-[#17171F] border border-[#8957F5]/30 flex items-center justify-center text-base font-bold text-[#8957F5] overflow-hidden">
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
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#101014] ${
                  profile.presence === 'online'
                    ? 'bg-[#3BA55D]'
                    : profile.presence === 'idle'
                    ? 'bg-[#FAA81A]'
                    : profile.presence === 'dnd'
                    ? 'bg-[#ED4245]'
                    : 'bg-[#706C7B]'
                }`}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[#F5F3FA]">
                  {greeting}, {profile.displayName}
                </h2>
                {isOwner && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A47BFF] border-l border-[#282631] pl-2">
                    ROOT OWNER
                  </span>
                )}
                {!isOwner && isSecOwner && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8957F5] border-l border-[#282631] pl-2">
                    {formatRoleLabel(profile.role, profile.uid)}
                  </span>
                )}
                {hasApexPlus && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C4B1FF] border-l border-[#282631] pl-2 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-[#A47BFF]" />
                    APEX+
                  </span>
                )}
                {!hasApexPlus && hasApexBasic && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8957F5] border-l border-[#282631] pl-2">
                    APEX
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A19DAD] mt-0.5">
                @{profile.username} · {profile.statusMessage || 'Connect and collaborate on Doomcord.'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSelectView({ type: 'friends', subTab: 'add' })}
              className="h-8 px-3 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white font-medium text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Friend</span>
            </button>

            <button
              onClick={onOpenCreateCommunity}
              className="h-8 px-3 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[#F5F3FA] font-medium text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-[#8957F5]" />
              <span>New Community</span>
            </button>

            <button
              onClick={onOpenCreateOrb}
              className="h-8 px-3 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[#F5F3FA] font-medium text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 text-[#A47BFF]" />
              <span>New Orb</span>
            </button>

            <button
              onClick={() => onSelectView({ type: 'nitro' })}
              className="h-8 px-3 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#8957F5]/30 text-[#C4B1FF] font-medium text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Crown className="w-3.5 h-3.5 text-[#8957F5]" />
              <span>APEX</span>
            </button>
          </div>
        </section>

        {/* Platform Metrics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => onSelectView({ type: 'friends', subTab: 'all' })}
            className="text-left rounded-lg bg-[#101014] hover:bg-[#17171F] border border-[#282631] p-3.5 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-[#A19DAD] mb-1.5">
              <span>Friends</span>
              <Users className="w-4 h-4 text-[#8957F5]" />
            </div>
            <div className="text-xl font-bold text-[#F5F3FA] tabular-nums">
              {friends.length}
            </div>
            <div className="text-[11px] text-[#706C7B] mt-0.5 tabular-nums">
              {onlineFriends.length} online now
            </div>
          </button>

          <button
            onClick={() =>
              dmThreads.length > 0
                ? onSelectView({ type: 'dm', dmId: dmThreads[0].id })
                : onSelectView({ type: 'friends', subTab: 'all' })
            }
            className="text-left rounded-lg bg-[#101014] hover:bg-[#17171F] border border-[#282631] p-3.5 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-[#A19DAD] mb-1.5">
              <span>Conversations</span>
              <MessageSquare className="w-4 h-4 text-[#8957F5]" />
            </div>
            <div className="text-xl font-bold text-[#F5F3FA] tabular-nums">
              {dmThreads.length}
            </div>
            <div className="text-[11px] text-[#706C7B] mt-0.5">
              Direct message channels
            </div>
          </button>

          <button
            onClick={() => onSelectView({ type: 'explore_communities' })}
            className="text-left rounded-lg bg-[#101014] hover:bg-[#17171F] border border-[#282631] p-3.5 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-[#A19DAD] mb-1.5">
              <span>Communities</span>
              <Hash className="w-4 h-4 text-[#A47BFF]" />
            </div>
            <div className="text-xl font-bold text-[#F5F3FA] tabular-nums">
              {joinedCommunities.length}
            </div>
            <div className="text-[11px] text-[#706C7B] mt-0.5 tabular-nums">
              {communities.length} total discoverable
            </div>
          </button>

          <button
            onClick={() => onSelectView({ type: 'orbs', viewMode: 'explore' })}
            className="text-left rounded-lg bg-[#101014] hover:bg-[#17171F] border border-[#282631] p-3.5 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-[#A19DAD] mb-1.5">
              <span>Spatial Orbs</span>
              <Compass className="w-4 h-4 text-[#C4B1FF]" />
            </div>
            <div className="text-xl font-bold text-[#F5F3FA] tabular-nums">
              {orbs.length}
            </div>
            <div className="text-[11px] text-[#706C7B] mt-0.5">
              Interactive 3D spaces
            </div>
          </button>
        </section>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (7 cols): Conversations & Communities */}
          <div className="lg:col-span-7 space-y-5">
            {/* Recent Conversations */}
            <div className="rounded-xl bg-[#101014] border border-[#282631] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#282631] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-[#F5F3FA]">
                    Recent Conversations
                  </h3>
                  <p className="text-[11px] text-[#706C7B]">
                    Pick up where you left off
                  </p>
                </div>
                <button
                  onClick={() => onSelectView({ type: 'friends', subTab: 'all' })}
                  className="text-xs font-medium text-[#8957F5] hover:text-[#A47BFF] flex items-center gap-1 transition-colors"
                >
                  <span>All Friends</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {dmThreads.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="w-7 h-7 text-[#706C7B] mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-medium text-[#F5F3FA]">
                    No direct conversations yet
                  </p>
                  <p className="text-[11px] text-[#706C7B] mt-0.5 max-w-sm mx-auto">
                    Add a friend by username or message a member from any community.
                  </p>
                  <button
                    onClick={() => onSelectView({ type: 'friends', subTab: 'add' })}
                    className="mt-3 h-7 px-3 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#8957F5] inline-flex items-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Find Friends</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#282631]/60">
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
                        className="w-full px-4 py-2.5 hover:bg-[#17171F] flex items-center justify-between gap-3 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-[#17171F] border border-[#282631] flex items-center justify-center text-xs font-bold text-[#8957F5] shrink-0 overflow-hidden">
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
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-[#F5F3FA] truncate">
                                {peerName}
                              </span>
                              <span className="text-[10px] font-mono text-[#706C7B] truncate">
                                @{peerUsername}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#A19DAD] truncate">
                              {dm.lastMessageText || 'Open thread'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {dm.lastMessageAt && (
                            <span className="text-[10px] font-mono text-[#706C7B] tabular-nums">
                              {new Date(dm.lastMessageAt).toLocaleDateString()}
                            </span>
                          )}
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#706C7B]" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Joined Communities */}
            <div className="rounded-xl bg-[#101014] border border-[#282631] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#282631] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-[#F5F3FA]">
                    Your Communities
                  </h3>
                  <p className="text-[11px] text-[#706C7B]">
                    Active spaces and voice channels
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectView({ type: 'explore_communities' })}
                    className="text-xs font-medium text-[#A19DAD] hover:text-[#F5F3FA] transition-colors"
                  >
                    Directory
                  </button>
                  <button
                    onClick={onOpenCreateCommunity}
                    className="h-6 px-2 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[11px] font-medium text-[#8957F5] flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                </div>
              </div>

              {joinedCommunities.length === 0 ? (
                <div className="p-6 text-center">
                  <Hash className="w-7 h-7 text-[#706C7B] mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-medium text-[#F5F3FA]">
                    No communities joined yet
                  </p>
                  <p className="text-[11px] text-[#706C7B] mt-0.5 max-w-sm mx-auto">
                    Create your own server or explore available spaces.
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      onClick={onOpenCreateCommunity}
                      className="h-7 px-3 rounded-md bg-[#8957F5] text-white text-xs font-medium shadow-sm"
                    >
                      Create Community
                    </button>
                    <button
                      onClick={() => onSelectView({ type: 'explore_communities' })}
                      className="h-7 px-3 rounded-md bg-[#17171F] text-[#F5F3FA] text-xs font-medium border border-[#282631]"
                    >
                      Browse Directory
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5">
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
                        className="p-3 rounded-lg bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-left transition-colors flex items-start gap-2.5"
                      >
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs text-white shrink-0"
                          style={{ backgroundColor: comm.themeColor || '#8957F5' }}
                        >
                          {comm.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-[#F5F3FA] truncate">
                            {comm.name}
                          </h4>
                          <p className="text-[11px] text-[#706C7B] line-clamp-1">
                            {comm.description || 'Community workspace'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#706C7B] tabular-nums">
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

          {/* Right Column (5 cols): Notifications, Orbs & Actions */}
          <div className="lg:col-span-5 space-y-5">
            {/* Notifications & Pending Actions */}
            <div className="rounded-xl bg-[#101014] border border-[#282631] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#282631] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-[#8957F5]" />
                  <h3 className="text-xs font-semibold text-[#F5F3FA]">
                    Notifications & Activity
                  </h3>
                </div>
                <button
                  onClick={() => onSelectView({ type: 'notifications' })}
                  className="text-xs font-medium text-[#8957F5] hover:text-[#A47BFF] transition-colors"
                >
                  Open Inbox
                </button>
              </div>

              <div className="p-3 space-y-2">
                {pendingIncomingRequests.length === 0 &&
                unclaimedGiftsForMe.length === 0 &&
                myReceipts.length === 0 ? (
                  <div className="py-5 text-center">
                    <p className="text-xs text-[#706C7B]">
                      You're all caught up. No pending requests or gifts.
                    </p>
                  </div>
                ) : (
                  <>
                    {pendingIncomingRequests.slice(0, 3).map((req) => (
                      <button
                        key={req.id}
                        onClick={() => onSelectView({ type: 'friends', subTab: 'pending' })}
                        className="w-full p-2.5 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <UserPlus className="w-3.5 h-3.5 text-[#8957F5] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#F5F3FA] truncate">
                              Friend request from @{req.fromUsername}
                            </p>
                            <p className="text-[10px] text-[#A19DAD]">Review request</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3 h-3 text-[#706C7B] shrink-0" />
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
                        className="w-full p-2.5 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#8957F5]/30 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Gift className="w-3.5 h-3.5 text-[#A47BFF] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#F5F3FA] truncate">
                              APEX Gift from {gift.creatorName}
                            </p>
                            <p className="text-[10px] text-[#A47BFF]">Click to claim</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3 h-3 text-[#A47BFF] shrink-0" />
                      </button>
                    ))}

                    {myReceipts.slice(0, 2).map((rcp) => (
                      <button
                        key={rcp.id}
                        onClick={() => onOpenReceipt(rcp)}
                        className="w-full p-2.5 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Receipt className="w-3.5 h-3.5 text-[#8957F5] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#F5F3FA] truncate">
                              Receipt {rcp.receiptNumber}
                            </p>
                            <p className="text-[10px] font-mono text-[#706C7B] tabular-nums">
                              ₹{rcp.totalAmountINR} · {rcp.paymentStatus}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3 h-3 text-[#706C7B] shrink-0" />
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Featured Orbs */}
            <div className="rounded-xl bg-[#101014] border border-[#282631] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#282631] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-[#F5F3FA]">
                    Featured Orbs
                  </h3>
                  <p className="text-[11px] text-[#706C7B]">
                    3D spaces & thematic realms
                  </p>
                </div>
                <button
                  onClick={() => onSelectView({ type: 'orbs', viewMode: 'explore' })}
                  className="text-xs font-medium text-[#8957F5] hover:text-[#A47BFF] transition-colors"
                >
                  Explore All
                </button>
              </div>

              {orbs.length === 0 ? (
                <div className="p-5 text-center">
                  <Compass className="w-6 h-6 text-[#706C7B] mx-auto mb-1.5 opacity-60" />
                  <p className="text-xs text-[#706C7B]">
                    No Orbs created yet.
                  </p>
                  <button
                    onClick={onOpenCreateOrb}
                    className="mt-2.5 h-7 px-3 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#A47BFF]"
                  >
                    + Create First Orb
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#282631]/60">
                  {orbs.slice(0, 4).map((orb) => (
                    <button
                      key={orb.id}
                      onClick={() =>
                        onSelectView({ type: 'orbs', orbId: orb.id, viewMode: 'detail' })
                      }
                      className="w-full px-4 py-2.5 hover:bg-[#17171F] flex items-center justify-between gap-2.5 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: orb.primaryColor || '#8957F5' }}
                        >
                          {orb.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-[#F5F3FA] truncate">
                              {orb.name}
                            </span>
                            <span className="text-[9px] font-mono uppercase text-[#706C7B]">
                              {orb.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#706C7B] truncate">
                            {orb.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#706C7B] tabular-nums shrink-0">
                        {orb.memberCount || 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => onSelectView({ type: 'shop' })}
                className="p-3.5 rounded-lg bg-[#101014] hover:bg-[#17171F] border border-[#282631] text-left transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#A47BFF] mb-1.5" />
                <div className="text-xs font-semibold text-[#F5F3FA]">Cosmetics Shop</div>
                <p className="text-[10px] text-[#706C7B] mt-0.5">
                  Decorations & themes
                </p>
              </button>

              {isAdminOrAbove(profile) && (
                <button
                  onClick={() => onSelectView({ type: 'admin' })}
                  className="p-3.5 rounded-lg bg-[#101014] hover:bg-[#17171F] border border-[#8957F5]/30 text-left transition-colors"
                >
                  <Shield className="w-4 h-4 text-[#8957F5] mb-1.5" />
                  <div className="text-xs font-semibold text-[#F5F3FA]">Admin Console</div>
                  <p className="text-[10px] text-[#706C7B] mt-0.5">
                    Platform Management
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
