import React from 'react';
import {
  Shield,
  Crown,
  Sparkles,
  Calendar,
  User,
  ArrowUpRight,
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

interface ContextualPanelProps {
  activeView: ActiveView;
  activeCommunity?: Community | null;
  recipientProfile?: UserProfile | null;
  activeOrb?: OrbData | null;
  members: UserProfile[];
  onSelectMember: (user: UserProfile) => void;
  onViewProfile?: (userId: string) => void;
}

export const ContextualPanel: React.FC<ContextualPanelProps> = ({
  activeView,
  activeCommunity,
  recipientProfile,
  activeOrb,
  members,
  onSelectMember,
  onViewProfile,
}) => {
  const getPresenceColor = (presence: UserPresence) => {
    switch (presence) {
      case 'online':
        return 'bg-[#6DD5A5]';
      case 'idle':
        return 'bg-[#E4B869]';
      case 'dnd':
        return 'bg-[#E57373]';
      case 'invisible':
      default:
        return 'bg-[#718478]';
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
      <aside className="w-72 h-full bg-[#141F1B] border-l border-white/[0.06] flex flex-col shrink-0 overflow-y-auto">
        <div className="h-16 px-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <span className="text-xs font-mono uppercase tracking-wider text-[#9BAEA2]">
            Conversation Details
          </span>
          {onViewProfile && (
            <button
              onClick={() => onViewProfile(recipientProfile.uid)}
              className="text-xs font-medium text-[#8BE2B8] hover:underline flex items-center gap-1"
            >
              <span>Full Profile</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Banner + Avatar */}
          <div className="relative mb-10">
            <div
              className="w-full h-24 rounded-xl overflow-hidden border border-white/[0.07]"
              style={{
                background: recipientProfile.bannerURL
                  ? `url(${recipientProfile.bannerURL}) center/cover no-repeat`
                  : 'linear-gradient(135deg, #192620 0%, #24362C 100%)',
              }}
            />
            <div className="absolute -bottom-8 left-4">
              <div className="relative">
                <img
                  src={
                    recipientProfile.photoURL ||
                    generateInitialsAvatar(recipientProfile.displayName)
                  }
                  alt={recipientProfile.displayName}
                  className="w-16 h-16 rounded-xl object-cover border-4 border-[#141F1B] bg-[#1D2B24]"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#141F1B] ${getPresenceColor(
                    recipientProfile.presence
                  )}`}
                />
              </div>
            </div>
          </div>

          {/* Identity Info */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-display font-bold text-[#F0F5F1]">
                {recipientProfile.displayName}
              </h3>
              {hasApex && (
                <Crown className="w-3.5 h-3.5 text-[#D9BB79] shrink-0" />
              )}
            </div>
            <span className="text-xs font-mono text-[#718478] block mt-0.5">
              @{recipientProfile.username}
            </span>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-[#192620] border border-white/[0.07] text-[10px] font-mono uppercase text-[#8BE2B8]">
                {formatRoleLabel(recipientProfile.role, recipientProfile.uid)}
              </span>
              {hasApex && (
                <span className="px-2 py-0.5 rounded bg-[#192620] border border-[#D9BB79]/30 text-[10px] font-mono uppercase text-[#D9BB79]">
                  {isOwner || recipientProfile.nitroTier === 'nitro'
                    ? 'DOOMCORD APEX+'
                    : 'DOOMCORD APEX'}
                </span>
              )}
            </div>
          </div>

          {/* Status & Bio */}
          <div className="p-3.5 rounded-xl bg-[#192620] border border-white/[0.06] space-y-3">
            {recipientProfile.statusMessage && (
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#718478] mb-1">
                  Status
                </div>
                <p className="text-xs text-[#F0F5F1]">
                  {recipientProfile.statusMessage}
                </p>
              </div>
            )}

            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#718478] mb-1">
                About
              </div>
              <p className="text-xs text-[#9BAEA2] leading-relaxed">
                {recipientProfile.bio || 'No biography written yet.'}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="p-3.5 rounded-xl bg-[#192620] border border-white/[0.06] space-y-2 text-xs text-[#9BAEA2]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#718478]">
                <Calendar className="w-3.5 h-3.5 text-[#8BE2B8]" />
                <span>Joined</span>
              </span>
              <span className="font-mono text-[#F0F5F1] tabular-nums">
                {new Date(
                  recipientProfile.createdAt || Date.now()
                ).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#718478]">
                <Shield className="w-3.5 h-3.5 text-[#E9987B]" />
                <span>Clearance</span>
              </span>
              <span className="font-mono text-[#F0F5F1] text-[11px]">
                {formatRoleLabel(recipientProfile.role, recipientProfile.uid)}
              </span>
            </div>
          </div>

          {onViewProfile && (
            <button
              onClick={() => onViewProfile(recipientProfile.uid)}
              className="w-full h-9 rounded-lg bg-[#1D2B24] hover:bg-[#24362C] border border-white/[0.08] text-xs font-medium text-[#F0F5F1] flex items-center justify-center gap-2 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#8BE2B8]" />
              <span>Open Full Profile</span>
            </button>
          )}
        </div>
      </aside>
    );
  }

  // Community Context: Member Roster grouped by Online / Offline
  if (activeView.type === 'community' && activeCommunity) {
    const onlineMembers = members.filter((m) => m.presence !== 'invisible');
    const offlineMembers = members.filter((m) => m.presence === 'invisible');

    return (
      <aside className="w-64 h-full bg-[#141F1B] border-l border-white/[0.06] flex flex-col shrink-0 overflow-y-auto">
        <div className="h-16 px-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <span className="text-xs font-mono uppercase tracking-wider text-[#9BAEA2]">
            Community Roster
          </span>
          <span className="text-xs font-mono text-[#8BE2B8] tabular-nums">
            {members.length}
          </span>
        </div>

        <div className="p-3 space-y-5">
          {/* Online Members */}
          <div>
            <div className="px-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-[#718478] tabular-nums">
              Online — {onlineMembers.length}
            </div>
            <div className="space-y-1">
              {onlineMembers.map((member) => {
                const isMemberOwner = isRootOwner(member.uid);
                return (
                  <button
                    key={member.uid}
                    onClick={() => onSelectMember(member)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#192620] text-left transition-colors group"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={
                          member.photoURL ||
                          generateInitialsAvatar(member.displayName)
                        }
                        alt={member.displayName}
                        className="w-7 h-7 rounded-lg object-cover bg-[#1D2B24]"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#141F1B] ${getPresenceColor(
                          member.presence
                        )}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-[#F0F5F1] group-hover:text-[#8BE2B8] truncate">
                          {member.displayName}
                        </span>
                        {(isMemberOwner || member.nitroTier !== 'free') && (
                          <Crown className="w-3 h-3 text-[#D9BB79] shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#718478] truncate block">
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
              <div className="px-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-[#718478] tabular-nums">
                Offline — {offlineMembers.length}
              </div>
              <div className="space-y-1 opacity-65">
                {offlineMembers.map((member) => (
                  <button
                    key={member.uid}
                    onClick={() => onSelectMember(member)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#192620] text-left transition-colors"
                  >
                    <img
                      src={
                        member.photoURL ||
                        generateInitialsAvatar(member.displayName)
                      }
                      alt={member.displayName}
                      className="w-7 h-7 rounded-lg object-cover bg-[#1D2B24] grayscale"
                    />
                    <span className="text-xs text-[#9BAEA2] truncate">
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
      <aside className="w-72 h-full bg-[#141F1B] border-l border-white/[0.06] p-5 flex flex-col shrink-0 overflow-y-auto space-y-5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#8BE2B8]">
          <Sparkles className="w-4 h-4 text-[#E9987B]" />
          <span>Orb Specifications</span>
        </div>

        <div className="p-4 rounded-xl bg-[#192620] border border-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-2">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: activeOrb.primaryColor }}
            />
            <h4 className="text-sm font-display font-bold text-[#F0F5F1]">
              {activeOrb.name}
            </h4>
          </div>
          <p className="text-xs text-[#9BAEA2] leading-relaxed">
            {activeOrb.description}
          </p>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
            <span className="text-[#718478]">Category</span>
            <span className="text-[#F0F5F1] font-medium">
              {activeOrb.category}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
            <span className="text-[#718478]">Visibility</span>
            <span className="text-[#F0F5F1] font-medium capitalize">
              {activeOrb.visibility}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
            <span className="text-[#718478]">Creator</span>
            <span className="text-[#F0F5F1] font-medium">
              {activeOrb.creatorName}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
            <span className="text-[#718478]">Members</span>
            <span className="text-[#8BE2B8] font-mono tabular-nums">
              {activeOrb.memberCount || 1}
            </span>
          </div>
        </div>

        {activeOrb.tags?.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#718478] mb-2">
              Topics & Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeOrb.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded bg-[#192620] border border-white/[0.07] text-[11px] font-mono text-[#9BAEA2]"
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
