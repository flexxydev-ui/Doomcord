import React, { useState } from 'react';
import { X, Sparkles, Globe, Lock, Shield } from 'lucide-react';
import { OrbData, OrbVisibility } from '../../types';

interface CreateOrbModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrb: (orb: Partial<OrbData>) => void;
}

export const CreateOrbModal: React.FC<CreateOrbModalProps> = ({
  isOpen,
  onClose,
  onCreateOrb
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<OrbData['category']>('Gaming');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#06b6d4');
  const [visibility, setVisibility] = useState<OrbVisibility>('public');
  const [tagsInput, setTagsInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onCreateOrb({
      name: name.trim(),
      description: description.trim() || `A spatial Orb dedicated to ${category}.`,
      category,
      primaryColor,
      secondaryColor,
      visibility,
      tags: tags.length > 0 ? tags : [category],
      memberCount: 1,
      activityScore: 85
    });

    setName('');
    setDescription('');
    setTagsInput('');
    onClose();
  };

  const CATEGORIES: OrbData['category'][] = [
    'Gaming', 'Coding', 'Anime', 'Music', 'Art', 'Science', 'Study', 'Tech', 'Chill'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md p-6 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[oklch(0.85_0.12_165)]" />
            <h3 className="text-base font-bold text-white tracking-wide">Forge a Spatial Orb</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white block mb-1">Orb Name</label>
            <input
              type="text"
              placeholder="e.g. Neon Cyberpunk, Deep Synthesizers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-white block mb-1">Interest Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)]"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-white block mb-1">Orb Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)]"
              >
                <option value="public">Public (Everyone)</option>
                <option value="friends">Friends Only</option>
                <option value="private">Private (Invite)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-white block mb-1">Primary Color</label>
              <div className="flex items-center gap-2 bg-[oklch(0.235_0.032_158)] p-1.5 rounded-xl border border-white/10">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-white">{primaryColor}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white block mb-1">Secondary Glow</label>
              <div className="flex items-center gap-2 bg-[oklch(0.235_0.032_158)] p-1.5 rounded-xl border border-white/10">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-white">{secondaryColor}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white block mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. shaders, webgl, physics"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)] font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white block mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="What makes this Orb space unique?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)] resize-none"
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
              Spawn Orb
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
