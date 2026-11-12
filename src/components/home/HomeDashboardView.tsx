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
  Receipt,
  Globe,
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
import {
  isRootOwner,
  isSecondaryOwner,
  isAdminOrAbove,
  formatRoleLabel,
  generateInitialsAvatar,
} from '../../lib/dataService';

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
  const hasApexBasic =
    profile.nitroTier === 'basic' ||
    profile.permanentEntitlement === 'LIFETIME_APEX';

  const joinedCommunities = communities.filter((c) =>
    c.members?.includes(profile.uid)
  );
  const friendIds = profile.friends || [];
  const friends = allUsers.filter((u) => friendIds.includes(u.uid));
  const onlineFriends = friends.filter((u) => u.presence !== 'invisible');

  const pendingIncomingRequests = friendRequests.filter(
    (r) => r.toUid === profile.uid && r.status === 'pending'
  );

  const unclaimedUserGifts = gifts.filter(
    (g) =>
      g.status === 'unclaimed' &&
      (g.restrictedRecipientUsername?.toLowerCase() ===
        profile.username.toLowerCase() ||
        (profile.email &&
          g.restrictedRecipientEmail?.toLowerCase() ===
            profile.email.toLowerCase()))
  );

  const userReceipts = receipts.filter(
    (r) =>
      r.customerUid === profile.uid ||
      r.customerUsername?.toLowerCase() === profile.username.toLowerCase() ||
      (profile.email &&
        r.customerEmail?.toLowerCase() === profile.email.toLowerCase())
  );

  const recentDMs = [...dmThreads]
    .sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 5);

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#09080F] text-[#F5F3FA] doom-ambient-bg select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-8">
        {/* =============================================================== */}
        {/* 1. PERSONALIZED GLASS WELCOME HERO & BRANDING                   */}
        {/* =============================================================== */}
        <section className="doom-glass-elevated rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#8957F5]/20 blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#15111F] border border-[#8957F5]/45 flex items-center justify-center shrink-0 doom-purple-glow">
                <img
                  src="/assets/aistudio/doomcord-icon_378efdf9.png"
                  alt="DOOMCORD"
                  className="w-11 h-11 object-contain"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#C4B1FF]">
                    DOOMCORD · RISE ABOVE. CONNECT BEYOND.
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#8957F5]/20 text-[#C4B1FF] border border-[#8957F5]/40">
                    {formatRoleLabel(profile.role, profile.uid)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F5F3FA] mt-1">
                  Welcome back, {profile.displayName}
                </h1>
                <p className="text-xs sm:text-sm text-[#A19DAD] mt-1 max-w-2xl">
                  Your spatial communication workspace — jump into real-time conversations, communities, and 3D Orbs.
                </p>
              </div>
            </div>

            {/* Quick Action Bar inside Hero */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() =>
                  onSelectView({ type: 'friends', subTab: 'online' })
                }
                className="px-4 py-2.5 rounded-xl bg-[#8957F5] hover:bg-[#A47BFF] text-white text-xs font-bold flex items-center gap-2 transition-all doom-purple-glow"
              >
                <UserPlus size={15} />
                <span>Friends & DMs</span>
              </button>
              <button
                onClick={onOpenCreateCommunity}
                className="px-4 py-2.5 rounded-xl doom-glass hover:border-[#8957F5]/50 text-[#F5F3FA] text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Plus size={15} className="text-[#C4B1FF]" />
                <span>New Community</span>
              </button>
              <button
                onClick={onOpenCreateOrb}
                className="px-4 py-2.5 rounded-xl doom-glass hover:border-[#8957F5]/50 text-[#F5F3FA] text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Globe size={15} className="text-[#C4B1FF]" />
                <span>Launch Orb</span>
              </button>
              {isAdminOrAbove(profile) && (
                <button
                  onClick={() => onSelectView({ type: 'admin' })}
                  className="px-4 py-2.5 rounded-xl bg-[#8957F5]/20 hover:bg-[#8957F5]/30 border border-[#8957F5]/45 text-[#C4B1FF] text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <Shield size={15} />
                  <span>Admin Console</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 2. APEX MEMBERSHIP STATUS & NOTIFICATIONS STRIP                 */}
        {/* =============================================================== */}
        <section className="flex flex-col lg:flex-row gap-5">
          {/* APEX Membership Glass Panel */}
          <div className="flex-1 doom-glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#8957F5]/20 border border-[#8957F5]/40 flex items-center justify-center text-[#C4B1FF] shrink-0">
                <Crown size={22} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#C4B1FF]">
                  APEX MEMBERSHIP STATUS
                </div>
                <div className="text-base font-extrabold text-[#F5F3FA] mt-0.5">
                  {hasApexPlus
                    ? isOwner || isSecOwner
                      ? 'Sovereign Permanent APEX+ Entitlement'
                      : 'APEX+ Sovereign Active'
                    : hasApexBasic
                    ? 'APEX Basic Active'
                    : 'Standard Citizen Tier'}
                </div>
                <div className="text-xs text-[#A19DAD] mt-0.5">
                  {hasApexPlus
                    ? '4K 60fps spatial streaming, full APEX Collection cosmetics, and custom profile banners unlocked.'
                    : 'Upgrade to APEX or APEX+ for animated frames, 4K streams, and exclusive profile cosmetics.'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onSelectView({ type: 'nitro' })}
                className="px-3.5 py-2 rounded-xl bg-[#8957F5] hover:bg-[#A47BFF] text-white text-xs font-bold transition-colors"
              >
                {hasApexPlus ? 'Manage APEX+' : 'Explore APEX'}
              </button>
              <button
                onClick={() => onSelectView({ type: 'shop' })}
                className="px-3.5 py-2 rounded-xl doom-glass text-xs font-semibold text-[#C4B1FF]"
              >
                Cosmetics
              </button>
            </div>
          </div>

          {/* Notifications & Gifts Summary Glass Panel */}
          <div className="lg:w-96 doom-glass rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#C4B1FF] shrink-0">
                <Bell size={19} />
              </div>
              <div>
                <div className="text-sm font-bold text-[#F5F3FA]">
                  Notifications & Gifts
                </div>
                <div className="text-xs text-[#A19DAD]">
                  {pendingIncomingRequests.length} friend requests ·{' '}
                  {unclaimedUserGifts.length} unclaimed gifts
                </div>
              </div>
            </div>
            <button
              onClick={() => onSelectView({ type: 'notifications' })}
              className="px-3 py-2 rounded-xl doom-glass-elevated text-xs font-bold text-[#C4B1FF] hover:text-white shrink-0"
            >
              Open Inbox
            </button>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 3. TWO-COLUMN MAIN WORKSPACE: CONVERSATIONS & FRIEND ACTIVITY   */}
        {/* =============================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Recent Conversations & Communities */}
          <div className="lg:col-span-7 space-y-6">
            {/* Recent Conversations */}
            <div className="doom-glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#A47BFF]" />
                  <h2 className="text-sm font-bold text-[#F5F3FA]">
                    Recent Conversations
                  </h2>
                </div>
                <button
                  onClick={() =>
                    onSelectView({ type: 'friends', subTab: 'online' })
                  }
                  className="text-xs font-semibold text-[#C4B1FF] hover:underline flex items-center gap-1"
                >
                  <span>All Messages</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>

              {recentDMs.length > 0 ? (
                <div className="space-y-2">
                  {recentDMs.map((thread) => {
                    const otherUid =
                      thread.participants.find((id) => id !== profile.uid) ||
                      thread.participants[0];
                    const otherUser =
                      thread.recipientProfile ||
                      allUsers.find((u) => u.uid === otherUid);
                    const title =
                      thread.isGroup && thread.groupName
                        ? thread.groupName
                        : otherUser?.displayName || 'Direct Conversation';
                    const avatar =
                      otherUser?.photoURL || generateInitialsAvatar(title);

                    return (
                      <button
                        key={thread.id}
                        onClick={() =>
                          onSelectView({
                            type: 'dm',
                            dmId: thread.id,
                          })
                        }
                        className="w-full p-3 rounded-xl bg-[#15111F]/85 hover:bg-[#15111F] border border-white/10 hover:border-[#8957F5]/40 flex items-center justify-between gap-3 transition-all text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={avatar}
                            alt={title}
                            onError={(e) => {
                              e.currentTarget.src = generateInitialsAvatar(
                                title,
                                '#8957F5'
                              );
                            }}
                            className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#F5F3FA] truncate">
                              {title}
                            </div>
                            <div className="text-[11px] text-[#A19DAD] truncate">
                              {thread.lastMessageText ||
                                'Open encrypted channel'}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[#C4B1FF] shrink-0">
                          Open →
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-[#15111F]/70 border border-white/10 text-center">
                  <p className="text-xs text-[#A19DAD] mb-3">
                    No active direct message threads yet. Start a conversation with any citizen.
                  </p>
                  <button
                    onClick={() =>
                      onSelectView({ type: 'friends', subTab: 'online' })
                    }
                    className="px-4 py-2 rounded-xl bg-[#8957F5] text-white text-xs font-bold"
                  >
                    Start Conversation
                  </button>
                </div>
              )}
            </div>

            {/* Your Communities */}
            <div className="doom-glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-[#A47BFF]" />
                  <h2 className="text-sm font-bold text-[#F5F3FA]">
                    Communities (
                    {joinedCommunities.length || communities.length})
                  </h2>
                </div>
                <button
                  onClick={() => onSelectView({ type: 'explore_communities' })}
                  className="text-xs font-semibold text-[#C4B1FF] hover:underline flex items-center gap-1"
                >
                  <span>Discover Servers</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>

              <div className="space-y-2.5">
                {(joinedCommunities.length > 0
                  ? joinedCommunities
                  : communities
                )
                  .slice(0, 4)
                  .map((comm) => (
                    <button
                      key={comm.id}
                      onClick={() =>
                        onSelectView({
                          type: 'community',
                          communityId: comm.id,
                          channelId: comm.channels?.[0]?.id || 'general',
                        })
                      }
                      className="w-full p-3.5 rounded-xl bg-[#15111F]/85 hover:bg-[#15111F] border border-white/10 hover:border-[#8957F5]/40 flex items-center justify-between gap-3 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={
                            comm.iconUrl || generateInitialsAvatar(comm.name, '#8957F5')
                          }
                          alt={comm.name}
                          onError={(e) => {
                            e.currentTarget.src = generateInitialsAvatar(
                              comm.name,
                              '#8957F5'
                            );
                          }}
                          className="w-11 h-11 rounded-2xl object-cover border border-white/15 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#F5F3FA] truncate">
                            {comm.name}
                          </div>
                          <div className="text-xs text-[#A19DAD] truncate">
                            {comm.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-[#C4B1FF]">
                          {comm.memberCount || comm.members?.length || 1} members
                        </div>
                        <div className="text-[10px] font-mono text-[#777180]">
                          {comm.channels?.length || 1} channels
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Friend Activity, Featured Orbs & Receipts */}
          <div className="lg:col-span-5 space-y-6">
            {/* Friend Activity */}
            <div className="doom-glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#A47BFF]" />
                  <h2 className="text-sm font-bold text-[#F5F3FA]">
                    Friend Activity ({onlineFriends.length} Online)
                  </h2>
                </div>
                <button
                  onClick={() =>
                    onSelectView({ type: 'friends', subTab: 'online' })
                  }
                  className="text-xs font-semibold text-[#C4B1FF] hover:underline"
                >
                  Manage
                </button>
              </div>

              {friends.length > 0 ? (
                <div className="space-y-2.5">
                  {friends.slice(0, 5).map((fr) => (
                    <div
                      key={fr.uid}
                      className="p-3 rounded-xl bg-[#15111F]/85 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={
                              fr.photoURL ||
                              generateInitialsAvatar(fr.displayName, '#8957F5')
                            }
                            alt={fr.displayName}
                            onError={(e) => {
                              e.currentTarget.src = generateInitialsAvatar(
                                fr.displayName,
                                '#8957F5'
                              );
                            }}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#8957F5] ring-2 ring-[#15111F] absolute bottom-0 right-0" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#F5F3FA] truncate">
                            {fr.displayName}
                          </div>
                          <div className="text-[11px] text-[#A19DAD] truncate">
                            {fr.statusMessage || `@${fr.username}`}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onStartDM(fr)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#8957F5]/20 hover:bg-[#8957F5]/30 text-[#C4B1FF] text-xs font-semibold"
                      >
                        Message
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-[#15111F]/70 border border-white/10 text-xs text-[#A19DAD] text-center">
                  Connect with citizens in the Friends directory to see real-time presence and activity.
                </div>
              )}
            </div>

            {/* Featured Spatial Orbs */}
            <div className="doom-glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#C4B1FF]" />
                  <h2 className="text-sm font-bold text-[#F5F3FA]">
                    Featured Spatial Orbs
                  </h2>
                </div>
                <button
                  onClick={() => onSelectView({ type: 'orbs' })}
                  className="text-xs font-semibold text-[#C4B1FF] hover:underline"
                >
                  Enter 3D Canvas
                </button>
              </div>

              <div className="space-y-2.5">
                {orbs.slice(0, 3).map((orb) => (
                  <button
                    key={orb.id}
                    onClick={() =>
                      onSelectView({
                        type: 'orbs',
                        orbId: orb.id,
                        viewMode: 'detail',
                      })
                    }
                    className="w-full p-3.5 rounded-xl bg-[#15111F]/85 hover:bg-[#15111F] border border-white/10 hover:border-[#8957F5]/40 flex items-center justify-between gap-3 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8957F5] to-[#C4B1FF] p-[1px] shrink-0">
                        <div className="w-full h-full rounded-full bg-[#15111F] flex items-center justify-center text-[#C4B1FF]">
                          <Globe size={17} />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#F5F3FA] truncate">
                          {orb.name}
                        </div>
                        <div className="text-[11px] text-[#A19DAD] truncate">
                          {orb.description}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-[#8957F5]/15 text-[#C4B1FF] text-[10px] font-mono shrink-0">
                      {orb.memberCount} members
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Official Verifiable Receipts */}
            {userReceipts.length > 0 && (
              <div className="doom-glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Receipt size={15} className="text-[#C4B1FF]" />
                    <h2 className="text-sm font-bold text-[#F5F3FA]">
                      Your Official Receipts
                    </h2>
                  </div>
                </div>
                <div className="space-y-2">
                  {userReceipts.slice(0, 3).map((rcp) => (
                    <button
                      key={rcp.id}
                      onClick={() => onOpenReceipt(rcp)}
                      className="w-full p-3 rounded-xl bg-[#15111F]/85 hover:bg-[#15111F] border border-white/10 flex items-center justify-between text-xs text-left"
                    >
                      <div>
                        <div className="font-mono text-[#C4B1FF]">
                          {rcp.receiptNumber}
                        </div>
                        <div className="text-[#A19DAD] truncate">
                          {rcp.items?.[0]?.productName || rcp.title}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-[#F5F3FA]">
                        View →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
