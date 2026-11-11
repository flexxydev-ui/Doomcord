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
} from 'lucide-react';
import { ChatMessage, UserProfile, MessageAttachment } from '../../types';
import {
  generateInitialsAvatar,
  isRootOwner,
} from '../../lib/dataService';

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
    replyTo?: { id: string; senderName: string; content: string }
  ) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string) => void;
  onMarkAsRead: (conversationId: string) => void;
}

const COMMON_REACTIONS = ['👍', '❤️', '🔥', '✨', '🌲', '😂', '🎯'];

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
  const [isMuted, setIsMuted] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const filteredMessages = messages.filter((msg) => {
    if (showPinnedOnly && !msg.isPinned) return false;
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

    onSendMessage(
      inputValue.trim(),
      undefined,
      replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            content: replyingTo.content.slice(0, 100),
          }
        : undefined
    );

    setInputValue('');
    setReplyingTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#101A17] overflow-hidden relative"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag-and-Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-4 rounded-2xl bg-[#192620]/95 border-2 border-dashed border-[#8BE2B8] z-40 flex flex-col items-center justify-center pointer-events-none">
          <Paperclip className="w-10 h-10 text-[#8BE2B8] mb-2" />
          <p className="text-sm font-display font-bold text-[#F0F5F1]">
            Drop file or image to share in {title}
          </p>
          <p className="text-xs text-[#9BAEA2] mt-1">
            Release to upload directly into the conversation
          </p>
        </div>
      )}

      {/* Top Conversation Header */}
      <header className="h-16 px-6 bg-[#101A17] border-b border-white/[0.06] flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            {recipientProfile ? (
              <img
                src={
                  recipientProfile.photoURL ||
                  generateInitialsAvatar(recipientProfile.displayName)
                }
                alt={recipientProfile.displayName}
                className="w-9 h-9 rounded-lg object-cover bg-[#1D2B24]"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#192620] border border-white/[0.08] flex items-center justify-center text-[#8BE2B8]">
                <Hash className="w-4 h-4" />
              </div>
            )}
            {recipientProfile && (
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#101A17] ${
                  recipientProfile.presence === 'online'
                    ? 'bg-[#6DD5A5]'
                    : recipientProfile.presence === 'idle'
                    ? 'bg-[#E4B869]'
                    : recipientProfile.presence === 'dnd'
                    ? 'bg-[#E57373]'
                    : 'bg-[#718478]'
                }`}
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-display font-bold text-[#F0F5F1] truncate">
                {title}
              </h2>
              {recipientProfile && (
                <span className="text-xs font-mono text-[#718478]">
                  @{recipientProfile.username}
                </span>
              )}
            </div>
            <p className="text-xs text-[#9BAEA2] truncate max-w-md">
              {subtitle ||
                recipientProfile?.statusMessage ||
                'Real-time conversation'}
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search Messages */}
          {isSearching ? (
            <div className="flex items-center bg-[#141F1B] rounded-lg px-2.5 h-8 border border-white/[0.08]">
              <Search className="w-3.5 h-3.5 text-[#718478] mr-1.5" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-[#F0F5F1] placeholder-[#718478] outline-none w-36"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                }}
                className="text-[#718478] hover:text-[#F0F5F1]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearching(true)}
              title="Search Conversation"
              className="w-8 h-8 rounded-lg text-[#9BAEA2] hover:text-[#F0F5F1] hover:bg-[#192620] flex items-center justify-center transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Pinned Messages Toggle */}
          <button
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            title={showPinnedOnly ? 'Show All Messages' : 'View Pinned Messages'}
            className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              showPinnedOnly
                ? 'bg-[#24362C] text-[#8BE2B8]'
                : 'text-[#9BAEA2] hover:text-[#F0F5F1] hover:bg-[#192620]'
            }`}
          >
            <Pin className="w-4 h-4" />
            {pinnedMessages.length > 0 && !showPinnedOnly && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#8BE2B8]" />
            )}
          </button>

          {/* Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isMuted
                ? 'bg-[#E57373]/15 text-[#E57373]'
                : 'text-[#9BAEA2] hover:text-[#F0F5F1] hover:bg-[#192620]'
            }`}
          >
            {isMuted ? (
              <BellOff className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
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
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                showRightPanel
                  ? 'bg-[#24362C] text-[#8BE2B8]'
                  : 'text-[#9BAEA2] hover:text-[#F0F5F1] hover:bg-[#192620]'
              }`}
            >
              {showRightPanel ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && !showPinnedOnly && (
        <div className="px-6 py-2 bg-[#141F1B] border-b border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#8BE2B8] min-w-0">
            <Pin className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold shrink-0 tabular-nums">
              {pinnedMessages.length} Pinned:
            </span>
            <span className="text-[#9BAEA2] truncate">
              “{pinnedMessages[0].content}”
            </span>
          </div>
          <button
            onClick={() => setShowPinnedOnly(true)}
            className="text-xs font-medium text-[#8BE2B8] hover:underline shrink-0 ml-4"
          >
            View All
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-xl bg-[#141F1B] border border-white/[0.07] flex items-center justify-center text-[#8BE2B8] mb-3">
              <Smile className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-display font-bold text-[#F0F5F1]">
              {showPinnedOnly
                ? 'No pinned messages in this conversation'
                : `Welcome to ${title}`}
            </h3>
            <p className="text-xs text-[#9BAEA2] max-w-sm mt-1">
              {showPinnedOnly
                ? 'Pin important messages from the message hover menu so everyone can reference them quickly.'
                : 'This is the beginning of your real-time conversation. Send a message or drop an attachment below.'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const isSelf = msg.senderId === currentUser.uid;
            const isReadByRecipient = msg.readBy && msg.readBy.length > 1;
            const prevMsg = idx > 0 ? filteredMessages[idx - 1] : null;
            const isGrouped =
              prevMsg &&
              prevMsg.senderId === msg.senderId &&
              !msg.replyTo &&
              new Date(msg.createdAt).getTime() -
                new Date(prevMsg.createdAt).getTime() <
                5 * 60 * 1000;

            return (
              <div
                key={msg.id}
                className={`group relative flex items-start gap-3.5 px-3 py-1.5 -mx-3 rounded-lg transition-colors hover:bg-[#141F1B] ${
                  msg.isPinned
                    ? 'bg-[#192620]/60 border-l-2 border-[#8BE2B8]'
                    : ''
                } ${isGrouped ? 'mt-0.5' : 'mt-3'}`}
              >
                {/* Avatar or Timestamp gutter */}
                {!isGrouped ? (
                  <img
                    src={
                      msg.senderAvatar ||
                      generateInitialsAvatar(msg.senderName || 'User')
                    }
                    alt={msg.senderName}
                    className="w-9 h-9 rounded-lg object-cover shrink-0 mt-0.5 bg-[#1D2B24]"
                  />
                ) : (
                  <div className="w-9 shrink-0 text-[10px] font-mono text-[#718478] opacity-0 group-hover:opacity-100 text-right pt-1 tabular-nums">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  {msg.replyTo && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#9BAEA2] mb-1">
                      <CornerDownRight className="w-3 h-3 text-[#8BE2B8]" />
                      <span className="font-semibold text-[#F0F5F1]">
                        {msg.replyTo.senderName}
                      </span>
                      <span className="truncate max-w-md text-[#718478]">
                        “{msg.replyTo.content}”
                      </span>
                    </div>
                  )}

                  {!isGrouped && (
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold ${
                          isSelf ? 'text-[#8BE2B8]' : 'text-[#F0F5F1]'
                        }`}
                      >
                        {msg.senderName}
                      </span>

                      {(msg.senderRole === 'root_owner' ||
                        msg.senderRole === 'owner') && (
                        <span className="text-[10px] font-mono uppercase text-[#D9BB79] flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" />
                          OWNER
                        </span>
                      )}

                      {msg.senderNitroTier && msg.senderNitroTier !== 'free' && (
                        <Crown className="w-3 h-3 text-[#D9BB79]" />
                      )}

                      <span className="text-[10px] text-[#718478] font-mono tabular-nums">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {msg.isEdited && (
                        <span className="text-[10px] text-[#718478]">
                          (edited)
                        </span>
                      )}

                      {isSelf && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[10px] font-mono ml-1"
                          title={
                            isReadByRecipient ? 'Read by recipient' : 'Delivered'
                          }
                        >
                          {isReadByRecipient ? (
                            <span className="text-[#8BE2B8] flex items-center gap-0.5">
                              <CheckCheck className="w-3 h-3" />
                              <span>Read</span>
                            </span>
                          ) : (
                            <span className="text-[#718478] flex items-center gap-0.5">
                              <Check className="w-3 h-3" />
                              <span>Sent</span>
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  )}

                  {editingMessageId === msg.id ? (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(msg.id);
                          if (e.key === 'Escape') setEditingMessageId(null);
                        }}
                        className="flex-1 bg-[#192620] text-[#F0F5F1] text-xs px-3 py-1.5 rounded-lg border border-[#8BE2B8] outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(msg.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-[#8BE2B8] text-[#101A17] rounded-md"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="px-2 py-1 text-xs text-[#9BAEA2] hover:text-[#F0F5F1]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="text-[13px] text-[#F0F5F1] leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  )}

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="rounded-xl overflow-hidden border border-white/[0.08] max-w-sm bg-[#141F1B]"
                        >
                          {att.type === 'image' ? (
                            <img
                              src={att.url}
                              alt={att.name}
                              className="max-h-64 object-cover"
                            />
                          ) : (
                            <div className="flex items-center gap-2 px-3.5 py-2.5">
                              <Paperclip className="w-4 h-4 text-[#8BE2B8]" />
                              <span className="text-xs text-[#F0F5F1]">
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
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                        const hasReacted = userIds.includes(currentUser.uid);
                        return (
                          <button
                            key={emoji}
                            onClick={() => onToggleReaction(msg.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border transition-colors ${
                              hasReacted
                                ? 'bg-[#24362C] border-[#8BE2B8]/40 text-[#8BE2B8]'
                                : 'bg-[#141F1B] border-white/[0.07] text-[#9BAEA2] hover:border-white/20'
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
                <div className="absolute right-3 -top-2 hidden group-hover:flex items-center gap-0.5 p-1 rounded-lg bg-[#192620] border border-white/[0.08] shadow-lg z-10">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowEmojiPickerFor(
                          showEmojiPickerFor === msg.id ? null : msg.id
                        )
                      }
                      className="p-1.5 text-[#9BAEA2] hover:text-[#F0F5F1] rounded hover:bg-[#24362C]"
                      title="React"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>

                    {showEmojiPickerFor === msg.id && (
                      <div className="absolute right-0 bottom-full mb-1 flex items-center gap-1 p-1.5 rounded-lg bg-[#141F1B] border border-white/10 shadow-xl z-20">
                        {COMMON_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              onToggleReaction(msg.id, emoji);
                              setShowEmojiPickerFor(null);
                            }}
                            className="p-1 hover:scale-125 transition-transform text-sm"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="p-1.5 text-[#9BAEA2] hover:text-[#F0F5F1] rounded hover:bg-[#24362C]"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onTogglePin(msg.id)}
                    className={`p-1.5 rounded hover:bg-[#24362C] ${
                      msg.isPinned
                        ? 'text-[#8BE2B8]'
                        : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
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
                        className="p-1.5 text-[#9BAEA2] hover:text-[#F0F5F1] rounded hover:bg-[#24362C]"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        className="p-1.5 text-[#E57373] hover:bg-[#24362C] rounded"
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
        <div className="px-6 py-2 bg-[#141F1B] border-t border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#9BAEA2] min-w-0">
            <Reply className="w-3.5 h-3.5 text-[#8BE2B8] shrink-0" />
            <span className="shrink-0">
              Replying to{' '}
              <strong className="text-[#F0F5F1]">{replyingTo.senderName}</strong>:
            </span>
            <span className="truncate text-[#718478]">
              “{replyingTo.content}”
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-[#718478] hover:text-[#F0F5F1] ml-3"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Message Composer */}
      <div className="px-6 py-4 bg-[#101A17] border-t border-white/[0.06]">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141F1B] border border-white/[0.08] focus-within:border-[#8BE2B8]/50 transition-colors">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload Attachment"
            className="p-2 text-[#9BAEA2] hover:text-[#F0F5F1] rounded-lg hover:bg-[#192620] transition-colors"
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
            type="text"
            placeholder={`Message ${title}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-xs text-[#F0F5F1] placeholder-[#718478] outline-none px-1 h-8"
          />

          <span className="text-[10px] font-mono text-[#718478] tabular-nums hidden sm:inline">
            {inputValue.length}/{maxCharLimit}
          </span>

          <button
            onClick={() => setInputValue((prev) => prev + ' ✨')}
            title="Insert Reaction"
            className="p-2 text-[#9BAEA2] hover:text-[#F0F5F1] rounded-lg hover:bg-[#192620] transition-colors"
          >
            <Smile className="w-4 h-4" />
          </button>

          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="h-8 px-3 rounded-lg bg-[#8BE2B8] hover:bg-[#7AD4A8] text-[#101A17] font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
