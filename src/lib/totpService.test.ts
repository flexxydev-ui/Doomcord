import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateTotpSecret,
  generateTotpCode,
  verifyTotpCode,
  buildOtpAuthUri,
  generateBackupCodes,
  validateFileUpload,
  evaluateAutoModMessage,
  DEFAULT_AUTOMOD_CONFIG,
} from './totpService';

test('RFC 6238 TOTP generates 6-digit codes and verifies within window tolerance', () => {
  const secret = generateTotpSecret(20);
  assert.equal(secret.length, 20);

  const fixedTime = 1_700_000_000_000;
  const codeNow = generateTotpCode(secret, fixedTime);
  assert.match(codeNow, /^\d{6}$/);

  // Exact timestamp match
  assert.equal(verifyTotpCode(secret, codeNow, fixedTime), true);
  // +30s window tolerance match
  assert.equal(verifyTotpCode(secret, codeNow, fixedTime + 30_000), true);
  // -30s window tolerance match
  assert.equal(verifyTotpCode(secret, codeNow, fixedTime - 30_000), true);
  // Wrong code rejected
  const wrongCode = codeNow === '123456' ? '654321' : '123456';
  assert.equal(verifyTotpCode(secret, wrongCode, fixedTime), false);
});

test('buildOtpAuthUri and generateBackupCodes produce valid formats', () => {
  const uri = buildOtpAuthUri('user@doomcord.com', 'JBSWY3DPEHPK3PXP');
  assert.ok(uri.startsWith('otpauth://totp/'));
  assert.ok(uri.includes('secret=JBSWY3DPEHPK3PXP'));

  const backupCodes = generateBackupCodes(8);
  assert.equal(backupCodes.length, 8);
  assert.match(backupCodes[0], /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
});

test('validateFileUpload blocks dangerous executables and enforces tier limits', () => {
  const exeCheck = validateFileUpload(
    { name: 'trojan.exe', size: 1024, type: 'application/octet-stream' },
    'free'
  );
  assert.equal(exeCheck.valid, false);
  assert.ok(exeCheck.error?.includes('Security block'));

  const oversizeFree = validateFileUpload(
    { name: 'recording.mp4', size: 30 * 1024 * 1024, type: 'video/mp4' },
    'free'
  );
  assert.equal(oversizeFree.valid, false);

  const validApexPlus = validateFileUpload(
    { name: 'recording.mp4', size: 120 * 1024 * 1024, type: 'video/mp4' },
    'nitro'
  );
  assert.equal(validApexPlus.valid, true);
  assert.equal(validApexPlus.maxLimitMB, 500);
});

test('evaluateAutoModMessage blocks restricted keywords and excessive mentions', () => {
  const cleanMsg = evaluateAutoModMessage('Hello everyone, ready for the raid tonight?', DEFAULT_AUTOMOD_CONFIG);
  assert.equal(cleanMsg.allowed, true);

  const keywordBlocked = evaluateAutoModMessage(
    'Click here for a free nitro scam giveaway',
    DEFAULT_AUTOMOD_CONFIG
  );
  assert.equal(keywordBlocked.allowed, false);
  assert.equal(keywordBlocked.ruleTriggered, 'keyword');

  const mentionBlocked = evaluateAutoModMessage(
    'Hey @u1 @u2 @u3 @u4 @u5 @u6 check this out',
    DEFAULT_AUTOMOD_CONFIG
  );
  assert.equal(mentionBlocked.allowed, false);
  assert.equal(mentionBlocked.ruleTriggered, 'mention_spam');
});
