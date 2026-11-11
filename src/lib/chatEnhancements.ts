import { PollData } from '../types';

export interface SlashCommandDefinition {
  command: string;
  usage: string;
  description: string;
  category: 'Interactive' | 'Formatting' | 'Expressions';
  example: string;
}

export const SLASH_COMMANDS: SlashCommandDefinition[] = [
  {
    command: '/poll',
    usage: '/poll Question | Option 1 | Option 2 | Option 3',
    description: 'Create an interactive real-time poll with multiple choices',
    category: 'Interactive',
    example: '/poll Best game night time? | Friday 8 PM | Saturday 9 PM | Sunday 7 PM',
  },
  {
    command: '/spoiler',
    usage: '/spoiler <secret message>',
    description: 'Hide text behind a click-to-reveal spoiler tag',
    category: 'Formatting',
    example: '/spoiler The final boss has a second phase!',
  },
  {
    command: '/code',
    usage: '/code <snippet>',
    description: 'Format message as a syntax-highlighted code block',
    category: 'Formatting',
    example: '/code const status = "online";',
  },
  {
    command: '/shrug',
    usage: '/shrug [message]',
    description: 'Append ¯\\_(ツ)_/¯ to your message',
    category: 'Expressions',
    example: '/shrug Ship it to production',
  },
  {
    command: '/tableflip',
    usage: '/tableflip [message]',
    description: 'Append (╯°□°）╯︵ ┻━┻ to your message',
    category: 'Expressions',
    example: '/tableflip Merge conflict again',
  },
  {
    command: '/unflip',
    usage: '/unflip [message]',
    description: 'Append ┬─┬ ノ( ゜-゜ノ) to calm things down',
    category: 'Expressions',
    example: '/unflip Fixed the build',
  },
  {
    command: '/me',
    usage: '/me <action>',
    description: 'Send an italicized status action message',
    category: 'Formatting',
    example: '/me is deploying the latest update',
  },
];

export interface ExecutedSlashCommand {
  transformedContent: string;
  poll?: PollData;
  isSlashCommand: boolean;
}

export function executeSlashCommand(rawInput: string, creatorUid: string): ExecutedSlashCommand {
  const trimmed = rawInput.trim();
  if (!trimmed.startsWith('/')) {
    return { transformedContent: trimmed, isSlashCommand: false };
  }

  const spaceIdx = trimmed.indexOf(' ');
  const cmd = (spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)).toLowerCase();
  const arg = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1).trim();

  if (cmd === '/shrug') {
    return {
      transformedContent: arg ? `${arg} ¯\\_(ツ)_/¯` : '¯\\_(ツ)_/¯',
      isSlashCommand: true,
    };
  }

  if (cmd === '/tableflip') {
    return {
      transformedContent: arg ? `${arg} (╯°□°）╯︵ ┻━┻` : '(╯°□°）╯︵ ┻━┻',
      isSlashCommand: true,
    };
  }

  if (cmd === '/unflip') {
    return {
      transformedContent: arg ? `${arg} ┬─┬ ノ( ゜-゜ノ)` : '┬─┬ ノ( ゜-゜ノ)',
      isSlashCommand: true,
    };
  }

  if (cmd === '/spoiler') {
    if (!arg) return { transformedContent: trimmed, isSlashCommand: false };
    return {
      transformedContent: `||${arg}||`,
      isSlashCommand: true,
    };
  }

  if (cmd === '/code') {
    if (!arg) return { transformedContent: trimmed, isSlashCommand: false };
    return {
      transformedContent: `\`\`\`\n${arg}\n\`\`\``,
      isSlashCommand: true,
    };
  }

  if (cmd === '/me') {
    if (!arg) return { transformedContent: trimmed, isSlashCommand: false };
    return {
      transformedContent: `*${arg}*`,
      isSlashCommand: true,
    };
  }

  if (cmd === '/poll') {
    const parts = arg
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    const question = parts[0] || 'Community Poll';
    const optionLabels = parts.length >= 3 ? parts.slice(1, 7) : ['Yes', 'No', 'Maybe'];
    const poll: PollData = {
      question,
      options: optionLabels.map((text, idx) => ({
        id: `opt_${idx + 1}`,
        text,
        voterIds: [],
      })),
      createdBy: creatorUid,
      closed: false,
    };
    return {
      transformedContent: `📊 **Poll:** ${question}`,
      poll,
      isSlashCommand: true,
    };
  }

  return { transformedContent: trimmed, isSlashCommand: false };
}

export type InlineSegment =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'strike'; content: string }
  | { type: 'code'; content: string }
  | { type: 'spoiler'; content: string }
  | { type: 'mention'; content: string };

export type MessageBlock =
  | { type: 'codeblock'; language: string; code: string }
  | { type: 'blockquote'; segments: InlineSegment[] }
  | { type: 'paragraph'; segments: InlineSegment[] };

export function parseInlineSegments(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const tokenRegex =
    /(\|\|[^|]+\|\||\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|\*[^*\n]+\*|@[a-zA-Z0-9_.-]+)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    const token = match[0];
    if (token.startsWith('||') && token.endsWith('||')) {
      segments.push({ type: 'spoiler', content: token.slice(2, -2) });
    } else if (token.startsWith('**') && token.endsWith('**')) {
      segments.push({ type: 'bold', content: token.slice(2, -2) });
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      segments.push({ type: 'strike', content: token.slice(2, -2) });
    } else if (token.startsWith('`') && token.endsWith('`')) {
      segments.push({ type: 'code', content: token.slice(1, -1) });
    } else if (token.startsWith('*') && token.endsWith('*')) {
      segments.push({ type: 'italic', content: token.slice(1, -1) });
    } else if (token.startsWith('@')) {
      segments.push({ type: 'mention', content: token });
    } else {
      segments.push({ type: 'text', content: token });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}

export function parseMessageBlocks(content: string): MessageBlock[] {
  if (!content) return [];

  const blocks: MessageBlock[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const processNonCodeChunk = (chunk: string) => {
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (!line.trim() && lines.length > 1) continue;
      if (line.startsWith('> ')) {
        blocks.push({
          type: 'blockquote',
          segments: parseInlineSegments(line.slice(2)),
        });
      } else {
        blocks.push({
          type: 'paragraph',
          segments: parseInlineSegments(line),
        });
      }
    }
  };

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      processNonCodeChunk(content.slice(lastIndex, match.index));
    }
    blocks.push({
      type: 'codeblock',
      language: match[1] || 'text',
      code: match[2].replace(/\n$/, ''),
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    processNonCodeChunk(content.slice(lastIndex));
  }

  return blocks;
}

export interface ServerBoostState {
  level: 0 | 1 | 2 | 3;
  boostCount: number;
  nextLevelBoosts: number;
  progressPercent: number;
  audioBitrateKbps: number;
  uploadLimitMB: number;
  customEmojiSlots: number;
  perks: string[];
}

export function calculateServerBoostState(boostCount = 0): ServerBoostState {
  const safeBoosts = Math.max(0, Math.floor(boostCount));
  let level: 0 | 1 | 2 | 3 = 0;
  let nextLevelBoosts = 2;
  let audioBitrateKbps = 96;
  let uploadLimitMB = 25;
  let customEmojiSlots = 50;

  if (safeBoosts >= 14) {
    level = 3;
    nextLevelBoosts = 14;
    audioBitrateKbps = 384;
    uploadLimitMB = 500;
    customEmojiSlots = 250;
  } else if (safeBoosts >= 7) {
    level = 2;
    nextLevelBoosts = 14;
    audioBitrateKbps = 256;
    uploadLimitMB = 100;
    customEmojiSlots = 150;
  } else if (safeBoosts >= 2) {
    level = 1;
    nextLevelBoosts = 7;
    audioBitrateKbps = 128;
    uploadLimitMB = 50;
    customEmojiSlots = 100;
  }

  const progressPercent =
    level === 3
      ? 100
      : Math.min(100, Math.round((safeBoosts / nextLevelBoosts) * 100));

  return {
    level,
    boostCount: safeBoosts,
    nextLevelBoosts,
    progressPercent,
    audioBitrateKbps,
    uploadLimitMB,
    customEmojiSlots,
    perks: [
      `${audioBitrateKbps} kbps HD Spatial Voice Audio`,
      `${uploadLimitMB} MB Community Media Uploads`,
      `${customEmojiSlots} Custom Server Reaction Slots`,
      level >= 2 ? 'HD 1080p 60fps Stage Screen Share' : '720p Stage Screen Share',
    ],
  };
}

export interface CommunityStarterTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  themeColor: string;
  channels: {
    name: string;
    topic: string;
    type: 'text' | 'announcement' | 'voice' | 'stage';
  }[];
}

export const COMMUNITY_TEMPLATES: CommunityStarterTemplate[] = [
  {
    id: 'tpl_gaming',
    name: 'Vanguard Gaming Guild',
    category: 'Gaming & Esports',
    description: 'Competitive matchmaking, raid coordination, patch notes, and low-latency voice comms.',
    themeColor: '#8957F5',
    channels: [
      { name: 'announcements', topic: 'Official tournament brackets & patch updates', type: 'announcement' },
      { name: 'general-lobby', topic: 'Main guild discussion and daily clips', type: 'text' },
      { name: 'looking-for-group', topic: 'Find teammates for ranked queues and raids', type: 'text' },
      { name: 'Squad Alpha Voice', topic: '384kbps competitive voice comms', type: 'voice' },
      { name: 'Tournament Stage', topic: 'Live match commentary & watch party stage', type: 'stage' },
    ],
  },
  {
    id: 'tpl_dev',
    name: 'Quantum Systems Collective',
    category: 'Engineering & AI',
    description: 'Full-stack architecture, TypeScript/Rust engineering, code reviews, and live pair programming.',
    themeColor: '#A47BFF',
    channels: [
      { name: 'releases', topic: 'Production deployments and changelog notes', type: 'announcement' },
      { name: 'architecture', topic: 'Distributed systems, WebRTC, and database design', type: 'text' },
      { name: 'code-review', topic: 'Share snippets with ```code``` blocks and feedback', type: 'text' },
      { name: 'Pair Programming', topic: 'Screen share and debugging war room', type: 'voice' },
      { name: 'Tech Talks Stage', topic: 'Weekly engineering lightning talks', type: 'stage' },
    ],
  },
  {
    id: 'tpl_creative',
    name: 'Synthwave & Spatial Design Lab',
    category: 'Art, 3D & Audio',
    description: '3D WebGL shaders, procedural audio synthesis, UI design critiques, and chill co-working.',
    themeColor: '#7846E4',
    channels: [
      { name: 'showcase', topic: 'Share finished renders, shaders, and audio tracks', type: 'announcement' },
      { name: 'design-critique', topic: 'UI/UX feedback, typography, and motion systems', type: 'text' },
      { name: 'webgl-shaders', topic: 'Three.js, GLSL shaders, and spatial art', type: 'text' },
      { name: 'Lo-Fi Co-Working', topic: 'Focus session with spatial ambient audio', type: 'voice' },
    ],
  },
];
