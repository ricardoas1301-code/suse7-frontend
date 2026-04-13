// ======================================================
// Ordenação / rótulos do comparativo ML — puro (sem React).
// Multi-marketplace: hoje só ML; funções genéricas sobre `scenario`.
// ======================================================

/** @typedef {"baseline" | "participating" | "available"} ScenarioUxGroup */

/**
 * @param {unknown} scenario
 * @returns {ScenarioUxGroup}
 */
export function classifyScenarioUxGroup(scenario) {
  if (!scenario || typeof scenario !== "object") return "available";
  const r = /** @type {Record<string, unknown>} */ (scenario);
  if (r.is_baseline === true) return "baseline";
  const kind = String(r.kind ?? r.scenario_kind ?? "").toLowerCase();
  if (kind === "base") return "baseline";
  const sid = String(r.scenario_id ?? "").toLowerCase();
  if (sid === "baseline") return "baseline";
  const st = String(r.status ?? "").toLowerCase();
  if (st === "active") return "participating";
  if (st === "scheduled") return "available";
  return "available";
}

const GROUP_ORDER = /** @type {Record<ScenarioUxGroup, number>} */ ({
  baseline: 0,
  participating: 1,
  available: 2,
});

/**
 * @param {unknown} scenario
 * @returns {string}
 */
export function cardHeadingLabel(scenario) {
  if (!scenario || typeof scenario !== "object") return "";
  const r = /** @type {Record<string, unknown>} */ (scenario);
  const g = classifyScenarioUxGroup(scenario);
  if (g === "baseline") return "Preço normal";
  const name =
    (r.promotion_name != null && String(r.promotion_name).trim() !== ""
      ? String(r.promotion_name)
      : null) ||
    (r.label != null && String(r.label).trim() !== "" ? String(r.label) : null) ||
    (r.scenario_id != null ? String(r.scenario_id) : "");
  return name;
}

/**
 * Linha de vigência para cards (DD/MM a DD/MM) — baseline não exibe.
 * @param {unknown} scenario
 * @returns {string | null}
 */
export function formatScenarioVigenciaLine(scenario) {
  if (!scenario || typeof scenario !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (scenario);
  if (r.is_baseline === true) return null;
  const kind = String(r.kind ?? "").toLowerCase();
  if (kind === "base") return null;
  const startRaw = r.starts_at != null ? String(r.starts_at).trim() : "";
  const endRaw = r.ends_at != null ? String(r.ends_at).trim() : "";
  const ds = startRaw !== "" ? formatIsoDateToDdMm(startRaw) : null;
  const de = endRaw !== "" ? formatIsoDateToDdMm(endRaw) : null;
  if (ds && de) return `${ds} a ${de}`;
  if (ds && !de) return `desde ${ds}`;
  if (!ds && de) return `até ${de}`;
  return null;
}

/**
 * @param {string} iso
 * @returns {string | null}
 */
function formatIsoDateToDdMm(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

/**
 * @param {unknown[]} scenarios
 * @returns {{ scenario: unknown; group: ScenarioUxGroup }[]}
 */
export function buildOrderedScenarioRows(scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) return [];
  const copy = scenarios.filter((s) => s !== null && typeof s === "object");
  copy.sort((a, b) => {
    const ga = classifyScenarioUxGroup(a);
    const gb = classifyScenarioUxGroup(b);
    const oa = GROUP_ORDER[ga] ?? 99;
    const ob = GROUP_ORDER[gb] ?? 99;
    if (oa !== ob) return oa - ob;
    const titleCmp = cardHeadingLabel(a).localeCompare(cardHeadingLabel(b), "pt-BR");
    if (titleCmp !== 0) return titleCmp;
    const ra = /** @type {Record<string, unknown>} */ (a);
    const rb = /** @type {Record<string, unknown>} */ (b);
    const sa = ra.starts_at != null ? String(ra.starts_at) : "";
    const sb = rb.starts_at != null ? String(rb.starts_at) : "";
    return sa.localeCompare(sb);
  });
  return copy.map((scenario) => ({
    scenario,
    group: classifyScenarioUxGroup(scenario),
  }));
}

/**
 * Raio-x da venda: apenas baseline (Preço normal) + promoções em que o seller participa agora (`status === "active"`).
 * Exclui scheduled e demais “disponíveis” — sem recalcular valores; só filtra a lista vinda da API.
 *
 * @param {unknown[]} scenarios
 * @returns {unknown[]}
 */
export function filterScenariosForRaioxDisplay(scenarios) {
  if (!Array.isArray(scenarios)) return [];
  return scenarios.filter((s) => {
    if (!s || typeof s !== "object") return false;
    const r = /** @type {Record<string, unknown>} */ (s);
    if (r.is_baseline === true) return true;
    const kind = String(r.kind ?? r.scenario_kind ?? "").toLowerCase();
    if (kind === "base") return true;
    const sid = String(r.scenario_id ?? "").toLowerCase();
    if (sid === "baseline") return true;
    const st = String(r.status ?? "").toLowerCase();
    return st === "active";
  });
}
