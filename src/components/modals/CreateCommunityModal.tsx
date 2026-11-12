import React, { useState } from 'react';
import { X, Users, Sparkles, Hash, Volume2, Radio, Megaphone } from 'lucide-react';
import { Community } from '../../types';
import {
  COMMUNITY_TEMPLATES,
  CommunityStarterTemplate,
} from '../../lib/chatEnhancements';
import { ImageUploader } from '../common/ImageUploader';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    community: Partial<Community>,
    template?: CommunityStarterTemplate
  ) => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [themeColor] = useState('#8957F5');

  if (!isOpen) return null;

  const selectedTemplate = COMMUNITY_TEMPLATES.find(
    (t) => t.id === selectedTemplateId
  );

  const handleApplyTemplate = (tpl: CommunityStarterTemplate) => {
    setSelectedTemplateId(tpl.id);
    setName(tpl.name);
    setDescription(tpl.description);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate(
      {
        name: name.trim(),
        description:
          description.trim() || 'A welcoming Doomcord community server.',
        iconUrl: iconUrl.trim() || undefined,
        themeColor: selectedTemplate?.themeColor || themeColor,
        isPublic: true,
      },
      selectedTemplate
    );

    setName('');
    setDescription('');
    setIconUrl('');
    setSelectedTemplateId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg p-6 rounded-2xl bg-[#101014] border border-[#282631] shadow-2xl text-[#F5F3FA] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8957F5]" />
            <h3 className="text-base font-semibold text-[#F5F3FA] tracking-wide">
              Create Community Server
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#706C7B] hover:text-[#F5F3FA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Starter Templates */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A47BFF] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Starter Server Templates (Multi-Channel)</span>
            </span>
            {selectedTemplate && (
              <button
                type="button"
                onClick={() => setSelectedTemplateId(null)}
                className="text-[11px] text-[#706C7B] hover:text-[#F5F3FA]"
              >
                Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {COMMUNITY_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#17171F] border-[#8957F5]'
                      : 'bg-[#0D0D12] border-[#282631] hover:border-[#8957F5]/40'
                  }`}
                >
                  <div className="text-[10px] font-mono text-[#A47BFF] uppercase mb-0.5">
                    {tpl.category}
                  </div>
                  <div className="text-xs font-semibold text-[#F5F3FA] truncate">
                    {tpl.name}
                  </div>
                  <div className="text-[10px] text-[#706C7B] font-mono mt-1 tabular-nums">
                    {tpl.channels.length} pre-built channels
                  </div>
                </button>
              );
            })}
          </div>

          {selectedTemplate && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-[#0D0D12] border border-[#282631]">
              <div className="text-[10px] font-mono uppercase text-[#706C7B] mb-1.5">
                Included Channels in Template:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedTemplate.channels.map((ch) => (
                  <span
                    key={ch.name}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#17171F] border border-[#282631] text-[10px] font-mono text-[#A19DAD]"
                  >
                    {ch.type === 'announcement' ? (
                      <Megaphone className="w-2.5 h-2.5 text-[#A47BFF]" />
                    ) : ch.type === 'voice' ? (
                      <Volume2 className="w-2.5 h-2.5 text-[#8957F5]" />
                    ) : ch.type === 'stage' ? (
                      <Radio className="w-2.5 h-2.5 text-[#C4B1FF]" />
                    ) : (
                      <Hash className="w-2.5 h-2.5 text-[#706C7B]" />
                    )}
                    {ch.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#A19DAD] block mb-1">
              Community Name
            </label>
            <input
              type="text"
              placeholder="e.g. Vanguard Gaming Guild, Quantum Collective"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#17171F] text-[#F5F3FA] text-xs px-3.5 py-2.5 rounded-lg border border-[#282631] outline-none focus:border-[#8957F5] transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#A19DAD] block mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="What is your server all about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#17171F] text-[#F5F3FA] text-xs px-3.5 py-2.5 rounded-lg border border-[#282631] outline-none focus:border-[#8957F5] resize-none transition-colors"
            />
          </div>

          <ImageUploader
            label="Server Icon (Optional)"
            variant="avatar"
            value={iconUrl}
            onChange={setIconUrl}
            fallbackInitials={name || 'DC'}
          />

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
              {selectedTemplate
                ? `Launch Server (${selectedTemplate.channels.length} Channels)`
                : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
