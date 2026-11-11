import React from 'react';
import {
  Shield,
  Crown,
  Sparkles,
  Calendar,
  User,
  ArrowUpRight,
  Zap,
  Check,
} from 'lucide-react';
import {
  ActiveView,
  Community,
  UserProfile,
  OrbData,
  UserPresence,
} from '../../types';
import {
  generateInitialsAvatar,
  isRootOwner,
  formatRoleLabel,
} from '../../lib/dataService';
import { calculateServerBoostState } from '../../lib/chatEnhancements';

interface ContextualPanelProps {
  activeView: ActiveView;
  activeCommunity?: Community | null;
  recipientProfile?: UserProfile | null;
  activeOrb?: OrbData | null;
  members: UserProfile[];
  onSelectMember: (user: UserProfile) => void;
  onViewProfile?: (userId: string) => void;
  onBoostCommunity?: (communityId: string) => void;
}

export const ContextualPanel: React.FC<ContextualPanelProps> = ({
  activeView,
  activeCommunity,
  recipientProfile,
  activeOrb,
  members,
  onSelectMember,
  onViewProfile,
  onBoostCommunity,
}) => {
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

  // Direct Message Context: Recipient Identity & Profile Inspector
  if (activeView.type === 'dm' && recipientProfile) {
    const isOwner = isRootOwner(recipientProfile.uid);
    const hasApex =
      isOwner ||
      recipientProfile.nitroTier !== 'free' ||
      Boolean(recipientProfile.permanentEntitlement);

    return (
      <aside className="w-72 h-full bg-[#0D0D12] border-l border-[#282631] flex flex-col shrink-0 overflow-y-auto text-[#F5F3FA]">
        <div className="h-14 px-4 border-b border-[#282631] flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#706C7B]">
            Profile Overview
          </span>
          {onViewProfile && (
            <button
              onClick={() => onViewProfile(recipientProfile.uid)}
              className="text-xs font-medium text-[#8957F5] hover:text-[#A47BFF] flex items-center gap-1 transition-colors"
            >
              <span>Full Profile</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Banner + Avatar */}
          <div className="relative mb-8">
            <div
              className="w-full h-20 rounded-lg overflow-hidden border border-[#282631]"
              style={{
                background: recipientProfile.bannerURL
                  ? `url(${recipientProfile.bannerURL}) center/cover no-repeat`
                  : 'linear-gradient(135deg, #17171F 0%, #22212C 100%)',
              }}
            />
            <div className="absolute -bottom-6 left-3">
              <div className="relative">
                <img
                  src={
                    recipientProfile.photoURL ||
                    generateInitialsAvatar(recipientProfile.displayName)
                  }
                  alt={recipientProfile.displayName}
                  className="w-14 h-14 rounded-lg object-cover border-2 border-[#0D0D12] bg-[#17171F]"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0D0D12] ${getPresenceColor(
                    recipientProfile.presence
                  )}`}
                />
              </div>
            </div>
          </div>

          {/* Identity Info */}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-semibold text-[#F5F3FA]">
                {recipientProfile.displayName}
              </h3>
              {hasApex && (
                <Crown className="w-3.5 h-3.5 text-[#A47BFF] shrink-0" />
              )}
            </div>
            <span className="text-xs font-mono text-[#706C7B] block mt-0.5">
              @{recipientProfile.username}
            </span>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-[#17171F] border border-[#282631] text-[10px] font-mono uppercase text-[#A47BFF]">
                {formatRoleLabel(recipientProfile.role, recipientProfile.uid)}
              </span>
              {hasApex && (
                <span className="px-2 py-0.5 rounded bg-[#8957F5]/10 border border-[#8957F5]/30 text-[10px] font-mono uppercase text-[#C4B1FF]">
                  {isOwner || recipientProfile.nitroTier === 'nitro'
                    ? 'APEX+'
                    : 'APEX'}
                </span>
              )}
            </div>
          </div>

          {/* Status & Bio */}
          <div className="p-3 rounded-lg bg-[#101014] border border-[#282631] space-y-2.5">
            {recipientProfile.statusMessage && (
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#706C7B] mb-0.5">
                  Status
                </div>
                <p className="text-xs text-[#F5F3FA]">
                  {recipientProfile.statusMessage}
                </p>
              </div>
            )}

            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#706C7B] mb-0.5">
                About
              </div>
              <p className="text-xs text-[#A19DAD] leading-relaxed">
                {recipientProfile.bio || 'No biography written yet.'}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="p-3 rounded-lg bg-[#101014] border border-[#282631] space-y-2 text-xs text-[#A19DAD]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#706C7B]">
                <Calendar className="w-3.5 h-3.5 text-[#8957F5]" />
                <span>Member Since</span>
              </span>
              <span className="font-mono text-[#F5F3FA] tabular-nums">
                {new Date(
                  recipientProfile.createdAt || Date.now()
                ).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#706C7B]">
                <Shield className="w-3.5 h-3.5 text-[#A47BFF]" />
                <span>Role</span>
              </span>
              <span className="font-mono text-[#F5F3FA] text-[11px]">
                {formatRoleLabel(recipientProfile.role, recipientProfile.uid)}
              </span>
            </div>
          </div>

          {onViewProfile && (
            <button
              onClick={() => onViewProfile(recipientProfile.uid)}
              className="w-full h-8 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#F5F3FA] flex items-center justify-center gap-2 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#8957F5]" />
              <span>View Full Profile</span>
            </button>
          )}
        </div>
      </aside>
    );
  }

  // Community Context: Server Perks + Member Roster grouped by Online / Offline
  if (activeView.type === 'community' && activeCommunity) {
    const onlineMembers = members.filter((m) => m.presence !== 'invisible');
    const offlineMembers = members.filter((m) => m.presence === 'invisible');
    const boostState = calculateServerBoostState(
      activeCommunity.boostCount || 0
    );

    return (
      <aside className="w-60 h-full bg-[#0D0D12] border-l border-[#282631] flex flex-col shrink-0 overflow-y-auto text-[#F5F3FA]">
        <div className="h-14 px-3.5 border-b border-[#282631] flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#706C7B]">
            Server Roster
          </span>
          <span className="text-xs font-mono text-[#8957F5] tabular-nums">
            {members.length}
          </span>
        </div>

        <div className="p-2.5 space-y-4">
          {/* Server Boost Perks Card */}
          <div className="p-3 rounded-lg bg-[#101014] border border-[#282631] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A47BFF] flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#8957F5]" />
                <span>Boost Level {boostState.level}</span>
              </span>
              <span className="text-[10px] font-mono text-[#706C7B] tabular-nums">
                {boostState.boostCount} Boosts
              </span>
            </div>

            <div className="space-y-1">
              {boostState.perks.map((perk) => (
                <div
                  key={perk}
                  className="flex items-center gap-1.5 text-[11px] text-[#A19DAD]"
                >
                  <Check className="w-3 h-3 text-[#8957F5] shrink-0" />
                  <span className="truncate">{perk}</span>
                </div>
              ))}
            </div>

            {onBoostCommunity && (
              <button
                type="button"
                onClick={() => onBoostCommunity(activeCommunity.id)}
                className="w-full py-1.5 rounded-md bg-[#8957F5] hover:bg-[#7846E4] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Boost This Server</span>
              </button>
            )}
          </div>

          {/* Online Members */}
          <div>
            <div className="px-2 mb-1 text-[10px] font-mono uppercase tracking-wider text-[#706C7B] tabular-nums">
              Online — {onlineMembers.length}
            </div>
            <div className="space-y-0.5">
              {onlineMembers.map((member) => {
                const isMemberOwner = isRootOwner(member.uid);
                return (
                  <button
                    key={member.uid}
                    onClick={() => onSelectMember(member)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#17171F] text-left transition-colors group"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={
                          member.photoURL ||
                          generateInitialsAvatar(member.displayName)
                        }
                        alt={member.displayName}
                        className="w-7 h-7 rounded-md object-cover bg-[#17171F]"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0D0D12] ${getPresenceColor(
                          member.presence
                        )}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-[#F5F3FA] group-hover:text-[#8957F5] truncate">
                          {member.displayName}
                        </span>
                        {(isMemberOwner || member.nitroTier !== 'free') && (
                          <Crown className="w-3 h-3 text-[#A47BFF] shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#706C7B] truncate block">
                        {member.statusMessage || `@${member.username}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Offline Members */}
          {offlineMembers.length > 0 && (
            <div>
              <div className="px-2 mb-1 text-[10px] font-mono uppercase tracking-wider text-[#706C7B] tabular-nums">
                Offline — {offlineMembers.length}
              </div>
              <div className="space-y-0.5 opacity-60">
                {offlineMembers.map((member) => (
                  <button
                    key={member.uid}
                    onClick={() => onSelectMember(member)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#17171F] text-left transition-colors"
                  >
                    <img
                      src={
                        member.photoURL ||
                        generateInitialsAvatar(member.displayName)
                      }
                      alt={member.displayName}
                      className="w-7 h-7 rounded-md object-cover bg-[#17171F] grayscale"
                    />
                    <span className="text-xs text-[#706C7B] truncate">
                      {member.displayName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    );
  }

  // Orbs Detail Context
  if (activeView.type === 'orbs' && activeOrb) {
    return (
      <aside className="w-72 h-full bg-[#0D0D12] border-l border-[#282631] p-4 flex flex-col shrink-0 overflow-y-auto space-y-4 text-[#F5F3FA]">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#8957F5]">
          <Sparkles className="w-4 h-4 text-[#A47BFF]" />
          <span>Orb Specifications</span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#101014] border border-[#282631]">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: activeOrb.primaryColor }}
            />
            <h4 className="text-xs font-semibold text-[#F5F3FA]">
              {activeOrb.name}
            </h4>
          </div>
          <p className="text-xs text-[#A19DAD] leading-relaxed">
            {activeOrb.description}
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-[#282631]">
            <span className="text-[#706C7B]">Category</span>
            <span className="text-[#F5F3FA] font-medium">
              {activeOrb.category}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#282631]">
            <span className="text-[#706C7B]">Visibility</span>
            <span className="text-[#F5F3FA] font-medium capitalize">
              {activeOrb.visibility}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#282631]">
            <span className="text-[#706C7B]">Creator</span>
            <span className="text-[#F5F3FA] font-medium">
              {activeOrb.creatorName}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#282631]">
            <span className="text-[#706C7B]">Members</span>
            <span className="text-[#8957F5] font-mono tabular-nums">
              {activeOrb.memberCount || 1}
            </span>
          </div>
        </div>

        {activeOrb.tags?.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#706C7B] mb-1.5">
              Tags
            </div>
            <div className="flex flex-wrap gap-1">
              {activeOrb.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded bg-[#17171F] border border-[#282631] text-[11px] font-mono text-[#A19DAD]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>
    );
  }

  return null;
};
