import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROOT_OWNER_UUID,
  isRootOwner,
  isSecondaryOwner,
  isAnyOwner,
  isAdminOrAbove,
  formatApexTierName,
  formatDurationLabel,
  computeDurationExpiry,
  calculateReceiptDuration,
  INITIAL_NITRO_PLANS,
  INITIAL_COSMETICS_CATALOG,
  cleanFirestoreData,
  isRootOwnerEmail,
} from './dataService';

test('isRootOwner and isAdminOrAbove strictly isolate Root Owner from normal members', () => {
  assert.equal(isRootOwner(ROOT_OWNER_UUID), true);
  assert.equal(isRootOwner('user_random_123'), false);
  assert.equal(
    isRootOwner({
      uid: ROOT_OWNER_UUID,
      role: 'root_owner',
      username: 'doomcord_owner',
      email: 'razorpay@admin.doom',
    }),
    true
  );
  // A non-root UUID must never be treated as Root Owner even if role or email is spoofed
  assert.equal(
    isRootOwner({
      uid: 'Oi527cdxGTMYWL0855MTRR5OGe13',
      role: 'member',
      email: 'kshriyans17@gmail.com',
    }),
    false
  );
  assert.equal(
    isAdminOrAbove({
      uid: 'Oi527cdxGTMYWL0855MTRR5OGe13',
      role: 'member',
      email: 'kshriyans17@gmail.com',
    }),
    false
  );
  assert.equal(
    isAdminOrAbove({
      uid: '0VY4uejFmvYFTGHOlqV6ZXM0kMz1',
      role: 'member',
      email: 'flexxygtx23@gmail.com',
    }),
    false
  );
  assert.equal(
    isAdminOrAbove({
      uid: 'mod_user_1',
      role: 'moderator',
      email: 'mod@example.com',
    }),
    false
  );
  assert.equal(
    isAdminOrAbove({
      uid: 'admin_user_1',
      role: 'admin',
      email: 'admin@example.com',
    }),
    true
  );
  assert.equal(isSecondaryOwner({ uid: 'sec_owner_1', role: 'secondary_owner' }), true);
  assert.equal(isAnyOwner({ uid: 'sec_owner_1', role: 'secondary_owner' }), true);
  assert.equal(isAdminOrAbove({ uid: 'sec_owner_1', role: 'secondary_owner' }), true);
});

test('Official APEX plans have zero Nitro text and accurate INR pricing', () => {
  const freePlan = INITIAL_NITRO_PLANS.find((p) => p.tier === 'free');
  const apexPlan = INITIAL_NITRO_PLANS.find((p) => p.tier === 'basic');
  const apexPlusPlan = INITIAL_NITRO_PLANS.find((p) => p.tier === 'nitro');

  assert.ok(freePlan);
  assert.ok(apexPlan);
  assert.ok(apexPlusPlan);

  assert.equal(apexPlan.name, 'APEX');
  assert.equal(apexPlan.monthlyPriceINR, 49);
  assert.equal(apexPlan.yearlyPriceINR, 499);

  assert.equal(apexPlusPlan.name, 'APEX+');
  assert.equal(apexPlusPlan.monthlyPriceINR, 99);
  assert.equal(apexPlusPlan.yearlyPriceINR, 999);

  for (const plan of INITIAL_NITRO_PLANS) {
    assert.equal(plan.name.toLowerCase().includes('nitro'), false);
    assert.equal(plan.tagline.toLowerCase().includes('nitro'), false);
    for (const benefit of plan.benefits) {
      assert.equal(benefit.toLowerCase().includes('nitro'), false);
    }
  }
});

test('APEX Collection cosmetics catalog contains zero user-facing Nitro strings', () => {
  assert.ok(INITIAL_COSMETICS_CATALOG.length >= 12);
  for (const item of INITIAL_COSMETICS_CATALOG) {
    assert.equal(item.name.toLowerCase().includes('nitro'), false);
    assert.equal(item.description.toLowerCase().includes('nitro'), false);
  }
});

test('formatApexTierName maps internal tiers to official APEX / APEX+ labels', () => {
  assert.equal(formatApexTierName('free'), 'Free');
  assert.equal(formatApexTierName('basic'), 'APEX');
  assert.equal(formatApexTierName('nitro'), 'APEX+');
});

test('computeDurationExpiry and formatDurationLabel use exact calendar billing periods', () => {
  const base = new Date('2026-03-15T10:00:00.000Z');

  const monthlyExp = computeDurationExpiry('1m', base, 'monthly');
  assert.ok(monthlyExp);
  const monthlyDate = new Date(monthlyExp);
  assert.equal(monthlyDate.getUTCFullYear(), 2026);
  assert.equal(monthlyDate.getUTCMonth(), 3); // April (0-indexed 3)
  assert.equal(monthlyDate.getUTCDate(), 15);
  assert.equal(formatDurationLabel('1m', 'monthly'), '1 Monthly Billing Period');

  const yearlyExp = computeDurationExpiry('1y', base, 'yearly');
  assert.ok(yearlyExp);
  const yearlyDate = new Date(yearlyExp);
  assert.equal(yearlyDate.getUTCFullYear(), 2027);
  assert.equal(yearlyDate.getUTCMonth(), 2); // March (0-indexed 2)
  assert.equal(yearlyDate.getUTCDate(), 15);
  assert.equal(formatDurationLabel('1y', 'yearly'), '1 Yearly Billing Period');

  const lifetimeExp = computeDurationExpiry('lifetime', base, 'lifetime');
  assert.equal(lifetimeExp, null);
  assert.equal(formatDurationLabel('lifetime', 'lifetime'), 'Lifetime / Permanent');
});

test('calculateReceiptDuration returns accurate start and expiry timestamps', () => {
  const startIso = '2026-05-01T00:00:00.000Z';
  const monthly = calculateReceiptDuration('30d', startIso);
  assert.equal(monthly.durationLabel, '1 Monthly Billing Period');
  assert.ok(monthly.serviceExpiryDate);

  const lifetime = calculateReceiptDuration('lifetime', startIso);
  assert.equal(lifetime.durationLabel, 'LIFETIME — NO EXPIRATION');
  assert.equal(lifetime.serviceExpiryDate, null);
  assert.equal(lifetime.expiryDate, null);
});

test('cleanFirestoreData strips all undefined fields recursively and preserves valid values', () => {
  const dirtyData = {
    id: 'gift_123',
    claimToken: 'APEX-123456',
    restrictedRecipientEmail: undefined,
    restrictedRecipientUsername: undefined,
    nested: {
      valid: 'ok',
      missing: undefined,
      deep: {
        num: 42,
        bad: undefined,
      },
    },
    items: [1, undefined, 'text', null],
    zeroValue: 0,
    falseValue: false,
    nullValue: null,
  };

  const cleaned = cleanFirestoreData(dirtyData);

  assert.equal(Object.prototype.hasOwnProperty.call(cleaned, 'restrictedRecipientEmail'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(cleaned, 'restrictedRecipientUsername'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(cleaned.nested, 'missing'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(cleaned.nested.deep, 'bad'), false);
  assert.equal(cleaned.nested.valid, 'ok');
  assert.equal(cleaned.nested.deep.num, 42);
  assert.equal(cleaned.zeroValue, 0);
  assert.equal(cleaned.falseValue, false);
  assert.equal(cleaned.nullValue, null);
  assert.deepEqual(cleaned.items, [1, 'text', null]);
});

test('isRootOwnerEmail strictly matches only razorpay@admin.doom', () => {
  assert.equal(isRootOwnerEmail('razorpay@admin.doom'), true);
  assert.equal(isRootOwnerEmail('RAZORPAY@ADMIN.DOOM'), true);
  assert.equal(isRootOwnerEmail('kshriyans17@gmail.com'), false);
  assert.equal(isRootOwnerEmail('adrenoxshriyans@gmail.com'), false);
  assert.equal(isRootOwnerEmail('random@gmail.com'), false);
  assert.equal(isRootOwnerEmail(undefined), false);
  assert.equal(isRootOwnerEmail(null), false);
});


