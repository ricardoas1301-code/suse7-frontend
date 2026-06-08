// Coluna Conta — logo/inicial + alias (dados já no payload; sem chamadas extras).
import MarketplaceBadge from "../MarketplaceBadge.jsx";
import "./S7CatalogAccountCell.css";

/**
 * @param {Record<string, unknown> | null | undefined} row
 */
export function pickCatalogAccountFields(row) {
  if (!row || typeof row !== "object") {
    return { marketplaceAccountId: null, accountAlias: null, accountLogoUrl: null };
  }
  return {
    marketplaceAccountId: row.marketplace_account_id ?? row.marketplaceAccountId ?? null,
    accountAlias: row.account_alias ?? row.accountAlias ?? row.ml_account_alias ?? null,
    accountLogoUrl:
      row.account_logo_url ??
      row.accountLogoUrl ??
      row.marketplace_account_logo_url ??
      row.company_logo_url ??
      row.seller_company_logo_url ??
      null,
  };
}

/**
 * @param {{
 *   marketplaceAccountId?: string | null;
 *   accountAlias?: string | null;
 *   accountLogoUrl?: string | null;
 *   compact?: boolean;
 *   variant?: "inline" | "stacked"; — stacked: avatar acima, nome abaixo (Vendas)
 *   stackedAvatarPx?: number; — override do avatar em stacked (ex.: densidade Vendas)
 * }} props
 */
export default function S7CatalogAccountCell({
  marketplaceAccountId,
  accountAlias,
  accountLogoUrl,
  compact = false,
  variant = "inline",
  stackedAvatarPx,
}) {
  const alias = accountAlias != null && String(accountAlias).trim() !== "" ? String(accountAlias).trim() : null;
  const logo = accountLogoUrl != null && String(accountLogoUrl).trim() !== "" ? String(accountLogoUrl).trim() : null;
  const id =
    marketplaceAccountId != null && String(marketplaceAccountId).trim() !== ""
      ? String(marketplaceAccountId).trim()
      : null;
  const defined = Boolean(id || alias || logo);
  const title = alias || id || "Conta não definida";
  const initial = (alias || "?").charAt(0).toUpperCase();

  if (!defined) {
    return (
      <span className="s7-catalog-account s7-catalog-account--undefined" title="Conta não definida">
        <span className="s7-catalog-account__muted">Conta não definida</span>
      </span>
    );
  }

  const stacked = variant === "stacked";
  const avatarStyle =
    stacked && stackedAvatarPx != null && Number.isFinite(Number(stackedAvatarPx))
      ? { width: Number(stackedAvatarPx), height: Number(stackedAvatarPx) }
      : undefined;
  return (
    <span
      className={`s7-catalog-account${compact ? " s7-catalog-account--compact" : ""}${stacked ? " s7-catalog-account--stacked" : ""}`}
      title={title}
    >
      <span className="s7-catalog-account__avatar" style={avatarStyle}>
        {logo ? (
          <img src={logo} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        ) : (
          <span className="s7-catalog-account__initial">{initial}</span>
        )}
      </span>
      {!compact ? (
        <span className={`s7-catalog-account__name${stacked ? " s7-catalog-account__name--stacked" : ""}`}>
          {alias || "—"}
        </span>
      ) : null}
    </span>
  );
}

/** Tamanho do logo canal em modo stacked (Vendas): ~15% maior que 34px da coluna Conta. */
const S7_CHANNEL_STACKED_BADGE_PX = Math.round(34 * 1.15);

/**
 * Coluna Canal — marketplace (logo). `inline`: compacto, nome no tooltip. `stacked`: logo maior + rótulo (Vendas).
 * @param {{
 *   marketplace?: string | null;
 *   marketplaceLabel?: string | null;
 *   variant?: "inline" | "stacked";
 *   stackedBadgePx?: number; — override do logo em stacked (ex.: densidade Vendas)
 * }} props
 */
export function S7CatalogChannelCell({ marketplace, marketplaceLabel, variant = "inline", stackedBadgePx }) {
  const lb =
    marketplaceLabel != null && String(marketplaceLabel).trim() !== "" ? String(marketplaceLabel).trim() : null;
  const fallbackTitle = (() => {
    const s = String(marketplace ?? "").trim().toLowerCase();
    if (s === "mercado_livre" || s === "mercadolivre") return "Mercado Livre";
    return marketplace ? String(marketplace) : "";
  })();
  const displayLabel = lb || fallbackTitle || null;
  const stacked = variant === "stacked";
  const badgeSize =
    stacked && stackedBadgePx != null && Number.isFinite(Number(stackedBadgePx))
      ? Number(stackedBadgePx)
      : stacked
        ? S7_CHANNEL_STACKED_BADGE_PX
        : 22;
  const title = displayLabel || undefined;

  return (
    <span className={`s7-catalog-channel${stacked ? " s7-catalog-channel--stacked" : ""}`} title={title}>
      <MarketplaceBadge
        marketplace={marketplace}
        label={lb}
        size={badgeSize}
        className={stacked ? "s7-catalog-channel__badge--stacked" : ""}
      />
      {stacked && displayLabel ? (
        <span className="s7-catalog-channel__label">{displayLabel}</span>
      ) : null}
    </span>
  );
}
