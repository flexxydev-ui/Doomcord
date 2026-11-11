import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Pin,
  Edit3,
  Trash2,
  Reply,
  X,
  Search,
  Bell,
  BellOff,
  CornerDownRight,
  PanelRightClose,
  PanelRightOpen,
  Hash,
  Crown,
  Shield,
  Bookmark,
  Copy,
  Code,
  EyeOff,
  BarChart2,
  Terminal,
  Bold,
  Italic,
} from 'lucide-react';
import {
  ChatMessage,
  UserProfile,
  MessageAttachment,
  PollData,
} from '../../types';
import {
  generateInitialsAvatar,
  isRootOwner,
} from '../../lib/dataService';
import {
  SLASH_COMMANDS,
  executeSlashCommand,
  parseMessageBlocks,
  InlineSegment,
} from '../../lib/chatEnhancements';

interface ChatViewProps {
  title: string;
  subtitle?: string;
  conversationId: string;
  currentUser: UserProfile;
  recipientProfile?: UserProfile;
  messages: ChatMessage[];
  showRightPanel?: boolean;
  onToggleRightPanel?: () => void;
  onSendMessage: (
    content: string,
    attachments?: MessageAttachment[],
    replyTo?: { id: string; senderName: string; content: string },
    poll?: PollData
  ) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string) => void;
  onVotePoll?: (messageId: string, optionId: string) => void;
  onToggleBookmark?: (messageId: string) => void;
  onMarkAsRead: (conversationId: string) => void;
}

const COMMON_REACTIONS = ['👍', '❤️', '🔥', '✨', '💜', '😂', '🎯', '🚀'];

const EMOJI_PALETTE = [
  '💜', '🔥', '✨', '🚀', '🎯', '👑', '⚡', '💎',
  '👍', '🙌', '👏', '🤝', '🎉', '💯', '❤️', '😂',
  '😎', '🤔', '👀', '🫡', '🎮', '💻', '🎧', '🛡️',
];

const InlineSegmentsRenderer: React.FC<{
  segments: InlineSegment[];
  revealedSpoilers: Record<string, boolean>;
  onToggleSpoiler: (key: string) => void;
  msgId: string;
}> = ({ segments, revealedSpoilers, onToggleSpoiler, msgId }) => {
  return (
    <>
      {segments.map((seg, idx) => {
        const key = `${msgId}_seg_${idx}`;
        if (seg.type === 'bold') {
          return (
            <strong key={key} className="font-semibold text-[#F5F3FA]">
              {seg.content}
            </strong>
          );
        }
        if (seg.type === 'italic') {
          return (
            <em key={key} className="italic text-[#C4B1FF]">
              {seg.content}
            </em>
          );
        }
        if (seg.type === 'strike') {
          return (
            <del key={key} className="line-through text-[#706C7B]">
              {seg.content}
            </del>
          );
        }
        if (seg.type === 'code') {
          return (
            <code
              key={key}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-[#17171F] border border-[#282631] font-mono text-[11px] text-[#C4B1FF]"
            >
              {seg.content}
            </code>
          );
        }
        if (seg.type === 'mention') {
          return (
            <span
              key={key}
              className="px-1 py-0.5 rounded bg-[#8957F5]/20 text-[#C4B1FF] font-medium cursor-pointer hover:bg-[#8957F5]/30 transition-colors"
            >
              {seg.content}
            </span>
          );
        }
        if (seg.type === 'spoiler') {
          const isRevealed = Boolean(revealedSpoilers[key]);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggleSpoiler(key)}
              title={isRevealed ? 'Click to hide spoiler' : 'Click to reveal spoiler'}
              className={`px-1.5 py-0.5 mx-0.5 rounded text-xs transition-all ${
                isRevealed
                  ? 'bg-[#17171F] text-[#F5F3FA] border border-[#282631]'
                  : 'bg-[#282631] text-transparent hover:bg-[#322F3D] select-none'
              }`}
            >
              {seg.content}
            </button>
          );
        }
        return <React.Fragment key={key}>{seg.content}</React.Fragment>;
      })}
    </>
  );
};

export const ChatView: React.FC<ChatViewProps> = ({
  title,
  subtitle,
  conversationId,
  currentUser,
  recipientProfile,
  messages,
  showRightPanel = true,
  onToggleRightPanel,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onToggleReaction,
  onTogglePin,
  onVotePoll,
  onToggleBookmark,
  onMarkAsRead,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(
    null
  );
  const [showComposerEmoji, setShowComposerEmoji] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const [selectedSlashIdx, setSelectedSlashIdx] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const savedMessageIds = currentUser.savedMessages || [];

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  useEffect(() => {
    if (conversationId) {
      onMarkAsRead(conversationId);
    }
  }, [conversationId, messages, onMarkAsRead]);

  // Slash commands filtering when input starts with '/'
  const matchingSlashCommands =
    inputValue.startsWith('/') && !inputValue.includes(' ')
      ? SLASH_COMMANDS.filter((c) =>
          c.command.toLowerCase().startsWith(inputValue.trim().toLowerCase())
        )
      : [];

  useEffect(() => {
    setSelectedSlashIdx(0);
  }, [inputValue]);

  const filteredMessages = messages.filter((msg) => {
    if (showPinnedOnly && !msg.isPinned) return false;
    if (showSavedOnly && !savedMessageIds.includes(msg.id)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      msg.content.toLowerCase().includes(q) ||
      msg.senderName.toLowerCase().includes(q)
    );
  });

  const pinnedMessages = messages.filter((m) => m.isPinned);

  const isOwner = isRootOwner(currentUser.uid);
  const maxCharLimit =
    isOwner ||
    currentUser.nitroTier === 'nitro' ||
    currentUser.permanentEntitlement
      ? 4000
      : 2000;

  const handleSend = () => {
    if (!inputValue.trim()) return;
    if (inputValue.length > maxCharLimit) return;

    const executed = executeSlashCommand(inputValue, currentUser.uid);

    onSendMessage(
      executed.transformedContent,
      undefined,
      replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            content: replyingTo.content.slice(0, 100),
          }
        : undefined,
      executed.poll
    );

    setInputValue('');
    setReplyingTo(null);
    setShowComposerEmoji(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (matchingSlashCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIdx((prev) => (prev + 1) % matchingSlashCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIdx(
          (prev) =>
            (prev - 1 + matchingSlashCommands.length) %
            matchingSlashCommands.length
        );
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const picked = matchingSlashCommands[selectedSlashIdx];
        if (picked) {
          setInputValue(`${picked.command} `);
        }
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertFormatting = (prefix: string, suffix: string, sample: string) => {
    setInputValue((prev) => {
      if (!prev.trim()) return `${prefix}${sample}${suffix}`;
      return `${prev} ${prefix}${sample}${suffix}`;
    });
    inputRef.current?.focus();
  };

  const handleSaveEdit = (msgId: string) => {
    if (editContent.trim()) {
      onEditMessage(msgId, editContent.trim());
    }
    setEditingMessageId(null);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const attachment: MessageAttachment = {
        id: `att_${Date.now()}`,
        name: file.name,
        url: dataUrl,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        size: file.size,
      };
      onSendMessage(
        file.type.startsWith('image/')
          ? 'Shared an image'
          : `Attached ${file.name}`,
        [attachment]
      );
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCopyCode = (code: string, key: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCodeKey(key);
    setTimeout(() => setCopiedCodeKey(null), 1800);
  };

  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#09090D] overflow-hidden relative text-[#F5F3FA]"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag-and-Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-4 rounded-xl bg-[#101014]/95 border-2 border-dashed border-[#8957F5] z-40 flex flex-col items-center justify-center pointer-events-none">
          <Paperclip className="w-8 h-8 text-[#8957F5] mb-2" />
          <p className="text-xs font-semibold text-[#F5F3FA]">
            Drop file or image to share in {title}
          </p>
          <p className="text-[11px] text-[#A19DAD] mt-0.5">
            Release to upload directly
          </p>
        </div>
      )}

      {/* Top Conversation Header */}
      <header className="h-14 px-5 bg-[#09090D] border-b border-[#282631] flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            {recipientProfile ? (
              <img
                src={
                  recipientProfile.photoURL ||
                  generateInitialsAvatar(recipientProfile.displayName)
                }
                alt={recipientProfile.displayName}
                className="w-8 h-8 rounded-md object-cover bg-[#17171F]"
              />
            ) : (
              <div className="w-8 h-8 rounded-md bg-[#17171F] border border-[#282631] flex items-center justify-center text-[#8957F5]">
                <Hash className="w-4 h-4" />
              </div>
            )}
            {recipientProfile && (
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#09090D] ${
                  recipientProfile.presence === 'online'
                    ? 'bg-[#3BA55D]'
                    : recipientProfile.presence === 'idle'
                    ? 'bg-[#FAA81A]'
                    : recipientProfile.presence === 'dnd'
                    ? 'bg-[#ED4245]'
                    : 'bg-[#706C7B]'
                }`}
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-semibold text-[#F5F3FA] truncate">
                {title}
              </h2>
              {recipientProfile && (
                <span className="text-[10px] font-mono text-[#706C7B]">
                  @{recipientProfile.username}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#706C7B] truncate max-w-md">
              {subtitle ||
                recipientProfile?.statusMessage ||
                'Real-time conversation'}
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Search Messages */}
          {isSearching ? (
            <div className="flex items-center bg-[#17171F] rounded-md px-2 h-7 border border-[#282631]">
              <Search className="w-3 h-3 text-[#706C7B] mr-1.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-[#F5F3FA] placeholder-[#706C7B] outline-none w-32"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                }}
                className="text-[#706C7B] hover:text-[#F5F3FA]"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearching(true)}
              title="Search Messages"
              className="w-7 h-7 rounded-md text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F] flex items-center justify-center transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Bookmarked / Saved Messages Toggle */}
          <button
            onClick={() => {
              setShowSavedOnly(!showSavedOnly);
              if (!showSavedOnly) setShowPinnedOnly(false);
            }}
            title={showSavedOnly ? 'Show All Messages' : 'Saved Bookmarks'}
            className={`relative w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              showSavedOnly
                ? 'bg-[#17171F] text-[#8957F5]'
                : 'text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          {/* Pinned Messages Toggle */}
          <button
            onClick={() => {
              setShowPinnedOnly(!showPinnedOnly);
              if (!showPinnedOnly) setShowSavedOnly(false);
            }}
            title={showPinnedOnly ? 'Show All Messages' : 'View Pinned Messages'}
            className={`relative w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              showPinnedOnly
                ? 'bg-[#17171F] text-[#8957F5]'
                : 'text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F]'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            {pinnedMessages.length > 0 && !showPinnedOnly && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#8957F5]" />
            )}
          </button>

          {/* Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              isMuted
                ? 'bg-[#ED4245]/15 text-[#ED4245]'
                : 'text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F]'
            }`}
          >
            {isMuted ? (
              <BellOff className="w-3.5 h-3.5" />
            ) : (
              <Bell className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Right Contextual Panel Toggle */}
          {onToggleRightPanel && (
            <button
              onClick={onToggleRightPanel}
              title={
                showRightPanel
                  ? 'Hide Details Panel'
                  : 'Show Details Panel'
              }
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                showRightPanel
                  ? 'bg-[#17171F] text-[#8957F5]'
                  : 'text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F]'
              }`}
            >
              {showRightPanel ? (
                <PanelRightClose className="w-3.5 h-3.5" />
              ) : (
                <PanelRightOpen className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && !showPinnedOnly && !showSavedOnly && (
        <div className="px-5 py-2 bg-[#101014] border-b border-[#282631] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#8957F5] min-w-0">
            <Pin className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium shrink-0 tabular-nums">
              {pinnedMessages.length} Pinned:
            </span>
            <span className="text-[#A19DAD] truncate">
              “{pinnedMessages[0].content}”
            </span>
          </div>
          <button
            onClick={() => setShowPinnedOnly(true)}
            className="text-xs font-medium text-[#8957F5] hover:text-[#A47BFF] shrink-0 ml-4 transition-colors"
          >
            View All
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-10 h-10 rounded-lg bg-[#101014] border border-[#282631] flex items-center justify-center text-[#8957F5] mb-2.5">
              <Smile className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-semibold text-[#F5F3FA]">
              {showPinnedOnly
                ? 'No pinned messages'
                : showSavedOnly
                ? 'No bookmarked messages in this channel'
                : `Beginning of ${title}`}
            </h3>
            <p className="text-[11px] text-[#706C7B] max-w-sm mt-1">
              {showPinnedOnly
                ? 'Pin messages to highlight important notes.'
                : showSavedOnly
                ? 'Bookmark any message using the hover menu to save it for quick reference.'
                : 'Type / to use slash commands (/poll, /spoiler, /code), format with Markdown, or drop files.'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const isSelf = msg.senderId === currentUser.uid;
            const isReadByRecipient = msg.readBy && msg.readBy.length > 1;
            const isBookmarked = savedMessageIds.includes(msg.id);
            const prevMsg = idx > 0 ? filteredMessages[idx - 1] : null;
            const isGrouped =
              prevMsg &&
              prevMsg.senderId === msg.senderId &&
              !msg.replyTo &&
              !msg.poll &&
              new Date(msg.createdAt).getTime() -
                new Date(prevMsg.createdAt).getTime() <
                5 * 60 * 1000;

            const blocks = parseMessageBlocks(msg.content);

            return (
              <div
                key={msg.id}
                className={`group relative flex items-start gap-3 px-2.5 py-1 -mx-2.5 rounded-md transition-colors hover:bg-[#101014] ${
                  msg.isPinned
                    ? 'bg-[#17171F]/50 border-l-2 border-[#8957F5]'
                    : isBookmarked
                    ? 'bg-[#17171F]/30 border-l-2 border-[#A47BFF]'
                    : ''
                } ${isGrouped ? 'mt-0.5' : 'mt-2'}`}
              >
                {/* Avatar or Timestamp */}
                {!isGrouped ? (
                  <img
                    src={
                      msg.senderAvatar ||
                      generateInitialsAvatar(msg.senderName || 'User')
                    }
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-md object-cover shrink-0 mt-0.5 bg-[#17171F]"
                  />
                ) : (
                  <div className="w-8 shrink-0 text-[10px] font-mono text-[#706C7B] opacity-0 group-hover:opacity-100 text-right pt-0.5 tabular-nums">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  {msg.replyTo && (
                    <div className="flex items-center gap-1.5 text-[10px] text-[#706C7B] mb-0.5">
                      <CornerDownRight className="w-3 h-3 text-[#8957F5]" />
                      <span className="font-medium text-[#A19DAD]">
                        {msg.replyTo.senderName}
                      </span>
                      <span className="truncate max-w-md text-[#706C7B]">
                        “{msg.replyTo.content}”
                      </span>
                    </div>
                  )}

                  {!isGrouped && (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`text-xs font-semibold ${
                          isSelf ? 'text-[#8957F5]' : 'text-[#F5F3FA]'
                        }`}
                      >
                        {msg.senderName}
                      </span>

                      {(msg.senderRole === 'root_owner' ||
                        msg.senderRole === 'owner') && (
                        <span className="text-[9px] font-mono uppercase text-[#A47BFF] flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" />
                          OWNER
                        </span>
                      )}

                      {msg.senderNitroTier && msg.senderNitroTier !== 'free' && (
                        <Crown className="w-3 h-3 text-[#C4B1FF]" />
                      )}

                      <span className="text-[10px] text-[#706C7B] font-mono tabular-nums">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {msg.isEdited && (
                        <span className="text-[10px] text-[#706C7B]">
                          (edited)
                        </span>
                      )}

                      {isSelf && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[10px] font-mono ml-0.5"
                          title={
                            isReadByRecipient ? 'Read' : 'Delivered'
                          }
                        >
                          {isReadByRecipient ? (
                            <span className="text-[#8957F5] flex items-center gap-0.5">
                              <CheckCheck className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="text-[#706C7B] flex items-center gap-0.5">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  )}

                  {editingMessageId === msg.id ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(msg.id);
                          if (e.key === 'Escape') setEditingMessageId(null);
                        }}
                        className="flex-1 bg-[#17171F] text-[#F5F3FA] text-xs px-2.5 py-1 rounded-md border border-[#8957F5] outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(msg.id)}
                        className="px-2 py-0.5 text-xs font-medium bg-[#8957F5] text-white rounded-md"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="px-1.5 py-0.5 text-xs text-[#706C7B] hover:text-[#F5F3FA]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {blocks.map((block, bIdx) => {
                        const blockKey = `${msg.id}_blk_${bIdx}`;
                        if (block.type === 'codeblock') {
                          return (
                            <div
                              key={blockKey}
                              className="my-1.5 rounded-lg bg-[#101014] border border-[#282631] overflow-hidden max-w-2xl"
                            >
                              <div className="px-3 py-1 bg-[#17171F] border-b border-[#282631] flex items-center justify-between text-[10px] font-mono text-[#706C7B]">
                                <span>{block.language || 'code'}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyCode(block.code, blockKey)
                                  }
                                  className="flex items-center gap-1 text-[#A19DAD] hover:text-[#F5F3FA] transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>
                                    {copiedCodeKey === blockKey
                                      ? 'Copied'
                                      : 'Copy'}
                                  </span>
                                </button>
                              </div>
                              <pre className="p-3 text-[11px] font-mono text-[#F5F3FA] overflow-x-auto leading-relaxed">
                                <code>{block.code}</code>
                              </pre>
                            </div>
                          );
                        }

                        if (block.type === 'blockquote') {
                          return (
                            <blockquote
                              key={blockKey}
                              className="pl-3 border-l-2 border-[#8957F5] text-xs text-[#A19DAD] italic"
                            >
                              <InlineSegmentsRenderer
                                segments={block.segments}
                                revealedSpoilers={revealedSpoilers}
                                onToggleSpoiler={(k) =>
                                  setRevealedSpoilers((prev) => ({
                                    ...prev,
                                    [k]: !prev[k],
                                  }))
                                }
                                msgId={blockKey}
                              />
                            </blockquote>
                          );
                        }

                        return (
                          <div
                            key={blockKey}
                            className="text-xs text-[#F5F3FA] leading-relaxed whitespace-pre-wrap break-words"
                          >
                            <InlineSegmentsRenderer
                              segments={block.segments}
                              revealedSpoilers={revealedSpoilers}
                              onToggleSpoiler={(k) =>
                                setRevealedSpoilers((prev) => ({
                                  ...prev,
                                  [k]: !prev[k],
                                }))
                              }
                              msgId={blockKey}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Interactive Poll Card */}
                  {msg.poll && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-[#101014] border border-[#282631] max-w-md space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F5F3FA]">
                          <BarChart2 className="w-3.5 h-3.5 text-[#8957F5]" />
                          <span>{msg.poll.question}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#706C7B] uppercase">
                          Live Poll
                        </span>
                      </div>

                      {(() => {
                        const totalVotes = msg.poll.options.reduce(
                          (sum, o) => sum + (o.voterIds?.length || 0),
                          0
                        );
                        return (
                          <>
                            <div className="space-y-1.5">
                              {msg.poll.options.map((opt) => {
                                const votes = opt.voterIds?.length || 0;
                                const pct =
                                  totalVotes > 0
                                    ? Math.round((votes / totalVotes) * 100)
                                    : 0;
                                const hasVoted = opt.voterIds?.includes(
                                  currentUser.uid
                                );

                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => onVotePoll?.(msg.id, opt.id)}
                                    className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left transition-colors ${
                                      hasVoted
                                        ? 'border-[#8957F5] bg-[#17171F]'
                                        : 'border-[#282631] bg-[#0D0D12] hover:border-[#8957F5]/50'
                                    }`}
                                  >
                                    <div
                                      className="absolute inset-y-0 left-0 bg-[#8957F5]/20 transition-all duration-300"
                                      style={{ width: `${pct}%` }}
                                    />
                                    <div className="relative flex items-center justify-between gap-2 text-xs">
                                      <span className="font-medium text-[#F5F3FA] flex items-center gap-1.5">
                                        {opt.text}
                                        {hasVoted && (
                                          <Check className="w-3 h-3 text-[#A47BFF]" />
                                        )}
                                      </span>
                                      <span className="text-[10px] font-mono text-[#A19DAD] tabular-nums">
                                        {votes} ({pct}%)
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-[#706C7B] tabular-nums pt-0.5">
                              <span>
                                {totalVotes} total vote
                                {totalVotes === 1 ? '' : 's'}
                              </span>
                              <span>Click an option to vote</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="rounded-lg overflow-hidden border border-[#282631] max-w-sm bg-[#101014]"
                        >
                          {att.type === 'image' ? (
                            <img
                              src={att.url}
                              alt={att.name}
                              className="max-h-60 object-cover"
                            />
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-2">
                              <Paperclip className="w-4 h-4 text-[#8957F5]" />
                              <span className="text-xs text-[#F5F3FA]">
                                {att.name}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                        const hasReacted = userIds.includes(currentUser.uid);
                        return (
                          <button
                            key={emoji}
                            onClick={() => onToggleReaction(msg.id, emoji)}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border transition-colors ${
                              hasReacted
                                ? 'bg-[#8957F5]/15 border-[#8957F5]/40 text-[#C4B1FF]'
                                : 'bg-[#101014] border-[#282631] text-[#A19DAD] hover:border-[#8957F5]/30'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-mono tabular-nums">
                              {userIds.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute right-2 -top-2 hidden group-hover:flex items-center gap-0.5 p-0.5 rounded-md bg-[#17171F] border border-[#282631] shadow-lg z-10">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowEmojiPickerFor(
                          showEmojiPickerFor === msg.id ? null : msg.id
                        )
                      }
                      className="p-1 text-[#706C7B] hover:text-[#F5F3FA] rounded hover:bg-[#22212C]"
                      title="React"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>

                    {showEmojiPickerFor === msg.id && (
                      <div className="absolute right-0 bottom-full mb-1 flex items-center gap-1 p-1 rounded-md bg-[#17171F] border border-[#282631] shadow-xl z-20">
                        {COMMON_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              onToggleReaction(msg.id, emoji);
                              setShowEmojiPickerFor(null);
                            }}
                            className="p-1 hover:scale-125 transition-transform text-xs"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="p-1 text-[#706C7B] hover:text-[#F5F3FA] rounded hover:bg-[#22212C]"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>

                  {onToggleBookmark && (
                    <button
                      onClick={() => onToggleBookmark(msg.id)}
                      className={`p-1 rounded hover:bg-[#22212C] ${
                        isBookmarked
                          ? 'text-[#A47BFF]'
                          : 'text-[#706C7B] hover:text-[#F5F3FA]'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Message'}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onTogglePin(msg.id)}
                    className={`p-1 rounded hover:bg-[#22212C] ${
                      msg.isPinned
                        ? 'text-[#8957F5]'
                        : 'text-[#706C7B] hover:text-[#F5F3FA]'
                    }`}
                    title={msg.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  {isSelf && (
                    <>
                      <button
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditContent(msg.content);
                        }}
                        className="p-1 text-[#706C7B] hover:text-[#F5F3FA] rounded hover:bg-[#22212C]"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        className="p-1 text-[#ED4245] hover:bg-[#22212C] rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Indicator Bar */}
      {replyingTo && (
        <div className="px-5 py-1.5 bg-[#101014] border-t border-[#282631] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#A19DAD] min-w-0">
            <Reply className="w-3.5 h-3.5 text-[#8957F5] shrink-0" />
            <span className="shrink-0 text-[11px]">
              Replying to <strong className="text-[#F5F3FA]">{replyingTo.senderName}</strong>:
            </span>
            <span className="truncate text-[#706C7B] text-[11px]">
              “{replyingTo.content}”
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-[#706C7B] hover:text-[#F5F3FA] ml-2"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Slash Command Autocomplete Popup */}
      {matchingSlashCommands.length > 0 && (
        <div className="mx-5 mb-1 rounded-xl bg-[#101014] border border-[#282631] shadow-2xl overflow-hidden z-20">
          <div className="px-3 py-1.5 bg-[#17171F] border-b border-[#282631] flex items-center justify-between text-[10px] font-mono text-[#706C7B]">
            <span className="flex items-center gap-1.5 text-[#A47BFF]">
              <Terminal className="w-3 h-3" />
              <span>SLASH COMMANDS</span>
            </span>
            <span>TAB or CLICK to insert</span>
          </div>
          <div className="p-1.5 space-y-0.5 max-h-48 overflow-y-auto">
            {matchingSlashCommands.map((cmd, idx) => (
              <button
                key={cmd.command}
                type="button"
                onClick={() => {
                  setInputValue(cmd.example);
                  inputRef.current?.focus();
                }}
                className={`w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  idx === selectedSlashIdx
                    ? 'bg-[#22212C] text-[#F5F3FA]'
                    : 'text-[#A19DAD] hover:bg-[#17171F]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-[#8957F5]">
                      {cmd.command}
                    </span>
                    <span className="text-[11px] text-[#706C7B] font-mono truncate">
                      {cmd.usage}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A19DAD] truncate">
                    {cmd.description}
                  </p>
                </div>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#17171F] border border-[#282631] text-[#C4B1FF] shrink-0">
                  {cmd.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer Emoji Palette Popover */}
      {showComposerEmoji && (
        <div className="absolute right-6 bottom-16 p-3 rounded-xl bg-[#101014] border border-[#282631] shadow-2xl z-30 w-64">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#706C7B]">
              Quick Emojis
            </span>
            <button
              onClick={() => setShowComposerEmoji(false)}
              className="text-[#706C7B] hover:text-[#F5F3FA]"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_PALETTE.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => {
                  setInputValue((prev) => `${prev}${em}`);
                  setShowComposerEmoji(false);
                  inputRef.current?.focus();
                }}
                className="p-1 rounded hover:bg-[#17171F] text-sm flex items-center justify-center transition-transform hover:scale-110"
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Composer */}
      <div className="px-5 py-2.5 bg-[#09090D] border-t border-[#282631]">
        {/* Quick Formatting & Slash Bar */}
        <div className="flex items-center justify-between mb-1.5 px-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**', 'bold')}
              title="Bold (**text**)"
              className="px-1.5 py-0.5 rounded text-[10px] text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F] flex items-center gap-1 transition-colors"
            >
              <Bold className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*', 'italic')}
              title="Italic (*text*)"
              className="px-1.5 py-0.5 rounded text-[10px] text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F] flex items-center gap-1 transition-colors"
            >
              <Italic className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('`', '`', 'code')}
              title="Inline Code (`code`)"
              className="px-1.5 py-0.5 rounded text-[10px] text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F] flex items-center gap-1 transition-colors"
            >
              <Code className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('||', '||', 'spoiler')}
              title="Spoiler Tag (||secret||)"
              className="px-1.5 py-0.5 rounded text-[10px] text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F] flex items-center gap-1 transition-colors"
            >
              <EyeOff className="w-3 h-3" />
              <span className="hidden sm:inline">Spoiler</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInputValue(
                  '/poll Next community event? | Gaming Tournament | Code Jam | Chill Stage'
                );
                inputRef.current?.focus();
              }}
              title="Create Interactive Poll (/poll)"
              className="px-1.5 py-0.5 rounded text-[10px] text-[#A47BFF] hover:bg-[#17171F] flex items-center gap-1 transition-colors"
            >
              <BarChart2 className="w-3 h-3" />
              <span>Poll</span>
            </button>
          </div>
          <span className="text-[10px] font-mono text-[#706C7B] hidden md:inline">
            Type <strong className="text-[#A47BFF]">/</strong> for commands
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#101014] border border-[#282631] focus-within:border-[#8957F5]/60 transition-colors">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload Attachment"
            className="p-1.5 text-[#706C7B] hover:text-[#F5F3FA] rounded hover:bg-[#17171F] transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,*/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <input
            ref={inputRef}
            type="text"
            placeholder={`Message ${title} or type / for commands...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-xs text-[#F5F3FA] placeholder-[#706C7B] outline-none px-1 h-7"
          />

          <span className="text-[10px] font-mono text-[#706C7B] tabular-nums hidden sm:inline">
            {inputValue.length}/{maxCharLimit}
          </span>

          <button
            type="button"
            onClick={() => setShowComposerEmoji((prev) => !prev)}
            title="Insert Emoji"
            className="p-1.5 text-[#706C7B] hover:text-[#F5F3FA] rounded hover:bg-[#17171F] transition-colors"
          >
            <Smile className="w-4 h-4" />
          </button>

          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="h-7 px-3 rounded bg-[#8957F5] hover:bg-[#7a4be6] text-white font-medium text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send className="w-3 h-3" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
