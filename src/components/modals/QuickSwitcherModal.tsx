import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Hash,
  Volume2,
  Radio,
  Megaphone,
  MessageSquare,
  Compass,
  Crown,
  ShoppingBag,
  Plus,
  Users,
  CornerDownLeft,
  X,
  Command,
} from 'lucide-react';
import {
  Community,
  DirectMessageThread,
  OrbData,
  UserProfile,
  ActiveView,
} from '../../types';
import { generateInitialsAvatar } from '../../lib/dataService';

interface QuickSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  communities: Community[];
  directMessages: DirectMessageThread[];
  orbs: OrbData[];
  allUsers: UserProfile[];
  currentUser: UserProfile;
  onSelectChannel: (communityId: string, channelId: string) => void;
  onSelectDm: (dmId: string) => void;
  onStartDmWithUser: (user: UserProfile) => void;
  onSelectView: (view: ActiveView) => void;
  onOpenCreateCommunity: () => void;
  onOpenCreateOrb: () => void;
}

interface SwitcherItem {
  id: string;
  category: 'Channels' | 'Communities' | 'Direct Messages' | 'Spatial Orbs' | 'Quick Actions';
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export const QuickSwitcherModal: React.FC<QuickSwitcherModalProps> = ({
  isOpen,
  onClose,
  communities,
  directMessages,
  orbs,
  allUsers,
  currentUser,
  onSelectChannel,
  onSelectDm,
  onStartDmWithUser,
  onSelectView,
  onOpenCreateCommunity,
  onOpenCreateOrb,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const allItems: SwitcherItem[] = useMemo(() => {
    const items: SwitcherItem[] = [];

    // 1. All Channels across Communities
    communities.forEach((comm) => {
      (comm.channels || []).forEach((ch) => {
        const iconNode =
          ch.type === 'voice' ? (
            <Volume2 className="w-3.5 h-3.5 text-[#8957F5]" />
          ) : ch.type === 'stage' ? (
            <Radio className="w-3.5 h-3.5 text-[#C4B1FF]" />
          ) : ch.type === 'announcement' ? (
            <Megaphone className="w-3.5 h-3.5 text-[#A47BFF]" />
          ) : (
            <Hash className="w-3.5 h-3.5 text-[#706C7B]" />
          );
        items.push({
          id: `ch_${comm.id}_${ch.id}`,
          category: 'Channels',
          title: `${ch.name}`,
          subtitle: comm.name,
          badge: ch.type.toUpperCase(),
          icon: iconNode,
          onSelect: () => {
            onSelectChannel(comm.id, ch.id);
            onClose();
          },
        });
      });
    });

    // 2. Direct Messages & Users
    directMessages.forEach((dm) => {
      const r = dm.recipientProfile;
      if (!r) return;
      items.push({
        id: `dm_${dm.id}`,
        category: 'Direct Messages',
        title: r.displayName,
        subtitle: `@${r.username}`,
        badge: r.presence.toUpperCase(),
        icon: (
          <img
            src={r.photoURL || generateInitialsAvatar(r.displayName)}
            alt={r.displayName}
            className="w-4 h-4 rounded object-cover"
          />
        ),
        onSelect: () => {
          onSelectDm(dm.id);
          onClose();
        },
      });
    });

    allUsers
      .filter(
        (u) =>
          u.uid !== currentUser.uid &&
          !directMessages.some((d) => d.recipientProfile?.uid === u.uid)
      )
      .forEach((u) => {
        items.push({
          id: `user_${u.uid}`,
          category: 'Direct Messages',
          title: u.displayName,
          subtitle: `@${u.username} · Start Direct Message`,
          icon: <MessageSquare className="w-3.5 h-3.5 text-[#A47BFF]" />,
          onSelect: () => {
            onStartDmWithUser(u);
            onClose();
          },
        });
      });

    // 3. Communities
    communities.forEach((comm) => {
      const firstCh = comm.channels?.[0];
      items.push({
        id: `comm_${comm.id}`,
        category: 'Communities',
        title: comm.name,
        subtitle: `${comm.memberCount || 1} members · ${comm.channels?.length || 0} channels`,
        badge: comm.boostCount ? `${comm.boostCount} BOOSTS` : undefined,
        icon: <Users className="w-3.5 h-3.5 text-[#8957F5]" />,
        onSelect: () => {
          if (firstCh) {
            onSelectChannel(comm.id, firstCh.id);
          } else {
            onSelectView({ type: 'explore_communities' });
          }
          onClose();
        },
      });
    });

    // 4. Spatial Orbs
    orbs.forEach((orb) => {
      items.push({
        id: `orb_${orb.id}`,
        category: 'Spatial Orbs',
        title: orb.name,
        subtitle: `${orb.category} · ${orb.memberCount || 1} active`,
        badge: '3D ORB',
        icon: <Compass className="w-3.5 h-3.5 text-[#C4B1FF]" />,
        onSelect: () => {
          onSelectView({ type: 'orbs', orbId: orb.id, viewMode: 'detail' });
          onClose();
        },
      });
    });

    // 5. Platform Quick Actions
    items.push(
      {
        id: 'act_create_comm',
        category: 'Quick Actions',
        title: 'Create New Community Server',
        subtitle: 'Launch a custom server or use a 1-click template',
        icon: <Plus className="w-3.5 h-3.5 text-[#8957F5]" />,
        onSelect: () => {
          onClose();
          onOpenCreateCommunity();
        },
      },
      {
        id: 'act_explore_comm',
        category: 'Quick Actions',
        title: 'Explore Public Communities',
        subtitle: 'Browse guilds, engineering hubs, and starter templates',
        icon: <Compass className="w-3.5 h-3.5 text-[#A47BFF]" />,
        onSelect: () => {
          onSelectView({ type: 'explore_communities' });
          onClose();
        },
      },
      {
        id: 'act_create_orb',
        category: 'Quick Actions',
        title: 'Create Spatial 3D Orb',
        subtitle: 'Deploy an interactive WebGL constellation sphere',
        icon: <Compass className="w-3.5 h-3.5 text-[#C4B1FF]" />,
        onSelect: () => {
          onClose();
          onOpenCreateOrb();
        },
      },
      {
        id: 'act_apex',
        category: 'Quick Actions',
        title: 'DOOMCORD APEX & Gifting',
        subtitle: 'Manage membership or send an APEX gift link',
        icon: <Crown className="w-3.5 h-3.5 text-[#8957F5]" />,
        onSelect: () => {
          onSelectView({ type: 'nitro' });
          onClose();
        },
      },
      {
        id: 'act_shop',
        category: 'Quick Actions',
        title: 'APEX Cosmetics Collection',
        subtitle: 'Browse avatar decorations, nameplates, and themes',
        icon: <ShoppingBag className="w-3.5 h-3.5 text-[#C4B1FF]" />,
        onSelect: () => {
          onSelectView({ type: 'shop' });
          onClose();
        },
      }
    );

    return items;
  }, [
    communities,
    directMessages,
    orbs,
    allUsers,
    currentUser.uid,
    onSelectChannel,
    onSelectDm,
    onStartDmWithUser,
    onSelectView,
    onOpenCreateCommunity,
    onOpenCreateOrb,
    onClose,
  ]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.slice(0, 14);

    // Support prefix filters: # for channels, @ for DMs, * for Orbs
    if (q.startsWith('#')) {
      const sub = q.slice(1).trim();
      return allItems.filter(
        (i) =>
          i.category === 'Channels' &&
          (i.title.toLowerCase().includes(sub) ||
            i.subtitle.toLowerCase().includes(sub))
      );
    }
    if (q.startsWith('@')) {
      const sub = q.slice(1).trim();
      return allItems.filter(
        (i) =>
          i.category === 'Direct Messages' &&
          (i.title.toLowerCase().includes(sub) ||
            i.subtitle.toLowerCase().includes(sub))
      );
    }

    return allItems.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.subtitle.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0
            ? (prev - 1 + filteredItems.length) % filteredItems.length
            : 0
        );
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        e.preventDefault();
        filteredItems[selectedIndex].onSelect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl bg-[#101014] border border-[#282631] shadow-2xl overflow-hidden text-[#F5F3FA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 bg-[#17171F] border-b border-[#282631]">
          <Search className="w-4 h-4 text-[#8957F5] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Where would you like to go? Try #channel, @username, or server name..."
            className="flex-1 bg-transparent text-xs text-[#F5F3FA] placeholder-[#706C7B] outline-none"
            autoFocus
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-1.5 py-0.5 rounded bg-[#101014] border border-[#282631] text-[10px] font-mono text-[#706C7B]">
              ESC
            </span>
            <button
              onClick={onClose}
              className="text-[#706C7B] hover:text-[#F5F3FA] p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Prefix Hints */}
        <div className="px-4 py-1.5 bg-[#0D0D12] border-b border-[#282631] flex items-center justify-between text-[10px] font-mono text-[#706C7B]">
          <div className="flex items-center gap-3">
            <span>
              <strong className="text-[#A47BFF]">#</strong> channels
            </span>
            <span>
              <strong className="text-[#A47BFF]">@</strong> direct messages
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3 text-[#8957F5]" />
            <span>Quick Switcher</span>
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#706C7B]">
              No matching channels, conversations, or servers found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-[#22212C] text-[#F5F3FA]'
                      : 'text-[#A19DAD] hover:bg-[#17171F]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-[#17171F] border border-[#282631] flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#F5F3FA] truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-[#706C7B] truncate">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded bg-[#17171F] border border-[#282631] text-[9px] font-mono text-[#A47BFF] tabular-nums">
                        {item.badge}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-[#706C7B]">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3 h-3 text-[#8957F5]" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
