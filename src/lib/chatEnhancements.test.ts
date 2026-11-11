import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  executeSlashCommand,
  parseMessageBlocks,
  parseInlineSegments,
  calculateServerBoostState,
  COMMUNITY_TEMPLATES,
} from './chatEnhancements';

describe('Doomcord Discord-Competitive Enhancements Pure Logic', () => {
  it('executes /poll slash command and builds structured PollData', () => {
    const res = executeSlashCommand(
      '/poll Best engine? | Unreal 5 | Unity | Godot',
      'user_123'
    );
    assert.ok(res.poll, 'Expected poll object to be created');
    assert.equal(res.poll?.question, 'Best engine?');
    assert.equal(res.poll?.options.length, 3);
    assert.equal(res.poll?.options[0].text, 'Unreal 5');
    assert.equal(res.poll?.options[2].text, 'Godot');
  });

  it('executes /spoiler, /code, and emote slash commands accurately', () => {
    const spoilerRes = executeSlashCommand('/spoiler Final boss is Malenia', 'user_1');
    assert.equal(spoilerRes.transformedContent, '||Final boss is Malenia||');

    const codeRes = executeSlashCommand('/code const x = 42;', 'user_1');
    assert.ok(codeRes.transformedContent.includes('```'));
    assert.ok(codeRes.transformedContent.includes('const x = 42;'));

    const shrugRes = executeSlashCommand('/shrug working on it', 'user_1');
    assert.equal(shrugRes.transformedContent, 'working on it ¯\\_(ツ)_/¯');
  });

  it('parses fenced code blocks and inline formatting segments (spoilers, bold, code, mentions)', () => {
    const raw = 'Check this:\n```ts\nconst a = 1;\n```\nAnd ||hidden|| **bold** `inline` @shriyans';
    const blocks = parseMessageBlocks(raw);
    assert.equal(blocks.length, 3);
    assert.equal(blocks[1].type, 'codeblock');
    if (blocks[1].type === 'codeblock') {
      assert.equal(blocks[1].language, 'ts');
      assert.equal(blocks[1].code, 'const a = 1;');
    }

    const segments = parseInlineSegments('||secret|| and **strong** for @owner');
    const types = segments.map((s) => s.type);
    assert.ok(types.includes('spoiler'));
    assert.ok(types.includes('bold'));
    assert.ok(types.includes('mention'));
  });

  it('calculates Community Server Boost levels and perks accurately', () => {
    const lvl0 = calculateServerBoostState(0);
    assert.equal(lvl0.level, 0);
    assert.equal(lvl0.nextLevelBoosts, 2);

    const lvl1 = calculateServerBoostState(2);
    assert.equal(lvl1.level, 1);
    assert.equal(lvl1.nextLevelBoosts, 7);

    const lvl2 = calculateServerBoostState(8);
    assert.equal(lvl2.level, 2);
    assert.equal(lvl2.nextLevelBoosts, 14);

    const lvl3 = calculateServerBoostState(15);
    assert.equal(lvl3.level, 3);
    assert.equal(lvl3.progressPercent, 100);
  });

  it('exposes multi-channel community templates with valid channel types', () => {
    assert.ok(COMMUNITY_TEMPLATES.length >= 3);
    for (const tpl of COMMUNITY_TEMPLATES) {
      assert.ok(tpl.channels.length >= 4);
      assert.ok(tpl.channels.some((c) => c.type === 'announcement'));
      assert.ok(tpl.channels.some((c) => c.type === 'voice' || c.type === 'stage'));
    }
  });
});
