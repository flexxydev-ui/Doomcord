import {
  NitroPlanConfig,
  CosmeticItem,
  SystemConfigData,
  NitroTier,
  GiftDuration,
  SecurityAuditItem,
  UserProfile,
  PlatformRole,
  ReceiptDurationPreset,
  CustomDurationUnit,
} from '../types';

export const ROOT_OWNER_UUID = '00000000-0000-4000-8000-000000000001';
export const ROOT_OWNER_EMAIL = 'razorpay@admin.doom';
export const OWNER_EMAILS = [
  'razorpay@admin.doom',
  'kshriyans17@gmail.com',
  'adrenoxshriyans@gmail.com',
];

export function isRootOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  return OWNER_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Recursively cleans an object or array for Firestore serialization:
 * - Completely removes any object keys where value === undefined
 * - Filters out undefined items in arrays
 * - Preserves Date, null, boolean, number, string, and plain objects
 */
export function cleanFirestoreData<T>(input: T): T {
  if (input === null || input === undefined || typeof input !== 'object') {
    return input;
  }
  if (input instanceof Date) {
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .filter((v) => v !== undefined)
      .map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(input as Record<string, any>)) {
    if (value !== undefined) {
      result[key] = cleanFirestoreData(value);
    }
  }
  return result as T;
}

/**
 * Identifies the Main Owner strictly using the protected `root_owner` role,
 * the verified authentication UUID (ROOT_OWNER_UUID), or recognized owner emails.
 */
export function isRootOwner(
  userOrUid?: Partial<UserProfile> | string | null
): boolean {
  if (!userOrUid) return false;
  if (typeof userOrUid === 'string') {
    return userOrUid === ROOT_OWNER_UUID;
  }
  return (
    userOrUid.uid === ROOT_OWNER_UUID ||
    userOrUid.role === 'root_owner' ||
    isRootOwnerEmail(userOrUid.email)
  );
}

export function isSecondaryOwner(user?: Partial<UserProfile> | null): boolean {
  if (!user) return false;
  if (isRootOwner(user)) return false;
  return user.role === 'secondary_owner' || user.role === 'owner';
}

export function isAnyOwner(user?: Partial<UserProfile> | null): boolean {
  return isRootOwner(user) || isSecondaryOwner(user);
}

export function isAdminOrAbove(user?: Partial<UserProfile> | null): boolean {
  if (!user) return false;
  return isAnyOwner(user) || user.role === 'admin';
}

export function formatRoleLabel(role?: PlatformRole, uid?: string): string {
  if (uid === ROOT_OWNER_UUID || role === 'root_owner') return 'ROOT OWNER';
  if (role === 'secondary_owner' || role === 'owner') return 'SECONDARY OWNER';
  if (role === 'admin') return 'ADMIN';
  if (role === 'moderator') return 'MODERATOR';
  return 'MEMBER';
}

/**
 * Generates a clean, deterministic SVG data-URI avatar from a user's display name or username.
 * Strictly avoids any fake external cartoon personas.
 */
export function generateInitialsAvatar(name: string, bgHex = '#22212C'): string {
  const clean = (name || 'U').trim();
  const parts = clean.split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : clean.slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgHex}" />
        <stop offset="100%" stop-color="#101014" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="28" fill="url(#g)" />
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#C4B1FF" font-family="system-ui, sans-serif" font-weight="700" font-size="48">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function formatApexTierName(tier?: NitroTier | 'none'): string {
  if (tier === 'nitro') return 'APEX+';
  if (tier === 'basic') return 'APEX';
  return 'Free';
}

export function formatDurationLabel(
  duration: GiftDuration,
  billingCycle?: 'monthly' | 'yearly' | 'lifetime'
): string {
  if (billingCycle === 'monthly' || duration === '1m') {
    return '1 Monthly Billing Period';
  }
  if (billingCycle === 'yearly' || duration === '1y') {
    return '1 Yearly Billing Period';
  }
  switch (duration) {
    case '1d':
      return '1 Day';
    case '7d':
      return '7 Days';
    case '30d':
      return '1 Monthly Billing Period';
    case '90d':
      return '90 Days';
    case 'lifetime':
      return 'Lifetime / Permanent';
    default:
      return '1 Monthly Billing Period';
  }
}

/**
 * Calculates expiry using the actual configured billing period (calendar month / calendar year)
 * rather than an arbitrary fixed number of days.
 */
export function computeDurationExpiry(
  duration: GiftDuration,
  baseDate = new Date(),
  billingCycle?: 'monthly' | 'yearly' | 'lifetime'
): string | null {
  if (duration === 'lifetime' || billingCycle === 'lifetime') {
    return null;
  }
  const d = new Date(baseDate);
  if (billingCycle === 'monthly' || duration === '1m') {
    d.setMonth(d.getMonth() + 1);
    return d.toISOString();
  }
  if (billingCycle === 'yearly' || duration === '1y') {
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString();
  }
  switch (duration) {
    case '1d':
      d.setDate(d.getDate() + 1);
      break;
    case '7d':
      d.setDate(d.getDate() + 7);
      break;
    case '30d':
      d.setMonth(d.getMonth() + 1);
      break;
    case '90d':
      d.setMonth(d.getMonth() + 3);
      break;
  }
  return d.toISOString();
}

export function calculateReceiptDuration(
  preset: ReceiptDurationPreset,
  startIso: string,
  customVal = 1,
  customUnit: CustomDurationUnit = 'days'
): {
  durationLabel: string;
  expiryDate: string | null;
  serviceStartDate: string;
  serviceExpiryDate: string | null;
} {
  const start = new Date(startIso || Date.now());
  const serviceStartDate = start.toISOString();

  if (preset === 'lifetime') {
    return {
      durationLabel: 'LIFETIME — NO EXPIRATION',
      expiryDate: null,
      serviceStartDate,
      serviceExpiryDate: null,
    };
  }

  const end = new Date(start);

  const presetDaysMap: Record<
    string,
    { days?: number; months?: number; years?: number; label: string }
  > = {
    '1d': { days: 1, label: '1 Day' },
    '3d': { days: 3, label: '3 Days' },
    '7d': { days: 7, label: '7 Days' },
    '15d': { days: 15, label: '15 Days' },
    '30d': { months: 1, label: '1 Monthly Billing Period' },
    '60d': { months: 2, label: '2 Months' },
    '90d': { months: 3, label: '3 Months' },
    '180d': { months: 6, label: '6 Months' },
    '1y': { years: 1, label: '1 Yearly Billing Period' },
  };

  if (preset !== 'custom' && presetDaysMap[preset]) {
    const cfg = presetDaysMap[preset];
    if (cfg.days) end.setDate(end.getDate() + cfg.days);
    if (cfg.months) end.setMonth(end.getMonth() + cfg.months);
    if (cfg.years) end.setFullYear(end.getFullYear() + cfg.years);
    const expIso = end.toISOString();
    return {
      durationLabel: cfg.label,
      expiryDate: expIso,
      serviceStartDate,
      serviceExpiryDate: expIso,
    };
  }

  const n = Math.max(1, Number(customVal) || 1);
  switch (customUnit) {
    case 'minutes':
      end.setMinutes(end.getMinutes() + n);
      break;
    case 'hours':
      end.setHours(end.getHours() + n);
      break;
    case 'days':
      end.setDate(end.getDate() + n);
      break;
    case 'weeks':
      end.setDate(end.getDate() + n * 7);
      break;
    case 'months':
      end.setMonth(end.getMonth() + n);
      break;
    case 'years':
      end.setFullYear(end.getFullYear() + n);
      break;
  }

  const unitLabel = n === 1 ? customUnit.replace(/s$/, '') : customUnit;
  const expIso = end.toISOString();
  return {
    durationLabel: `${n} ${unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1)}`,
    expiryDate: expIso,
    serviceStartDate,
    serviceExpiryDate: expIso,
  };
}

export function getReceiptExpirationInfo(expiryDate: string | null): {
  status: 'Lifetime' | 'Active' | 'Expired';
  remainingLabel: string;
} {
  if (!expiryDate) {
    return {
      status: 'Lifetime',
      remainingLabel: 'LIFETIME — NO EXPIRATION',
    };
  }
  const now = Date.now();
  const exp = new Date(expiryDate).getTime();
  const diffMs = exp - now;
  if (diffMs <= 0) {
    return {
      status: 'Expired',
      remainingLabel: 'Expired',
    };
  }
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) {
    return { status: 'Active', remainingLabel: `${days}d ${hours}h remaining` };
  }
  if (hours > 0) {
    return { status: 'Active', remainingLabel: `${hours}h ${mins}m remaining` };
  }
  return { status: 'Active', remainingLabel: `${Math.max(1, mins)}m remaining` };
}

/**
 * Official Doomcord APEX Membership Plans in Indian Rupees (INR).
 * Official names: APEX (₹49/mo, ₹499/yr) and APEX+ (₹99/mo, ₹999/yr).
 */
export const INITIAL_NITRO_PLANS: NitroPlanConfig[] = [
  {
    id: 'free',
    tier: 'free',
    name: 'Doomcord Free',
    tagline: 'Core real-time communication, communities, and public Orbs.',
    monthlyPriceINR: 0,
    yearlyPriceINR: 0,
    uploadLimitMB: 25,
    maxMessageLength: 2000,
    shopDiscountPercent: 0,
    benefits: [
      'Standard real-time messaging & read receipts',
      'Basic profile customization & status',
      'Standard avatar and banner support',
      'Standard file uploads up to 25 MB',
      'Access to all public Orbs and communities',
      'Standard emojis, reactions, and basic profile badges',
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'basic',
    tier: 'basic',
    name: 'APEX',
    tagline: 'Essential identity elevation, animated avatars, custom colours, and 50 MB uploads.',
    monthlyPriceINR: 49,
    yearlyPriceINR: 499,
    uploadLimitMB: 50,
    maxMessageLength: 2500,
    shopDiscountPercent: 10,
    benefits: [
      'Exclusive APEX Badge on your profile',
      'Animated avatar support & custom profile colours',
      'APEX Avatar Frames & selected profile effects',
      'Profile theme customization & APEX name styling',
      'Premium emoji and sticker access across communities',
      'Enhanced file upload limit up to 50 MB',
      '10% APEX member discount in the APEX Collection',
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'nitro',
    tier: 'nitro',
    name: 'APEX+',
    tagline: 'Maximum prestige, animated banners, 500 MB uploads, 4,000-character messages & 20% APEX Collection discount.',
    monthlyPriceINR: 99,
    yearlyPriceINR: 999,
    uploadLimitMB: 500,
    maxMessageLength: 4000,
    shopDiscountPercent: 20,
    benefits: [
      'Everything included in APEX',
      'Exclusive animated prismatic APEX+ Badge',
      'Animated profile avatars & animated profile banners',
      'Advanced APEX+ profile effects & unlimited theme customization',
      'Complete APEX Collection decoration access where eligible',
      'Advanced display name styles & per-community custom profiles',
      'Massive file uploads up to 500 MB',
      'Extended 4,000-character message limit',
      'Two community boosts per billing cycle',
      'Custom soundboard access & custom interface themes',
      'HD WebRTC audio & stage streaming priority',
      '20% discount on all eligible APEX Collection purchases',
    ],
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Original Doomcord APEX Collection Catalog in Indian Rupees (INR).
 * Covers all 12 required cosmetic categories with original forest/mint/coral/orbital visuals.
 * Preserves existing item IDs for 100% database backward compatibility.
 */
export const INITIAL_COSMETICS_CATALOG: CosmeticItem[] = [
  // 1. APEX Avatar Frames (Avatar Decorations)
  {
    id: 'cosm_frame_emerald_crystal',
    name: 'APEX Emerald Crystal Frame',
    description: 'Faceted forest-emerald crystalline ring with subtle mint refraction.',
    category: 'Avatar Decorations',
    priceINR: 39,
    rarity: 'Rare',
    nitroEligible: 'basic',
    cssPreviewClass: 'ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.75)]',
    previewColorPrimary: '#10b981',
    previewColorSecondary: '#047857',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cosm_frame_solar_flare',
    name: 'APEX+ Coral Corona Orbit',
    description: 'High-energy coral plasma ring with dual rotating orbital nodes.',
    category: 'Avatar Decorations',
    priceINR: 59,
    rarity: 'Epic',
    nitroEligible: 'nitro',
    cssPreviewClass: 'ring-4 ring-orange-500 shadow-[0_0_24px_rgba(249,115,22,0.85)]',
    previewColorPrimary: '#f97316',
    previewColorSecondary: '#fb7185',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cosm_frame_void_halo',
    name: 'APEX+ Abyssal Singularity Halo',
    description: 'Deep spatial horizon ring with bioluminescent cyan-mint pulse.',
    category: 'Avatar Decorations',
    priceINR: 79,
    rarity: 'Legendary',
    nitroEligible: 'nitro',
    cssPreviewClass: 'ring-4 ring-teal-300 shadow-[0_0_28px_rgba(45,212,191,0.9)]',
    previewColorPrimary: '#2dd4bf',
    previewColorSecondary: '#0f766e',
    enabled: true,
    createdAt: new Date().toISOString(),
  },

  // 2. APEX Profile Effects
  {
    id: 'cosm_effect_aurora_canopy',
    name: 'APEX+ Bioluminescent Canopy Mist',
    description: 'Atmospheric northern-forest aurora shimmer across your profile card.',
    category: 'Profile Effects',
    priceINR: 79,
    rarity: 'Epic',
    nitroEligible: 'nitro',
    cssPreviewClass: 'bg-gradient-to-br from-emerald-500/25 via-teal-500/15 to-transparent',
    previewColorPrimary: '#34d399',
    previewColorSecondary: '#059669',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cosm_effect_ember_storm',
    name: 'APEX+ Crimson Ember Cascade',
    description: 'Warm rising coral sparks illuminating profile headers and borders.',
    category: 'Profile Effects',
    priceINR: 99,
    rarity: 'Legendary',
    nitroEligible: 'nitro',
    cssPreviewClass: 'bg-gradient-to-tr from-orange-500/30 via-rose-500/15 to-transparent',
    previewColorPrimary: '#fb923c',
    previewColorSecondary: '#e11d48',
    enabled: true,
    createdAt: new Date().toISOString(),
  },

  // 3. APEX Themes (Profile Themes)
  {
    id: 'cosm_theme_obsidian_grove',
    name: 'APEX Obsidian Grove Theme',
    description: 'Deep mineral charcoal-green surface with luminous mint dividers.',
    category: 'Profile Themes',
    priceINR: 49,
    rarity: 'Rare',
    nitroEligible: 'basic',
    cssPreviewClass: 'bg-[#071f18] border-emerald-500/40',
    previewColorPrimary: '#071f18',
    previewColorSecondary: '#10b981',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cosm_theme_nebula_dusk',
    name: 'APEX+ Horizon Dusk Theme',
    description: 'Warm twilight gradient blending forest slate with coral rim lighting.',
    category: 'Profile Themes',
    priceINR: 59,
    rarity: 'Epic',
    nitroEligible: 'nitro',
    cssPreviewClass: 'bg-[#1f1619] border-orange-400/40',
    previewColorPrimary: '#1f1619',
    previewColorSecondary: '#f97316',
    enabled: true,
    createdAt: new Date().toISOString(),
  },

  // 4. APEX Nameplates
  {
    id: 'cosm_nameplate_mint_velocity',
    name: 'APEX Mint Velocity Nameplate',
    description: 'Crisp mint-jade gradient backing for your username in member rosters.',
    category: 'Nameplates',
    priceINR: 39,
    rarity: 'Rare',
    nitroEligible: 'basic',
    cssPreviewClass: 'text-emerald-300 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]',
    previewColorPrimary: '#6ee7b7',
    previewColorSecondary: '#059669',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cosm_nameplate_coral_flare',
    name: 'APEX+ Coral Ascendant Nameplate',
    description: 'Radiant coral-gold metallic sheen for display names across channels.',
    category: 'Nameplates',
    priceINR: 49,
    rarity: 'Epic',
    nitroEligible: 'nitro',
    cssPreviewClass: 'text-orange-300 font-bold drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]',
    previewColorPrimary: '#fdba74',
    previewColorSecondary: '#ea580c',
    enabled: true,
    createdAt: new Date().toISOString(),
  },

  // 5. APEX Badges (Profile Badges)
  {
    id: 'cosm_badge_spatial_pioneer',
    name: 'APEX Spatial Pioneer Crest',
    description: 'Commemorates early architects of the Doomcord 3D Orbs cosmos.',
    category: 'Profile Badges',
    priceINR: 19,
    rarity: 'Common',
    nitroEligible: 'basic',
    cssPreviewClass: 'text-emerald-400 border-emerald-400/40',
    previewColorPrimary: '#34d399',
    previewColorSecondary: '#065f46',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cosm_badge_sovereign_star',
    name: 'APEX+ Sovereign Star Insignia',
    description: 'High-prestige geometric star emblem displayed on profile cards.',
    category: 'Profile Badges',
    priceINR: 39,
    rarity: 'Rare',
    nitroEligible: 'nitro',
    cssPreviewClass: 'text-amber-300 border-amber-300/40',
    previewColorPrimary: '#fcd34d',
    previewColorSecondary: '#b45309',
    enabled: true,
    createdAt: new Date().toISOString(),
  },

  // 6. APEX Animated Banners (Banners)
  {
    id: 'cosm_banner_vermilion_grid',
    name: 'APEX+ Cybernetic Forest Matrix Banner',
    description: 'Topographic vector terrain lines glowing in deep emerald and mint.',
    category: 'Banners',
    priceINR: 59,
    rarity: 'Epic',
    nitroEligible: 'nitro',
    cssPreviewClass: 'bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#115e59]',
    previewColorPrimary: '#047857',
    previewColorSecondary: '#2dd4bf',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cosm_banner_solar_horizon',
    name: 'APEX+ Orbital Eclipse Banner',
    description: 'Panoramic planetary eclipse header with warm coral atmospheric flare.',
    category: 'Banners',
    priceINR: 79,
    rarity: 'Legendary',
    nitroEligible: 'nitro',
    cssPreviewClass: 'bg-gradient-to-r from-[#431407] via-[#9a3412] to-[#064e3b]',
    previewColorPrimary: '#ea580c',
    previewColorSecondary: '#064e3b',
    enabled: true,
    createdAt: new Date().toISOString(),
  },

  // 7. Animated Avatars
  {
    id: 'cosm_anim_avatar_pulse_core',
    name: 'APEX Kinetic Pulse Core Avatar',
    description: 'Reactive concentric geometric rings that pulse with your online presence.',
    category: 'Animated Avatars',
    priceINR: 59,
    rarity: 'Epic',
    nitroEligible: 'basic',
    cssPreviewClass: 'animate-pulse ring-2 ring-emerald-300',
    previewColorPrimary: '#10b981',
    previewColorSecondary: '#6ee7b7',
    enabled: true,
    createdAt: new Date().toISOString(),
  },

  // 8. App Themes and Icons
  {
    id: 'cosm_apptheme_midnight_pine',
    name: 'APEX Deep Pine Workspace Accent',
    description: 'Customizes navigation rail highlights with ultra-crisp alpine mint.',
    category: 'App Themes and Icons',
    priceINR: 49,
    rarity: 'Rare',
    nitroEligible: 'nitro',
    cssPreviewClass: 'bg-[#042f2e] text-teal-200',
    previewColorPrimary: '#14b8a6',
    previewColorSecondary: '#042f2e',
    enabled: true,
    createdAt: new Date().toISOString(),
  },

  // 9. APEX Chat Effects (Chat Cosmetics)
  {
    id: 'cosm_chat_emerald_glow',
    name: 'APEX+ Luminous Message Accent',
    description: 'Adds a subtle emerald border highlight to your messages in channels.',
    category: 'Chat Cosmetics',
    priceINR: 39,
    rarity: 'Rare',
    nitroEligible: 'nitro',
    cssPreviewClass: 'border-l-2 border-emerald-400 bg-emerald-950/20',
    previewColorPrimary: '#34d399',
    previewColorSecondary: '#064e3b',
    enabled: true,
    createdAt: new Date().toISOString(),
  },

  // 10. APEX Sound Effects
  {
    id: 'cosm_sfx_crystal_chime',
    name: 'APEX Harmonic Resonance Pack',
    description: 'Unlocks spatial harmonic chimes when joining WebRTC voice lounges.',
    category: 'Sound Effects',
    priceINR: 19,
    rarity: 'Common',
    nitroEligible: 'basic',
    cssPreviewClass: 'text-teal-300',
    previewColorPrimary: '#5eead4',
    previewColorSecondary: '#0f766e',
    enabled: true,
    createdAt: new Date().toISOString(),
  },

  // 11. APEX Limited Collections (Seasonal Collections)
  {
    id: 'cosm_season_monsoon_zenith',
    name: 'APEX Monsoon Zenith Limited Edition',
    description: 'Limited-edition raindrop refraction frame and misty rainforest banner.',
    category: 'Seasonal Collections',
    priceINR: 99,
    rarity: 'Legendary',
    nitroEligible: 'nitro',
    isLimitedEdition: true,
    cssPreviewClass: 'ring-4 ring-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.8)]',
    previewColorPrimary: '#22d3ee',
    previewColorSecondary: '#0e7490',
    enabled: true,
    createdAt: new Date().toISOString(),
  },

  // 12. APEX Exclusive Bundles
  {
    id: 'cosm_bundle_sovereign_architect',
    name: 'APEX+ Sovereign Architect Collector Bundle',
    description:
      'Complete collector suite: Abyssal Singularity Halo + Bioluminescent Mist + Orbital Eclipse Banner + Coral Ascendant Nameplate.',
    category: 'Exclusive Bundles',
    priceINR: 149,
    rarity: 'Mythic',
    nitroEligible: 'nitro',
    isLimitedEdition: true,
    bundleItems: [
      'cosm_frame_void_halo',
      'cosm_effect_aurora_canopy',
      'cosm_banner_solar_horizon',
      'cosm_nameplate_coral_flare',
    ],
    cssPreviewClass: 'ring-4 ring-amber-400 shadow-[0_0_32px_rgba(251,191,36,0.9)]',
    previewColorPrimary: '#fbbf24',
    previewColorSecondary: '#10b981',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_SYSTEM_CONFIG: SystemConfigData = {
  id: 'global',
  merchantUpiId: 'adrenoxshriyans@fam',
  maintenanceMode: false,
  globalAnnouncement: '',
  globalDiscountPercent: 0,
  updatedAt: new Date().toISOString(),
};

/**
 * Comprehensive Security Review & Vulnerability Remediation Report (#32).
 * Documents actual code & infrastructure vulnerabilities inspected, fixed, and verified.
 */
export const SECURITY_AUDIT_REPORT_DATA: SecurityAuditItem[] = [
  {
    id: 'SEC-01',
    vulnerability: 'Brute-Force Login & Gift Token Enumeration',
    category: 'Authentication',
    severity: 'Critical',
    affectedComponent: 'server.ts (/api/auth/login, /api/gifts/redeem)',
    fixImplemented:
      'Implemented sliding-window IP rate limiting middleware on authentication and gift redemption endpoints, plus generic authentication error messages to prevent account enumeration.',
    testPerformed:
      'Automated rapid-request verification against /api/auth/login and /api/gifts/redeem confirming HTTP 429 enforcement after threshold.',
    remainingRisk:
      'Distributed multi-IP botnets require upstream Cloud Armor / CDN edge WAF in large-scale deployments.',
    status: 'Remediated & Verified',
  },
  {
    id: 'SEC-02',
    vulnerability: 'Privilege Escalation & Unauthorized Owner Role Modification',
    category: 'Authorization',
    severity: 'Critical',
    affectedComponent: 'firestore.rules (/users/{userId}) & server.ts (/api/admin/user-role)',
    fixImplemented:
      'Locked Owner UUID (00000000-0000-4000-8000-000000000001) in both Firestore Security Rules and Express RBAC middleware so the Owner account can never be deleted, banned, suspended, or downgraded by any admin or client request.',
    testPerformed:
      'Attempted role modification and moderation calls targeting Owner UUID; verified HTTP 403 rejection and Firestore rule denial.',
    remainingRisk: 'None — enforced at both API and Firestore rule layers.',
    status: 'Remediated & Verified',
  },
  {
    id: 'SEC-03',
    vulnerability: 'Owner Permanent APEX+ Entitlement Loss via Subscription Expiry or Webhook',
    category: 'Payment & Gifting',
    severity: 'Critical',
    affectedComponent: 'src/context/AuthContext.tsx & src/App.tsx',
    fixImplemented:
      'Assigned immutable OWNER_PERMANENT_APEX entitlement with null expiration to Owner UUID (00000000-0000-4000-8000-000000000001) in /user_entitlements and enforced automatic full cosmetic catalog access independent of Razorpay billing.',
    testPerformed:
      'Verified Owner profile retains APEX+ tier, null expiry, and 100% cosmetic inventory across session reloads and subscription changes.',
    remainingRisk: 'None — OWNER_PERMANENT_APEX bypasses billing expiration logic.',
    status: 'Remediated & Verified',
  },
  {
    id: 'SEC-04',
    vulnerability: 'Gift Link Token Exposure & Race-Condition Double Claiming',
    category: 'Payment & Gifting',
    severity: 'Critical',
    affectedComponent: 'server.ts (/api/gifts/*), firestore.rules (/gifts/{giftId}), GiftRedemptionView.tsx',
    fixImplemented:
      'Generated 192-bit cryptographically random gift tokens, stored SHA-256 tokenHash in database, enforced Owner-only gift creation in Firestore rules and server API, and implemented atomic Firestore runTransaction redemption to prevent double-claims.',
    testPerformed:
      'Tested single-use gift claim, repeat claim rejection, revoked gift rejection, and recipient-restricted gift enforcement.',
    remainingRisk: 'None — atomic transaction guarantees single redemption.',
    status: 'Remediated & Verified',
  },
  {
    id: 'SEC-05',
    vulnerability: 'Unverified Client-Side Payment Activation & Webhook Replay',
    category: 'Payment & Gifting',
    severity: 'High',
    affectedComponent: 'server.ts (/api/razorpay/verify-payment, /api/razorpay/webhook)',
    fixImplemented:
      'Enforced constant-time HMAC-SHA256 signature verification (crypto.timingSafeEqual) using server-side RAZORPAY_KEY_SECRET and idempotent event ID tracking for webhooks.',
    testPerformed:
      'Submitted forged payment signatures to /api/razorpay/verify-payment; verified 400 Invalid Signature rejection.',
    remainingRisk: 'Requires live Razorpay keys configured in Admin Payment Settings for live capture.',
    status: 'Remediated & Verified',
  },
  {
    id: 'SEC-06',
    vulnerability: 'Audit Log & Transaction Tampering',
    category: 'Database & RLS',
    severity: 'High',
    affectedComponent: 'firestore.rules (/audit_logs, /transactions, /gift_redemptions)',
    fixImplemented:
      'Configured Firestore Security Rules with allow update, delete: if false on /audit_logs and /gift_redemptions, and allow delete: if false on /transactions and /user_entitlements.',
    testPerformed:
      'Deployed rules via fax.DeployRules RPC and verified append-only immutability.',
    remainingRisk: 'None — database rules reject any deletion or tampering.',
    status: 'Remediated & Verified',
  },
  {
    id: 'SEC-07',
    vulnerability: 'Missing HTTP Security Headers & Payload Abuse',
    category: 'Application & API',
    severity: 'Medium',
    affectedComponent: 'server.ts Express Middleware',
    fixImplemented:
      'Added X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, Referrer-Policy: strict-origin-when-cross-origin, and strict JSON body size limits.',
    testPerformed: 'Inspected HTTP response headers from localhost:3000.',
    remainingRisk: 'None.',
    status: 'Remediated & Verified',
  },
];
