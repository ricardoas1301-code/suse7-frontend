#!/usr/bin/env node
// =============================================================================
// DASH.5B — validação da edição de hora operacional no Perfil > Empresa
// =============================================================================

import assert from "node:assert/strict";
import { resolveOperationalDayCycle } from "../src/features/dashboard/operationalDayCycle.js";

function resolvePrimaryCompanyId(companies) {
  return companies.find((c) => c.is_primary)?.id ?? (companies.length === 1 ? companies[0]?.id ?? null : null);
}

function shouldShowOperationalCloseField({ mode, companyId, primaryCompanyId }) {
  return (
    mode === "edit" &&
    companyId != null &&
    primaryCompanyId != null &&
    String(companyId) === String(primaryCompanyId)
  );
}

console.log("[DASH.5B] test_profile_operational_close_unit");

{
  const companies = [{ id: "a", is_primary: true }];
  const primaryId = resolvePrimaryCompanyId(companies);
  assert.equal(primaryId, "a");
  assert.equal(shouldShowOperationalCloseField({ mode: "edit", companyId: "a", primaryCompanyId: primaryId }), true);
}

{
  const companies = [
    { id: "primary", is_primary: true },
    { id: "secondary", is_primary: false },
  ];
  const primaryId = resolvePrimaryCompanyId(companies);
  assert.equal(primaryId, "primary");
  assert.equal(
    shouldShowOperationalCloseField({ mode: "edit", companyId: "primary", primaryCompanyId: primaryId }),
    true,
  );
  assert.equal(
    shouldShowOperationalCloseField({ mode: "edit", companyId: "secondary", primaryCompanyId: primaryId }),
    false,
  );
}

{
  const companies = [{ id: "only", is_primary: false }];
  const primaryId = resolvePrimaryCompanyId(companies);
  assert.equal(primaryId, "only");
  assert.equal(shouldShowOperationalCloseField({ mode: "edit", companyId: "only", primaryCompanyId: primaryId }), true);
}

{
  const cycleBefore = resolveOperationalDayCycle({
    now: new Date("2026-06-20T08:00:00.000-03:00"),
    closesAt: "18:00",
  });
  const cycleAfter = resolveOperationalDayCycle({
    now: new Date("2026-06-20T08:00:00.000-03:00"),
    closesAt: "17:00",
  });
  assert.match(cycleBefore.labelCompact, /19\/06 18:00/);
  assert.match(cycleAfter.labelCompact, /19\/06 17:00/);
}

console.log("[DASH.5B] OK — cenários de Perfil > Empresa e Dashboard passaram");
