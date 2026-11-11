import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROOT_OWNER_UUID,
  isRootOwner,
  isSecondaryOwner,
  isAnyOwner,
  formatApexTierName,
  formatDurationLabel,
  computeDurationExpiry,
  calculateReceiptDuration,
  INITIAL_NITRO_PLANS,
  INITIAL_COSMETICS_CATALOG,
} from './dataService';

test('isRootOwner strictly identifies Main Owner by UUID or root_owner role', () => {
  assert.equal(isRootOwner(ROOT_OWNER_UUID), true);
  assert.equal(isRootOwner('user_random_123'), false);
  assert.equal(
    isRootOwner({
      uid: ROOT_OWNER_UUID,
      role: 'root_owner',
      username: 'any_handle',
      email: 'any@example.com',
    }),
    true
  );
  assert.equal(
    isRootOwner({
      uid: 'custom_uid',
      role: 'root_owner',
    }),
    true
  );
  assert.equal(
    isRootOwner({
      uid: 'sec_owner_1',
      role: 'secondary_owner',
      username: 'doomcord_owner',
    }),
    false
  );
  assert.equal(isSecondaryOwner({ uid: 'sec_owner_1', role: 'secondary_owner' }), true);
  assert.equal(isAnyOwner({ uid: 'sec_owner_1', role: 'secondary_owner' }), true);
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
