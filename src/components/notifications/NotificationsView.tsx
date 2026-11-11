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
    <div className="flex-1 h-full overflow-y-auto bg-[#09090D] text-[#F5F3FA]">
      {/* Header */}
      <header className="sticky top-0 z-20 h-14 px-6 bg-[#09090D]/90 backdrop-blur-md border-b border-[#282631] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Bell className="w-4 h-4 text-[#8957F5]" />
          <h1 className="font-semibold text-xs text-[#F5F3FA]">
            Notifications
          </h1>
          <span className="text-[11px] font-mono text-[#706C7B] border-l border-[#282631] pl-2.5 tabular-nums">
            {incomingRequests.length} pending
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#101014] p-0.5 rounded-md border border-[#282631]">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'friends', label: 'Requests' },
              { id: 'messages', label: 'Messages' },
              { id: 'apex', label: 'APEX & Billing' },
              { id: 'spaces', label: 'Spaces' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`h-6 px-2.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-[#17171F] text-[#F5F3FA]'
                  : 'text-[#A19DAD] hover:text-[#F5F3FA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {/* Friend Requests Section */}
        {(filter === 'all' || filter === 'friends') && (
          <section className="rounded-xl bg-[#101014] border border-[#282631] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#282631] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-3.5 h-3.5 text-[#8957F5]" />
                <h2 className="text-xs font-semibold text-[#F5F3FA]">
                  Friend Requests ({incomingRequests.length})
                </h2>
              </div>
              <button
                onClick={() => onSelectView({ type: 'friends', subTab: 'pending' })}
                className="text-xs text-[#8957F5] hover:text-[#A47BFF] transition-colors"
              >
                Manage
              </button>
            </div>

            {incomingRequests.length === 0 ? (
              <div className="p-4 text-xs text-[#706C7B]">
                No pending friend requests.
              </div>
            ) : (
              <div className="divide-y divide-[#282631]/60">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-[#17171F] border border-[#282631] flex items-center justify-center text-xs font-bold text-[#8957F5]">
                        {(req.fromDisplayName || req.fromUsername)
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#F5F3FA] truncate">
                          {req.fromDisplayName || req.fromUsername}{' '}
                          <span className="text-[10px] font-mono text-[#706C7B]">
                            @{req.fromUsername}
                          </span>
                        </p>
                        <p className="text-[11px] text-[#706C7B]">
                          Sent request · {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onAcceptFriendRequest(req)}
                        className="h-7 px-2.5 rounded bg-[#8957F5] hover:bg-[#7a4be6] text-white text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => onRejectFriendRequest(req.id)}
                        className="h-7 px-2.5 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[#A19DAD] hover:text-[#ED4245] text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3 h-3" />
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
          <section className="rounded-xl bg-[#101014] border border-[#282631] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#282631] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-3.5 h-3.5 text-[#A47BFF]" />
                <h2 className="text-xs font-semibold text-[#F5F3FA]">
                  Gifts & Receipts ({giftsForMe.length + myReceipts.length})
                </h2>
              </div>
              <button
                onClick={() => onSelectView({ type: 'nitro' })}
                className="text-xs text-[#8957F5] hover:text-[#A47BFF] transition-colors"
              >
                APEX Hub
              </button>
            </div>

            {giftsForMe.length === 0 && myReceipts.length === 0 ? (
              <div className="p-4 text-xs text-[#706C7B]">
                No gifts or receipts recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-[#282631]/60">
                {giftsForMe.map((gift) => (
                  <div
                    key={gift.id}
                    className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#17171F] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-[#8957F5]/10 border border-[#8957F5]/30 flex items-center justify-center text-[#A47BFF] shrink-0">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#F5F3FA] truncate">
                          {gift.apexTier === 'nitro'
                            ? 'DOOMCORD APEX+ Gift'
                            : gift.apexTier === 'basic'
                            ? 'DOOMCORD APEX Gift'
                            : 'Cosmetic Gift'}{' '}
                          from {gift.creatorName}
                        </p>
                        <p className="text-[11px] text-[#706C7B] truncate">
                          Status: <span className="font-mono uppercase">{gift.status}</span> ·{' '}
                          {gift.personalMessage || 'Enjoy your gift!'}
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
                        className="h-7 px-3 rounded bg-[#8957F5] text-white text-xs font-medium shrink-0 shadow-sm"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                ))}

                {myReceipts.map((rcp) => (
                  <div
                    key={rcp.id}
                    className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#17171F] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-[#8957F5]/10 border border-[#8957F5]/30 flex items-center justify-center text-[#8957F5] shrink-0">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#F5F3FA] truncate">
                          Receipt {rcp.receiptNumber} — {rcp.title}
                        </p>
                        <p className="text-[11px] text-[#706C7B] font-mono tabular-nums">
                          ₹{rcp.totalAmountINR} · {rcp.paymentStatus} ·{' '}
                          {new Date(rcp.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenReceipt(rcp)}
                      className="h-7 px-2.5 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#F5F3FA] flex items-center gap-1 shrink-0"
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Recent Direct Message Threads */}
        {(filter === 'all' || filter === 'messages') && (
          <section className="rounded-xl bg-[#101014] border border-[#282631] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#282631] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#8957F5]" />
                <h2 className="text-xs font-semibold text-[#F5F3FA]">
                  Direct Messages ({recentDMs.length})
                </h2>
              </div>
            </div>

            {recentDMs.length === 0 ? (
              <div className="p-4 text-xs text-[#706C7B]">
                No direct messages yet.
              </div>
            ) : (
              <div className="divide-y divide-[#282631]/60">
                {recentDMs.map((dm) => {
                  const otherUid =
                    dm.participants.find((id) => id !== profile.uid) || dm.participants[0];
                  const peer =
                    dm.recipientProfile || allUsers.find((u) => u.uid === otherUid);
                  return (
                    <button
                      key={dm.id}
                      onClick={() => onSelectView({ type: 'dm', dmId: dm.id })}
                      className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#17171F] text-left transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-[#17171F] border border-[#282631] flex items-center justify-center text-xs font-bold text-[#8957F5]">
                          {(peer?.displayName || 'DM').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#F5F3FA] truncate">
                            {peer?.displayName || 'Direct Conversation'}
                          </p>
                          <p className="text-[11px] text-[#706C7B] truncate">
                            {dm.lastMessageText}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#706C7B] shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Communities & Orbs */}
        {(filter === 'all' || filter === 'spaces') && (
          <section className="rounded-xl bg-[#101014] border border-[#282631] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#282631] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-[#A47BFF]" />
                <h2 className="text-xs font-semibold text-[#F5F3FA]">
                  Communities & Orbs ({myCommunities.length + myOrbs.length})
                </h2>
              </div>
            </div>

            {myCommunities.length === 0 && myOrbs.length === 0 ? (
              <div className="p-4 text-xs text-[#706C7B]">
                Join communities or follow Orbs to see updates here.
              </div>
            ) : (
              <div className="divide-y divide-[#282631]/60">
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
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#17171F] text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Hash className="w-4 h-4 text-[#8957F5]" />
                      <div>
                        <p className="text-xs font-medium text-[#F5F3FA]">{comm.name}</p>
                        <p className="text-[11px] text-[#706C7B]">
                          {comm.members?.length || 1} members · {comm.channels?.length || 1} channels
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#706C7B]" />
                  </button>
                ))}
                {myOrbs.map((orb) => (
                  <button
                    key={orb.id}
                    onClick={() =>
                      onSelectView({ type: 'orbs', orbId: orb.id, viewMode: 'detail' })
                    }
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#17171F] text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Compass className="w-4 h-4 text-[#A47BFF]" />
                      <div>
                        <p className="text-xs font-medium text-[#F5F3FA]">{orb.name}</p>
                        <p className="text-[11px] text-[#706C7B]">
                          Orb · {orb.category} · {orb.memberCount || 1} members
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#706C7B]" />
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
