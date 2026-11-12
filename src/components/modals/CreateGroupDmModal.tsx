import React, { useState } from 'react';
import { X, Users, MessageSquare, Search, Check } from 'lucide-react';
import { UserProfile } from '../../types';

interface CreateGroupDmModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onClose: () => void;
  onStartDmWithUser: (user: UserProfile) => Promise<void>;
  onCreateGroupDm: (participantUids: string[], groupName: string) => Promise<void>;
}

export const CreateGroupDmModal: React.FC<CreateGroupDmModalProps> = ({
  isOpen,
  currentUser,
  allUsers,
  onClose,
  onStartDmWithUser,
  onCreateGroupDm,
}) => {
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  const eligibleUsers = allUsers.filter(
    (u) =>
      u.uid !== currentUser.uid &&
      !(currentUser.blockedUsers || []).includes(u.uid) &&
      (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleSelect = (uid: string) => {
    setSelectedUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUids.length === 0) return;
    setCreating(true);
    try {
      if (selectedUids.length === 1) {
        const target = allUsers.find((u) => u.uid === selectedUids[0]);
        if (target) {
          await onStartDmWithUser(target);
        }
      } else {
        const selectedNames = selectedUids
          .map((uid) => allUsers.find((u) => u.uid === uid)?.displayName)
          .filter(Boolean);
        const defaultName = `${currentUser.displayName}, ${selectedNames.join(', ')}`.slice(
          0,
          48
        );
        await onCreateGroupDm(selectedUids, groupName.trim() || defaultName);
      }
      setSelectedUids([]);
      setGroupName('');
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-[#101014] border border-[#282631] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 bg-[#0D0D12] border-b border-[#282631] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#17171F] border border-[#8957F5]/40 flex items-center justify-center text-[#8957F5]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F3FA]">
                New Direct Message or Group Chat
              </h3>
              <p className="text-[11px] text-[#706C7B]">
                Select 1 member for a direct message or 2+ for a Group DM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {selectedUids.length >= 2 && (
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#A19DAD] block mb-1.5">
                Group Conversation Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Raid Squad, Core Engineering, Design Sync"
                className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] focus:border-[#8957F5] text-xs text-[#F5F3FA] outline-none"
              />
            </div>
          )}

          <div>
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-[#706C7B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members by name or @username..."
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-[#09090D] border border-[#282631] focus:border-[#8957F5] text-xs text-[#F5F3FA] outline-none"
              />
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {eligibleUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#706C7B]">
                  No other registered users found.
                </div>
              ) : (
                eligibleUsers.map((u) => {
                  const isSelected = selectedUids.includes(u.uid);
                  return (
                    <button
                      key={u.uid}
                      type="button"
                      onClick={() => toggleSelect(u.uid)}
                      className={`w-full p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#17171F] border-[#8957F5]'
                          : 'bg-[#09090D] border-[#282631] hover:bg-[#17171F]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.photoURL}
                          alt={u.displayName}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <div className="text-left min-w-0">
                          <div className="text-xs font-semibold text-[#F5F3FA] truncate">
                            {u.displayName}
                          </div>
                          <div className="text-[10px] font-mono text-[#706C7B] truncate">
                            @{u.username}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isSelected
                            ? 'bg-[#8957F5] border-[#8957F5] text-white'
                            : 'border-[#282631]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-[#282631] flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-[#A19DAD]">
              {selectedUids.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 rounded-lg bg-[#17171F] text-xs font-medium text-[#A19DAD] hover:text-[#F5F3FA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedUids.length === 0 || creating}
                className="h-8 px-4 rounded-lg bg-[#8957F5] hover:bg-[#7846E4] disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>
                  {selectedUids.length >= 2
                    ? `Create Group DM (${selectedUids.length + 1})`
                    : 'Open Direct Message'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
