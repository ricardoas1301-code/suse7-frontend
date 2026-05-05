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
    accountLogoUrl: row.account_logo_url ?? row.accountLogoUrl ?? row.marketplace_account_logo_url ?? null,
  };
}

/**
 * @param {{
 *   marketplaceAccountId?: string | null;
 *   accountAlias?: string | null;
 *   accountLogoUrl?: string | null;
 *   compact?: boolean;
 * }} props
 */
export default function S7CatalogAccountCell({
  marketplaceAccountId,
  accountAlias,
  accountLogoUrl,
  compact = false,
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

  return (
    <span
      className={`s7-catalog-account${compact ? " s7-catalog-account--compact" : ""}`}
      title={title}
    >
      <span className="s7-catalog-account__avatar">
        {logo ? (
          <img src={logo} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="s7-catalog-account__initial">{initial}</span>
        )}
      </span>
      {!compact ? <span className="s7-catalog-account__name">{alias || "—"}</span> : null}
    </span>
  );
}

/**
 * Coluna Canal — marketplace (logo); nome só em tooltip (sem aumentar altura da linha).
 * @param {{ marketplace?: string | null; marketplaceLabel?: string | null }} props
 */
export function S7CatalogChannelCell({ marketplace, marketplaceLabel }) {
  const lb =
    marketplaceLabel != null && String(marketplaceLabel).trim() !== "" ? String(marketplaceLabel).trim() : null;
  const fallbackTitle = (() => {
    const s = String(marketplace ?? "").trim().toLowerCase();
    if (s === "mercado_livre" || s === "mercadolivre") return "Mercado Livre";
    return marketplace ? String(marketplace) : "";
  })();
  return (
    <span className="s7-catalog-channel" title={lb || fallbackTitle || undefined}>
      <MarketplaceBadge marketplace={marketplace} label={lb} size={22} />
    </span>
  );
}
