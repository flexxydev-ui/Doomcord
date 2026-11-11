import React from 'react';
import { 
  Shield, Crown, Sparkles, User, Calendar, 
  Hash, Globe, Lock, Users, MessageSquare 
} from 'lucide-react';
import { ActiveView, Community, UserProfile, OrbData, UserPresence } from '../../types';

interface ContextualPanelProps {
  activeView: ActiveView;
  activeCommunity?: Community | null;
  recipientProfile?: UserProfile | null;
  activeOrb?: OrbData | null;
  members: UserProfile[];
  onSelectMember: (user: UserProfile) => void;
}

export const ContextualPanel: React.FC<ContextualPanelProps> = ({
  activeView,
  activeCommunity,
  recipientProfile,
  activeOrb,
  members,
  onSelectMember
}) => {
  const getPresenceColor = (presence: UserPresence) => {
    switch (presence) {
      case 'online': return 'bg-[oklch(0.85_0.12_165)]';
      case 'idle': return 'bg-[oklch(0.84_0.14_85)]';
      case 'dnd': return 'bg-[oklch(0.72_0.15_355)]';
      case 'invisible':
      default: return 'bg-gray-500';
    }
  };

  // If in Direct Message: render full recipient profile card
  if (activeView.type === 'dm' && recipientProfile) {
    return (
      <div className="w-64 h-full bg-[oklch(0.17_0.028_161)] border-l border-white/5 p-4 flex flex-col shrink-0 overflow-y-auto">
        {/* Banner and Avatar */}
        <div className="relative mb-12">
          <div 
            className="w-full h-20 rounded-xl overflow-hidden bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] shadow-md"
          >
            {recipientProfile.bannerURL && (
              <img src={recipientProfile.bannerURL} alt="Banner" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="absolute -bottom-8 left-4">
            <div className="relative">
              <img
                src={recipientProfile.photoURL}
                alt={recipientProfile.displayName}
                className="w-16 h-16 rounded-2xl object-cover border-4 border-[oklch(0.17_0.028_161)] bg-black/30 shadow-lg"
              />
              <div 
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[oklch(0.17_0.028_161)] ${getPresenceColor(recipientProfile.presence)}`}
              />
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-wide">{recipientProfile.displayName}</h3>
            {recipientProfile.role === 'owner' && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-[oklch(0.72_0.16_32)]">
                · OWNER
              </span>
            )}
            {recipientProfile.nitroTier && recipientProfile.nitroTier !== 'free' && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-[oklch(0.85_0.12_165)]">
                · {recipientProfile.nitroTier === 'nitro' ? 'NITRO' : 'BASIC'}
              </span>
            )}
          </div>
          <span className="text-xs text-[oklch(0.7_0.03_155)] font-mono block">@{recipientProfile.username}</span>
          <p className="text-xs text-[oklch(0.95_0.015_150)] mt-2 leading-relaxed">
            {recipientProfile.bio || 'No biography set.'}
          </p>
        </div>

        <div className="h-[1px] bg-white/5 my-3" />

        {/* Status Message */}
        <div className="mb-4">
          <span className="text-[10px] font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider block mb-1">
            Status
          </span>
          <span className="text-xs text-white bg-[oklch(0.235_0.032_158)] px-2.5 py-1.5 rounded-lg block border border-white/5">
            {recipientProfile.statusMessage || 'Online'}
          </span>
        </div>

        {/* Meta Info */}
        <div className="space-y-2 text-xs text-[oklch(0.7_0.03_155)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)]" />
            <span>Member since {new Date(recipientProfile.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[oklch(0.72_0.16_32)]" />
            <span className="capitalize">Role: {recipientProfile.role || 'user'}</span>
          </div>
        </div>
      </div>
    );
  }

  // If in Community: render member roster categorized by online status
  if (activeView.type === 'community' && activeCommunity) {
    const onlineMembers = members.filter(m => m.presence !== 'invisible');
    const offlineMembers = members.filter(m => m.presence === 'invisible');

    return (
      <div className="w-60 h-full bg-[oklch(0.17_0.028_161)] border-l border-white/5 p-3 flex flex-col shrink-0 overflow-y-auto">
        {/* Community Info Snippet */}
        <div className="p-3 mb-3 rounded-xl bg-[oklch(0.235_0.032_158)] border border-white/5">
          <span className="text-xs font-bold text-white block mb-0.5">{activeCommunity.name}</span>
          <p className="text-[11px] text-[oklch(0.7_0.03_155)] line-clamp-2">
            {activeCommunity.description}
          </p>
        </div>

        {/* Online Members */}
        <div className="mb-4">
          <div className="px-2 mb-2 text-[10px] font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider">
            Online — {onlineMembers.length}
          </div>
          <div className="space-y-1">
            {onlineMembers.map((member) => (
              <button
                key={member.uid}
                onClick={() => onSelectMember(member)}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/5 text-left transition-colors group"
              >
                <div className="relative shrink-0">
                  <img
                    src={member.photoURL}
                    alt={member.displayName}
                    className="w-7 h-7 rounded-lg object-cover bg-black/20"
                  />
                  <div 
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[oklch(0.17_0.028_161)] ${getPresenceColor(member.presence)}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-white group-hover:text-[oklch(0.85_0.12_165)] truncate block">
                    {member.displayName}
                  </span>
                  <span className="text-[10px] text-[oklch(0.7_0.03_155)] truncate block">
                    {member.statusMessage || `@${member.username}`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Offline Members */}
        {offlineMembers.length > 0 && (
          <div>
            <div className="px-2 mb-2 text-[10px] font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider">
              Offline — {offlineMembers.length}
            </div>
            <div className="space-y-1 opacity-60">
              {offlineMembers.map((member) => (
                <button
                  key={member.uid}
                  onClick={() => onSelectMember(member)}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/5 text-left transition-colors"
                >
                  <img
                    src={member.photoURL}
                    alt={member.displayName}
                    className="w-7 h-7 rounded-lg object-cover bg-black/20 grayscale"
                  />
                  <span className="text-xs text-[oklch(0.7_0.03_155)] truncate">
                    {member.displayName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // If in Orbs detail: render Orb specs panel
  if (activeView.type === 'orbs' && activeOrb) {
    return (
      <div className="w-64 h-full bg-[oklch(0.17_0.028_161)] border-l border-white/5 p-4 flex flex-col shrink-0 overflow-y-auto">
        <div className="flex items-center gap-2 text-xs font-bold text-[oklch(0.85_0.12_165)] uppercase tracking-wider mb-3">
          <Sparkles className="w-4 h-4" />
          <span>Orb Specifications</span>
        </div>

        <div className="p-4 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-white/5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: activeOrb.primaryColor }}
            />
            <h4 className="text-sm font-bold text-white">{activeOrb.name}</h4>
          </div>
          <p className="text-xs text-[oklch(0.7_0.03_155)] leading-relaxed">
            {activeOrb.description}
          </p>
        </div>

        <div className="space-y-2 text-xs mb-4">
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-[oklch(0.7_0.03_155)]">Category</span>
            <span className="text-white font-medium">{activeOrb.category}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-[oklch(0.7_0.03_155)]">Visibility</span>
            <span className="text-white font-medium capitalize">{activeOrb.visibility}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-[oklch(0.7_0.03_155)]">Creator</span>
            <span className="text-white font-medium">{activeOrb.creatorName}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-4">
          <span className="text-[10px] font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider block mb-2">
            Interests & Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {activeOrb.tags.map((tag) => (
              <span 
                key={tag}
                className="px-2 py-0.5 rounded-lg text-[10px] bg-[oklch(0.235_0.032_158)] text-white border border-white/5 font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
