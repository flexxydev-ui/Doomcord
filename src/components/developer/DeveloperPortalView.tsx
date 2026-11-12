import React, { useState } from 'react';
import {
  Terminal,
  Bot,
  Webhook,
  Key,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Send,
  BookOpen,
  Shield,
  Server,
  CheckCircle2,
  Code2,
} from 'lucide-react';
import {
  Community,
  DeveloperApplication,
  UserProfile,
  ServerBotRecord,
} from '../../types';

interface DeveloperPortalViewProps {
  currentUser: UserProfile;
  communities: Community[];
  developerApps: DeveloperApplication[];
  onSaveDeveloperApp: (app: DeveloperApplication) => Promise<void>;
  onDeleteDeveloperApp: (appId: string) => Promise<void>;
  onInstallBotToServer: (
    communityId: string,
    bot: ServerBotRecord
  ) => Promise<void>;
  onSendWebhookTestMessage: (
    communityId: string,
    channelId: string,
    botName: string,
    content: string
  ) => Promise<void>;
}

const AVAILABLE_OAUTH_SCOPES = [
  { id: 'identify', desc: 'Read user profile, username, and avatar' },
  { id: 'communities.read', desc: 'List user joined Doomcord servers' },
  { id: 'messages.write', desc: 'Post automated bot messages and rich embeds' },
  { id: 'webhooks.incoming', desc: 'Create channel webhooks and event hooks' },
  { id: 'commands.slash', desc: 'Register custom /slash commands in servers' },
  { id: 'moderation.audit', desc: 'Read server audit logs and AutoMod alerts' },
];

export const DeveloperPortalView: React.FC<DeveloperPortalViewProps> = ({
  currentUser,
  communities,
  developerApps,
  onSaveDeveloperApp,
  onDeleteDeveloperApp,
  onInstallBotToServer,
  onSendWebhookTestMessage,
}) => {
  const [activeTab, setActiveTab] = useState<
    'apps' | 'sandbox' | 'docs'
  >('apps');

  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [newBotPrefix, setNewBotPrefix] = useState('!');
  const [newRedirectUri, setNewRedirectUri] = useState(
    `${window.location.origin}/oauth/callback`
  );
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'identify',
    'messages.write',
    'commands.slash',
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Sandbox state
  const [sandboxCommId, setSandboxCommId] = useState<string>(
    communities[0]?.id || ''
  );
  const selectedSandboxComm =
    communities.find((c) => c.id === sandboxCommId) || communities[0];
  const [sandboxChannelId, setSandboxChannelId] = useState<string>(
    selectedSandboxComm?.channels?.[0]?.id || ''
  );
  const [sandboxBotName, setSandboxBotName] = useState('Doomcord Sentinel Bot');
  const [sandboxPayload, setSandboxPayload] = useState(
    '🚀 **[Automated Webhook]** Build #402 deployed to production successfully!'
  );
  const [installTargetServerId, setInstallTargetServerId] = useState<string>(
    communities[0]?.id || ''
  );

  const generateHexSecret = (prefix: string) => {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `${prefix}_${hex}`;
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;
    const now = new Date().toISOString();
    const appId = `app_${Date.now()}`;
    const clientId = `dc_client_${Math.floor(100000000 + Math.random() * 900000000)}`;
    const app: DeveloperApplication = {
      id: appId,
      name: newAppName.trim(),
      description:
        newAppDesc.trim() ||
        'Official Doomcord Bot & OAuth2 integration application.',
      ownerUid: currentUser.uid,
      clientId,
      clientSecretMasked: generateHexSecret('dc_sec'),
      botUsername: newAppName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_'),
      botPrefix: newBotPrefix.trim() || '!',
      botTokenMasked: generateHexSecret('DCBOT'),
      redirectUris: newRedirectUri.trim() ? [newRedirectUri.trim()] : [],
      scopes: selectedScopes,
      permissionsBitfield: '0x000001FF',
      installedServerIds: [],
      requestCount: 0,
      createdAt: now,
    };

    await onSaveDeveloperApp(app);
    setNewAppName('');
    setNewAppDesc('');
    setStatusBanner(`Created developer application "${app.name}" (${clientId}).`);
  };

  const handleRotateSecret = async (app: DeveloperApplication) => {
    const updated: DeveloperApplication = {
      ...app,
      clientSecretMasked: generateHexSecret('dc_sec'),
      botTokenMasked: generateHexSecret('DCBOT'),
    };
    await onSaveDeveloperApp(updated);
    setStatusBanner(`Rotated OAuth2 Client Secret & Bot Token for "${app.name}".`);
  };

  const handleInstallAppBot = async (app: DeveloperApplication) => {
    const targetId = installTargetServerId || communities[0]?.id;
    if (!targetId) {
      setStatusBanner('Create or join a community server first to install this bot.');
      return;
    }
    const botRecord: ServerBotRecord = {
      id: `bot_${app.id}`,
      name: app.name,
      description: app.description,
      prefix: app.botPrefix,
      permissions: app.scopes,
      installedAt: new Date().toISOString(),
    };
    await onInstallBotToServer(targetId, botRecord);
    const updated: DeveloperApplication = {
      ...app,
      installedServerIds: Array.from(
        new Set([...(app.installedServerIds || []), targetId])
      ),
    };
    await onSaveDeveloperApp(updated);
    const targetComm = communities.find((c) => c.id === targetId);
    setStatusBanner(
      `Installed bot "${app.name}" to server "${targetComm?.name || targetId}".`
    );
  };

  const handleDispatchSandboxWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    const comm =
      communities.find((c) => c.id === sandboxCommId) || communities[0];
    if (!comm) {
      setStatusBanner('No community server available for webhook delivery.');
      return;
    }
    const ch =
      comm.channels?.find((c) => c.id === sandboxChannelId) ||
      comm.channels?.[0];
    if (!ch) {
      setStatusBanner('Selected server has no channels.');
      return;
    }
    await onSendWebhookTestMessage(
      comm.id,
      ch.id,
      sandboxBotName.trim() || 'Doomcord Webhook',
      sandboxPayload.trim()
    );
    setStatusBanner(
      `Delivered live webhook payload to ${comm.name} → #${ch.name}.`
    );
  };

  const copyText = (id: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090D] text-[#F5F3FA] overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-20 h-16 px-6 bg-[#0D0D12] border-b border-[#282631] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#17171F] border border-[#8957F5]/40 flex items-center justify-center text-[#8957F5]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#F5F3FA]">
                Doomcord Developer Portal
              </h1>
              <span className="px-2 py-0.5 rounded bg-[#8957F5]/15 border border-[#8957F5]/30 text-[10px] font-mono text-[#C4B1FF]">
                API v1 · BOTS & OAUTH2
              </span>
            </div>
            <p className="text-[11px] text-[#706C7B] hidden sm:block">
              Register OAuth2 applications, manage bot tokens, configure scopes & test live channel webhooks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#101014] border border-[#282631]">
          <button
            onClick={() => setActiveTab('apps')}
            className={`h-7 px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'apps'
                ? 'bg-[#8957F5] text-white'
                : 'text-[#A19DAD] hover:text-[#F5F3FA]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Applications & Bots ({developerApps.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`h-7 px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'sandbox'
                ? 'bg-[#8957F5] text-white'
                : 'text-[#A19DAD] hover:text-[#F5F3FA]'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>Webhook Sandbox</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`h-7 px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'docs'
                ? 'bg-[#8957F5] text-white'
                : 'text-[#A19DAD] hover:text-[#F5F3FA]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>API Docs</span>
          </button>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        {statusBanner && (
          <div className="p-3.5 rounded-xl bg-[#59C995]/10 border border-[#59C995]/30 flex items-center justify-between text-xs text-[#59C995]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusBanner}</span>
            </div>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-[10px] font-mono underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'apps' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Create Application Form */}
            <form
              onSubmit={handleCreateApp}
              className="lg:col-span-5 p-5 rounded-xl bg-[#101014] border border-[#282631] space-y-4 h-fit"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#8957F5]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5F3FA]">
                  Register New Application / Bot
                </h2>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#A19DAD] block mb-1">
                  Application & Bot Name
                </label>
                <input
                  type="text"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="e.g. Sentinel Guard Bot, GitHub Notifier"
                  className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] focus:border-[#8957F5] text-xs text-[#F5F3FA] outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] font-mono uppercase text-[#A19DAD] block mb-1">
                    OAuth2 Redirect URI
                  </label>
                  <input
                    type="text"
                    value={newRedirectUri}
                    onChange={(e) => setNewRedirectUri(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs font-mono text-[#F5F3FA] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#A19DAD] block mb-1">
                    Command Prefix
                  </label>
                  <input
                    type="text"
                    value={newBotPrefix}
                    onChange={(e) => setNewBotPrefix(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs font-mono text-[#F5F3FA] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#A19DAD] block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newAppDesc}
                  onChange={(e) => setNewAppDesc(e.target.value)}
                  placeholder="Describe what your bot or OAuth integration does..."
                  className="w-full p-2.5 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA] outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#A19DAD] block mb-1.5">
                  OAuth2 & Bot Permission Scopes
                </label>
                <div className="space-y-1.5">
                  {AVAILABLE_OAUTH_SCOPES.map((sc) => {
                    const checked = selectedScopes.includes(sc.id);
                    return (
                      <label
                        key={sc.id}
                        className="flex items-start gap-2.5 p-2 rounded-lg bg-[#09090D] border border-[#282631] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedScopes((prev) =>
                              checked
                                ? prev.filter((s) => s !== sc.id)
                                : [...prev, sc.id]
                            )
                          }
                          className="mt-0.5 accent-[#8957F5]"
                        />
                        <div>
                          <div className="text-xs font-mono font-semibold text-[#C4B1FF]">
                            {sc.id}
                          </div>
                          <div className="text-[10px] text-[#706C7B]">
                            {sc.desc}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-9 rounded-lg bg-[#8957F5] hover:bg-[#7846E4] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Application & Generate Credentials</span>
              </button>
            </form>

            {/* Registered Applications List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#A19DAD]">
                  Your Registered Applications ({developerApps.length})
                </h2>
                {communities.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#706C7B]">
                      Target Server:
                    </span>
                    <select
                      value={installTargetServerId}
                      onChange={(e) => setInstallTargetServerId(e.target.value)}
                      className="h-7 px-2 rounded bg-[#101014] border border-[#282631] text-xs text-[#F5F3FA] outline-none"
                    >
                      {communities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {developerApps.length === 0 ? (
                <div className="p-10 rounded-xl bg-[#101014] border border-[#282631] text-center space-y-2">
                  <Code2 className="w-8 h-8 text-[#8957F5] mx-auto opacity-80" />
                  <h3 className="text-sm font-semibold text-[#F5F3FA]">
                    No Developer Applications Registered Yet
                  </h3>
                  <p className="text-xs text-[#706C7B] max-w-md mx-auto">
                    Use the form on the left to register your first Doomcord OAuth2 application and bot account.
                  </p>
                </div>
              ) : (
                developerApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-xl bg-[#101014] border border-[#282631] space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#17171F] border border-[#8957F5]/40 flex items-center justify-center text-[#8957F5] font-bold text-sm">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[#F5F3FA]">
                              {app.name}
                            </h3>
                            <span className="px-1.5 py-0.5 rounded bg-[#8957F5]/20 text-[#C4B1FF] text-[9px] font-mono">
                              BOT · {app.botPrefix}
                            </span>
                          </div>
                          <p className="text-xs text-[#A19DAD]">
                            {app.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteDeveloperApp(app.id)}
                        className="p-1.5 rounded-lg text-[#706C7B] hover:text-[#EA747E] hover:bg-[#17171F]"
                        title="Delete Application"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#09090D] border border-[#282631] flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono uppercase text-[#706C7B]">
                            OAuth2 Client ID
                          </div>
                          <div className="font-mono text-[#F5F3FA] truncate">
                            {app.clientId}
                          </div>
                        </div>
                        <button
                          onClick={() => copyText(`cid_${app.id}`, app.clientId)}
                          className="p-1.5 text-[#A19DAD] hover:text-[#F5F3FA]"
                        >
                          {copiedId === `cid_${app.id}` ? (
                            <Check className="w-3.5 h-3.5 text-[#59C995]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#09090D] border border-[#282631] flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono uppercase text-[#706C7B]">
                            Bot Token (Protected)
                          </div>
                          <div className="font-mono text-[#C4B1FF] truncate">
                            {app.botTokenMasked}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            copyText(`tok_${app.id}`, app.botTokenMasked)
                          }
                          className="p-1.5 text-[#A19DAD] hover:text-[#F5F3FA]"
                        >
                          {copiedId === `tok_${app.id}` ? (
                            <Check className="w-3.5 h-3.5 text-[#59C995]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {app.scopes.map((sc) => (
                        <span
                          key={sc}
                          className="px-2 py-0.5 rounded bg-[#17171F] border border-[#282631] text-[10px] font-mono text-[#A19DAD]"
                        >
                          {sc}
                        </span>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-[#282631] flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleRotateSecret(app)}
                        className="h-8 px-3 rounded-lg bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#A19DAD] hover:text-[#F5F3FA] flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Rotate Token & Secret</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInstallAppBot(app)}
                        className="h-8 px-3.5 rounded-lg bg-[#8957F5] hover:bg-[#7846E4] text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Server className="w-3.5 h-3.5" />
                        <span>Install Bot to Server</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleDispatchSandboxWebhook}
              className="lg:col-span-7 p-6 rounded-xl bg-[#101014] border border-[#282631] space-y-4"
            >
              <div className="flex items-center gap-2">
                <Webhook className="w-4 h-4 text-[#8957F5]" />
                <h2 className="text-sm font-bold text-[#F5F3FA]">
                  Live Channel Webhook & Bot Message Dispatcher
                </h2>
              </div>
              <p className="text-xs text-[#A19DAD]">
                Test real-time webhook delivery into any Doomcord server channel. Messages dispatched here persist in Firestore and appear immediately in the target channel.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase text-[#A19DAD] block mb-1">
                    Target Community Server
                  </label>
                  <select
                    value={sandboxCommId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setSandboxCommId(nextId);
                      const nextComm = communities.find((c) => c.id === nextId);
                      setSandboxChannelId(nextComm?.channels?.[0]?.id || '');
                    }}
                    className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA] outline-none"
                  >
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase text-[#A19DAD] block mb-1">
                    Target Channel
                  </label>
                  <select
                    value={sandboxChannelId}
                    onChange={(e) => setSandboxChannelId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA] outline-none"
                  >
                    {(selectedSandboxComm?.channels || []).map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        #{ch.name} ({ch.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#A19DAD] block mb-1">
                  Webhook / Bot Sender Display Name
                </label>
                <input
                  type="text"
                  value={sandboxBotName}
                  onChange={(e) => setSandboxBotName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-[#A19DAD] block mb-1">
                  Message Content (Markdown Supported)
                </label>
                <textarea
                  rows={3}
                  value={sandboxPayload}
                  onChange={(e) => setSandboxPayload(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs font-mono text-[#F5F3FA] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="h-9 px-5 rounded-lg bg-[#8957F5] hover:bg-[#7846E4] text-white text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Live Webhook Payload</span>
              </button>
            </form>

            <div className="lg:col-span-5 p-6 rounded-xl bg-[#101014] border border-[#282631] space-y-3 h-fit">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C4B1FF]">
                <Key className="w-4 h-4 text-[#8957F5]" />
                <span>Webhook Signature Security</span>
              </div>
              <p className="text-xs text-[#A19DAD] leading-relaxed">
                All incoming Doomcord webhook requests include an{' '}
                <code className="font-mono text-[#C4B1FF]">
                  X-Doomcord-Signature-256
                </code>{' '}
                HMAC-SHA256 header computed over the raw JSON body using your webhook's secret token.
              </p>
              <pre className="p-3 rounded-lg bg-[#09090D] border border-[#282631] text-[11px] font-mono text-[#A19DAD] overflow-x-auto">
{`POST /api/webhooks/{webhook_id}/{token}
Content-Type: application/json
X-Doomcord-Signature-256: sha256=...

{
  "username": "${sandboxBotName}",
  "content": "${sandboxPayload.slice(0, 42)}..."
}`}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="p-6 rounded-xl bg-[#101014] border border-[#282631] space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#F5F3FA]">
                Doomcord REST API & Gateway Reference (v1)
              </h2>
              <p className="text-xs text-[#A19DAD] mt-1">
                Authenticate bot requests with{' '}
                <code className="font-mono text-[#C4B1FF]">
                  Authorization: Bot &lt;TOKEN&gt;
                </code>{' '}
                and user OAuth requests with{' '}
                <code className="font-mono text-[#C4B1FF]">
                  Authorization: Bearer &lt;JWT&gt;
                </code>
                .
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  method: 'POST',
                  path: '/api/auth/login',
                  desc: 'Authenticate user credentials & verify RFC 6238 2FA TOTP or backup recovery codes.',
                },
                {
                  method: 'POST',
                  path: '/api/auth/2fa/enable',
                  desc: 'Provision encrypted TOTP secret and SHA-256 hashed single-use backup codes.',
                },
                {
                  method: 'POST',
                  path: '/api/razorpay/create-order',
                  desc: 'Create server-verified Razorpay INR order for DOOMCORD APEX or gift checkout.',
                },
                {
                  method: 'POST',
                  path: '/api/razorpay/verify-payment',
                  desc: 'Verify HMAC-SHA256 Razorpay payment signature before activating entitlements.',
                },
              ].map((ep) => (
                <div
                  key={ep.path}
                  className="p-4 rounded-xl bg-[#09090D] border border-[#282631] space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#8957F5]/20 text-[#C4B1FF] text-[10px] font-mono font-bold">
                      {ep.method}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#F5F3FA]">
                      {ep.path}
                    </span>
                  </div>
                  <p className="text-xs text-[#A19DAD]">{ep.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
