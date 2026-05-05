import { buildApiUrl, apiFetch } from "../config/api";
import { supabase } from "../supabaseClient";
import { NOTIFICATION_TYPES } from "../constants/notificationPreferences";
import { triggerNotificationEvent } from "./notificationEngine";
import { resolveNotificationUserContext } from "./notificationUserResolver";

const SALES_MARGIN_THRESHOLD = 5;

export async function scanNotificationEventsForCurrentUser() {
  const userCtxResult = await resolveNotificationUserContext();
  if (!userCtxResult.ok || !userCtxResult.data) {
    return { ok: false, error: userCtxResult.error ?? "Não foi possível carregar contexto do usuário." };
  }
  const userContext = userCtxResult.data;

  const [salesEvents, productEvents, listingEvents] = await Promise.all([
    scanSalesEvents(userContext),
    scanProductEvents(userContext),
    scanListingEvents(userContext),
  ]);

  const allEvents = [...salesEvents, ...productEvents, ...listingEvents];
  const deliveries = [];
  for (const event of allEvents) {
    const delivered = await triggerNotificationEvent(event, {
      preferencesByType: userContext.preferencesByType,
      userContext,
    });
    deliveries.push({ event, delivered });
  }

  return {
    ok: true,
    data: {
      user_id: userContext.user_id,
      events_detected: allEvents,
      deliveries,
      totals: {
        detected: allEvents.length,
        delivered: deliveries.reduce((sum, item) => sum + item.delivered.length, 0),
      },
    },
  };
}

export async function scanSalesEvents(userContext) {
  const salesBase = buildApiUrl("/api/sales");
  if (!salesBase) return [];

  const qs = new URLSearchParams({ page: "1", page_size: "120" });
  const result = await apiFetch(`${salesBase}?${qs.toString()}`, { method: "GET" });
  if (!result.ok) return [];
  const rows = Array.isArray(result.data?.rows) ? result.data.rows : [];

  const events = [];
  for (const row of rows) {
    const financials = row?.financials ?? {};
    const profit = toNumber(financials?.profit_brl);
    const margin = toNumber(financials?.margin_percent);
    const saleId = stringOrNull(row?.item_id ?? row?.sale_display_code);
    const marketplaceId = stringOrNull(row?.marketplace);

    if (profit != null && profit < 0) {
      events.push({
        notification_type: NOTIFICATION_TYPES.NEGATIVE_SALE,
        title: "Venda com prejuízo",
        message: `A venda ${row?.sale_display_code ?? saleId ?? "sem código"} foi registrada com lucro negativo.`,
        priority: "critical",
        category: "sales_profit",
        entity_type: "sale",
        entity_id: saleId,
        marketplace_id: marketplaceId,
        user_id: userContext.user_id,
        dedupeKey: buildEventDedupeKey({
          userId: userContext.user_id,
          type: NOTIFICATION_TYPES.NEGATIVE_SALE,
          entityType: "sale",
          entityId: saleId,
          marketplaceId,
          bucket: "sale_once",
        }),
      });
    }

    if (margin != null && margin < SALES_MARGIN_THRESHOLD) {
      events.push({
        notification_type: NOTIFICATION_TYPES.LOW_MARGIN_SALE,
        title: "Venda com margem baixa",
        message: `A venda ${row?.sale_display_code ?? saleId ?? "sem código"} ficou abaixo de ${SALES_MARGIN_THRESHOLD}% de margem.`,
        priority: "important",
        category: "sales_profit",
        entity_type: "sale",
        entity_id: saleId,
        marketplace_id: marketplaceId,
        user_id: userContext.user_id,
        dedupeKey: buildEventDedupeKey({
          userId: userContext.user_id,
          type: NOTIFICATION_TYPES.LOW_MARGIN_SALE,
          entityType: "sale",
          entityId: saleId,
          marketplaceId,
          bucket: "sale_once",
        }),
      });
    }
  }
  return events;
}

export async function scanProductEvents(userContext) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id, product_name, sku, stock_quantity, low_stock_threshold, min_stock, minimum_stock, product_variants(stock_quantity, min_stock, minimum_stock, low_stock_threshold)")
    .eq("user_id", user.id)
    .limit(250);
  if (error || !Array.isArray(data)) return [];

  const events = [];
  for (const product of data) {
    const productStock = resolveProductStockQuantity(product);
    const minStock = pickStockThreshold(product, ["min_stock", "minimum_stock"], 1);
    const lowStock = pickStockThreshold(product, ["low_stock_threshold"], Math.max(minStock + 1, 3));
    const productId = stringOrNull(product?.id);

    if (productStock <= 0) {
      events.push(buildStockEvent({
        type: NOTIFICATION_TYPES.OUT_OF_STOCK,
        title: "Estoque zerado",
        message: `Produto ${product?.product_name ?? product?.sku ?? productId ?? "sem identificação"} está com estoque zerado.`,
        priority: "critical",
        productId,
        userId: userContext.user_id,
      }));
    } else if (productStock < minStock) {
      events.push(buildStockEvent({
        type: NOTIFICATION_TYPES.MIN_STOCK,
        title: "Estoque abaixo do mínimo",
        message: `Produto ${product?.product_name ?? product?.sku ?? productId ?? "sem identificação"} está abaixo do estoque mínimo.`,
        priority: "important",
        productId,
        userId: userContext.user_id,
      }));
    } else if (productStock <= lowStock) {
      events.push(buildStockEvent({
        type: NOTIFICATION_TYPES.LOW_STOCK,
        title: "Estoque baixo",
        message: `Produto ${product?.product_name ?? product?.sku ?? productId ?? "sem identificação"} entrou em faixa de estoque baixo.`,
        priority: "important",
        productId,
        userId: userContext.user_id,
      }));
    }
  }

  return events;
}

export async function scanListingEvents(userContext) {
  const url = buildApiUrl("/api/ml/listings");
  if (!url) return [];
  const result = await apiFetch(url, { method: "GET" });
  if (!result.ok) return [];

  const listings = Array.isArray(result.data?.listings) ? result.data.listings : [];
  const events = [];
  for (const listing of listings) {
    const status = String(listing?.status ?? "").toLowerCase();
    if (status !== "paused") continue;
    const recentSales = resolveRecentSalesCount(listing);
    const listingId = stringOrNull(listing?.id ?? listing?.external_listing_id);
    const marketplaceId = stringOrNull(listing?.marketplace);

    if (recentSales > 0) {
      events.push({
        notification_type: NOTIFICATION_TYPES.PAUSED_PRODUCT_WITH_RECENT_SALES,
        title: "Produto pausado com vendas recentes",
        message: `Anúncio ${listing?.title ?? listingId ?? "sem identificação"} está pausado e teve vendas recentes.`,
        priority: "critical",
        category: "products_stock",
        entity_type: "listing",
        entity_id: listingId,
        marketplace_id: marketplaceId,
        user_id: userContext.user_id,
        dedupeKey: buildEventDedupeKey({
          userId: userContext.user_id,
          type: NOTIFICATION_TYPES.PAUSED_PRODUCT_WITH_RECENT_SALES,
          entityType: "listing",
          entityId: listingId,
          marketplaceId,
        }),
      });
    } else {
      events.push({
        notification_type: NOTIFICATION_TYPES.PAUSED_PRODUCT_WITHOUT_RECENT_SALES,
        title: "Produto pausado sem vendas recentes",
        message: `Anúncio ${listing?.title ?? listingId ?? "sem identificação"} está pausado sem vendas recentes.`,
        priority: "medium",
        category: "products_stock",
        entity_type: "listing",
        entity_id: listingId,
        marketplace_id: marketplaceId,
        user_id: userContext.user_id,
        dedupeKey: buildEventDedupeKey({
          userId: userContext.user_id,
          type: NOTIFICATION_TYPES.PAUSED_PRODUCT_WITHOUT_RECENT_SALES,
          entityType: "listing",
          entityId: listingId,
          marketplaceId,
        }),
      });
    }
  }
  return events;
}

function buildStockEvent({ type, title, message, priority, productId, userId }) {
  return {
    notification_type: type,
    title,
    message,
    priority,
    category: "products_stock",
    entity_type: "product",
    entity_id: productId,
    marketplace_id: null,
    user_id: userId,
    dedupeKey: buildEventDedupeKey({
      userId,
      type,
      entityType: "product",
      entityId: productId,
      marketplaceId: "global",
    }),
  };
}

function resolveProductStockQuantity(product) {
  const variants = Array.isArray(product?.product_variants) ? product.product_variants : [];
  if (variants.length > 0) {
    return variants.reduce((sum, variant) => sum + (toNumber(variant?.stock_quantity) ?? 0), 0);
  }
  return toNumber(product?.stock_quantity) ?? 0;
}

function pickStockThreshold(entity, fields, fallback) {
  const variants = Array.isArray(entity?.product_variants) ? entity.product_variants : [];
  for (const field of fields) {
    const v = toNumber(entity?.[field]);
    if (v != null) return Math.max(0, v);
  }
  for (const variant of variants) {
    for (const field of fields) {
      const v = toNumber(variant?.[field]);
      if (v != null) return Math.max(0, v);
    }
  }
  return fallback;
}

function resolveRecentSalesCount(listing) {
  const candidates = [
    listing?.sales_last_30_days,
    listing?.sold_quantity_30d,
    listing?.recent_sales_30d,
    listing?.last_30d_sales,
    listing?.sold_quantity,
  ];
  for (const value of candidates) {
    const n = toNumber(value);
    if (n != null) return n;
  }
  return 0;
}

function buildEventDedupeKey({ userId, type, entityType, entityId, marketplaceId, bucket = null }) {
  const dayBucket = bucket ?? new Date().toISOString().slice(0, 10);
  return [
    userId || "anonymous",
    String(type || "GENERIC"),
    String(entityType || "entity"),
    String(entityId || "unknown"),
    String(marketplaceId || "global"),
    dayBucket,
  ].join(":");
}

function toNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function stringOrNull(value) {
  const s = String(value ?? "").trim();
  return s || null;
}

