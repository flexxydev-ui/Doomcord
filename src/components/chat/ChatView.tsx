import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Smile, Paperclip, Check, CheckCheck, 
  Pin, Edit3, Trash2, Reply, X, Search, 
  Bell, BellOff, Image as ImageIcon, MoreVertical, 
  CornerDownRight 
} from 'lucide-react';
import { ChatMessage, UserProfile, MessageAttachment } from '../../types';

interface ChatViewProps {
  title: string;
  subtitle?: string;
  conversationId: string;
  currentUser: UserProfile;
  recipientProfile?: UserProfile;
  messages: ChatMessage[];
  onSendMessage: (content: string, attachments?: MessageAttachment[], replyTo?: any) => void;
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
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onToggleReaction,
  onTogglePin,
  onMarkAsRead
}) => {
  const [inputValue, setInputValue] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  // CRITICAL REQUIREMENT: Mark messages as read when user opens or receives messages
  useEffect(() => {
    if (conversationId) {
      onMarkAsRead(conversationId);
    }
  }, [conversationId, messages, onMarkAsRead]);

  // Filter messages based on search query or pinned state
  const filteredMessages = messages.filter((msg) => {
    if (showPinnedOnly && !msg.isPinned) return false;
    if (!searchQuery.trim()) return true;
    return msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           msg.senderName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const pinnedMessages = messages.filter(m => m.isPinned);

  const maxCharLimit = currentUser.nitroTier === 'nitro' ? 4000 : 2000;

  const handleSend = () => {
    if (!inputValue.trim()) return;
    if (inputValue.length > maxCharLimit) return;

    onSendMessage(
      inputValue.trim(),
      undefined,
      replyingTo ? {
        id: replyingTo.id,
        senderName: replyingTo.senderName,
        content: replyingTo.content.slice(0, 100)
      } : undefined
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

  // Image upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const attachment: MessageAttachment = {
        id: `att_${Date.now()}`,
        name: file.name,
        url: dataUrl,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        size: file.size
      };
      onSendMessage(file.type.startsWith('image/') ? 'Shared an image' : `Attached ${file.name}`, [attachment]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[oklch(0.2_0.03_160)] overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[oklch(0.17_0.028_161)] border-b border-white/5 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            {recipientProfile ? (
              <img
                src={recipientProfile.photoURL}
                alt={recipientProfile.displayName}
                className="w-9 h-9 rounded-xl object-cover bg-black/20"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[oklch(0.85_0.12_165)]/20 border border-[oklch(0.85_0.12_165)]/30 flex items-center justify-center text-[oklch(0.85_0.12_165)] font-bold text-sm">
                #
              </div>
            )}
            {recipientProfile && (
              <div 
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[oklch(0.17_0.028_161)] ${
                  recipientProfile.presence === 'online' ? 'bg-[oklch(0.85_0.12_165)]' :
                  recipientProfile.presence === 'idle' ? 'bg-[oklch(0.84_0.14_85)]' :
                  recipientProfile.presence === 'dnd' ? 'bg-[oklch(0.72_0.15_355)]' : 'bg-gray-500'
                }`}
              />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">{title}</h2>
              {recipientProfile && (
                <span className="text-xs text-[oklch(0.7_0.03_155)] font-mono">
                  @{recipientProfile.username}
                </span>
              )}
            </div>
            <p className="text-xs text-[oklch(0.7_0.03_155)] truncate max-w-md">
              {subtitle || (recipientProfile?.statusMessage || 'Active in Doomcord realm')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          <div className="relative">
            {isSearching ? (
              <div className="flex items-center bg-[oklch(0.235_0.032_158)] rounded-lg px-2.5 py-1 border border-white/10">
                <Search className="w-3.5 h-3.5 text-[oklch(0.7_0.03_155)] mr-1.5" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none w-36"
                  autoFocus
                />
                <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="text-gray-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearching(true)}
                title="Search conversation"
                className="p-2 text-[oklch(0.7_0.03_155)] hover:text-white hover:bg-[oklch(0.235_0.032_158)] rounded-lg transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Pinned Messages Toggle */}
          <button
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            title={showPinnedOnly ? 'Show all messages' : 'View pinned messages'}
            className={`p-2 rounded-lg transition-colors relative ${
              showPinnedOnly 
                ? 'bg-[oklch(0.85_0.12_165)]/20 text-[oklch(0.85_0.12_165)]' 
                : 'text-[oklch(0.7_0.03_155)] hover:text-white hover:bg-[oklch(0.235_0.032_158)]'
            }`}
          >
            <Pin className="w-4 h-4" />
            {pinnedMessages.length > 0 && !showPinnedOnly && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[oklch(0.85_0.12_165)]" />
            )}
          </button>

          {/* Mute Conversation */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
            className={`p-2 rounded-lg transition-colors ${
              isMuted 
                ? 'text-[oklch(0.72_0.15_355)] bg-[oklch(0.72_0.15_355)]/20' 
                : 'text-[oklch(0.7_0.03_155)] hover:text-white hover:bg-[oklch(0.235_0.032_158)]'
            }`}
          >
            {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Pinned Messages Top Strip (if any pinned) */}
      {pinnedMessages.length > 0 && !showPinnedOnly && (
        <div className="flex items-center justify-between px-6 py-2 bg-[oklch(0.235_0.032_158)]/70 border-b border-white/5 text-xs">
          <div className="flex items-center gap-2 text-[oklch(0.85_0.12_165)]">
            <Pin className="w-3.5 h-3.5 rotate-45" />
            <span className="font-semibold">{pinnedMessages.length} Pinned message{pinnedMessages.length > 1 ? 's' : ''}:</span>
            <span className="text-[oklch(0.7_0.03_155)] truncate max-w-xl">
              "{pinnedMessages[0].content}"
            </span>
          </div>
          <button
            onClick={() => setShowPinnedOnly(true)}
            className="text-[oklch(0.85_0.12_165)] hover:underline font-medium"
          >
            View all
          </button>
        </div>
      )}

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-2xl bg-[oklch(0.17_0.028_161)] border border-white/5 flex items-center justify-center text-[oklch(0.85_0.12_165)] mb-3">
              <Smile className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {showPinnedOnly ? 'No pinned messages' : 'The start of something great'}
            </h3>
            <p className="text-xs text-[oklch(0.7_0.03_155)] max-w-sm">
              {showPinnedOnly 
                ? 'Pin important messages to find them easily later.' 
                : `Send a message to break the ice and start communicating in real time.`}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isSelf = msg.senderId === currentUser.uid;
            const isReadByRecipient = msg.readBy && msg.readBy.length > 1;

            return (
              <div 
                key={msg.id}
                className={`group relative flex items-start gap-3 p-2 -mx-2 rounded-xl transition-colors hover:bg-[oklch(0.17_0.028_161)]/40 ${
                  msg.isPinned ? 'bg-[oklch(0.85_0.12_165)]/5 border-l-2 border-[oklch(0.85_0.12_165)]' : ''
                }`}
              >
                {/* Avatar */}
                <img
                  src={msg.senderAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderId}&backgroundColor=0d382e`}
                  alt={msg.senderName}
                  className="w-10 h-10 rounded-xl object-cover shrink-0 mt-0.5 bg-black/20"
                />

                {/* Message Body */}
                <div className="flex-1 min-w-0">
                  {/* Reply Reference Header */}
                  {msg.replyTo && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[oklch(0.7_0.03_155)] mb-1">
                      <CornerDownRight className="w-3 h-3 text-[oklch(0.85_0.12_165)]" />
                      <span className="font-medium text-white">{msg.replyTo.senderName}</span>
                      <span className="truncate max-w-md italic">"{msg.replyTo.content}"</span>
                    </div>
                  )}

                  {/* Header: Sender Name, Timestamp, Read Status Indicator */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${isSelf ? 'text-[oklch(0.85_0.12_165)]' : 'text-white'}`}>
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-[oklch(0.7_0.03_155)] font-mono tabular-nums">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.isEdited && (
                      <span className="text-[10px] text-[oklch(0.7_0.03_155)] italic">(edited)</span>
                    )}

                    {/* CRITICAL READ STATUS INDICATOR FOR SENDER */}
                    {isSelf && (
                      <div 
                        className="flex items-center gap-1 text-[11px] ml-1"
                        title={isReadByRecipient ? `Read by recipient` : `Sent / Delivered`}
                      >
                        {isReadByRecipient ? (
                          <span className="flex items-center text-[oklch(0.85_0.12_165)] font-medium">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-mono ml-0.5">Read</span>
                          </span>
                        ) : (
                          <span className="flex items-center text-[oklch(0.7_0.03_155)]">
                            <Check className="w-3 h-3" />
                            <span className="text-[9px] font-mono ml-0.5">Delivered</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Content or Edit Input */}
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
                        className="flex-1 bg-[oklch(0.235_0.032_158)] text-white text-xs px-3 py-1.5 rounded-lg border border-[oklch(0.85_0.12_165)] outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(msg.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-[oklch(0.85_0.12_165)] text-black rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-[oklch(0.95_0.015_150)] leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  )}

                  {/* Attachments / Image Previews */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {msg.attachments.map((att) => (
                        <div key={att.id} className="relative group/att rounded-xl overflow-hidden border border-white/10 max-w-sm">
                          {att.type === 'image' ? (
                            <img
                              src={att.url}
                              alt={att.name}
                              className="max-h-64 object-cover rounded-xl"
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-[oklch(0.17_0.028_161)]">
                              <Paperclip className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
                              <span className="text-xs text-white">{att.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reactions Display */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                        const hasReacted = userIds.includes(currentUser.uid);
                        return (
                          <button
                            key={emoji}
                            onClick={() => onToggleReaction(msg.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs border transition-all ${
                              hasReacted
                                ? 'bg-[oklch(0.85_0.12_165)]/20 border-[oklch(0.85_0.12_165)]/40 text-[oklch(0.85_0.12_165)]'
                                : 'bg-[oklch(0.17_0.028_161)] border-white/5 text-[oklch(0.7_0.03_155)] hover:border-white/10'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-mono tabular-nums">{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Floating Quick Action Toolbar on Hover */}
                <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 p-1 rounded-xl bg-[oklch(0.17_0.028_161)] border border-white/10 shadow-lg z-10">
                  {/* Emoji Reaction Quick Picker */}
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPickerFor(showEmojiPickerFor === msg.id ? null : msg.id)}
                      className="p-1.5 text-[oklch(0.7_0.03_155)] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                      title="Add reaction"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>

                    {showEmojiPickerFor === msg.id && (
                      <div className="absolute right-0 bottom-full mb-1 flex items-center gap-1 p-1.5 rounded-xl bg-[oklch(0.14_0.025_162)] border border-white/10 shadow-2xl z-20">
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

                  {/* Reply Button */}
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="p-1.5 text-[oklch(0.7_0.03_155)] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>

                  {/* Pin Button */}
                  <button
                    onClick={() => onTogglePin(msg.id)}
                    className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${
                      msg.isPinned ? 'text-[oklch(0.85_0.12_165)]' : 'text-[oklch(0.7_0.03_155)] hover:text-white'
                    }`}
                    title={msg.isPinned ? 'Unpin message' : 'Pin message'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit/Delete for own messages */}
                  {isSelf && (
                    <>
                      <button
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditContent(msg.content);
                        }}
                        className="p-1.5 text-[oklch(0.7_0.03_155)] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                        title="Edit message"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        className="p-1.5 text-[oklch(0.72_0.15_355)] hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                        title="Delete message"
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

      {/* Typing Indicator Bar */}
      {typingUser && (
        <div className="px-6 py-1 text-[11px] text-[oklch(0.85_0.12_165)] flex items-center gap-1.5 font-medium animate-pulse">
          <div className="flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.85_0.12_165)]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.85_0.12_165)]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.85_0.12_165)]" />
          </div>
          <span>{typingUser} is typing...</span>
        </div>
      )}

      {/* Reply Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-6 py-2 bg-[oklch(0.17_0.028_161)] border-t border-white/5 text-xs">
          <div className="flex items-center gap-2 text-[oklch(0.7_0.03_155)]">
            <Reply className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)]" />
            <span>Replying to <strong className="text-white">{replyingTo.senderName}</strong>:</span>
            <span className="italic truncate max-w-sm">"{replyingTo.content}"</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Composer */}
      <div className="p-4 bg-[oklch(0.17_0.028_161)] border-t border-white/5">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-white/10 focus-within:border-[oklch(0.85_0.12_165)]/50 transition-all">
          {/* File Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach image or file"
            className="p-2 text-[oklch(0.7_0.03_155)] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Text Input */}
          <input
            type="text"
            placeholder={`Message ${title}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-xs text-white placeholder-[oklch(0.7_0.03_155)] outline-none px-2"
          />

          {/* Quick Emoji Button */}
          <button
            onClick={() => setInputValue(prev => prev + ' 🌲')}
            title="Insert forest emoji"
            className="p-2 text-[oklch(0.7_0.03_155)] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-2 rounded-xl bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
