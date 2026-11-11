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
  const isOwner = isRootOwner(targetUser);
  const hasApexPlus =
    isOwner ||
    targetUser.nitroTier === 'nitro' ||
    targetUser.permanentEntitlement === 'OWNER_PERMANENT_APEX' ||
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

  const primaryColor = targetUser.accentColor || '#8957F5';
  const secondaryColor = targetUser.secondaryColor || '#17171F';

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#09090D] text-[#F5F3FA]">
      {/* Header */}
      <header className="sticky top-0 z-20 h-14 px-6 bg-[#09090D]/90 backdrop-blur-md border-b border-[#282631] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <User className="w-4 h-4 text-[#8957F5]" />
          <h1 className="font-semibold text-xs text-[#F5F3FA]">
            {isSelf ? 'My Profile' : `${targetUser.displayName}'s Profile`}
          </h1>
          <span className="text-[11px] font-mono text-[#706C7B]">
            @{targetUser.username}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSelf ? (
            <>
              <button
                onClick={() => onSelectView({ type: 'shop' })}
                className="h-8 px-3 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#8957F5] flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cosmetics</span>
              </button>
              <button
                onClick={onOpenSettings}
                className="h-8 px-3 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onStartDM(targetUser)}
                className="h-8 px-3 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
              {!isFriend && (
                <button
                  onClick={() => onSendFriendRequest(targetUser.username)}
                  className="h-8 px-3 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#F5F3FA] flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#8957F5]" />
                  <span>Add Friend</span>
                </button>
              )}
              {isFriend && (
                <span className="h-8 px-3 rounded-md bg-[#101014] border border-[#282631] text-xs font-medium text-[#8957F5] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Friends</span>
                </span>
              )}
            </>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* Hero Identity Card */}
        <section className="rounded-xl bg-[#101014] border border-[#282631] overflow-hidden">
          {/* Banner */}
          <div
            className="h-36 w-full relative overflow-hidden border-b border-[#282631]"
            style={{
              background: targetUser.bannerURL
                ? `url(${targetUser.bannerURL}) center/cover no-repeat`
                : `linear-gradient(135deg, ${secondaryColor} 0%, #09090D 65%, ${primaryColor}33 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#101014] via-transparent to-transparent opacity-80" />
          </div>

          {/* Profile Identity Content */}
          <div className="px-6 pb-6 -mt-10 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-xl bg-[#17171F] border-2 border-[#101014] flex items-center justify-center text-xl font-bold text-[#8957F5] overflow-hidden shadow-xl"
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
                    className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#101014] ${
                      targetUser.presence === 'online'
                        ? 'bg-[#3BA55D]'
                        : targetUser.presence === 'idle'
                        ? 'bg-[#FAA81A]'
                        : targetUser.presence === 'dnd'
                        ? 'bg-[#ED4245]'
                        : 'bg-[#706C7B]'
                    }`}
                  />
                </div>

                <div className="pb-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-[#F5F3FA]">
                      {targetUser.displayName}
                    </h2>
                    {isOwner && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#A47BFF] border-l border-[#282631] pl-2 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        ROOT OWNER
                      </span>
                    )}
                    {!isOwner && targetUser.role !== 'member' && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8957F5] border-l border-[#282631] pl-2">
                        {formatRoleLabel(targetUser.role, targetUser.uid)}
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
                  <p className="text-xs font-mono text-[#706C7B] mt-0.5">
                    @{targetUser.username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#706C7B] font-mono tabular-nums">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#706C7B]" />
                  <span>
                    Joined {new Date(targetUser.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio & Badges */}
            <div className="mt-5 pt-5 border-t border-[#282631] grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#706C7B]">
                  About
                </div>
                {targetUser.statusMessage && (
                  <p className="text-xs font-medium text-[#8957F5]">
                    “{targetUser.statusMessage}”
                  </p>
                )}
                <p className="text-xs text-[#A19DAD] leading-relaxed">
                  {targetUser.bio || 'No biography written yet.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#706C7B]">
                  Badges ({targetUser.badges?.length || 0})
                </div>
                {(!targetUser.badges || targetUser.badges.length === 0) && !isOwner ? (
                  <p className="text-xs text-[#706C7B]">Standard Member</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {isOwner && (
                      <span className="px-2 py-0.5 rounded bg-[#17171F] border border-[#8957F5]/40 text-[10px] font-mono text-[#A47BFF]">
                        ROOT OWNER
                      </span>
                    )}
                    {hasApexPlus && (
                      <span className="px-2 py-0.5 rounded bg-[#8957F5]/10 border border-[#8957F5]/30 text-[10px] font-mono text-[#C4B1FF]">
                        APEX+
                      </span>
                    )}
                    {(targetUser.badges || []).map((badge) => (
                      <span
                        key={badge}
                        className="px-2 py-0.5 rounded bg-[#17171F] border border-[#282631] text-[10px] font-mono text-[#F5F3FA]"
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

        {/* Lower Grid: Equipped Cosmetics, Communities, Orbs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Equipped Profile Cosmetics */}
          <section className="rounded-xl bg-[#101014] border border-[#282631] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#A47BFF]" />
                <h3 className="text-xs font-semibold text-[#F5F3FA]">
                  Equipped Cosmetics
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#706C7B] tabular-nums">
                {equippedItems.length} active
              </span>
            </div>

            {equippedItems.length === 0 ? (
              <p className="text-xs text-[#706C7B] py-3">
                No cosmetics currently equipped.
              </p>
            ) : (
              <div className="space-y-2">
                {equippedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-md bg-[#17171F] border border-[#282631] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-medium text-[#F5F3FA]">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-[#706C7B]">
                        {item.category}
                      </div>
                    </div>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.previewColorPrimary }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Joined Communities */}
          <section className="rounded-xl bg-[#101014] border border-[#282631] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#8957F5]" />
                <h3 className="text-xs font-semibold text-[#F5F3FA]">
                  Communities
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#706C7B] tabular-nums">
                {userCommunities.length}
              </span>
            </div>

            {userCommunities.length === 0 ? (
              <p className="text-xs text-[#706C7B] py-3">
                Not a member of any communities.
              </p>
            ) : (
              <div className="space-y-1.5">
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
                    className="w-full p-2.5 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] flex items-center justify-between text-left transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#F5F3FA] truncate">
                        {comm.name}
                      </div>
                      <div className="text-[10px] text-[#706C7B] font-mono tabular-nums">
                        {comm.members?.length || 1} members
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Public Orbs */}
          <section className="rounded-xl bg-[#101014] border border-[#282631] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#C4B1FF]" />
                <h3 className="text-xs font-semibold text-[#F5F3FA]">
                  Public Orbs
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#706C7B] tabular-nums">
                {userOrbs.length}
              </span>
            </div>

            {userOrbs.length === 0 ? (
              <p className="text-xs text-[#706C7B] py-3">
                No public Orbs created or joined.
              </p>
            ) : (
              <div className="space-y-1.5">
                {userOrbs.map((orb) => (
                  <button
                    key={orb.id}
                    onClick={() =>
                      onSelectView({ type: 'orbs', orbId: orb.id, viewMode: 'detail' })
                    }
                    className="w-full p-2.5 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] flex items-center justify-between text-left transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#F5F3FA] truncate">
                        {orb.name}
                      </div>
                      <div className="text-[10px] text-[#706C7B] font-mono">
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
