import { NitroPlanConfig, CosmeticItem, SystemConfigData } from '../types';

/**
 * Generates a deterministic, original SVG data URI avatar from a real user's display name and accent color.
 * Zero external image dependencies or fake photos.
 */
export function generateInitialsAvatar(name: string, bgColor = '#11362a'): string {
  const cleanName = (name || 'U').trim();
  const parts = cleanName.split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : cleanName.slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor}" />
        <stop offset="100%" stop-color="#071a14" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="28" fill="url(#g)" />
    <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#e6f7f0" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="46">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Default Doomcord Nitro Subscription Plans (INR)
 * Stored in Firestore /nitro_plans and editable in real time from the Admin Dashboard.
 */
export const INITIAL_NITRO_PLANS: NitroPlanConfig[] = [
  {
    id: 'plan_free',
    tier: 'free',
    name: 'Doomcord Free',
    tagline: 'Essential real-time messaging, communities, and public 3D Orbs.',
    monthlyPriceINR: 0,
    yearlyPriceINR: 0,
    uploadLimitMB: 25,
    maxMessageLength: 2000,
    shopDiscountPercent: 0,
    benefits: [
      'Standard real-time messaging & read receipts',
      'Basic profile customization & standard avatar/banner',
      'Basic forest-green themes',
      'Standard file uploads up to 25 MB',
      'Standard emojis and stickers',
      'Access to public Orbs and communities',
      'Basic profile badges & decoration collection',
    ],
    updatedAt: '2026-11-11T00:00:00Z',
  },
  {
    id: 'plan_nitro_basic',
    tier: 'basic',
    name: 'Doomcord Nitro Basic',
    tagline: 'Enhanced personal identity, animated avatars, and larger file sharing.',
    monthlyPriceINR: 49,
    yearlyPriceINR: 499,
    uploadLimitMB: 50,
    maxMessageLength: 2500,
    shopDiscountPercent: 10,
    benefits: [
      'Exclusive Nitro Basic profile badge',
      'Animated avatar support',
      'Profile theme & custom colour customization',
      'Premium avatar decorations & profile frames',
      'Premium emoji and sticker access',
      'Increased file upload limit up to 50 MB',
      'Exclusive profile cosmetics & selected profile effects',
      'Premium display name styling',
      'Nitro member pricing in the Cosmetics Shop (10% off)',
    ],
    updatedAt: '2026-11-11T00:00:00Z',
  },
  {
    id: 'plan_nitro_pro',
    tier: 'nitro',
    name: 'Doomcord Nitro',
    tagline: 'The ultimate Doomcord experience with full cosmetics, 500 MB uploads, and 20% shop discount.',
    monthlyPriceINR: 99,
    yearlyPriceINR: 999,
    uploadLimitMB: 500,
    maxMessageLength: 4000,
    shopDiscountPercent: 20,
    benefits: [
      'Everything included in Nitro Basic',
      'Exclusive animated Nitro badge',
      'Animated profile avatars & animated profile banners',
      'Advanced profile effects & complete premium decoration access',
      'Unlimited profile theme & custom background customization',
      'Advanced display name styles & per-community custom profiles',
      'Massive file uploads up to 500 MB',
      'Premium emojis, animated stickers & custom soundboard access',
      'Custom interface themes & exclusive app icons',
      'Two community boosts per billing cycle',
      '4,000-character long-form messages',
      'HD WebRTC voice & stage streaming',
      'Exclusive Nitro shop collections & early feature access',
      '20% discount on all eligible Cosmetics Shop purchases',
    ],
    updatedAt: '2026-11-11T00:00:00Z',
  },
];

/**
 * Official Doomcord Cosmetics Catalog across all 12 required categories.
 * Stored in Firestore /cosmetics and editable via the Admin Dashboard.
 */
export const INITIAL_COSMETICS_CATALOG: CosmeticItem[] = [
  // 1. Avatar Decorations
  {
    id: 'cosm_frame_neon_coral',
    name: 'Solaris Coral Neon Ring',
    description: 'High-luminance coral plasma ring with dual rotating orbital nodes.',
    category: 'Avatar Decorations',
    priceINR: 39,
    rarity: 'Rare',
    nitroEligible: 'basic',
    cssPreviewClass: 'ring-4 ring-[oklch(0.72_0.16_32)] shadow-[0_0_20px_oklch(0.72_0.16_32)]',
    previewColorPrimary: '#f97316',
    previewColorSecondary: '#ec4899',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  {
    id: 'cosm_frame_emerald_crystal',
    name: 'Sylvan Emerald Crystal Crown',
    description: 'Faceted forest-mint crystalline border with refracted light shards.',
    category: 'Avatar Decorations',
    priceINR: 59,
    rarity: 'Epic',
    nitroEligible: 'nitro',
    cssPreviewClass: 'ring-4 ring-[oklch(0.85_0.12_165)] shadow-[0_0_24px_oklch(0.85_0.12_165)]',
    previewColorPrimary: '#10b981',
    previewColorSecondary: '#34d399',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  {
    id: 'cosm_frame_minimal_moss',
    name: 'Minimalist Moss Halo',
    description: 'Clean architectural sage-green frame for understated profiles.',
    category: 'Avatar Decorations',
    priceINR: 19,
    rarity: 'Common',
    nitroEligible: 'none',
    cssPreviewClass: 'ring-2 ring-[oklch(0.62_0.11_140)]',
    previewColorPrimary: '#4ade80',
    previewColorSecondary: '#166534',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  // 2. Profile Effects
  {
    id: 'cosm_effect_aurora_canopy',
    name: 'Boreal Forest Aurora',
    description: 'Sweeping mint-and-coral aurora ribbons that illuminate your profile card on open.',
    category: 'Profile Effects',
    priceINR: 99,
    rarity: 'Legendary',
    nitroEligible: 'nitro',
    cssPreviewClass: 'bg-gradient-to-br from-emerald-500/30 via-teal-400/15 to-orange-500/30',
    previewColorPrimary: '#10b981',
    previewColorSecondary: '#f97316',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  {
    id: 'cosm_effect_voltaic_storm',
    name: 'Voltaic Arc Cascade',
    description: 'Crackling golden-sky electric surges across your profile header.',
    category: 'Profile Effects',
    priceINR: 79,
    rarity: 'Epic',
    nitroEligible: 'basic',
    cssPreviewClass: 'bg-gradient-to-tr from-amber-500/25 via-sky-500/20 to-emerald-500/25',
    previewColorPrimary: '#eab308',
    previewColorSecondary: '#0ea5e9',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  // 3. Profile Themes
  {
    id: 'cosm_theme_obsidian_sanctum',
    name: 'Obsidian Sanctum Theme',
    description: 'Deep canopy emerald gradient with golden filigree borders and custom card contrast.',
    category: 'Profile Themes',
    priceINR: 49,
    rarity: 'Rare',
    nitroEligible: 'basic',
    cssPreviewClass: 'bg-gradient-to-b from-[#0d2b22] to-[#061510] border-emerald-400/40',
    previewColorPrimary: '#0d2b22',
    previewColorSecondary: '#eab308',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  // 4. Nameplates
  {
    id: 'cosm_nameplate_coral_flare',
    name: 'Coral Supernova Nameplate',
    description: 'Metallic coral-to-gold gradient display name styling with luminous typography.',
    category: 'Nameplates',
    priceINR: 39,
    rarity: 'Rare',
    nitroEligible: 'basic',
    cssPreviewClass: 'bg-gradient-to-r from-[#ff7e5f] via-[#feb47b] to-[#6ee7b7] bg-clip-text text-transparent font-extrabold',
    previewColorPrimary: '#ff7e5f',
    previewColorSecondary: '#6ee7b7',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  {
    id: 'cosm_nameplate_cyber_mint',
    name: 'Hyperion Mint Nameplate',
    description: 'Crisp mint-to-sky neon gradient text effect for channel member lists and messages.',
    category: 'Nameplates',
    priceINR: 39,
    rarity: 'Rare',
    nitroEligible: 'nitro',
    cssPreviewClass: 'bg-gradient-to-r from-[#34d399] via-[#38bdf8] to-[#a7f3d0] bg-clip-text text-transparent font-extrabold',
    previewColorPrimary: '#34d399',
    previewColorSecondary: '#38bdf8',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  // 5. Profile Badges
  {
    id: 'cosm_badge_early_pioneer',
    name: 'Realm Pioneer Emblem',
    description: 'Collectible emblem commemorating early supporters of the Doomcord ecosystem.',
    category: 'Profile Badges',
    priceINR: 19,
    rarity: 'Epic',
    nitroEligible: 'none',
    cssPreviewClass: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
    previewColorPrimary: '#f59e0b',
    previewColorSecondary: '#fef08a',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  // 6. Banners
  {
    id: 'cosm_banner_nebula_forest',
    name: 'Bioluminescent Canopy Banner',
    description: 'Layered procedural forest horizon with glowing spores and twilight mist.',
    category: 'Banners',
    priceINR: 59,
    rarity: 'Epic',
    nitroEligible: 'nitro',
    cssPreviewClass: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500 via-teal-900 to-slate-950',
    previewColorPrimary: '#10b981',
    previewColorSecondary: '#0f766e',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  // 7. Animated Avatars
  {
    id: 'cosm_avatar_pulse_orb',
    name: 'Harmonic Core Animated Avatar',
    description: 'Dynamic geometric core avatar with smooth harmonic rotation.',
    category: 'Animated Avatars',
    priceINR: 59,
    rarity: 'Epic',
    nitroEligible: 'basic',
    cssPreviewClass: 'bg-gradient-to-tr from-emerald-400 to-cyan-500',
    previewColorPrimary: '#34d399',
    previewColorSecondary: '#06b6d4',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  // 8. App Themes and Icons
  {
    id: 'cosm_apptheme_deep_pine',
    name: 'Midnight Pine Interface Matrix',
    description: 'High-contrast deep pine workspace theme with luminous mint borders.',
    category: 'App Themes and Icons',
    priceINR: 49,
    rarity: 'Rare',
    nitroEligible: 'nitro',
    cssPreviewClass: 'bg-[#091e17] border-emerald-500/30',
    previewColorPrimary: '#091e17',
    previewColorSecondary: '#10b981',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  // 9. Chat Cosmetics
  {
    id: 'cosm_chat_emerald_flair',
    name: 'Sylvan Whisper Message Flair',
    description: 'Subtle emerald glow accent around your sent messages in channels and DMs.',
    category: 'Chat Cosmetics',
    priceINR: 39,
    rarity: 'Rare',
    nitroEligible: 'nitro',
    cssPreviewClass: 'border border-emerald-500/30 bg-emerald-950/20',
    previewColorPrimary: '#10b981',
    previewColorSecondary: '#064e3b',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  // 10. Sound Effects
  {
    id: 'cosm_sound_crystal_chime',
    name: 'Harmonic Quartz Sound Pack',
    description: 'Unlocks 652Hz & 963Hz harmonic quartz synthesizer cues in voice and stage channels.',
    category: 'Sound Effects',
    priceINR: 19,
    rarity: 'Common',
    nitroEligible: 'basic',
    cssPreviewClass: 'bg-sky-500/20 border-sky-400/30',
    previewColorPrimary: '#38bdf8',
    previewColorSecondary: '#0284c7',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  // 11. Seasonal Collections
  {
    id: 'cosm_seasonal_solstice_bloom',
    name: 'Winter Solstice Biolume Crest',
    description: 'Limited-edition seasonal frost and bioluminescent pine decoration.',
    category: 'Seasonal Collections',
    priceINR: 59,
    rarity: 'Legendary',
    nitroEligible: 'nitro',
    isLimitedEdition: true,
    cssPreviewClass: 'ring-4 ring-sky-300 shadow-[0_0_20px_#38bdf8]',
    previewColorPrimary: '#38bdf8',
    previewColorSecondary: '#a7f3d0',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
  // 12. Exclusive Bundles
  {
    id: 'cosm_bundle_sovereign_pack',
    name: 'Sovereign of the Canopy Bundle',
    description: 'Includes Solaris Coral Frame, Boreal Aurora Profile Effect, Coral Supernova Nameplate, and Bioluminescent Banner.',
    category: 'Exclusive Bundles',
    priceINR: 149,
    rarity: 'Mythic',
    nitroEligible: 'nitro',
    bundleItems: [
      'cosm_frame_neon_coral',
      'cosm_effect_aurora_canopy',
      'cosm_nameplate_coral_flare',
      'cosm_banner_nebula_forest',
    ],
    cssPreviewClass: 'bg-gradient-to-r from-[#ff7e5f] via-[#10b981] to-[#38bdf8]',
    previewColorPrimary: '#ff7e5f',
    previewColorSecondary: '#10b981',
    enabled: true,
    createdAt: '2026-11-11T00:00:00Z',
  },
];

export const INITIAL_SYSTEM_CONFIG: SystemConfigData = {
  id: 'global',
  merchantUpiId: 'adrenoxshriyans@fam',
  maintenanceMode: false,
  globalAnnouncement: '',
  globalDiscountPercent: 0,
  updatedAt: '2026-11-11T00:00:00Z',
};
