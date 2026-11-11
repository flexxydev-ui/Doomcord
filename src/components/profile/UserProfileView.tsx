import React from 'react';
import {
  User,
  MessageSquare,
  UserPlus,
  Crown,
  Sparkles,
  Hash,
  Compass,
  Calendar,
  Settings,
  Shield,
  Check,
} from 'lucide-react';
import {
  UserProfile,
  Community,
  OrbData,
  CosmeticItem,
  ActiveView,
} from '../../types';
import { isRootOwner, formatRoleLabel } from '../../lib/dataService';

interface UserProfileViewProps {
  currentUser: UserProfile;
  targetUser: UserProfile;
  communities: Community[];
  orbs: OrbData[];
  cosmeticsCatalog: CosmeticItem[];
  onStartDM: (user: UserProfile) => void;
  onSendFriendRequest: (username: string) => Promise<void>;
  onOpenSettings: () => void;
  onSelectView: (view: ActiveView) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  targetUser,
  communities,
  orbs,
  cosmeticsCatalog,
  onStartDM,
  onSendFriendRequest,
  onOpenSettings,
  onSelectView,
}) => {
  const isSelf = currentUser.uid === targetUser.uid;
  const isFriend = currentUser.friends?.includes(targetUser.uid);
  const isOwner = isRootOwner(targetUser.uid);
  const hasApexPlus =
    isOwner ||
    targetUser.nitroTier === 'nitro' ||
    targetUser.permanentEntitlement === 'OWNER_PERMANENT_APEX' ||
    targetUser.permanentEntitlement === 'OWNER_PERMANENT_NITRO' ||
    targetUser.permanentEntitlement === 'LIFETIME_APEX_PLUS';
  const hasApexBasic =
    targetUser.nitroTier === 'basic' || targetUser.permanentEntitlement === 'LIFETIME_APEX';

  const userCommunities = communities.filter((c) =>
    c.members?.includes(targetUser.uid)
  );
  const userOrbs = orbs.filter(
    (o) =>
      o.visibility === 'public' &&
      (o.creatorId === targetUser.uid || o.members?.includes(targetUser.uid))
  );

  const equippedItems = Object.values(targetUser.equippedCosmetics || {})
    .filter(Boolean)
    .map((id) => cosmeticsCatalog.find((c) => c.id === id))
    .filter((c): c is CosmeticItem => Boolean(c));

  const primaryColor = targetUser.accentColor || '#8BE2B8';
  const secondaryColor = targetUser.secondaryColor || '#192620';

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101A17] text-[#F0F5F1]">
      {/* Header */}
      <header className="sticky top-0 z-20 h-16 px-8 bg-[#101A17]/95 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-[#8BE2B8]" />
          <h1 className="font-display font-bold text-base text-[#F0F5F1]">
            {isSelf ? 'My Profile' : `${targetUser.displayName}'s Profile`}
          </h1>
          <span className="text-xs font-mono text-[#718478]">
            @{targetUser.username}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {isSelf ? (
            <>
              <button
                onClick={() => onSelectView({ type: 'shop' })}
                className="h-9 px-3.5 rounded-lg bg-[#192620] hover:bg-[#24362C] border border-white/[0.08] text-xs font-medium text-[#8BE2B8] flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Customize Cosmetics</span>
              </button>
              <button
                onClick={onOpenSettings}
                className="h-9 px-3.5 rounded-lg bg-[#8BE2B8] hover:bg-[#7AD4A8] text-[#101A17] text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onStartDM(targetUser)}
                className="h-9 px-3.5 rounded-lg bg-[#8BE2B8] hover:bg-[#7AD4A8] text-[#101A17] text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
              {!isFriend && (
                <button
                  onClick={() => onSendFriendRequest(targetUser.username)}
                  className="h-9 px-3.5 rounded-lg bg-[#192620] hover:bg-[#24362C] border border-white/[0.08] text-xs font-medium text-[#F0F5F1] flex items-center gap-2 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#8BE2B8]" />
                  <span>Add Friend</span>
                </button>
              )}
              {isFriend && (
                <span className="h-9 px-3.5 rounded-lg bg-[#141F1B] border border-white/[0.06] text-xs font-medium text-[#8BE2B8] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Friends</span>
                </span>
              )}
            </>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        {/* Hero Identity Card */}
        <section className="rounded-xl bg-[#141F1B] border border-white/[0.07] overflow-hidden">
          {/* Banner */}
          <div
            className="h-44 w-full relative overflow-hidden border-b border-white/[0.06]"
            style={{
              background: targetUser.bannerURL
                ? `url(${targetUser.bannerURL}) center/cover no-repeat`
                : `linear-gradient(135deg, ${secondaryColor} 0%, #101A17 65%, ${primaryColor}33 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#141F1B] via-transparent to-transparent opacity-80" />
          </div>

          {/* Profile Identity Content */}
          <div className="px-8 pb-8 -mt-12 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-end gap-5">
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-2xl bg-[#1D2B24] border-4 border-[#141F1B] flex items-center justify-center text-2xl font-display font-bold text-[#8BE2B8] overflow-hidden shadow-xl"
                    style={{
                      boxShadow: hasApexPlus ? `0 0 0 2px ${primaryColor}` : undefined,
                    }}
                  >
                    {targetUser.photoURL ? (
                      <img
                        src={targetUser.photoURL}
                        alt={targetUser.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      targetUser.displayName?.slice(0, 2).toUpperCase() || 'DC'
                    )}
                  </div>
                  <span
                    className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#141F1B] ${
                      targetUser.presence === 'online'
                        ? 'bg-[#6DD5A5]'
                        : targetUser.presence === 'idle'
                        ? 'bg-[#E4B869]'
                        : targetUser.presence === 'dnd'
                        ? 'bg-[#E57373]'
                        : 'bg-[#718478]'
                    }`}
                  />
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-2xl font-display font-bold text-[#F0F5F1]">
                      {targetUser.displayName}
                    </h2>
                    {isOwner && (
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#D9BB79] border-l border-white/15 pl-2.5 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        ROOT OWNER
                      </span>
                    )}
                    {!isOwner && targetUser.role !== 'member' && (
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#8BE2B8] border-l border-white/15 pl-2.5">
                        {formatRoleLabel(targetUser.role, targetUser.uid)}
                      </span>
                    )}
                    {hasApexPlus && (
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#D9BB79] border-l border-white/15 pl-2.5 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5" />
                        DOOMCORD APEX+
                      </span>
                    )}
                    {!hasApexPlus && hasApexBasic && (
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#8BE2B8] border-l border-white/15 pl-2.5">
                        DOOMCORD APEX
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-mono text-[#9BAEA2] mt-0.5">
                    @{targetUser.username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-[#9BAEA2] font-mono tabular-nums">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#718478]" />
                  <span>
                    Joined {new Date(targetUser.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio & Status */}
            <div className="mt-6 pt-6 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#718478]">
                  Biography & Status
                </div>
                {targetUser.statusMessage && (
                  <p className="text-xs font-medium text-[#8BE2B8]">
                    “{targetUser.statusMessage}”
                  </p>
                )}
                <p className="text-sm text-[#F0F5F1] leading-relaxed">
                  {targetUser.bio || 'No biography written yet.'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#718478]">
                  Profile Badges ({targetUser.badges?.length || 0})
                </div>
                {(!targetUser.badges || targetUser.badges.length === 0) && !isOwner ? (
                  <p className="text-xs text-[#718478]">Standard Member</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {isOwner && (
                      <span className="px-2.5 py-1 rounded bg-[#192620] border border-[#D9BB79]/30 text-[11px] font-mono text-[#D9BB79]">
                        FOUNDER & ROOT OWNER
                      </span>
                    )}
                    {hasApexPlus && (
                      <span className="px-2.5 py-1 rounded bg-[#192620] border border-[#8BE2B8]/30 text-[11px] font-mono text-[#8BE2B8]">
                        APEX+ SUBSCRIBER
                      </span>
                    )}
                    {(targetUser.badges || []).map((badge) => (
                      <span
                        key={badge}
                        className="px-2.5 py-1 rounded bg-[#192620] border border-white/10 text-[11px] font-mono text-[#F0F5F1]"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Lower Grid: Equipped Cosmetics, Joined Communities, Public Orbs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Equipped Profile Cosmetics */}
          <section className="rounded-xl bg-[#141F1B] border border-white/[0.06] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E9987B]" />
                <h3 className="text-sm font-display font-bold text-[#F0F5F1]">
                  Equipped Cosmetics
                </h3>
              </div>
              <span className="text-xs font-mono text-[#718478] tabular-nums">
                {equippedItems.length} active
              </span>
            </div>

            {equippedItems.length === 0 ? (
              <p className="text-xs text-[#9BAEA2] py-4">
                No custom cosmetics currently equipped on this profile.
              </p>
            ) : (
              <div className="space-y-2.5">
                {equippedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-[#192620] border border-white/[0.06] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#F0F5F1]">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[#9BAEA2]">
                        {item.category} · {item.rarity}
                      </div>
                    </div>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.previewColorPrimary }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Joined Communities */}
          <section className="rounded-xl bg-[#141F1B] border border-white/[0.06] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#8BE2B8]" />
                <h3 className="text-sm font-display font-bold text-[#F0F5F1]">
                  Joined Communities
                </h3>
              </div>
              <span className="text-xs font-mono text-[#718478] tabular-nums">
                {userCommunities.length}
              </span>
            </div>

            {userCommunities.length === 0 ? (
              <p className="text-xs text-[#9BAEA2] py-4">
                Not a member of any public communities yet.
              </p>
            ) : (
              <div className="space-y-2">
                {userCommunities.map((comm) => (
                  <button
                    key={comm.id}
                    onClick={() =>
                      onSelectView({
                        type: 'community',
                        communityId: comm.id,
                        channelId: comm.channels?.[0]?.id || 'general',
                      })
                    }
                    className="w-full p-3 rounded-lg bg-[#192620] hover:bg-[#24362C] border border-white/[0.06] flex items-center justify-between text-left transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#F0F5F1] truncate">
                        {comm.name}
                      </div>
                      <div className="text-[11px] text-[#718478] font-mono tabular-nums">
                        {comm.members?.length || 1} members
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Public Orbs */}
          <section className="rounded-xl bg-[#141F1B] border border-white/[0.06] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#D9BB79]" />
                <h3 className="text-sm font-display font-bold text-[#F0F5F1]">
                  Public Orbs
                </h3>
              </div>
              <span className="text-xs font-mono text-[#718478] tabular-nums">
                {userOrbs.length}
              </span>
            </div>

            {userOrbs.length === 0 ? (
              <p className="text-xs text-[#9BAEA2] py-4">
                No public Orbs created or joined yet.
              </p>
            ) : (
              <div className="space-y-2">
                {userOrbs.map((orb) => (
                  <button
                    key={orb.id}
                    onClick={() =>
                      onSelectView({ type: 'orbs', orbId: orb.id, viewMode: 'detail' })
                    }
                    className="w-full p-3 rounded-lg bg-[#192620] hover:bg-[#24362C] border border-white/[0.06] flex items-center justify-between text-left transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#F0F5F1] truncate">
                        {orb.name}
                      </div>
                      <div className="text-[11px] text-[#718478] font-mono">
                        {orb.category} · {orb.memberCount || 1} members
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
