// Labels operacionais do bloco esquerdo — GET /api/sales/detail (general).

/** @param {unknown} v */
function safeStr(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/**
 * @param {Record<string, unknown> | null | undefined} general
 */
export function pickSaleNumberDisplay(general) {
  const g = general && typeof general === "object" ? general : {};
  const fromApi = safeStr(g.sale_number_display);
  if (fromApi) return fromApi;
  const raw =
    safeStr(g.sale_number) ??
    safeStr(g.external_pack_id) ??
    safeStr(g.external_order_id);
  if (!raw) return null;
  return raw.startsWith("#") ? raw : `#${raw}`;
}

/**
 * @param {Record<string, unknown> | null | undefined} general
 */
export function pickSaleNumberCopyText(general) {
  const g = general && typeof general === "object" ? general : {};
  const raw =
    safeStr(g.sale_number) ??
    safeStr(g.external_pack_id) ??
    safeStr(g.external_order_id);
  if (!raw) return null;
  return raw.replace(/^#/, "");
}

/**
 * @param {Record<string, unknown> | null | undefined} general
 */
export function pickSaleStatusLabel(general) {
  const g = general && typeof general === "object" ? general : {};
  return safeStr(g.sale_status_label) ?? safeStr(g.order_status);
}

/**
 * @param {Record<string, unknown> | null | undefined} general
 * @returns {"success" | "warning" | "danger" | "neutral"}
 */
export function pickSaleStatusTone(general) {
  const g = general && typeof general === "object" ? general : {};
  const tone = safeStr(g.sale_status_tone)?.toLowerCase();
  if (tone === "success" || tone === "warning" || tone === "danger" || tone === "neutral") {
    return tone;
  }
  return "neutral";
}

/**
 * @param {Record<string, unknown> | null | undefined} general
 */
export function pickSaleOriginLabel(general) {
  const g = general && typeof general === "object" ? general : {};
  return safeStr(g.sale_origin_label);
}

/**
 * @param {Record<string, unknown> | null | undefined} general
 * @returns {{ type: "ads" | "affiliate" | "standard"; label: string; icon: string | null }}
 */
export function pickSaleTypeDisplay(general) {
  const g = general && typeof general === "object" ? general : {};
  const raw = g.sale_type_display;
  if (raw && typeof raw === "object") {
    const d = /** @type {Record<string, unknown>} */ (raw);
    const typeRaw = safeStr(d.type)?.toLowerCase();
    const type =
      typeRaw === "ads" || typeRaw === "affiliate" || typeRaw === "standard" ? typeRaw : "standard";
    const label = safeStr(d.label) ?? (type === "ads" ? "Venda por publicidade" : type === "affiliate" ? "Venda por afiliado" : "Padrão");
    const icon = safeStr(d.icon);
    return {
      type,
      label,
      icon: icon === "mercado_livre_ads" ? "mercado_livre_ads" : null,
    };
  }

  const legacy = safeStr(g.sale_type_label);
  if (legacy === "Publicidade" || legacy === "Venda por publicidade") {
    return { type: "ads", label: "Venda por publicidade", icon: "mercado_livre_ads" };
  }
  if (legacy === "Afiliado" || legacy === "Venda por afiliado") {
    return { type: "affiliate", label: "Venda por afiliado", icon: null };
  }
  return { type: "standard", label: legacy ?? "Padrão", icon: null };
}

/**
 * @param {Record<string, unknown> | null | undefined} general
 */
export function pickSaleTypeLabel(general) {
  return pickSaleTypeDisplay(general).label;
}

/**
 * @param {Record<string, unknown> | null | undefined} general
 * @returns {{ type: "full" | "flex" | "standard"; label: string } | null}
 */
export function pickFulfillmentDisplay(general) {
  const g = general && typeof general === "object" ? general : {};
  const raw = g.fulfillment_display;
  if (!raw || typeof raw !== "object") {
    const legacy = safeStr(g.fulfillment_label);
    if (!legacy) return { type: "standard", label: "Padrão" };
    const upper = legacy.toUpperCase();
    if (upper === "FULL") return { type: "full", label: "FULL" };
    if (upper === "FLEX") return { type: "flex", label: "FLEX" };
    return { type: "standard", label: "Padrão" };
  }
  const d = /** @type {Record<string, unknown>} */ (raw);
  const typeRaw = safeStr(d.type)?.toLowerCase();
  const label = safeStr(d.label);
  if (typeRaw === "full" && label) return { type: "full", label };
  if (typeRaw === "flex" && label) return { type: "flex", label };
  if (typeRaw === "standard" && label) return { type: "standard", label };
  return { type: "standard", label: label ?? "Padrão" };
}

/**
 * @param {unknown} compact
 */
export function pickSaleShippingDisplayCompact(compact) {
  if (!compact || typeof compact !== "object") return null;
  const s = /** @type {Record<string, unknown>} */ (compact);
  const streetLine = safeStr(s.street_line) ?? safeStr(s.address_line);
  const cepCityState = safeStr(s.cep_city_state);
  const receiverLabel = safeStr(s.receiver_label);
  if (!streetLine && !cepCityState && !receiverLabel) return null;
  return {
    title: safeStr(s.title) ?? "Dados do envio",
    streetLine,
    cepCityState,
    receiverLabel,
  };
}
