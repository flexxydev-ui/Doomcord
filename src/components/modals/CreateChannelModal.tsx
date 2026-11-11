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
  onCreateChannel,
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
      position: 10,
    });

    setName('');
    setTopic('');
    onClose();
  };

  const CHANNEL_TYPES: {
    type: ChannelType;
    label: string;
    desc: string;
    icon: any;
  }[] = [
    {
      type: 'text',
      label: 'Text Channel',
      desc: 'Post messages, images, files, and reactions',
      icon: Hash,
    },
    {
      type: 'voice',
      label: 'Voice Channel',
      desc: 'Real-time spatial WebRTC audio room with mic visualizer',
      icon: Volume2,
    },
    {
      type: 'stage',
      label: 'Live Stage',
      desc: 'Moderated events with stage speakers and audience hand-raising',
      icon: Radio,
    },
    {
      type: 'announcement',
      label: 'Announcements',
      desc: 'Important server broadcasts and updates',
      icon: Bell,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md p-6 rounded-2xl bg-[#101014] border border-[#282631] shadow-2xl text-[#F5F3FA]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#F5F3FA] tracking-wide">
            Create Channel
          </h3>
          <button
            onClick={onClose}
            className="text-[#706C7B] hover:text-[#F5F3FA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel Type Selector */}
          <div>
            <label className="text-xs font-medium text-[#A19DAD] block mb-2">
              Channel Type
            </label>
            <div className="space-y-2">
              {CHANNEL_TYPES.map((ct) => {
                const Icon = ct.icon;
                const isSelected = type === ct.type;
                return (
                  <button
                    key={ct.type}
                    type="button"
                    onClick={() => setType(ct.type)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                      isSelected
                        ? 'bg-[#17171F] border-[#8957F5] shadow-sm'
                        : 'bg-[#101014] border-[#282631] hover:bg-[#17171F]/50'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        isSelected ? 'text-[#8957F5]' : 'text-[#706C7B]'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#F5F3FA] block">
                        {ct.label}
                      </span>
                      <span className="text-[11px] text-[#A19DAD] block">
                        {ct.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#A19DAD] block mb-1">
              Channel Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#706C7B] font-mono text-xs">
                #
              </span>
              <input
                type="text"
                placeholder="new-channel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#17171F] text-[#F5F3FA] text-xs pl-7 pr-3.5 py-2.5 rounded-lg border border-[#282631] outline-none focus:border-[#8957F5] font-mono transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#A19DAD] block mb-1">
              Channel Topic (Optional)
            </label>
            <input
              type="text"
              placeholder="What is this channel about?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[#17171F] text-[#F5F3FA] text-xs px-3.5 py-2.5 rounded-lg border border-[#282631] outline-none focus:border-[#8957F5] transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#282631]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#A19DAD] hover:text-[#F5F3FA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#8957F5] hover:bg-[#7846E4] rounded-lg shadow-sm shadow-[#8957F5]/20 disabled:opacity-40 transition-colors"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
