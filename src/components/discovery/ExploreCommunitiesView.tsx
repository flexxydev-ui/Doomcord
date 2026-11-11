import React, { useState } from 'react';
import { Compass, Users, Sparkles, Search, Check, Plus } from 'lucide-react';
import { Community } from '../../types';

interface ExploreCommunitiesViewProps {
  communities: Community[];
  joinedCommunityIds: string[];
  onJoinCommunity: (comm: Community) => void;
  onCreateCommunity: () => void;
}

export const ExploreCommunitiesView: React.FC<ExploreCommunitiesViewProps> = ({
  communities,
  joinedCommunityIds,
  onJoinCommunity,
  onCreateCommunity
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[oklch(0.2_0.03_160)] overflow-y-auto p-8">
      {/* Hero Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-r from-[oklch(0.14_0.025_162)] to-[oklch(0.17_0.028_161)] border border-white/5 shadow-2xl mb-8 overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 text-[oklch(0.85_0.12_165)] text-xs font-mono uppercase tracking-wider mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Community Directory</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Find your tribe on Doomcord
          </h1>
          <p className="text-xs text-[oklch(0.7_0.03_155)] leading-relaxed mb-6">
            Explore active public gaming guilds, developer teams, audio engineers, and study collectives created by real users.
          </p>

          {/* Search Bar */}
          <div className="flex items-center bg-[oklch(0.235_0.032_158)] rounded-2xl px-4 py-2 border border-white/10 shadow-lg">
            <Search className="w-4 h-4 text-[oklch(0.7_0.03_155)] mr-2" />
            <input
              type="text"
              placeholder="Search communities by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-[oklch(0.7_0.03_155)] outline-none flex-1"
            />
          </div>
        </div>
      </div>

      {/* Featured Communities Grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Public Communities ({filteredCommunities.length})
        </h2>
        <button
          onClick={onCreateCommunity}
          className="flex items-center gap-1.5 text-xs text-[oklch(0.85_0.12_165)] hover:underline font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Server</span>
        </button>
      </div>

      {filteredCommunities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-white/10 flex items-center justify-center text-[oklch(0.85_0.12_165)] mb-3">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Communities Created Yet</h3>
          <p className="text-xs text-[oklch(0.7_0.03_155)] max-w-sm mb-4">
            There are no public communities matching your search yet. Create the first server to start building your community.
          </p>
          <button
            onClick={onCreateCommunity}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-xs font-semibold text-white shadow-md hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Community</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCommunities.map((comm) => {
            const isJoined = joinedCommunityIds.includes(comm.id);

            return (
              <div
                key={comm.id}
                className="flex flex-col justify-between p-5 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/5 hover:border-white/10 transition-all shadow-xl group"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-3">
                    {comm.iconUrl ? (
                      <img
                        src={comm.iconUrl}
                        alt={comm.name}
                        className="w-12 h-12 rounded-2xl object-cover bg-black/20 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-white/10 flex items-center justify-center text-base font-bold text-[oklch(0.85_0.12_165)]">
                        {comm.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-[oklch(0.85_0.12_165)] transition-colors">
                        {comm.name}
                      </h3>
                      <span className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono flex items-center gap-1 tabular-nums">
                        <Users className="w-3 h-3 text-[oklch(0.85_0.12_165)]" />
                        {comm.memberCount || 1} member{(comm.memberCount || 1) === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[oklch(0.7_0.03_155)] leading-relaxed line-clamp-3 mb-4">
                    {comm.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-[oklch(0.7_0.03_155)] font-mono tabular-nums">
                    {comm.channels?.length || 0} channels
                  </span>

                  <button
                    onClick={() => onJoinCommunity(comm)}
                    disabled={isJoined}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      isJoined
                        ? 'bg-white/5 text-[oklch(0.85_0.12_165)] cursor-default'
                        : 'bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-white hover:opacity-95 shadow-md'
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
