import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Eye,
  Crown,
  Layers,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  CosmeticItem,
  CosmeticCategory,
  UserProfile,
  EquippedCosmetics,
} from '../../types';
import { CheckoutPayload } from '../modals/RazorpayCheckoutModal';
import { generateInitialsAvatar, isRootOwner, formatApexTierName } from '../../lib/dataService';

const SHOP_CATEGORIES: ('All' | CosmeticCategory)[] = [
  'All',
  'Avatar Decorations',
  'Profile Effects',
  'Profile Themes',
  'Nameplates',
  'Profile Badges',
  'Banners',
  'Animated Avatars',
  'App Themes and Icons',
  'Chat Cosmetics',
  'Sound Effects',
  'Seasonal Collections',
  'Exclusive Bundles',
];

interface CosmeticsShopViewProps {
  currentUser: UserProfile;
  cosmetics: CosmeticItem[];
  globalDiscountPercent: number;
  onStartCheckout: (payload: CheckoutPayload) => void;
  onEquipCosmetic: (category: CosmeticCategory, itemId: string | undefined) => Promise<void>;
  onOpenNitro: () => void;
}

export const CosmeticsShopView: React.FC<CosmeticsShopViewProps> = ({
  currentUser,
  cosmetics,
  globalDiscountPercent,
  onStartCheckout,
  onEquipCosmetic,
  onOpenNitro,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | CosmeticCategory>('All');
  const [viewMode, setViewMode] = useState<'catalog' | 'inventory'>('catalog');

  const isMainOwner = isRootOwner(currentUser);

  // Interactive Sandbox Preview State (starts from user's currently equipped items)
  const [previewEquipped, setPreviewEquipped] = useState<EquippedCosmetics>(
    currentUser.equippedCosmetics || {}
  );

  const visibleCosmetics = useMemo(() => {
    return cosmetics.filter((item) => {
      if (!item.enabled) return false;
      if (viewMode === 'inventory') {
        const isOwned =
          isMainOwner || Boolean(currentUser.ownedCosmetics?.includes(item.id));
        const unlockedViaApex =
          currentUser.nitroTier === 'nitro' && item.nitroEligible !== 'none';
        if (!isOwned && !unlockedViaApex) return false;
      }
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [cosmetics, viewMode, selectedCategory, currentUser, isMainOwner]);

  const mapCategoryToEquipKey = (cat: CosmeticCategory): keyof EquippedCosmetics | null => {
    switch (cat) {
      case 'Avatar Decorations':
      case 'Seasonal Collections':
        return 'avatarDecoration';
      case 'Profile Effects':
        return 'profileEffect';
      case 'Profile Themes':
        return 'profileTheme';
      case 'Nameplates':
        return 'nameplate';
      case 'Banners':
        return 'banner';
      case 'App Themes and Icons':
        return 'appTheme';
      case 'Chat Cosmetics':
        return 'chatCosmetic';
      case 'Sound Effects':
        return 'soundEffect';
      default:
        return null;
    }
  };

  const handlePreviewItem = (item: CosmeticItem) => {
    if (item.category === 'Exclusive Bundles' && item.bundleItems) {
      const next = { ...previewEquipped };
      for (const subId of item.bundleItems) {
        const subItem = cosmetics.find((c) => c.id === subId);
        if (subItem) {
          const key = mapCategoryToEquipKey(subItem.category);
          if (key) next[key] = subItem.id;
        }
      }
      setPreviewEquipped(next);
      return;
    }

    const key = mapCategoryToEquipKey(item.category);
    if (key) {
      setPreviewEquipped((prev) => ({
        ...prev,
        [key]: prev[key] === item.id ? undefined : item.id,
      }));
    }
  };

  const calculateEffectivePrice = (basePrice: number): { finalINR: number; discountPct: number } => {
    let discountPct = globalDiscountPercent || 0;
    if (currentUser.nitroTier === 'nitro') {
      discountPct = Math.max(discountPct, 20);
    } else if (currentUser.nitroTier === 'basic') {
      discountPct = Math.max(discountPct, 10);
    }
    const finalINR = Math.max(1, Math.round(basePrice * (1 - discountPct / 100)));
    return { finalINR, discountPct };
  };

  // Resolve preview cosmetic objects for the Live Profile Previewer
  const previewFrame = cosmetics.find((c) => c.id === previewEquipped.avatarDecoration);
  const previewEffect = cosmetics.find((c) => c.id === previewEquipped.profileEffect);
  const previewTheme = cosmetics.find((c) => c.id === previewEquipped.profileTheme);
  const previewNameplate = cosmetics.find((c) => c.id === previewEquipped.nameplate);
  const previewBanner = cosmetics.find((c) => c.id === previewEquipped.banner);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full bg-[#09090D] overflow-hidden">
      {/* Left/Center Catalog & Inventory Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#101014] border-b border-[#282631]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#8957F5] text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-white tracking-tight">
                  DOOMCORD APEX Collection
                </h1>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8957F5]">
                  · RISE ABOVE. STAND APART.
                </span>
              </div>
              <p className="text-xs text-[#A19DAD]">
                APEX Avatar Frames, Profile Effects, Animated Banners, Nameplates, Themes & Exclusive Bundles (INR)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0D0D12] border border-[#282631]">
              <button
                onClick={() => setViewMode('catalog')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'catalog'
                    ? 'bg-[#17171F] text-white'
                    : 'text-[#A19DAD] hover:text-white'
                }`}
              >
                APEX Catalog ({cosmetics.filter((c) => c.enabled).length})
              </button>
              <button
                onClick={() => setViewMode('inventory')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'inventory'
                    ? 'bg-[#17171F] text-white'
                    : 'text-[#A19DAD] hover:text-white'
                }`}
              >
                My Inventory (
                {isMainOwner
                  ? cosmetics.filter((c) => c.enabled).length
                  : currentUser.ownedCosmetics?.length || 0}
                )
              </button>
            </div>

            <button
              onClick={onOpenNitro}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#8957F5] hover:bg-[#7846E4] rounded-xl shadow"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>
                {isMainOwner
                  ? 'OWNER_PERMANENT_APEX (All Unlocked)'
                  : currentUser.nitroTier === 'nitro'
                  ? '20% APEX+ Discount Active'
                  : 'Get 20% Off with APEX+'}
              </span>
            </button>
          </div>
        </div>

        {/* 12 Category Tabs Bar */}
        <div className="px-6 py-2.5 bg-[#0D0D12] border-b border-[#282631] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {SHOP_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-[#17171F] text-[#8957F5] font-bold'
                  : 'text-[#A19DAD] hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cosmetics Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {visibleCosmetics.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-[#101014] border border-[#282631]">
              <Layers className="w-8 h-8 text-[#8957F5] mb-2" />
              <h3 className="text-sm font-bold text-white">
                {viewMode === 'inventory'
                  ? 'No cosmetics in this category in your inventory yet'
                  : 'No cosmetics found in this category'}
              </h3>
              <p className="text-xs text-[#A19DAD] mt-1 max-w-sm">
                {viewMode === 'inventory'
                  ? 'Switch to the APEX Catalog to preview and unlock original Doomcord decorations.'
                  : 'Select another category from the navigation bar above.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {visibleCosmetics.map((item) => {
                const isOwned =
                  isMainOwner || Boolean(currentUser.ownedCosmetics?.includes(item.id));
                const equipKey = mapCategoryToEquipKey(item.category);
                const isEquipped = Boolean(
                  equipKey && currentUser.equippedCosmetics?.[equipKey] === item.id
                );
                const isPreviewing = Boolean(
                  equipKey && previewEquipped[equipKey] === item.id
                );

                const { finalINR, discountPct } = calculateEffectivePrice(item.priceINR);

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col justify-between p-5 rounded-3xl bg-[#101014] border transition-all shadow-xl ${
                      isPreviewing
                        ? 'border-[#8957F5]'
                        : 'border-[#282631] hover:border-white/15'
                    }`}
                  >
                    <div>
                      {/* Visual Preview Swatch */}
                      <div
                        className="h-28 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden border border-[#282631]"
                        style={{
                          background: `radial-gradient(circle at center, ${item.previewColorPrimary}33, ${item.previewColorSecondary}22, #071913)`,
                        }}
                      >
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xs ${item.cssPreviewClass}`}
                          style={{
                            backgroundColor: item.previewColorPrimary,
                          }}
                        >
                          <Sparkles className="w-6 h-6 text-white drop-shadow" />
                        </div>

                        <div className="absolute top-2.5 left-3 text-[10px] font-mono text-white/80">
                          {item.rarity}
                          {item.isLimitedEdition ? ' · Limited' : ''}
                        </div>

                        {item.nitroEligible !== 'none' && (
                          <div className="absolute top-2.5 right-3 text-[10px] font-mono text-[#8957F5]">
                            {item.nitroEligible === 'basic' ? 'APEX' : 'APEX+'} Privilege
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="text-[11px] text-[#A19DAD] mb-1">
                        {item.category} · {item.rarity}
                      </div>
                      <h3 className="text-sm font-bold text-white">{item.name}</h3>
                      <p className="text-xs text-[#A19DAD] mt-1 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Price & Actions */}
                    <div className="mt-4 pt-3 border-t border-[#282631] flex items-center justify-between gap-2">
                      <div>
                        {isOwned ? (
                          <span className="text-xs font-semibold text-[#8957F5] flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />{' '}
                            {isMainOwner ? 'Owner Permanent' : 'Owned Permanently'}
                          </span>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-white font-mono tabular-nums">
                              ₹{finalINR}
                            </span>
                            {discountPct > 0 && (
                              <span className="text-[11px] line-through text-[#A19DAD] font-mono tabular-nums">
                                ₹{item.priceINR}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePreviewItem(item)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1 ${
                            isPreviewing
                              ? 'bg-[#8957F5]/20 border-[#8957F5] text-[#8957F5]'
                              : 'bg-white/5 border-[#282631] text-[#F5F3FA] hover:bg-white/10'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isPreviewing ? 'Previewing' : 'Preview'}</span>
                        </button>

                        {isOwned ? (
                          equipKey && (
                            <button
                              type="button"
                              onClick={() =>
                                onEquipCosmetic(item.category, isEquipped ? undefined : item.id)
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                isEquipped
                                  ? 'bg-[#8957F5] text-white'
                                  : 'bg-[#8957F5] text-black'
                              }`}
                            >
                              {isEquipped ? 'Unequip' : 'Equip'}
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              onStartCheckout({
                                type: 'cosmetic_purchase',
                                itemId: item.id,
                                itemName: item.name,
                                description: `${item.category} · ${item.rarity}`,
                                amountINR: finalINR,
                              })
                            }
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#8957F5] hover:bg-[#7846E4] hover:opacity-95 shadow"
                          >
                            Buy ₹{finalINR}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Interactive Profile Preview Dock */}
      <div className="w-full lg:w-80 bg-[#0D0D12] border-t lg:border-t-0 lg:border-l border-[#282631] p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8957F5]">
                Interactive Sandbox
              </span>
              <h3 className="text-sm font-bold text-white">Live APEX Profile Preview</h3>
            </div>
            <button
              onClick={() => setPreviewEquipped(currentUser.equippedCosmetics || {})}
              title="Reset preview to currently equipped cosmetics"
              className="p-1.5 rounded-lg bg-white/5 text-[#A19DAD] hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Rendered User Profile Card */}
          <div
            className={`rounded-3xl p-4 border transition-all relative overflow-hidden shadow-2xl ${
              previewTheme
                ? previewTheme.cssPreviewClass
                : 'bg-[#101014] border-[#282631]'
            }`}
          >
            {/* Profile Effect Overlay */}
            {previewEffect && (
              <div
                className={`absolute inset-0 pointer-events-none opacity-60 ${previewEffect.cssPreviewClass}`}
              />
            )}

            {/* Banner */}
            <div
              className={`h-24 rounded-2xl mb-10 relative overflow-hidden ${
                previewBanner
                  ? previewBanner.cssPreviewClass
                  : 'bg-[#8957F5] hover:bg-[#7846E4]'
              }`}
            />

            {/* Avatar + Avatar Decoration Frame */}
            <div className="relative -mt-16 ml-3 mb-3 inline-block">
              <img
                src={
                  currentUser.photoURL ||
                  generateInitialsAvatar(currentUser.displayName)
                }
                alt={currentUser.displayName}
                className={`w-16 h-16 rounded-2xl object-cover bg-black/40 ${
                  previewFrame ? previewFrame.cssPreviewClass : 'ring-4 ring-[#101014]'
                }`}
              />
            </div>

            {/* Display Name + Nameplate */}
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-base font-bold ${
                    previewNameplate ? previewNameplate.cssPreviewClass : 'text-white'
                  }`}
                >
                  {currentUser.displayName}
                </span>
                {(currentUser.role === 'root_owner' || currentUser.role === 'owner') && (
                  <span className="text-[10px] font-mono text-[#C4B1FF]">
                    ROOT OWNER
                  </span>
                )}
                {currentUser.role === 'secondary_owner' && (
                  <span className="text-[10px] font-mono text-[#A47BFF]">
                    SECONDARY OWNER
                  </span>
                )}
              </div>

              <span className="text-xs font-mono text-[#A19DAD] block">
                @{currentUser.username} · {formatApexTierName(currentUser.nitroTier)}
              </span>

              <p className="text-xs text-[#F5F3FA] pt-2 leading-relaxed">
                {currentUser.bio || 'Customizing my DOOMCORD APEX identity in real time.'}
              </p>

              {/* Qualified Badges */}
              {currentUser.badges && currentUser.badges.length > 0 && (
                <div className="pt-3 flex items-center gap-2 flex-wrap text-[11px] text-[#8957F5] font-mono">
                  {currentUser.badges.map((b) => (
                    <span key={b}>★ {b.toUpperCase()}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Preview Breakdown */}
          <div className="mt-5 space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A19DAD] block">
              Previewing Combination
            </span>
            <div className="p-3 rounded-2xl bg-[#101014] border border-[#282631] space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#A19DAD]">Avatar Frame:</span>
                <span className="text-white font-medium">{previewFrame?.name || 'Default'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A19DAD]">Profile Effect:</span>
                <span className="text-white font-medium">{previewEffect?.name || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A19DAD]">Profile Theme:</span>
                <span className="text-white font-medium">{previewTheme?.name || 'Default'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A19DAD]">Nameplate:</span>
                <span className="text-white font-medium">{previewNameplate?.name || 'Standard'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A19DAD]">Banner:</span>
                <span className="text-white font-medium">{previewBanner?.name || 'Default'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
