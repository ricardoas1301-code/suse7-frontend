// ======================================================================
// Testes — normalização summary_cards (Central de Saúde dos Anúncios)
// ======================================================================

import assert from "node:assert/strict";
import {
  normalizeListingsHealthSummaryCards,
  normalizeListingsHealthSummaryPayload,
} from "../src/features/dashboard/api/normalizeListingsHealthSummary.js";

function testPreservaSnakeCase() {
  const cards = normalizeListingsHealthSummaryCards({
    summary_cards: {
      active_count: 397,
      offline_count: 150,
      paused_count: 149,
      inactive_count: 1,
      active_with_sales_count: 239,
      active_without_sales_count: 158,
      attention_count: 522,
    },
  });

  assert.ok(cards);
  assert.equal(cards.active_count, 397);
  assert.equal(cards.offline_count, 150);
  assert.equal(cards.paused_count, 149);
  assert.equal(cards.inactive_count, 1);
  assert.equal(cards.active_with_sales_count, 239);
  assert.equal(cards.active_without_sales_count, 158);
  assert.equal(cards.attention_count, 522);
}

function testAceitaCamelCase() {
  const cards = normalizeListingsHealthSummaryCards({
    summaryCards: {
      activeCount: 397,
      offlineCount: 150,
      pausedCount: 149,
      inactiveCount: 1,
      activeWithSalesCount: 239,
      activeWithoutSalesCount: 158,
      attentionCount: 522,
    },
  });

  assert.ok(cards);
  assert.equal(cards.active_count, 397);
  assert.equal(cards.offline_count, 150);
  assert.equal(cards.active_with_sales_count, 239);
  assert.equal(cards.active_without_sales_count, 158);
}

function testMissingSummaryCardsRetornaNull() {
  const warnings = [];
  const cards = normalizeListingsHealthSummaryCards({}, {
    onWarn: (message) => warnings.push(message),
  });

  assert.equal(cards, null);
  assert.ok(warnings.some((msg) => msg.includes("missing summary_cards")));
}

function testPayloadPreservaSummaryCards() {
  const payload = normalizeListingsHealthSummaryPayload({
    summary: { total_listings: 547 },
    summary_cards: {
      active_count: 397,
      offline_count: 150,
      paused_count: 149,
      inactive_count: 1,
      active_with_sales_count: 239,
      active_without_sales_count: 158,
      attention_count: 522,
    },
    cards: {
      operational_health: { total_listings: 547 },
    },
  });

  assert.ok(payload.summary_cards);
  assert.equal(payload.summary_cards.active_count, 397);
  assert.equal(payload.summary?.total_listings, 547);
  assert.equal(payload.cards?.operational_health?.total_listings, 547);
}

function testNaoZeraQuandoBucketsSuperioresTemDados() {
  const payload = normalizeListingsHealthSummaryPayload({
    summary: { total_listings: 547 },
    summary_cards: {
      active_count: 397,
      offline_count: 150,
      paused_count: 149,
      inactive_count: 1,
      active_with_sales_count: 239,
      active_without_sales_count: 158,
      attention_count: 522,
    },
    cards: {
      registration_health: { total_listings: 547, buckets_sum: 547 },
      operational_health: { total_listings: 547, buckets_sum: 547 },
      commercial_health: { total_listings: 547, buckets_sum: 547 },
    },
  });

  const sc = payload.summary_cards;
  assert.equal(sc.active_count, 397);
  assert.equal(sc.active_with_sales_count + sc.active_without_sales_count + sc.offline_count, 547);
  assert.equal(sc.offline_count, sc.paused_count + sc.inactive_count);
}

const tests = [
  testPreservaSnakeCase,
  testAceitaCamelCase,
  testMissingSummaryCardsRetornaNull,
  testPayloadPreservaSummaryCards,
  testNaoZeraQuandoBucketsSuperioresTemDados,
];

let failed = 0;
for (const fn of tests) {
  try {
    fn();
    console.log(`OK ${fn.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${fn.name}`, error);
  }
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log(`\n${tests.length} testes OK`);
}
