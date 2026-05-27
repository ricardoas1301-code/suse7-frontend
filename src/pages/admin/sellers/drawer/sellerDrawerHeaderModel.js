import { marketplaceLabel } from "../sellerOpsConstants";
import { formatPlanDisplay, statusClass } from "../sellerOpsUtils";

/**
 * @typedef {"neutral" | "active" | "muted" | "warn"} SellerDrawerBadgeTone
 * @typedef {{ key: string; label: string; tone: SellerDrawerBadgeTone; className?: string }} SellerDrawerBadge
 * @typedef {{
 *   sellerId: string;
 *   nome: string;
 *   email: string | null;
 *   secondaryId: string;
 *   photoUrl: string | null;
 *   initial: string;
 *   badges: SellerDrawerBadge[];
 * }} SellerDrawerHeaderModel
 */

/**
 * Monta badges prioritários (máx. 4) a partir de payload/listPreview — sem API nova.
 * @param {{
 *   seller?: Record<string, unknown> | null;
 *   subscription?: Record<string, unknown> | null;
 *   marketplaces?: Record<string, unknown>[];
 *   metrics?: Record<string, unknown> | null;
 *   listPreview?: import("../sellerOpsTypes").SellerListRow | null;
 * }} input
 * @returns {SellerDrawerBadge[]}
 */
export function buildSellerDrawerHeaderBadges({
  seller = null,
  subscription = null,
  marketplaces = [],
  metrics = null,
  listPreview = null,
}) {
  /** @type {SellerDrawerBadge[]} */
  const badges = [];

  const planLabel = formatPlanDisplay(
    /** @type {string | null | undefined} */ (subscription?.plan_key ?? listPreview?.plan_key),
    /** @type {string | null | undefined} */ (subscription?.plan_label ?? listPreview?.plano),
  );
  if (planLabel && planLabel !== "—") {
    badges.push({ key: "plan", label: planLabel, tone: "neutral" });
  }

  const subscriptionStatus = String(
    subscription?.status ?? listPreview?.subscription_status ?? "",
  ).trim();
  if (subscriptionStatus && subscriptionStatus !== "—") {
    const normalized = subscriptionStatus.toLowerCase();
    badges.push({
      key: "subscription_status",
      label: formatSubscriptionStatusLabel(subscriptionStatus),
      tone: normalized === "active" || normalized === "ativo" ? "active" : "muted",
    });
  } else {
    const sellerStatus = String(seller?.status ?? listPreview?.status ?? "").trim();
    if (sellerStatus) {
      badges.push({
        key: "seller_status",
        label: capitalizeLabel(sellerStatus),
        tone: sellerStatus === "ativo" ? "active" : "muted",
        className: statusClass(sellerStatus),
      });
    }
  }

  const mpObjects = Array.isArray(marketplaces) ? marketplaces : [];
  const mpStrings = Array.isArray(listPreview?.marketplaces) ? listPreview.marketplaces : [];
  const mpTotal = mpObjects.length || mpStrings.length;
  const primaryMp = mpObjects[0]?.marketplace ?? mpStrings[0];
  if (primaryMp) {
    const extra = Math.max(0, mpTotal - 1);
    badges.push({
      key: "marketplace",
      label: `${marketplaceLabel(String(primaryMp))}${extra > 0 ? ` +${extra}` : ""}`,
      tone: "neutral",
    });
  } else if (badges.length < 4) {
    badges.push({ key: "marketplace", label: "Sem marketplace", tone: "muted" });
  }

  const connected =
    Number(metrics?.connected_accounts ?? listPreview?.connected_accounts ?? 0) || 0;
  if (connected > 0) {
    badges.push({
      key: "accounts",
      label: connected === 1 ? "1 conta ativa" : `${connected} contas ativas`,
      tone: "active",
    });
  } else {
    const activeFromDetail = mpObjects.filter((m) => {
      const status = String(m.status ?? m.connection_badge_label ?? "").toLowerCase();
      return status.includes("ativ") || status.includes("connect");
    }).length;
    if (activeFromDetail > 0) {
      badges.push({
        key: "accounts",
        label: activeFromDetail === 1 ? "1 conta ativa" : `${activeFromDetail} contas ativas`,
        tone: "active",
      });
    } else if (badges.length < 4) {
      badges.push({ key: "accounts", label: "Sem conta ativa", tone: "muted" });
    }
  }

  return badges.slice(0, 4);
}

/**
 * @param {{
 *   sellerId: string;
 *   listPreview?: import("../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../sellerOpsTypes").SellerDetailPayload | null;
 * }} input
 * @returns {SellerDrawerHeaderModel}
 */
export function buildSellerDrawerHeaderModel({ sellerId, listPreview = null, detail = null }) {
  const seller = detail?.seller ?? null;
  const subscription = detail?.subscription ?? null;
  const marketplaces = Array.isArray(detail?.marketplaces) ? detail.marketplaces : [];
  const metrics = detail?.metrics ?? null;

  const nome = String(seller?.nome ?? listPreview?.nome ?? "Seller");
  const emailRaw = seller?.email ?? listPreview?.email;
  const email = emailRaw ? String(emailRaw) : null;

  return {
    sellerId,
    nome,
    email,
    secondaryId: sellerId,
    photoUrl: seller?.photo_url ?? listPreview?.photo_url ?? null,
    initial: nome.slice(0, 1).toUpperCase() || "?",
    badges: buildSellerDrawerHeaderBadges({ seller, subscription, marketplaces, metrics, listPreview }),
  };
}

/**
 * @param {string} value
 */
function formatSubscriptionStatusLabel(value) {
  const normalized = value.toLowerCase();
  const map = {
    active: "Assinatura ativa",
    ativo: "Assinatura ativa",
    trialing: "Trial",
    trial: "Trial",
    past_due: "Inadimplente",
    canceled: "Cancelada",
    cancelled: "Cancelada",
    paused: "Pausada",
  };
  return map[normalized] ?? capitalizeLabel(value);
}

/**
 * @param {string} value
 */
function capitalizeLabel(value) {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * @param {SellerDrawerBadgeTone} tone
 * @param {string} [extraClass]
 */
export function sellerDrawerBadgeClassName(tone, extraClass = "") {
  const base = "seller-drawer-header__badge dc-seller-pill";
  const toneClass =
    tone === "active"
      ? "dc-seller-pill--status-active"
      : tone === "warn"
        ? "dc-seller-pill--health-warn"
        : tone === "muted"
          ? "dc-seller-pill--status-muted"
          : "dc-seller-pill--neutral";
  return [base, toneClass, extraClass].filter(Boolean).join(" ");
}
