import React, { useState } from 'react';
import { X, Users, Sparkles } from 'lucide-react';
import { Community } from '../../types';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (community: Partial<Community>) => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [themeColor, setThemeColor] = useState('oklch(0.85 0.12 165)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      description: description.trim() || 'A welcoming Doomcord community.',
      iconUrl: iconUrl.trim() || undefined,
      themeColor,
      isPublic: true
    });

    setName('');
    setDescription('');
    setIconUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md p-6 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[oklch(0.85_0.12_165)]" />
            <h3 className="text-base font-bold text-white tracking-wide">Create Community</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white block mb-1">Community Name</label>
            <input
              type="text"
              placeholder="e.g. Pixel Crafters, Quantum Syndicate"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)]"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white block mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="What is your server all about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)] resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white block mb-1">Icon URL (Optional)</label>
            <input
              type="text"
              placeholder="https://..."
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)] font-mono"
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
              Create Community
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
