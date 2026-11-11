import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { OrbData, OrbVisibility } from '../../types';

interface CreateOrbModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrb: (orb: Partial<OrbData>) => void;
}

export const CreateOrbModal: React.FC<CreateOrbModalProps> = ({
  isOpen,
  onClose,
  onCreateOrb,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<OrbData['category']>('Gaming');
  const [primaryColor, setPrimaryColor] = useState('#8957F5');
  const [secondaryColor, setSecondaryColor] = useState('#A47BFF');
  const [visibility, setVisibility] = useState<OrbVisibility>('public');
  const [tagsInput, setTagsInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onCreateOrb({
      name: name.trim(),
      description:
        description.trim() || `A spatial Orb dedicated to ${category}.`,
      category,
      primaryColor,
      secondaryColor,
      visibility,
      tags: tags.length > 0 ? tags : [category],
      memberCount: 1,
      activityScore: 85,
    });

    setName('');
    setDescription('');
    setTagsInput('');
    onClose();
  };

  const CATEGORIES: OrbData['category'][] = [
    'Gaming',
    'Coding',
    'Anime',
    'Music',
    'Art',
    'Science',
    'Study',
    'Tech',
    'Chill',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md p-6 rounded-2xl bg-[#101014] border border-[#282631] shadow-2xl text-[#F5F3FA]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8957F5]" />
            <h3 className="text-base font-semibold text-[#F5F3FA] tracking-wide">
              Forge a Spatial Orb
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#706C7B] hover:text-[#F5F3FA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#A19DAD] block mb-1">
              Orb Name
            </label>
            <input
              type="text"
              placeholder="e.g. Neon Cyberpunk, Deep Synthesizers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#17171F] text-[#F5F3FA] text-xs px-3.5 py-2.5 rounded-lg border border-[#282631] outline-none focus:border-[#8957F5] transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                Interest Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#17171F] text-[#F5F3FA] text-xs px-3 py-2.5 rounded-lg border border-[#282631] outline-none focus:border-[#8957F5] transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                Orb Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full bg-[#17171F] text-[#F5F3FA] text-xs px-3 py-2.5 rounded-lg border border-[#282631] outline-none focus:border-[#8957F5] transition-colors"
              >
                <option value="public">Public (Everyone)</option>
                <option value="friends">Friends Only</option>
                <option value="private">Private (Invite)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                Primary Color
              </label>
              <div className="flex items-center gap-2 bg-[#17171F] p-1.5 rounded-lg border border-[#282631]">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-[#F5F3FA]">
                  {primaryColor}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                Secondary Glow
              </label>
              <div className="flex items-center gap-2 bg-[#17171F] p-1.5 rounded-lg border border-[#282631]">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-[#F5F3FA]">
                  {secondaryColor}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#A19DAD] block mb-1">
              Tags (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. shaders, webgl, physics"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-[#17171F] text-[#F5F3FA] text-xs px-3.5 py-2.5 rounded-lg border border-[#282631] outline-none focus:border-[#8957F5] font-mono transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#A19DAD] block mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="What makes this Orb space unique?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#17171F] text-[#F5F3FA] text-xs px-3.5 py-2.5 rounded-lg border border-[#282631] outline-none focus:border-[#8957F5] resize-none transition-colors"
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
              Spawn Orb
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
