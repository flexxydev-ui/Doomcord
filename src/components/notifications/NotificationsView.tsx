import React, { useState } from 'react';
import {
  Bell,
  UserPlus,
  MessageSquare,
  Gift,
  Receipt,
  Check,
  X,
  ArrowUpRight,
  Compass,
  Hash,
} from 'lucide-react';
import {
  UserProfile,
  FriendRequest,
  DirectMessageThread,
  GiftRecord,
  ReceiptRecord,
  Community,
  OrbData,
  ActiveView,
} from '../../types';

interface NotificationsViewProps {
  profile: UserProfile;
  allUsers: UserProfile[];
  friendRequests: FriendRequest[];
  dmThreads: DirectMessageThread[];
  gifts: GiftRecord[];
  receipts: ReceiptRecord[];
  communities: Community[];
  orbs: OrbData[];
  onAcceptFriendRequest: (req: FriendRequest) => Promise<void>;
  onRejectFriendRequest: (reqId: string) => Promise<void>;
  onSelectView: (view: ActiveView) => void;
  onOpenReceipt: (receipt: ReceiptRecord) => void;
}

type NotificationFilter = 'all' | 'friends' | 'messages' | 'apex' | 'spaces';

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  profile,
  allUsers,
  friendRequests,
  dmThreads,
  gifts,
  receipts,
  communities,
  orbs,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onSelectView,
  onOpenReceipt,
}) => {
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const incomingRequests = friendRequests.filter(
    (r) => r.toUid === profile.uid && r.status === 'pending'
  );

  const giftsForMe = gifts.filter(
    (g) =>
      (g.restrictedRecipientUid && g.restrictedRecipientUid === profile.uid) ||
      (g.restrictedRecipientUsername &&
        g.restrictedRecipientUsername.toLowerCase() === profile.username.toLowerCase()) ||
      (g.restrictedRecipientEmail &&
        g.restrictedRecipientEmail.toLowerCase() === profile.email.toLowerCase()) ||
      g.redeemedByUid === profile.uid
  );

  const myReceipts = receipts.filter(
    (r) =>
      r.customerUid === profile.uid ||
      r.customerEmail?.toLowerCase() === profile.email?.toLowerCase()
  );

  const recentDMs = dmThreads.filter((dm) => dm.lastMessageText);
  const myCommunities = communities.filter((c) => c.members?.includes(profile.uid));
  const myOrbs = orbs.filter(
    (o) => o.creatorId === profile.uid || o.members?.includes(profile.uid)
  );

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101A17] text-[#F0F5F1]">
      {/* Header */}
      <header className="sticky top-0 z-20 h-16 px-8 bg-[#101A17]/95 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-4 h-4 text-[#8BE2B8]" />
          <h1 className="font-display font-bold text-base text-[#F0F5F1]">
            Notifications Center
          </h1>
          <span className="text-xs font-mono text-[#718478] border-l border-white/15 pl-3 tabular-nums">
            {incomingRequests.length} action required
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#141F1B] p-1 rounded-lg border border-white/[0.06]">
          {(
            [
              { id: 'all', label: 'All Activity' },
              { id: 'friends', label: 'Friend Requests' },
              { id: 'messages', label: 'Direct Messages' },
              { id: 'apex', label: 'APEX & Billing' },
              { id: 'spaces', label: 'Communities & Orbs' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`h-7 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-[#24362C] text-[#F0F5F1]'
                  : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        {/* Friend Requests Section */}
        {(filter === 'all' || filter === 'friends') && (
          <section className="rounded-xl bg-[#141F1B] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#8BE2B8]" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-[#F0F5F1]">
                  Incoming Friend Requests ({incomingRequests.length})
                </h2>
              </div>
              <button
                onClick={() => onSelectView({ type: 'friends', subTab: 'pending' })}
                className="text-xs text-[#8BE2B8] hover:underline"
              >
                Manage Friends
              </button>
            </div>

            {incomingRequests.length === 0 ? (
              <div className="p-6 text-xs text-[#9BAEA2]">
                No pending friend requests right now.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#1D2B24] border border-white/10 flex items-center justify-center text-xs font-bold text-[#8BE2B8]">
                        {(req.fromDisplayName || req.fromUsername)
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#F0F5F1] truncate">
                          {req.fromDisplayName || req.fromUsername}{' '}
                          <span className="text-xs font-mono text-[#718478]">
                            @{req.fromUsername}
                          </span>
                        </p>
                        <p className="text-xs text-[#9BAEA2]">
                          Sent you a friend request ·{' '}
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onAcceptFriendRequest(req)}
                        className="h-8 px-3 rounded-lg bg-[#8BE2B8] hover:bg-[#7AD4A8] text-[#101A17] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => onRejectFriendRequest(req.id)}
                        className="h-8 px-3 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/10 text-[#9BAEA2] hover:text-[#E57373] text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* APEX Gifts & Billing Notifications */}
        {(filter === 'all' || filter === 'apex') && (
          <section className="rounded-xl bg-[#141F1B] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#D9BB79]" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-[#F0F5F1]">
                  DOOMCORD APEX Gifts & Official Receipts ({giftsForMe.length + myReceipts.length})
                </h2>
              </div>
              <button
                onClick={() => onSelectView({ type: 'nitro' })}
                className="text-xs text-[#D9BB79] hover:underline"
              >
                Open APEX Hub
              </button>
            </div>

            {giftsForMe.length === 0 && myReceipts.length === 0 ? (
              <div className="p-6 text-xs text-[#9BAEA2]">
                No APEX gifts or billing receipts recorded for your account yet.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {giftsForMe.map((gift) => (
                  <div
                    key={gift.id}
                    className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#192620] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#D9BB79]/15 border border-[#D9BB79]/30 flex items-center justify-center text-[#D9BB79] shrink-0">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#F0F5F1] truncate">
                          {gift.apexTier === 'nitro'
                            ? 'DOOMCORD APEX+ Gift'
                            : gift.apexTier === 'basic'
                            ? 'DOOMCORD APEX Gift'
                            : 'Cosmetic Gift'}{' '}
                          from {gift.creatorName}
                        </p>
                        <p className="text-xs text-[#9BAEA2] truncate">
                          Status: <span className="font-mono uppercase">{gift.status}</span> ·{' '}
                          {gift.personalMessage || 'Enjoy your premium Doomcord benefits!'}
                        </p>
                      </div>
                    </div>

                    {gift.status === 'unclaimed' && (
                      <button
                        onClick={() =>
                          onSelectView({
                            type: 'gift_redeem',
                            token: gift.claimToken || gift.tokenPreview,
                          })
                        }
                        className="h-8 px-3.5 rounded-lg bg-[#D9BB79] text-[#101A17] text-xs font-semibold shrink-0"
                      >
                        Claim Gift
                      </button>
                    )}
                  </div>
                ))}

                {myReceipts.map((rcp) => (
                  <div
                    key={rcp.id}
                    className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#192620] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#8BE2B8]/15 border border-[#8BE2B8]/30 flex items-center justify-center text-[#8BE2B8] shrink-0">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#F0F5F1] truncate">
                          Official Receipt {rcp.receiptNumber} — {rcp.title}
                        </p>
                        <p className="text-xs text-[#9BAEA2] font-mono tabular-nums">
                          ₹{rcp.totalAmountINR} · {rcp.paymentStatus} ·{' '}
                          {new Date(rcp.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenReceipt(rcp)}
                      className="h-8 px-3 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/10 text-xs font-medium text-[#F0F5F1] flex items-center gap-1.5 shrink-0"
                    >
                      <span>View Receipt</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Recent Direct Message Threads */}
        {(filter === 'all' || filter === 'messages') && (
          <section className="rounded-xl bg-[#141F1B] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#8BE2B8]" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-[#F0F5F1]">
                  Direct Message Activity ({recentDMs.length})
                </h2>
              </div>
            </div>

            {recentDMs.length === 0 ? (
              <div className="p-6 text-xs text-[#9BAEA2]">
                No direct message updates yet.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {recentDMs.map((dm) => {
                  const otherUid =
                    dm.participants.find((id) => id !== profile.uid) || dm.participants[0];
                  const peer =
                    dm.recipientProfile || allUsers.find((u) => u.uid === otherUid);
                  return (
                    <button
                      key={dm.id}
                      onClick={() => onSelectView({ type: 'dm', dmId: dm.id })}
                      className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#192620] text-left transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#1D2B24] border border-white/10 flex items-center justify-center text-xs font-bold text-[#8BE2B8]">
                          {(peer?.displayName || 'DM').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#F0F5F1] truncate">
                            {peer?.displayName || 'Direct Conversation'}
                          </p>
                          <p className="text-xs text-[#9BAEA2] truncate">
                            {dm.lastMessageText}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#718478] shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Communities & Orbs */}
        {(filter === 'all' || filter === 'spaces') && (
          <section className="rounded-xl bg-[#141F1B] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#E9987B]" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-[#F0F5F1]">
                  Subscribed Communities & Orbs ({myCommunities.length + myOrbs.length})
                </h2>
              </div>
            </div>

            {myCommunities.length === 0 && myOrbs.length === 0 ? (
              <div className="p-6 text-xs text-[#9BAEA2]">
                Join a community or follow an Orb to receive space activity updates here.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {myCommunities.map((comm) => (
                  <button
                    key={comm.id}
                    onClick={() =>
                      onSelectView({
                        type: 'community',
                        communityId: comm.id,
                        channelId: comm.channels?.[0]?.id || 'general',
                      })
                    }
                    className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-[#192620] text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Hash className="w-4 h-4 text-[#8BE2B8]" />
                      <div>
                        <p className="text-sm font-medium text-[#F0F5F1]">{comm.name}</p>
                        <p className="text-xs text-[#9BAEA2]">
                          {comm.members?.length || 1} members · {comm.channels?.length || 1} channels
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#718478]" />
                  </button>
                ))}
                {myOrbs.map((orb) => (
                  <button
                    key={orb.id}
                    onClick={() =>
                      onSelectView({ type: 'orbs', orbId: orb.id, viewMode: 'detail' })
                    }
                    className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-[#192620] text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Compass className="w-4 h-4 text-[#E9987B]" />
                      <div>
                        <p className="text-sm font-medium text-[#F0F5F1]">{orb.name}</p>
                        <p className="text-xs text-[#9BAEA2]">
                          Orb · {orb.category} · {orb.memberCount || 1} members
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#718478]" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
