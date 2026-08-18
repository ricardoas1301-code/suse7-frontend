// ======================================================================
// Ciclo operacional global da conta — SSOT: profiles (auth user id).
// Consumido pelo Dashboard / Resumo Diário; não pertence a um CNPJ.
// ======================================================================

import { supabase } from "../supabaseClient";
import {
  DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
  normalizeOperationalDayClosesAt,
} from "../features/dashboard/operationalDayCycle.js";
import {
  DEFAULT_OPERATIONAL_WORKING_DAYS,
  normalizeOperationalWorkingDays,
  areOperationalWorkingDaysEqual,
} from "../features/dashboard/operationalWorkingDays.js";

/**
 * @returns {Promise<{ closesAt: string; workingDays: number[] } | null>}
 */
export async function loadAccountOperationalCycle() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("operational_day_closes_at, operational_working_days")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return null;

  return {
    closesAt: normalizeOperationalDayClosesAt(data?.operational_day_closes_at),
    workingDays: normalizeOperationalWorkingDays(data?.operational_working_days),
  };
}

/**
 * @param {{ closesAt: string; workingDays: number[] }} payload
 */
export async function saveAccountOperationalCycle(payload) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return { ok: false, error: "Sessão inválida." };
  }

  const closesAt = normalizeOperationalDayClosesAt(
    payload?.closesAt || DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
  );
  const workingDays = normalizeOperationalWorkingDays(payload?.workingDays);

  if (workingDays.length === 0) {
    return { ok: false, error: "Selecione pelo menos um dia de operação." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      operational_day_closes_at: closesAt,
      operational_working_days: workingDays,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message || "Não foi possível salvar." };
  }

  window.dispatchEvent(new Event("s7OperationalDayClosesAtUpdated"));
  return { ok: true };
}

/**
 * @param {{ closesAt: string; workingDays: number[] }} current
 * @param {{ closesAt: string; workingDays: number[] }} baseline
 */
export function isAccountOperationalCycleDirty(current, baseline) {
  if (!current || !baseline) return false;
  return (
    normalizeOperationalDayClosesAt(current.closesAt) !==
      normalizeOperationalDayClosesAt(baseline.closesAt) ||
    !areOperationalWorkingDaysEqual(current.workingDays, baseline.workingDays)
  );
}

export {
  DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
  DEFAULT_OPERATIONAL_WORKING_DAYS,
};
