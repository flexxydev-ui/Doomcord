import React, { useState } from 'react';
import { X, Hash, Volume2, Radio, Bell } from 'lucide-react';
import { Channel, ChannelType } from '../../types';

interface CreateChannelModalProps {
  isOpen: boolean;
  communityId: string;
  onClose: () => void;
  onCreateChannel: (channel: Partial<Channel>) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  communityId,
  onClose,
  onCreateChannel
}) => {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<ChannelType>('text');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateChannel({
      communityId,
      name: name.toLowerCase().replace(/\s+/g, '-'),
      topic: topic.trim() || undefined,
      type,
      position: 10
    });

    setName('');
    setTopic('');
    onClose();
  };

  const CHANNEL_TYPES: { type: ChannelType; label: string; desc: string; icon: any }[] = [
    { type: 'text', label: 'Text Channel', desc: 'Post messages, images, files, and reactions', icon: Hash },
    { type: 'voice', label: 'Voice Channel', desc: 'Real-time spatial WebRTC audio room with mic visualizer', icon: Volume2 },
    { type: 'stage', label: 'Live Stage', desc: 'Moderated events with stage speakers and audience hand-raising', icon: Radio },
    { type: 'announcement', label: 'Announcements', desc: 'Important server broadcasts and updates', icon: Bell }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md p-6 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white tracking-wide">Create Channel</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel Type Selector */}
          <div>
            <label className="text-xs font-semibold text-white block mb-2">Channel Type</label>
            <div className="space-y-2">
              {CHANNEL_TYPES.map((ct) => {
                const Icon = ct.icon;
                const isSelected = type === ct.type;
                return (
                  <button
                    key={ct.type}
                    type="button"
                    onClick={() => setType(ct.type)}
                    className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[oklch(0.235_0.032_158)] border-[oklch(0.85_0.12_165)] shadow-sm'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-[oklch(0.85_0.12_165)]' : 'text-[oklch(0.7_0.03_155)]'}`} />
                    <div>
                      <span className="text-xs font-bold text-white block">{ct.label}</span>
                      <span className="text-[11px] text-[oklch(0.7_0.03_155)] block">{ct.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white block mb-1">Channel Name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">#</span>
              <input
                type="text"
                placeholder="new-channel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs pl-7 pr-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)] font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white block mb-1">Channel Topic (Optional)</label>
            <input
              type="text"
              placeholder="What is this channel about?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[oklch(0.7_0.03_155)] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] rounded-xl shadow-md disabled:opacity-40 hover:opacity-95 transition-all"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
