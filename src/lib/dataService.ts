import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, 
  query, where, orderBy, onSnapshot, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  Community, Channel, OrbData, ChatMessage, 
  DirectMessageThread, FriendRequest, UserProfile 
} from '../types';

// Default initial communities
export const DEFAULT_COMMUNITIES: Community[] = [
  {
    id: 'citadel-prime',
    name: 'The Citadel',
    description: 'The central gathering hub for Doomcord pioneers, gaming, tech discussion, and voice sessions.',
    iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1000&auto=format&fit=crop&q=80',
    ownerId: 'demo_alex_shadow',
    themeColor: 'oklch(0.72 0.16 32)',
    isPublic: true,
    memberCount: 284,
    createdAt: '2026-01-10T12:00:00Z',
    channels: [
      { id: 'c-welcome', communityId: 'citadel-prime', name: 'welcome-and-rules', topic: 'Read guidelines before diving into the forest', type: 'announcement', position: 1 },
      { id: 'c-general', communityId: 'citadel-prime', name: 'general-chat', topic: 'Real-time discussions and realm banter', type: 'text', position: 2 },
      { id: 'c-showcase', communityId: 'citadel-prime', name: 'project-showcase', topic: 'Share your creations, code, and setups', type: 'text', position: 3 },
      { id: 'c-voice-1', communityId: 'citadel-prime', name: 'The Forest Lounge', topic: 'Casual open voice room', type: 'voice', position: 4 },
      { id: 'c-stage-1', communityId: 'citadel-prime', name: 'Council Stage', topic: 'Weekly developer AMA and community stage', type: 'stage', position: 5 }
    ]
  },
  {
    id: 'synth-collective',
    name: 'Synthetix Modular',
    description: 'Patch cables, generative ambient modular synthesis, analog warmth, and music production.',
    iconUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&auto=format&fit=crop&q=80',
    ownerId: 'demo_seraph_mint',
    themeColor: 'oklch(0.85 0.12 165)',
    isPublic: true,
    memberCount: 148,
    createdAt: '2026-02-15T10:00:00Z',
    channels: [
      { id: 's-announcements', communityId: 'synth-collective', name: 'releases', topic: 'New tracks and firmware drops', type: 'announcement', position: 1 },
      { id: 's-patching', communityId: 'synth-collective', name: 'patch-diaries', topic: 'Eurorack and VCV Rack recipes', type: 'text', position: 2 },
      { id: 's-voice', communityId: 'synth-collective', name: 'Studio Jam', topic: 'Live audio monitoring and jam room', type: 'voice', position: 3 }
    ]
  },
  {
    id: 'obsidian-devs',
    name: 'Obsidian Systems',
    description: 'High-performance TypeScript, WebGL shaders, distributed consensus, and UI architecture.',
    iconUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
    ownerId: 'demo_cipher_gold',
    themeColor: 'oklch(0.84 0.14 85)',
    isPublic: true,
    memberCount: 96,
    createdAt: '2026-03-01T08:00:00Z',
    channels: [
      { id: 'o-general', communityId: 'obsidian-devs', name: 'dev-stream', topic: 'Architecture, PRs, and benchmarking', type: 'text', position: 1 },
      { id: 'o-shaders', communityId: 'obsidian-devs', name: 'threejs-and-glsl', topic: '3D spatial geometry and compute shaders', type: 'text', position: 2 },
      { id: 'o-voice', communityId: 'obsidian-devs', name: 'Pair Programming', topic: 'Screenshare and pair coding room', type: 'voice', position: 3 }
    ]
  }
];

// Default Signature Orbs
export const DEFAULT_ORBS: OrbData[] = [
  {
    id: 'orb-gaming-glory',
    name: 'Neo Cyber Gaming',
    description: 'Co-op tactical shooters, indie roguelikes, speedrunning, and midnight raid coordination.',
    category: 'Gaming',
    icon: 'Gamepad2',
    primaryColor: '#f43f5e',
    secondaryColor: '#ec4899',
    visibility: 'public',
    creatorId: 'demo_alex_shadow',
    creatorName: 'Alex Thorne',
    memberCount: 312,
    activityScore: 98,
    tags: ['Cyberpunk', 'Roguelike', 'Speedrun', 'Co-op'],
    createdAt: '2026-01-20T14:30:00Z'
  },
  {
    id: 'orb-quantum-code',
    name: 'Quantum Systems',
    description: 'Systems programming, WebGL shaders, Three.js spatial canvas, and real-time networking.',
    category: 'Coding',
    icon: 'Code2',
    primaryColor: '#10b981',
    secondaryColor: '#06b6d4',
    visibility: 'public',
    creatorId: 'demo_cipher_gold',
    creatorName: 'Cipher',
    memberCount: 245,
    activityScore: 92,
    tags: ['TypeScript', 'WebGL', 'Three.js', 'Rust'],
    createdAt: '2026-02-05T09:15:00Z'
  },
  {
    id: 'orb-ambient-audio',
    name: 'Modular Ambient',
    description: 'Generative tape loops, Eurorack synthesis, field recordings, and soothing soundscapes.',
    category: 'Music',
    icon: 'Headphones',
    primaryColor: '#f59e0b',
    secondaryColor: '#f97316',
    visibility: 'public',
    creatorId: 'demo_seraph_mint',
    creatorName: 'Seraphina Vale',
    memberCount: 189,
    activityScore: 86,
    tags: ['Modular', 'Ambient', 'Generative', 'Vinyl'],
    createdAt: '2026-02-12T16:00:00Z'
  },
  {
    id: 'orb-anime-realm',
    name: 'Manga & Sakuga',
    description: 'Seasonal anime discourse, sakuga key animation breakdowns, light novels, and fan art.',
    category: 'Anime',
    icon: 'Sparkles',
    primaryColor: '#a855f7',
    secondaryColor: '#d946ef',
    visibility: 'public',
    creatorId: 'demo_alex_shadow',
    creatorName: 'Alex Thorne',
    memberCount: 420,
    activityScore: 99,
    tags: ['Anime', 'Sakuga', 'Manga', 'Seasonal'],
    createdAt: '2026-01-15T18:00:00Z'
  },
  {
    id: 'orb-astrophysics',
    name: 'Cosmic Horizons',
    description: 'Deep space photography, James Webb data, orbital mechanics, and stellar cosmology.',
    category: 'Science',
    icon: 'Globe',
    primaryColor: '#0ea5e9',
    secondaryColor: '#6366f1',
    visibility: 'public',
    creatorId: 'demo_seraph_mint',
    creatorName: 'Seraphina Vale',
    memberCount: 142,
    activityScore: 78,
    tags: ['JWST', 'Exoplanets', 'Physics', 'Astrophotography'],
    createdAt: '2026-02-28T21:00:00Z'
  },
  {
    id: 'orb-deep-study',
    name: 'Deep Focus Sanctuary',
    description: 'Quiet Pomodoro sessions, distraction-free study logs, research notes, and academic goals.',
    category: 'Study',
    icon: 'BookOpen',
    primaryColor: '#14b8a6',
    secondaryColor: '#10b981',
    visibility: 'public',
    creatorId: 'demo_cipher_gold',
    creatorName: 'Cipher',
    memberCount: 275,
    activityScore: 88,
    tags: ['Focus', 'Pomodoro', 'Research', 'Study'],
    createdAt: '2026-03-05T07:30:00Z'
  }
];

// Seed initial messages for direct messages & channels
export const SEED_MESSAGES: Record<string, ChatMessage[]> = {
  'dm-seraphina': [
    {
      id: 'msg-s-1',
      conversationId: 'dm-seraphina',
      senderId: 'demo_seraph_mint',
      senderName: 'Seraphina Vale',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SeraphMint&backgroundColor=154338',
      content: 'Hey Alex! Did you check out the new 3D spatial Orbs in Doomcord? The orbital physics feel incredible.',
      createdAt: '2026-11-11T07:15:00Z',
      readBy: ['demo_seraph_mint', 'demo_alex_shadow'],
      reactions: { '✨': ['demo_alex_shadow'] }
    },
    {
      id: 'msg-s-2',
      conversationId: 'dm-seraphina',
      senderId: 'demo_alex_shadow',
      senderName: 'Alex Thorne',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlexThorne&backgroundColor=0d382e',
      content: 'Yes! The Three.js WebGL canvas runs so smoothly, and the read receipt tracking gives instant feedback.',
      createdAt: '2026-11-11T07:18:00Z',
      readBy: ['demo_alex_shadow', 'demo_seraph_mint'],
      reactions: { '🔥': ['demo_seraph_mint'] }
    },
    {
      id: 'msg-s-3',
      conversationId: 'dm-seraphina',
      senderId: 'demo_seraph_mint',
      senderName: 'Seraphina Vale',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SeraphMint&backgroundColor=154338',
      content: 'Here is a quick snapshot of the shader bloom test from the Modular Synthesizers space:',
      attachments: [
        {
          id: 'att-1',
          name: 'ambient_orb_preview.png',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          type: 'image'
        }
      ],
      createdAt: '2026-11-11T07:22:00Z',
      readBy: ['demo_seraph_mint', 'demo_alex_shadow']
    }
  ],
  'dm-cipher': [
    {
      id: 'msg-c-1',
      conversationId: 'dm-cipher',
      senderId: 'demo_cipher_gold',
      senderName: 'Cipher',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CipherZero&backgroundColor=2e3a1f',
      content: 'The WebRTC audio room signaling pipeline is verified. Live microphone level analysis works with zero delay.',
      createdAt: '2026-11-11T06:50:00Z',
      readBy: ['demo_cipher_gold', 'demo_alex_shadow'],
      isPinned: true
    },
    {
      id: 'msg-c-2',
      conversationId: 'dm-cipher',
      senderId: 'demo_alex_shadow',
      senderName: 'Alex Thorne',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlexThorne&backgroundColor=0d382e',
      content: 'Awesome! Let me know if you want to hop into Council Stage for a soundcheck.',
      createdAt: '2026-11-11T06:55:00Z',
      readBy: ['demo_alex_shadow', 'demo_cipher_gold']
    }
  ],
  'c-general': [
    {
      id: 'msg-cg-1',
      conversationId: 'c-general',
      senderId: 'demo_alex_shadow',
      senderName: 'Alex Thorne',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlexThorne&backgroundColor=0d382e',
      content: 'Welcome everyone to Doomcord! Feel free to explore the communities, create your own custom Orbs, or jump into voice channels.',
      isPinned: true,
      createdAt: '2026-11-11T06:00:00Z',
      readBy: ['demo_alex_shadow', 'demo_seraph_mint', 'demo_cipher_gold'],
      reactions: { '🌲': ['demo_seraph_mint', 'demo_cipher_gold'], '🚀': ['demo_seraph_mint'] }
    },
    {
      id: 'msg-cg-2',
      conversationId: 'c-general',
      senderId: 'demo_seraph_mint',
      senderName: 'Seraphina Vale',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SeraphMint&backgroundColor=154338',
      content: 'Loving the dark forest-green palette with coral and mint accents. So much easier on the eyes during late night coding sessions.',
      createdAt: '2026-11-11T06:12:00Z',
      readBy: ['demo_seraph_mint', 'demo_alex_shadow']
    }
  ],
  'orb-gaming-glory': [
    {
      id: 'msg-og-1',
      conversationId: 'orb-gaming-glory',
      senderId: 'demo_alex_shadow',
      senderName: 'Alex Thorne',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlexThorne&backgroundColor=0d382e',
      content: 'Orb discussion active! Who is down for an extraction run tonight at 21:00 UTC?',
      createdAt: '2026-11-11T07:00:00Z',
      readBy: ['demo_alex_shadow'],
      reactions: { '🎯': ['demo_alex_shadow'] }
    }
  ]
};

// Seed demo friends list
export const DEMO_FRIENDS: UserProfile[] = [
  {
    uid: 'demo_seraph_mint',
    email: 'seraphina@doomcord.io',
    username: 'seraph_mint',
    displayName: 'Seraphina Vale',
    bio: 'Spatial UI researcher & ambient music producer. Orb enthusiast.',
    statusMessage: 'Crafting glowing geometry',
    presence: 'online',
    accentColor: 'oklch(0.85 0.12 165)',
    photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=SeraphMint&backgroundColor=154338',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    uid: 'demo_cipher_gold',
    email: 'cipher@doomcord.io',
    username: 'cipher_zero',
    displayName: 'Cipher',
    bio: 'Distributed systems & cryptographic protocols.',
    statusMessage: 'Do Not Disturb // Deep in code',
    presence: 'dnd',
    accentColor: 'oklch(0.84 0.14 85)',
    photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=CipherZero&backgroundColor=2e3a1f',
    createdAt: '2026-01-05T00:00:00Z'
  },
  {
    uid: 'demo_elena_sky',
    email: 'elena@doomcord.io',
    username: 'elena_sky',
    displayName: 'Elena Rostova',
    bio: '3D technical artist & particle fx developer.',
    statusMessage: 'Away grabbing coffee',
    presence: 'idle',
    accentColor: 'oklch(0.76 0.11 230)',
    photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=ElenaSky&backgroundColor=1e3a4b',
    createdAt: '2026-01-12T00:00:00Z'
  }
];

export const DEMO_PENDING_REQUESTS: FriendRequest[] = [
  {
    id: 'req-kai-1',
    fromUid: 'demo_kai_moss',
    toUid: 'demo_alex_shadow',
    fromUsername: 'kai_moss',
    fromDisplayName: 'Kai Linden',
    fromPhotoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=KaiMoss&backgroundColor=1a3824',
    toUsername: 'shadow_weaver',
    status: 'pending',
    createdAt: '2026-11-10T19:40:00Z'
  }
];
