import React, { useState } from 'react';
import {
  X,
  Settings,
  Hash,
  Shield,
  Users,
  Link2,
  Bot,
  AlertTriangle,
  Plus,
  Trash2,
  Check,
  Copy,
  UserMinus,
  Ban,
  Crown,
  Volume2,
  Radio,
  Megaphone,
  MessageSquare,
  Image,
  Calendar,
  Webhook,
  ShieldAlert,
} from 'lucide-react';
import {
  Community,
  Channel,
  ChannelType,
  UserProfile,
  MemberRole,
  ServerRoleDefinition,
  ServerInviteRecord,
  ServerWebhookRecord,
  ServerBotRecord,
  ServerEventRecord,
} from '../../types';
import { isRootOwner, generateInitialsAvatar } from '../../lib/dataService';
import { DEFAULT_AUTOMOD_CONFIG } from '../../lib/totpService';
import { ImageUploader } from '../common/ImageUploader';

interface ServerSettingsModalProps {
  isOpen: boolean;
  community: Community | null;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onClose: () => void;
  onUpdateCommunity: (communityId: string, updates: Partial<Community>) => Promise<void>;
  onCreateChannel: (communityId: string, channelData: Partial<Channel>) => Promise<void>;
  onUpdateChannel: (communityId: string, channelId: string, updates: Partial<Channel>) => Promise<void>;
  onDeleteChannel: (communityId: string, channelId: string) => Promise<void>;
  onLeaveCommunity: (communityId: string) => Promise<void>;
  onDeleteCommunity: (communityId: string) => Promise<void>;
}

type ServerTab =
  | 'overview'
  | 'channels'
  | 'roles'
  | 'members'
  | 'invites'
  | 'automod'
  | 'bots_webhooks'
  | 'events_danger';

const GRANULAR_PERMISSIONS = [
  'Administrator',
  'Manage Server',
  'Manage Channels',
  'Manage Roles',
  'Manage Members',
  'Kick Members',
  'Ban Members',
  'Timeout Members',
  'Manage Messages',
  'Manage Webhooks',
  'Manage Events',
  'View Audit Logs',
  'Send Messages',
  'Attach Files',
  'Embed Links',
  'Add Reactions',
  'Connect to Voice',
  'Speak',
  'Video',
  'Screen Share',
  'Mention Everyone',
];

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  isOpen,
  community,
  currentUser,
  allUsers,
  onClose,
  onUpdateCommunity,
  onCreateChannel,
  onUpdateChannel,
  onDeleteChannel,
  onLeaveCommunity,
  onDeleteCommunity,
}) => {
  const [activeTab, setActiveTab] = useState<ServerTab>('overview');
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // Overview state
  const [name, setName] = useState(community?.name || '');
  const [description, setDescription] = useState(community?.description || '');
  const [iconUrl, setIconUrl] = useState(community?.iconUrl || '');
  const [bannerUrl, setBannerUrl] = useState(community?.bannerUrl || '');
  const [themeColor, setThemeColor] = useState(community?.themeColor || '#8957F5');
  const [isPublic, setIsPublic] = useState(community?.isPublic ?? true);
  const [verificationLevel, setVerificationLevel] = useState<
    'none' | 'low' | 'medium' | 'high'
  >(community?.verificationLevel || 'low');
  const [welcomeMessage, setWelcomeMessage] = useState(
    community?.welcomeMessage || 'Welcome to our official Doomcord server!'
  );

  // Channels state
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelTopic, setNewChannelTopic] = useState('');
  const [newChannelCategory, setNewChannelCategory] = useState('General');
  const [newChannelType, setNewChannelType] = useState<ChannelType>('text');
  const [newChannelSlowmode, setNewChannelSlowmode] = useState(0);

  // Custom Roles state
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#8957F5');
  const [selectedRolePerms, setSelectedRolePerms] = useState<string[]>([
    'Send Messages',
    'Attach Files',
    'Add Reactions',
    'Connect to Voice',
    'Speak',
  ]);

  // Members search
  const [memberSearch, setMemberSearch] = useState('');

  // Invite creation state
  const [inviteMaxUses, setInviteMaxUses] = useState<number>(0);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);

  // AutoMod state
  const [newKeyword, setNewKeyword] = useState('');

  // Webhooks & Bots state
  const [webhookName, setWebhookName] = useState('');
  const [webhookChannelId, setWebhookChannelId] = useState('');
  const [botName, setBotName] = useState('');
  const [botPrefix, setBotPrefix] = useState('/');
  const [botDesc, setBotDesc] = useState('');

  // Events state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');

  React.useEffect(() => {
    if (community) {
      setName(community.name);
      setDescription(community.description);
      setIconUrl(community.iconUrl || '');
      setBannerUrl(community.bannerUrl || '');
      setThemeColor(community.themeColor || '#8957F5');
      setIsPublic(community.isPublic ?? true);
      setVerificationLevel(community.verificationLevel || 'low');
      setWelcomeMessage(
        community.welcomeMessage || 'Welcome to our official Doomcord server!'
      );
      setWebhookChannelId(community.channels?.[0]?.id || '');
    }
  }, [community]);

  if (!isOpen || !community) return null;

  const isServerOwner =
    community.ownerId === currentUser.uid || isRootOwner(currentUser.uid);
  const myMemberRole: MemberRole = isServerOwner
    ? 'owner'
    : community.memberRoles?.[currentUser.uid] || 'member';
  const canManageServer =
    isServerOwner || myMemberRole === 'admin' || myMemberRole === 'moderator';

  const notifySaved = (msg: string) => {
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(null), 2800);
  };

  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageServer) return;
    await onUpdateCommunity(community.id, {
      name: name.trim() || community.name,
      description: description.trim(),
      iconUrl: iconUrl.trim() || community.iconUrl,
      bannerUrl: bannerUrl.trim(),
      themeColor,
      isPublic,
      verificationLevel,
      welcomeMessage: welcomeMessage.trim(),
    });
    notifySaved('Server overview & configuration saved.');
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageServer || !newChannelName.trim()) return;
    await onCreateChannel(community.id, {
      name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
      topic: newChannelTopic.trim(),
      category: newChannelCategory.trim() || 'General',
      type: newChannelType,
      slowmodeSeconds: newChannelSlowmode,
    });
    setNewChannelName('');
    setNewChannelTopic('');
    notifySaved(`Created #${newChannelName.trim()} channel.`);
  };

  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageServer || !newRoleName.trim()) return;
    const roleDef: ServerRoleDefinition = {
      id: `role_${Date.now()}`,
      name: newRoleName.trim(),
      color: newRoleColor,
      hoisted: true,
      mentionable: true,
      position: (community.customRoles?.length || 0) + 1,
      permissions: selectedRolePerms,
    };
    const nextRoles = [...(community.customRoles || []), roleDef];
    await onUpdateCommunity(community.id, { customRoles: nextRoles });
    setNewRoleName('');
    notifySaved(`Created role "${roleDef.name}".`);
  };

  const handleDeleteCustomRole = async (roleId: string) => {
    if (!canManageServer) return;
    const nextRoles = (community.customRoles || []).filter((r) => r.id !== roleId);
    await onUpdateCommunity(community.id, { customRoles: nextRoles });
    notifySaved('Role deleted.');
  };

  const handleSetMemberRole = async (targetUid: string, role: MemberRole) => {
    if (!canManageServer) return;
    const nextRoles = {
      ...(community.memberRoles || {}),
      [targetUid]: role,
    };
    await onUpdateCommunity(community.id, { memberRoles: nextRoles });
    notifySaved(`Updated member role to ${role.toUpperCase()}.`);
  };

  const handleKickMember = async (targetUid: string) => {
    if (!canManageServer || targetUid === community.ownerId) return;
    const nextMembers = (community.members || []).filter((id) => id !== targetUid);
    await onUpdateCommunity(community.id, {
      members: nextMembers,
      memberCount: Math.max(1, nextMembers.length),
    });
    notifySaved('Member kicked from server.');
  };

  const handleBanMember = async (targetUid: string) => {
    if (!canManageServer || targetUid === community.ownerId) return;
    const nextMembers = (community.members || []).filter((id) => id !== targetUid);
    const nextBanned = Array.from(
      new Set([...(community.bannedMembers || []), targetUid])
    );
    await onUpdateCommunity(community.id, {
      members: nextMembers,
      memberCount: Math.max(1, nextMembers.length),
      bannedMembers: nextBanned,
    });
    notifySaved('Member banned from server.');
  };

  const handleUnbanMember = async (targetUid: string) => {
    if (!canManageServer) return;
    const nextBanned = (community.bannedMembers || []).filter(
      (id) => id !== targetUid
    );
    await onUpdateCommunity(community.id, { bannedMembers: nextBanned });
    notifySaved('Member unbanned.');
  };

  const handleTransferOwnership = async (newOwnerUid: string) => {
    if (!isServerOwner) return;
    await onUpdateCommunity(community.id, {
      ownerId: newOwnerUid,
      memberRoles: {
        ...(community.memberRoles || {}),
        [newOwnerUid]: 'owner',
        [currentUser.uid]: 'admin',
      },
    });
    notifySaved('Server ownership transferred.');
  };

  const handleCreateInvite = async () => {
    const code = `DC-${community.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const newInvite: ServerInviteRecord = {
      code,
      creatorUid: currentUser.uid,
      creatorName: currentUser.displayName,
      uses: 0,
      maxUses: inviteMaxUses > 0 ? inviteMaxUses : null,
      expiresAt: null,
      createdAt: new Date().toISOString(),
    };
    const nextInvites = [newInvite, ...(community.invites || [])];
    await onUpdateCommunity(community.id, { invites: nextInvites });
    notifySaved(`Generated invite code ${code}.`);
  };

  const handleRevokeInvite = async (code: string) => {
    const nextInvites = (community.invites || []).filter((i) => i.code !== code);
    await onUpdateCommunity(community.id, { invites: nextInvites });
    notifySaved(`Revoked invite ${code}.`);
  };

  const autoMod = community.autoModConfig || DEFAULT_AUTOMOD_CONFIG;

  const handleUpdateAutoMod = async (
    updates: Partial<typeof DEFAULT_AUTOMOD_CONFIG>
  ) => {
    if (!canManageServer) return;
    await onUpdateCommunity(community.id, {
      autoModConfig: {
        ...autoMod,
        ...updates,
      },
    });
    notifySaved('AutoMod community safety rules updated.');
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageServer || !webhookName.trim()) return;
    const wh: ServerWebhookRecord = {
      id: `wh_${Date.now()}`,
      name: webhookName.trim(),
      channelId: webhookChannelId || community.channels?.[0]?.id || '',
      secretToken: `whsec_${Math.random().toString(36).slice(2, 12)}`,
      deliveriesCount: 0,
      createdAt: new Date().toISOString(),
    };
    await onUpdateCommunity(community.id, {
      webhooks: [...(community.webhooks || []), wh],
    });
    setWebhookName('');
    notifySaved(`Created webhook "${wh.name}".`);
  };

  const handleInstallBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageServer || !botName.trim()) return;
    const bot: ServerBotRecord = {
      id: `bot_${Date.now()}`,
      name: botName.trim(),
      description: botDesc.trim() || 'Automated Doomcord Server Bot',
      prefix: botPrefix.trim() || '/',
      permissions: ['Send Messages', 'Embed Links', 'Manage Messages'],
      installedAt: new Date().toISOString(),
    };
    await onUpdateCommunity(community.id, {
      installedBots: [...(community.installedBots || []), bot],
    });
    setBotName('');
    setBotDesc('');
    notifySaved(`Installed bot "${bot.name}" to server.`);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageServer || !eventTitle.trim()) return;
    const ev: ServerEventRecord = {
      id: `evt_${Date.now()}`,
      title: eventTitle.trim(),
      description: eventDesc.trim() || 'Community live event',
      scheduledAt: eventDate || new Date(Date.now() + 86400000).toISOString(),
      interestedUids: [currentUser.uid],
      createdAt: new Date().toISOString(),
    };
    await onUpdateCommunity(community.id, {
      events: [...(community.events || []), ev],
    });
    setEventTitle('');
    setEventDesc('');
    notifySaved(`Scheduled event "${ev.title}".`);
  };

  const serverMembers = allUsers.filter((u) =>
    (community.members || []).includes(u.uid)
  );
  const filteredMembers = serverMembers.filter((m) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (
      m.displayName.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  const TABS: {
    id: ServerTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Server Overview', icon: Settings },
    { id: 'channels', label: 'Channels & Categories', icon: Hash },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'members', label: `Members (${serverMembers.length})`, icon: Users },
    { id: 'invites', label: 'Invite Links', icon: Link2 },
    { id: 'automod', label: 'AutoMod & Safety', icon: ShieldAlert },
    { id: 'bots_webhooks', label: 'Bots & Webhooks', icon: Bot },
    { id: 'events_danger', label: 'Events & Danger Zone', icon: AlertTriangle },
  ];

  const shareableInviteUrl = `${window.location.origin}/?invite=${community.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-5xl h-[90vh] sm:h-[680px] flex flex-col sm:flex-row rounded-2xl bg-[#09090D] border border-[#282631] shadow-2xl overflow-hidden text-[#F5F3FA]">
        {/* Left Navigation Sidebar */}
        <aside className="w-full sm:w-60 p-3 bg-[#0D0D12] border-b sm:border-b-0 sm:border-r border-[#282631] flex sm:flex-col justify-between shrink-0 overflow-x-auto">
          <div className="space-y-3">
            <div className="px-2 pt-1 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#F5F3FA] truncate">
                  {community.name}
                </div>
                <div className="text-[10px] font-mono uppercase text-[#8957F5]">
                  Server Management
                </div>
              </div>
            </div>

            <nav className="flex sm:flex-col gap-1 sm:space-y-0.5 overflow-x-auto">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                        : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="hidden sm:block pt-2 border-t border-[#282631] text-[10px] font-mono text-[#706C7B] px-2">
            Server ID: {community.id}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto bg-[#09090D]">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#282631]">
              <div>
                <h2 className="text-sm font-semibold text-[#F5F3FA]">
                  {TABS.find((t) => t.id === activeTab)?.label}
                </h2>
                <p className="text-[11px] text-[#706C7B]">
                  Configure server channels, roles, permissions, moderation, and developer integrations
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close Server Settings"
                className="w-7 h-7 rounded-md text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {savedBanner && (
              <div className="p-2.5 rounded-lg bg-[#3BA55D]/15 border border-[#3BA55D]/30 text-[#3BA55D] text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{savedBanner}</span>
              </div>
            )}

            {/* TAB 1: SERVER OVERVIEW */}
            {activeTab === 'overview' && (
              <form onSubmit={handleSaveOverview} className="space-y-4 max-w-2xl text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[#A19DAD] font-medium mb-1">
                      Server Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!canManageServer}
                      className="w-full h-8 px-2.5 rounded-md bg-[#101014] border border-[#282631] text-[#F5F3FA] outline-none focus:border-[#8957F5]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#A19DAD] font-medium mb-1">
                      Verification Level
                    </label>
                    <select
                      value={verificationLevel}
                      onChange={(e) => setVerificationLevel(e.target.value as any)}
                      disabled={!canManageServer}
                      className="w-full h-8 px-2.5 rounded-md bg-[#101014] border border-[#282631] text-[#F5F3FA] outline-none focus:border-[#8957F5]"
                    >
                      <option value="none">None — Unrestricted</option>
                      <option value="low">Low — Verified account required</option>
                      <option value="medium">Medium — Registered &gt; 5 mins</option>
                      <option value="high">High — 2FA / Member verification</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#A19DAD] font-medium mb-1">
                    Server Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!canManageServer}
                    className="w-full p-2.5 rounded-md bg-[#101014] border border-[#282631] text-[#F5F3FA] outline-none focus:border-[#8957F5] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <ImageUploader
                    label="Server Icon"
                    variant="avatar"
                    value={iconUrl}
                    onChange={setIconUrl}
                    fallbackInitials={name || community.name || 'DC'}
                    disabled={!canManageServer}
                  />
                  <ImageUploader
                    label="Server Banner"
                    variant="banner"
                    value={bannerUrl}
                    onChange={setBannerUrl}
                    disabled={!canManageServer}
                  />
                </div>

                <div>
                  <label className="block text-[#A19DAD] font-medium mb-1">
                    Welcome Banner Message
                  </label>
                  <input
                    type="text"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    disabled={!canManageServer}
                    className="w-full h-8 px-2.5 rounded-md bg-[#101014] border border-[#282631] text-[#F5F3FA] outline-none focus:border-[#8957F5]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#101014] border border-[#282631] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#F5F3FA]">
                      Public Server Discovery
                    </div>
                    <p className="text-[11px] text-[#706C7B]">
                      Allow Doomcord members to discover and join this server from Explore Communities.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    disabled={!canManageServer}
                    className="accent-[#8957F5] w-4 h-4 cursor-pointer"
                  />
                </div>

                {canManageServer && (
                  <button
                    type="submit"
                    className="h-8 px-4 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white font-semibold transition-colors"
                  >
                    Save Server Configuration
                  </button>
                )}
              </form>
            )}

            {/* TAB 2: CHANNELS & CATEGORIES */}
            {activeTab === 'channels' && (
              <div className="space-y-4 max-w-2xl text-xs">
                {canManageServer && (
                  <form
                    onSubmit={handleAddChannel}
                    className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-3"
                  >
                    <div className="font-semibold text-[#F5F3FA] flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-[#8957F5]" />
                      <span>Create New Channel</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="channel-name"
                        className="h-8 px-2.5 rounded-md bg-[#17171F] border border-[#282631] text-[#F5F3FA] outline-none focus:border-[#8957F5]"
                        required
                      />
                      <select
                        value={newChannelType}
                        onChange={(e) => setNewChannelType(e.target.value as ChannelType)}
                        className="h-8 px-2.5 rounded-md bg-[#17171F] border border-[#282631] text-[#F5F3FA] outline-none"
                      >
                        <option value="text">Text Channel</option>
                        <option value="announcement">Announcement Channel</option>
                        <option value="forum">Forum Channel</option>
                        <option value="media">Media Gallery Channel</option>
                        <option value="voice">Voice Room</option>
                        <option value="stage">Stage Auditorium</option>
                      </select>
                      <input
                        type="text"
                        value={newChannelCategory}
                        onChange={(e) => setNewChannelCategory(e.target.value)}
                        placeholder="Category (e.g. General)"
                        className="h-8 px-2.5 rounded-md bg-[#17171F] border border-[#282631] text-[#F5F3FA] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                      <input
                        type="text"
                        value={newChannelTopic}
                        onChange={(e) => setNewChannelTopic(e.target.value)}
                        placeholder="Channel topic or guidelines..."
                        className="sm:col-span-2 h-8 px-2.5 rounded-md bg-[#17171F] border border-[#282631] text-[#F5F3FA] outline-none"
                      />
                      <select
                        value={newChannelSlowmode}
                        onChange={(e) => setNewChannelSlowmode(Number(e.target.value))}
                        className="h-8 px-2.5 rounded-md bg-[#17171F] border border-[#282631] text-[#F5F3FA] outline-none"
                      >
                        <option value={0}>Slowmode: Off</option>
                        <option value={5}>Slowmode: 5s</option>
                        <option value={15}>Slowmode: 15s</option>
                        <option value={60}>Slowmode: 60s</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="h-8 px-3.5 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white font-semibold"
                    >
                      Create Channel
                    </button>
                  </form>
                )}

                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-[#706C7B]">
                    Active Server Channels ({community.channels?.length || 0})
                  </div>
                  {(community.channels || []).map((ch) => (
                    <div
                      key={ch.id}
                      className="p-3 rounded-lg bg-[#101014] border border-[#282631] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {ch.type === 'announcement' ? (
                          <Megaphone className="w-4 h-4 text-[#A47BFF] shrink-0" />
                        ) : ch.type === 'voice' ? (
                          <Volume2 className="w-4 h-4 text-[#8957F5] shrink-0" />
                        ) : ch.type === 'stage' ? (
                          <Radio className="w-4 h-4 text-[#C4B1FF] shrink-0" />
                        ) : ch.type === 'forum' ? (
                          <MessageSquare className="w-4 h-4 text-[#3BA55D] shrink-0" />
                        ) : ch.type === 'media' ? (
                          <Image className="w-4 h-4 text-[#FAA81A] shrink-0" />
                        ) : (
                          <Hash className="w-4 h-4 text-[#706C7B] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#F5F3FA]">
                              {ch.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#17171F] border border-[#282631] text-[9px] font-mono uppercase text-[#A19DAD]">
                              {ch.type}
                            </span>
                            {ch.category && (
                              <span className="text-[10px] font-mono text-[#706C7B]">
                                [{ch.category}]
                              </span>
                            )}
                          </div>
                          {ch.topic && (
                            <p className="text-[11px] text-[#706C7B] truncate">
                              {ch.topic}
                            </p>
                          )}
                        </div>
                      </div>

                      {canManageServer && (community.channels?.length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteChannel(community.id, ch.id)}
                          className="p-1.5 rounded hover:bg-[#ED4245]/15 text-[#ED4245]"
                          title="Delete Channel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: ROLES & PERMISSIONS */}
            {activeTab === 'roles' && (
              <div className="space-y-4 max-w-2xl text-xs">
                {canManageServer && (
                  <form
                    onSubmit={handleCreateCustomRole}
                    className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-3"
                  >
                    <div className="font-semibold text-[#F5F3FA]">
                      Create Custom Server Role
                    </div>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="text"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="Role Name (e.g. Raid Leader, VIP)"
                        className="flex-1 h-8 px-2.5 rounded-md bg-[#17171F] border border-[#282631] text-[#F5F3FA] outline-none focus:border-[#8957F5]"
                        required
                      />
                      <input
                        type="color"
                        value={newRoleColor}
                        onChange={(e) => setNewRoleColor(e.target.value)}
                        className="w-10 h-8 rounded bg-[#17171F] border border-[#282631] cursor-pointer"
                      />
                      <button
                        type="submit"
                        className="h-8 px-3.5 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white font-semibold"
                      >
                        Add Role
                      </button>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono uppercase text-[#706C7B] mb-1.5">
                        Granular Role Permissions ({selectedRolePerms.length} selected)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-2 rounded bg-[#0D0D12] border border-[#282631]">
                        {GRANULAR_PERMISSIONS.map((perm) => {
                          const checked = selectedRolePerms.includes(perm);
                          return (
                            <label
                              key={perm}
                              className="flex items-center gap-1.5 text-[11px] text-[#A19DAD] cursor-pointer hover:text-[#F5F3FA]"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRolePerms((prev) => [...prev, perm]);
                                  } else {
                                    setSelectedRolePerms((prev) =>
                                      prev.filter((p) => p !== perm)
                                    );
                                  }
                                }}
                                className="accent-[#8957F5]"
                              />
                              <span className="truncate">{perm}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-[#706C7B]">
                    Configured Server Roles
                  </div>
                  {(community.customRoles || []).length === 0 ? (
                    <div className="p-3 rounded-lg bg-[#101014] border border-[#282631] text-[#706C7B]">
                      Built-in hierarchy active: Server Owner → Admin → Moderator → Member. Create custom roles above to add specialized badges and permissions.
                    </div>
                  ) : (
                    (community.customRoles || []).map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-lg bg-[#101014] border border-[#282631] flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: r.color }}
                            />
                            <span className="font-semibold text-[#F5F3FA]">
                              {r.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#706C7B]">
                              {r.permissions.length} permissions
                            </span>
                          </div>
                          <div className="text-[10px] text-[#A19DAD] line-clamp-1">
                            {r.permissions.join(' · ')}
                          </div>
                        </div>
                        {canManageServer && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomRole(r.id)}
                            className="text-[#ED4245] hover:underline text-[11px]"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: MEMBERS & MODERATION */}
            {activeTab === 'members' && (
              <div className="space-y-4 max-w-2xl text-xs">
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search server members by name, @username, or email..."
                  className="w-full h-8 px-3 rounded-md bg-[#101014] border border-[#282631] text-[#F5F3FA] outline-none focus:border-[#8957F5]"
                />

                <div className="space-y-1.5">
                  {filteredMembers.map((member) => {
                    const isMemberOwner = member.uid === community.ownerId;
                    const role: MemberRole = isMemberOwner
                      ? 'owner'
                      : community.memberRoles?.[member.uid] || 'member';

                    return (
                      <div
                        key={member.uid}
                        className="p-3 rounded-lg bg-[#101014] border border-[#282631] flex flex-wrap items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              member.photoURL ||
                              generateInitialsAvatar(member.displayName)
                            }
                            alt={member.displayName}
                            className="w-8 h-8 rounded-md object-cover bg-[#17171F]"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#F5F3FA]">
                                {member.displayName}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#17171F] border border-[#282631] text-[9px] font-mono uppercase text-[#8957F5]">
                                {role}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-[#706C7B]">
                              @{member.username}
                            </div>
                          </div>
                        </div>

                        {canManageServer && !isMemberOwner && (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={role}
                              onChange={(e) =>
                                handleSetMemberRole(
                                  member.uid,
                                  e.target.value as MemberRole
                                )
                              }
                              className="h-7 px-2 rounded bg-[#17171F] border border-[#282631] text-[11px] text-[#F5F3FA]"
                            >
                              <option value="member">Member</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>

                            {isServerOwner && (
                              <button
                                type="button"
                                onClick={() => handleTransferOwnership(member.uid)}
                                title="Transfer Server Ownership"
                                className="h-7 px-2 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[#A47BFF]"
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleKickMember(member.uid)}
                              title="Kick from Server"
                              className="h-7 px-2 rounded bg-[#FAA81A]/15 text-[#FAA81A] hover:bg-[#FAA81A]/25"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleBanMember(member.uid)}
                              title="Ban from Server"
                              className="h-7 px-2 rounded bg-[#ED4245]/15 text-[#ED4245] hover:bg-[#ED4245]/25"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {(community.bannedMembers || []).length > 0 && (
                  <div className="pt-3 border-t border-[#282631] space-y-2">
                    <div className="text-[10px] font-mono uppercase text-[#ED4245]">
                      Banned Users ({community.bannedMembers?.length})
                    </div>
                    {(community.bannedMembers || []).map((bannedUid) => {
                      const u = allUsers.find((usr) => usr.uid === bannedUid);
                      return (
                        <div
                          key={bannedUid}
                          className="p-2.5 rounded-lg bg-[#101014] border border-[#282631] flex items-center justify-between"
                        >
                          <span className="font-mono text-[11px] text-[#A19DAD]">
                            {u ? `${u.displayName} (@${u.username})` : bannedUid}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUnbanMember(bannedUid)}
                            className="h-7 px-2.5 rounded bg-[#3BA55D]/15 text-[#3BA55D] text-[11px]"
                          >
                            Unban
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: INVITE LINKS */}
            {activeTab === 'invites' && (
              <div className="space-y-4 max-w-2xl text-xs">
                <div className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-2.5">
                  <div className="font-semibold text-[#F5F3FA]">
                    Direct Server Invite Link
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareableInviteUrl}
                      className="flex-1 h-8 px-2.5 rounded bg-[#17171F] border border-[#282631] font-mono text-[11px] text-[#C4B1FF]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(shareableInviteUrl);
                        setCopiedInvite('direct');
                        setTimeout(() => setCopiedInvite(null), 1800);
                      }}
                      className="h-8 px-3 rounded bg-[#8957F5] text-white font-semibold flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedInvite === 'direct' ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F5F3FA]">
                      Create Tracked Invite Code
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={inviteMaxUses}
                        onChange={(e) => setInviteMaxUses(Number(e.target.value))}
                        className="h-8 px-2 rounded bg-[#17171F] border border-[#282631] text-[#F5F3FA]"
                      >
                        <option value={0}>Unlimited uses</option>
                        <option value={5}>Max 5 uses</option>
                        <option value={25}>Max 25 uses</option>
                        <option value={100}>Max 100 uses</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleCreateInvite}
                        className="h-8 px-3 rounded bg-[#8957F5] text-white font-semibold"
                      >
                        + Generate Code
                      </button>
                    </div>
                  </div>

                  {(community.invites || []).length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {(community.invites || []).map((inv) => (
                        <div
                          key={inv.code}
                          className="p-2.5 rounded bg-[#17171F] border border-[#282631] flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#C4B1FF]">
                              {inv.code}
                            </span>
                            <span className="text-[10px] text-[#706C7B] ml-2">
                              by {inv.creatorName} · {inv.uses}/
                              {inv.maxUses || '∞'} uses
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRevokeInvite(inv.code)}
                            className="text-[11px] text-[#ED4245] hover:underline"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: AUTOMOD & COMMUNITY SAFETY */}
            {activeTab === 'automod' && (
              <div className="space-y-4 max-w-2xl text-xs">
                <div className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#F5F3FA]">
                        Enable Automated Moderation (AutoMod)
                      </div>
                      <p className="text-[11px] text-[#706C7B]">
                        Automatically filter restricted keywords, mention spam, and unauthorized invite links in real time.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoMod.enabled}
                      onChange={(e) =>
                        handleUpdateAutoMod({ enabled: e.target.checked })
                      }
                      className="accent-[#8957F5] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#282631]">
                    <span>Block External Server Invite Links</span>
                    <input
                      type="checkbox"
                      checked={autoMod.blockInviteLinks}
                      onChange={(e) =>
                        handleUpdateAutoMod({ blockInviteLinks: e.target.checked })
                      }
                      className="accent-[#8957F5] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#282631]">
                    <span>Block Excessive ALL-CAPS Messages</span>
                    <input
                      type="checkbox"
                      checked={autoMod.blockExcessiveCaps}
                      onChange={(e) =>
                        handleUpdateAutoMod({
                          blockExcessiveCaps: e.target.checked,
                        })
                      }
                      className="accent-[#8957F5] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#282631]">
                    <span>Maximum Mentions per Message</span>
                    <select
                      value={autoMod.maxMentionsPerMessage}
                      onChange={(e) =>
                        handleUpdateAutoMod({
                          maxMentionsPerMessage: Number(e.target.value),
                        })
                      }
                      className="h-7 px-2 rounded bg-[#17171F] border border-[#282631]"
                    >
                      <option value={3}>3 mentions</option>
                      <option value={5}>5 mentions</option>
                      <option value={10}>10 mentions</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-[#282631] space-y-2">
                    <div className="font-semibold text-[#F5F3FA]">
                      Blocked Keywords Filter
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="Add restricted word or phrase..."
                        className="flex-1 h-8 px-2.5 rounded bg-[#17171F] border border-[#282631] text-[#F5F3FA] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newKeyword.trim()) return;
                          handleUpdateAutoMod({
                            blockedKeywords: [
                              ...(autoMod.blockedKeywords || []),
                              newKeyword.trim(),
                            ],
                          });
                          setNewKeyword('');
                        }}
                        className="h-8 px-3 rounded bg-[#8957F5] text-white font-semibold"
                      >
                        Add Keyword
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(autoMod.blockedKeywords || []).map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-1 rounded bg-[#17171F] border border-[#282631] font-mono text-[11px] text-[#C4B1FF] flex items-center gap-1.5"
                        >
                          <span>{kw}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateAutoMod({
                                blockedKeywords: (
                                  autoMod.blockedKeywords || []
                                ).filter((k) => k !== kw),
                              })
                            }
                            className="text-[#ED4245]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: BOTS & WEBHOOKS */}
            {activeTab === 'bots_webhooks' && (
              <div className="space-y-4 max-w-2xl text-xs">
                <form
                  onSubmit={handleCreateWebhook}
                  className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-3"
                >
                  <div className="font-semibold text-[#F5F3FA] flex items-center gap-1.5">
                    <Webhook className="w-3.5 h-3.5 text-[#8957F5]" />
                    <span>Channel Webhooks</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={webhookName}
                      onChange={(e) => setWebhookName(e.target.value)}
                      placeholder="Webhook Name (e.g. GitHub CI)"
                      className="h-8 px-2.5 rounded bg-[#17171F] border border-[#282631] text-[#F5F3FA] outline-none"
                      required
                    />
                    <select
                      value={webhookChannelId}
                      onChange={(e) => setWebhookChannelId(e.target.value)}
                      className="h-8 px-2.5 rounded bg-[#17171F] border border-[#282631] text-[#F5F3FA]"
                    >
                      {(community.channels || []).map((c) => (
                        <option key={c.id} value={c.id}>
                          #{c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="h-8 px-3 rounded bg-[#8957F5] text-white font-semibold"
                    >
                      + Create Webhook
                    </button>
                  </div>

                  {(community.webhooks || []).length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {(community.webhooks || []).map((wh) => (
                        <div
                          key={wh.id}
                          className="p-2.5 rounded bg-[#17171F] border border-[#282631] flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-[#F5F3FA]">
                              {wh.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#706C7B] ml-2">
                              Secret: {wh.secretToken}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateCommunity(community.id, {
                                webhooks: (community.webhooks || []).filter(
                                  (w) => w.id !== wh.id
                                ),
                              })
                            }
                            className="text-[11px] text-[#ED4245]"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </form>

                <form
                  onSubmit={handleInstallBot}
                  className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-3"
                >
                  <div className="font-semibold text-[#F5F3FA] flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-[#A47BFF]" />
                    <span>Doomcord Bot Applications</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="Bot Name (e.g. SentinelBot)"
                      className="h-8 px-2.5 rounded bg-[#17171F] border border-[#282631] text-[#F5F3FA] outline-none"
                      required
                    />
                    <input
                      type="text"
                      value={botDesc}
                      onChange={(e) => setBotDesc(e.target.value)}
                      placeholder="Description / Slash Command role"
                      className="h-8 px-2.5 rounded bg-[#17171F] border border-[#282631] text-[#F5F3FA] outline-none"
                    />
                    <button
                      type="submit"
                      className="h-8 px-3 rounded bg-[#8957F5] text-white font-semibold"
                    >
                      + Install Bot
                    </button>
                  </div>

                  {(community.installedBots || []).length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {(community.installedBots || []).map((b) => (
                        <div
                          key={b.id}
                          className="p-2.5 rounded bg-[#17171F] border border-[#282631] flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-[#F5F3FA]">
                              {b.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#8957F5]/20 text-[#C4B1FF] font-mono text-[9px] ml-2">
                              BOT
                            </span>
                            <p className="text-[11px] text-[#706C7B]">
                              {b.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateCommunity(community.id, {
                                installedBots: (
                                  community.installedBots || []
                                ).filter((x) => x.id !== b.id),
                              })
                            }
                            className="text-[11px] text-[#ED4245]"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* TAB 8: EVENTS & DANGER ZONE */}
            {activeTab === 'events_danger' && (
              <div className="space-y-4 max-w-2xl text-xs">
                <form
                  onSubmit={handleCreateEvent}
                  className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-3"
                >
                  <div className="font-semibold text-[#F5F3FA] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8957F5]" />
                    <span>Schedule Community Event</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Event Title"
                      className="h-8 px-2.5 rounded bg-[#17171F] border border-[#282631] text-[#F5F3FA] outline-none"
                      required
                    />
                    <input
                      type="text"
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      placeholder="Topic or Stage Room"
                      className="h-8 px-2.5 rounded bg-[#17171F] border border-[#282631] text-[#F5F3FA] outline-none"
                    />
                    <button
                      type="submit"
                      className="h-8 px-3 rounded bg-[#8957F5] text-white font-semibold"
                    >
                      + Create Event
                    </button>
                  </div>
                  {(community.events || []).length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {(community.events || []).map((ev) => (
                        <div
                          key={ev.id}
                          className="p-2.5 rounded bg-[#17171F] border border-[#282631] flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-[#F5F3FA]">
                              {ev.title}
                            </div>
                            <div className="text-[11px] text-[#706C7B]">
                              {ev.description}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-[#A47BFF]">
                            {ev.interestedUids?.length || 1} Interested
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </form>

                <div className="p-4 rounded-xl bg-[#ED4245]/10 border border-[#ED4245]/30 space-y-3">
                  <div className="font-semibold text-[#ED4245] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Server Danger Zone</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {!isServerOwner && (
                      <button
                        type="button"
                        onClick={async () => {
                          await onLeaveCommunity(community.id);
                          onClose();
                        }}
                        className="h-8 px-3.5 rounded-md bg-[#ED4245]/20 hover:bg-[#ED4245]/30 text-[#ED4245] font-semibold"
                      >
                        Leave Server
                      </button>
                    )}

                    {isServerOwner && (
                      <button
                        type="button"
                        onClick={async () => {
                          await onDeleteCommunity(community.id);
                          onClose();
                        }}
                        className="h-8 px-3.5 rounded-md bg-[#ED4245] hover:bg-[#d93639] text-white font-semibold"
                      >
                        Permanently Delete Server
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-[#282631]">
            <button
              onClick={onClose}
              className="h-8 px-4 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#F5F3FA]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
