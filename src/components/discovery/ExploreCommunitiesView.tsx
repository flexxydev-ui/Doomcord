import React, { useState } from 'react';
import {
  Compass,
  Users,
  Search,
  Check,
  Plus,
  Sparkles,
  Zap,
  Hash,
  Volume2,
  Radio,
  Megaphone,
} from 'lucide-react';
import { Community } from '../../types';
import {
  COMMUNITY_TEMPLATES,
  CommunityStarterTemplate,
  calculateServerBoostState,
} from '../../lib/chatEnhancements';

interface ExploreCommunitiesViewProps {
  communities: Community[];
  joinedCommunityIds: string[];
  onJoinCommunity: (comm: Community) => void;
  onCreateCommunity: () => void;
  onLaunchTemplate?: (template: CommunityStarterTemplate) => void;
}

export const ExploreCommunitiesView: React.FC<ExploreCommunitiesViewProps> = ({
  communities,
  joinedCommunityIds,
  onJoinCommunity,
  onCreateCommunity,
  onLaunchTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCommunities = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090D] text-[#F5F3FA] overflow-y-auto p-8">
      {/* Hero Banner */}
      <div className="relative p-7 rounded-2xl bg-[#101014] border border-[#282631] shadow-xl mb-8 overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 text-[#8957F5] text-xs font-mono uppercase tracking-wider mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Community Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F3FA] tracking-tight mb-2">
            Find your tribe on Doomcord
          </h1>
          <p className="text-xs text-[#A19DAD] leading-relaxed mb-5">
            Explore active public gaming guilds, developer teams, audio engineers, and study collectives—or deploy a full multi-channel server in one click.
          </p>

          {/* Search Bar */}
          <div className="flex items-center bg-[#17171F] rounded-lg px-3.5 py-2 border border-[#282631] shadow-sm">
            <Search className="w-4 h-4 text-[#706C7B] mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search communities by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-[#F5F3FA] placeholder-[#706C7B] outline-none flex-1"
            />
          </div>
        </div>
      </div>

      {/* 1-Click Multi-Channel Server Templates */}
      {onLaunchTemplate && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8957F5]" />
              <h2 className="text-xs font-semibold text-[#F5F3FA] uppercase tracking-wider">
                1-Click Server Blueprints
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#706C7B]">
              Instant multi-channel provisioning
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COMMUNITY_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="flex flex-col justify-between p-4 rounded-xl bg-[#101014] border border-[#282631] hover:border-[#8957F5]/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase text-[#A47BFF]">
                      {tpl.category}
                    </span>
                    <span className="text-[10px] font-mono text-[#706C7B] tabular-nums">
                      {tpl.channels.length} channels
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#F5F3FA] mb-1">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-[#A19DAD] leading-relaxed mb-3">
                    {tpl.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tpl.channels.map((ch) => (
                      <span
                        key={ch.name}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#17171F] border border-[#282631] text-[10px] font-mono text-[#A19DAD]"
                      >
                        {ch.type === 'announcement' ? (
                          <Megaphone className="w-2.5 h-2.5 text-[#A47BFF]" />
                        ) : ch.type === 'voice' ? (
                          <Volume2 className="w-2.5 h-2.5 text-[#8957F5]" />
                        ) : ch.type === 'stage' ? (
                          <Radio className="w-2.5 h-2.5 text-[#C4B1FF]" />
                        ) : (
                          <Hash className="w-2.5 h-2.5 text-[#706C7B]" />
                        )}
                        {ch.name}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onLaunchTemplate(tpl)}
                  className="w-full py-2 rounded-lg bg-[#17171F] hover:bg-[#8957F5] text-xs font-semibold text-[#F5F3FA] hover:text-white border border-[#282631] hover:border-[#8957F5] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Deploy {tpl.name}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Communities Grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-[#A19DAD] uppercase tracking-wider">
          Public Communities ({filteredCommunities.length})
        </h2>
        <button
          onClick={onCreateCommunity}
          className="flex items-center gap-1.5 text-xs text-[#8957F5] hover:text-[#A47BFF] font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Custom Server</span>
        </button>
      </div>

      {filteredCommunities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 rounded-2xl bg-[#101014] border border-[#282631] text-center">
          <div className="w-12 h-12 rounded-xl bg-[#17171F] border border-[#282631] flex items-center justify-center text-[#8957F5] mb-3">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#F5F3FA] mb-1">
            No Public Communities Yet
          </h3>
          <p className="text-xs text-[#A19DAD] max-w-sm mb-4">
            Deploy one of the 1-Click Server Blueprints above or create your own custom community server.
          </p>
          <button
            onClick={onCreateCommunity}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8957F5] hover:bg-[#7846E4] text-xs font-semibold text-white shadow-sm shadow-[#8957F5]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Community</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCommunities.map((comm) => {
            const isJoined = joinedCommunityIds.includes(comm.id);
            const boostState = calculateServerBoostState(comm.boostCount || 0);

            return (
              <div
                key={comm.id}
                className="flex flex-col justify-between p-5 rounded-xl bg-[#101014] border border-[#282631] hover:border-[#8957F5]/40 transition-colors shadow-sm group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {comm.iconUrl ? (
                        <img
                          src={comm.iconUrl}
                          alt={comm.name}
                          className="w-12 h-12 rounded-xl object-cover bg-black/20 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#17171F] border border-[#282631] flex items-center justify-center text-sm font-bold text-[#8957F5] shrink-0">
                          {comm.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#F5F3FA] group-hover:text-[#A47BFF] transition-colors truncate">
                          {comm.name}
                        </h3>
                        <span className="text-[11px] text-[#706C7B] font-mono flex items-center gap-1 tabular-nums">
                          <Users className="w-3 h-3 text-[#8957F5]" />
                          {comm.memberCount || 1} member
                          {(comm.memberCount || 1) === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    {boostState.boostCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-[#8957F5]/15 border border-[#8957F5]/40 text-[10px] font-mono text-[#C4B1FF] flex items-center gap-1 shrink-0 tabular-nums">
                        <Zap className="w-3 h-3 text-[#A47BFF]" />
                        LVL {boostState.level}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#A19DAD] leading-relaxed line-clamp-3 mb-4">
                    {comm.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#282631] flex items-center justify-between">
                  <span className="text-[10px] text-[#706C7B] font-mono tabular-nums">
                    {comm.channels?.length || 0} channels · {boostState.audioBitrateKbps}kbps
                  </span>

                  <button
                    onClick={() => onJoinCommunity(comm)}
                    disabled={isJoined}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      isJoined
                        ? 'bg-[#17171F] text-[#8957F5] cursor-default'
                        : 'bg-[#8957F5] hover:bg-[#7846E4] text-white shadow-sm'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Joined</span>
                      </>
                    ) : (
                      <span>Join Server</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
