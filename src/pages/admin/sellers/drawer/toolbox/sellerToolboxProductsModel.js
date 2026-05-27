import { marketplaceLabel } from "../../sellerOpsConstants";
import { formatSellerWhen } from "../../sellerOpsUtils";

/** @typedef {"loading" | "loaded" | "empty" | "error"} SellerToolboxProductsPanelState */

/** @typedef {"healthy" | "attention" | "critical" | "unknown"} SellerToolboxCatalogHealth */

/**
 * @typedef {{
 *   summary: {
 *     productsLabel: string;
 *     listingsLabel: string;
 *     activeListingsLabel: string;
 *     lastUpdateLabel: string;
 *   };
 *   listingsIndicators: {
 *     hasData: boolean;
 *     items: Array<{ key: string; label: string; valueLabel: string }>;
 *   };
 *   operationalHealth: SellerToolboxCatalogHealth;
 *   operationalHealthLabel: string;
 *   marketplaceDistribution: Array<{
 *     marketplaceKey: string;
 *     marketplaceLabel: string;
 *     countLabel: string;
 *   }>;
 *   hiddenMarketplaceCount: number;
 * }} SellerToolboxProductsModel
 */

const VISIBLE_MARKETPLACE_ROWS = 5;

/**
 * @param {string | null | undefined} value
 * @param {string} [fallback]
 */
export function formatProductsField(value, fallback = "Não informado") {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized === "—") return fallback;
  return normalized;
}

/**
 * @param {...unknown} values
 */
function pickOptionalNumber(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * @param {number | null} value
 */
function formatCountLabel(value) {
  if (value == null || !Number.isFinite(value)) return "Não informado";
  return String(value);
}

/**
 * @param {import("../../sellerOpsTypes").SellerDetailPayload | null | undefined} detail
 */
function collectProductsRows(detail) {
  const products = Array.isArray(detail?.products) ? detail.products : [];
  return products.filter((row) => row && typeof row === "object");
}

/**
 * @param {import("../../sellerOpsTypes").SellerDetailPayload | null | undefined} detail
 */
function collectListingsRows(detail) {
  const listings = Array.isArray(detail?.listings) ? detail.listings : [];
  return listings.filter((row) => row && typeof row === "object");
}

/**
 * @param {Record<string, unknown>} row
 * @returns {"active" | "paused" | "inactive" | "alert" | null}
 */
function resolveListingBucket(row) {
  const statusRaw = String(row.status ?? row.listing_status ?? row.publication_status ?? "")
    .trim()
    .toLowerCase();
  const hasAlert =
    row.has_alert === true ||
    row.alert === true ||
    Number(row.alert_count ?? row.alerts_count ?? 0) > 0 ||
    /alert|warn|atenc|attention/.test(statusRaw);

  if (hasAlert) return "alert";
  if (/ativ|active|published|live|online/.test(statusRaw)) return "active";
  if (/paus|paused|pause/.test(statusRaw)) return "paused";
  if (/inativ|inactive|closed|ended|offline|archived/.test(statusRaw)) return "inactive";
  return null;
}

/**
 * @param {Record<string, unknown>[]} listings
 */
function countListingsByBucket(listings) {
  /** @type {{ active: number; paused: number; inactive: number; alert: number }} */
  const counts = { active: 0, paused: 0, inactive: 0, alert: 0 };

  for (const row of listings) {
    const bucket = resolveListingBucket(row);
    if (bucket) counts[bucket] += 1;
  }

  return counts;
}

/**
 * @param {unknown} iso
 */
function parseUpdateTime(iso) {
  if (!iso) return null;
  const time = Date.parse(String(iso));
  return Number.isFinite(time) ? time : null;
}

/**
 * @param {Record<string, unknown>[]} rows
 */
function resolveLatestUpdateFromRows(rows) {
  let latest = null;
  let latestTime = 0;

  for (const row of rows) {
    const candidate = row.updated_at ?? row.last_updated_at ?? row.synced_at ?? row.last_sync_at;
    const time = parseUpdateTime(candidate);
    if (time != null && time >= latestTime) {
      latestTime = time;
      latest = candidate;
    }
  }

  return latest;
}

/**
 * @param {unknown} healthRaw
 * @returns {SellerToolboxCatalogHealth}
 */
export function resolveCatalogHealth(healthRaw) {
  const raw = String(healthRaw ?? "").trim().toLowerCase();
  if (!raw) return "unknown";
  if (/saud|healthy|ok|good/.test(raw)) return "healthy";
  if (/atenc|warn|attention/.test(raw)) return "attention";
  if (/crit|critical|bad|fail/.test(raw)) return "critical";
  return "unknown";
}

/**
 * @param {SellerToolboxCatalogHealth} health
 */
export function catalogHealthLabel(health) {
  switch (health) {
    case "healthy":
      return "Saudável";
    case "attention":
      return "Atenção";
    case "critical":
      return "Crítico";
    default:
      return "Não informado";
  }
}

/**
 * @param {SellerToolboxCatalogHealth} health
 */
export function sellerToolboxProductsBadgeClassName(health) {
  const base = "seller-toolbox-products-badge dc-seller-pill";
  if (health === "healthy") return `${base} dc-seller-pill--status-active`;
  if (health === "attention") return `${base} dc-seller-pill--health-warn`;
  if (health === "critical") return `${base} dc-seller-pill--health-critical`;
  return `${base} dc-seller-pill--neutral`;
}

/**
 * @param {Record<string, unknown>} row
 */
function resolveMarketplaceKey(row) {
  const key = String(row.marketplace ?? row.marketplace_key ?? row.channel ?? "").trim();
  return key || "outros";
}

/**
 * @param {Record<string, unknown>[]} products
 * @param {Record<string, unknown>[]} listings
 * @param {Record<string, unknown>[]} marketplaces
 */
function buildMarketplaceDistribution(products, listings, marketplaces) {
  /** @type {Map<string, number>} */
  const counts = new Map();

  const addCount = (marketplaceKey, amount) => {
    const key = marketplaceKey || "outros";
    counts.set(key, (counts.get(key) ?? 0) + amount);
  };

  for (const row of listings) {
    const explicit = pickOptionalNumber(
      row.listings_count,
      row.listing_count,
      row.active_listings,
      row.count,
    );
    if (explicit != null) {
      addCount(resolveMarketplaceKey(row), explicit);
      continue;
    }
    addCount(resolveMarketplaceKey(row), 1);
  }

  if (counts.size === 0) {
    for (const row of products) {
      const explicit = pickOptionalNumber(row.products_count, row.product_count, row.count);
      if (explicit != null) {
        addCount(resolveMarketplaceKey(row), explicit);
        continue;
      }
      addCount(resolveMarketplaceKey(row), 1);
    }
  }

  if (counts.size === 0) {
    for (const row of marketplaces) {
      const explicit = pickOptionalNumber(
        row.listings_count,
        row.listing_count,
        row.products_count,
        row.product_count,
        row.catalog_count,
      );
      if (explicit != null) {
        addCount(resolveMarketplaceKey(row), explicit);
      }
    }
  }

  const sorted = [...counts.entries()]
    .map(([marketplaceKey, count]) => ({
      marketplaceKey,
      marketplaceLabel: marketplaceLabel(marketplaceKey),
      countLabel: String(count),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const visible = sorted.slice(0, VISIBLE_MARKETPLACE_ROWS).map(({ count, ...item }) => item);
  const hiddenMarketplaceCount = Math.max(0, sorted.length - VISIBLE_MARKETPLACE_ROWS);

  return { marketplaceDistribution: visible, hiddenMarketplaceCount };
}

/**
 * @param {{
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 * }} input
 * @returns {SellerToolboxProductsModel}
 */
export function buildSellerToolboxProductsModel({ listPreview = null, detail = null }) {
  const metrics = detail?.metrics ?? null;
  const productsRows = collectProductsRows(detail);
  const listingsRows = collectListingsRows(detail);
  const marketplacesRows = Array.isArray(detail?.marketplaces) ? detail.marketplaces : [];

  const productsCount = pickOptionalNumber(
    metrics?.products_count,
    metrics?.product_count,
    metrics?.catalog_products,
    productsRows.length > 0 ? productsRows.length : null,
  );

  const listingsCount = pickOptionalNumber(
    metrics?.listings_count,
    metrics?.listing_count,
    metrics?.catalog_listings,
    listPreview?.listings_count,
    listingsRows.length > 0 ? listingsRows.length : null,
  );

  const bucketCounts = countListingsByBucket(listingsRows);

  const activeListings = pickOptionalNumber(
    metrics?.active_listings,
    metrics?.listings_active,
    bucketCounts.active > 0 ? bucketCounts.active : null,
  );

  const pausedListings = pickOptionalNumber(
    metrics?.paused_listings,
    metrics?.listings_paused,
    bucketCounts.paused > 0 ? bucketCounts.paused : null,
  );

  const inactiveListings = pickOptionalNumber(
    metrics?.inactive_listings,
    metrics?.listings_inactive,
    bucketCounts.inactive > 0 ? bucketCounts.inactive : null,
  );

  const alertListings = pickOptionalNumber(
    metrics?.listings_with_alert,
    metrics?.alert_listings,
    metrics?.listings_alert,
    bucketCounts.alert > 0 ? bucketCounts.alert : null,
  );

  const lastUpdateRaw =
    metrics?.listings_updated_at ??
    metrics?.products_updated_at ??
    metrics?.catalog_updated_at ??
    metrics?.last_listing_update ??
    metrics?.last_product_update ??
    resolveLatestUpdateFromRows([...listingsRows, ...productsRows]);

  /** @type {Array<{ key: string; label: string; valueLabel: string }>} */
  const listingIndicatorItems = [];

  if (activeListings != null) {
    listingIndicatorItems.push({
      key: "active",
      label: "Ativos",
      valueLabel: String(activeListings),
    });
  }
  if (pausedListings != null) {
    listingIndicatorItems.push({
      key: "paused",
      label: "Pausados",
      valueLabel: String(pausedListings),
    });
  }
  if (inactiveListings != null) {
    listingIndicatorItems.push({
      key: "inactive",
      label: "Inativos",
      valueLabel: String(inactiveListings),
    });
  }
  if (alertListings != null) {
    listingIndicatorItems.push({
      key: "alert",
      label: "Com alerta",
      valueLabel: String(alertListings),
    });
  }

  const operationalHealth = resolveCatalogHealth(
    listPreview?.operational_health ??
      metrics?.operational_health ??
      metrics?.catalog_health ??
      metrics?.listings_health,
  );

  const { marketplaceDistribution, hiddenMarketplaceCount } = buildMarketplaceDistribution(
    productsRows,
    listingsRows,
    marketplacesRows.filter((row) => row && typeof row === "object"),
  );

  return {
    summary: {
      productsLabel: formatCountLabel(productsCount),
      listingsLabel: formatCountLabel(listingsCount),
      activeListingsLabel: formatCountLabel(activeListings),
      lastUpdateLabel: formatProductsField(formatSellerWhen(/** @type {string | null | undefined} */ (lastUpdateRaw))),
    },
    listingsIndicators: {
      hasData: listingIndicatorItems.length > 0,
      items: listingIndicatorItems,
    },
    operationalHealth,
    operationalHealthLabel: catalogHealthLabel(operationalHealth),
    marketplaceDistribution,
    hiddenMarketplaceCount,
  };
}

/**
 * @param {{
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 * }} input
 */
export function isSellerToolboxProductsEmpty({ listPreview = null, detail = null }) {
  const metrics = detail?.metrics ?? null;
  const productsRows = collectProductsRows(detail);
  const listingsRows = collectListingsRows(detail);

  const hasCount = [
    metrics?.products_count,
    metrics?.product_count,
    metrics?.listings_count,
    metrics?.listing_count,
    metrics?.active_listings,
    listPreview?.listings_count,
  ].some((value) => Number.isFinite(Number(value)));

  if (hasCount) return false;
  if (productsRows.length > 0 || listingsRows.length > 0) return false;

  const marketplaces = Array.isArray(detail?.marketplaces) ? detail.marketplaces : [];
  const hasMarketplaceCounts = marketplaces.some((row) => {
    if (!row || typeof row !== "object") return false;
    return [
      row.listings_count,
      row.listing_count,
      row.products_count,
      row.product_count,
      row.catalog_count,
    ].some((value) => Number.isFinite(Number(value)));
  });

  return !hasMarketplaceCounts;
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 *   drawerState?: import("../SellerDrawerStateResolver").SellerDrawerState | null;
 *   toolboxState?: import("./sellerToolboxContextModel").SellerToolboxState | null;
 *   isReady?: boolean;
 * }} input
 * @returns {SellerToolboxProductsPanelState}
 */
export function resolveSellerToolboxProductsPanelState({
  sellerId = null,
  listPreview = null,
  detail = null,
  drawerState = null,
  toolboxState = null,
  isReady = false,
}) {
  if (!sellerId) return "empty";
  if (drawerState === "loading" || toolboxState === "loading") return "loading";
  if (drawerState === "error" || toolboxState === "error") return "error";
  if (drawerState === "empty" || toolboxState === "empty") return "empty";
  if (!isReady) return "loading";

  if (isSellerToolboxProductsEmpty({ listPreview, detail })) return "empty";
  return "loaded";
}
