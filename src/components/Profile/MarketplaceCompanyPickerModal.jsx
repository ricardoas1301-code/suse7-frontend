// ======================================================================
// Seletor de empresa para conectar um marketplace (ML hoje; Shopee/Amazon depois).
// ======================================================================

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./MarketplaceCompanyPickerModal.css";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   marketplaceSlug: string;
 *   marketplaceLabel: string;
 *   companies: Record<string, unknown>[];
 *   connectedSellerCompanyIds: Set<string> | string[];
 *   onSelectCompany: (sellerCompanyId: string) => void;
 *   profilePath?: string;
 * }} props
 */
export default function MarketplaceCompanyPickerModal({
  open,
  onClose,
  marketplaceSlug: _marketplaceSlug,
  marketplaceLabel,
  companies,
  connectedSellerCompanyIds,
  onSelectCompany,
  profilePath = "/perfil/dados-empresa",
}) {
  const navigate = useNavigate();

  const connectedSet = useMemo(() => {
    if (connectedSellerCompanyIds instanceof Set) return connectedSellerCompanyIds;
    return new Set(
      Array.isArray(connectedSellerCompanyIds)
        ? connectedSellerCompanyIds.map((x) => String(x)).filter(Boolean)
        : []
    );
  }, [connectedSellerCompanyIds]);

  const rows = useMemo(() => {
    const list = Array.isArray(companies) ? companies : [];
    return list.map((c) => {
      const id = c?.id != null ? String(c.id) : "";
      const trade = c?.trade_name != null && String(c.trade_name).trim() !== "" ? String(c.trade_name).trim() : "";
      const legal = c?.company_name != null && String(c.company_name).trim() !== "" ? String(c.company_name).trim() : "";
      const masked = c?.document_masked != null ? String(c.document_masked) : "—";
      const isPrimary = c?.is_primary === true;
      const connected = id && connectedSet.has(id);
      const inactive = c?.active === false;
      return { id, trade, legal, masked, isPrimary, connected, inactive };
    });
  }, [companies, connectedSet]);

  const anyAvailable = rows.some((r) => r.id && !r.connected && !r.inactive);
  const allConnected =
    rows.length > 0 && rows.every((r) => !r.id || r.connected || r.inactive);

  if (!open) return null;

  return (
    <div className="s7-mcpick-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="s7-mcpick-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s7-mcpick-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="s7-mcpick-head">
          <div>
            <h2 id="s7-mcpick-title" className="s7-mcpick-title">
              Conectar {marketplaceLabel}
            </h2>
            <p className="s7-mcpick-sub">
              Escolha qual empresa (CNPJ) receberá esta conexão. Cada empresa pode ter no máximo uma conta ativa
              por marketplace.
            </p>
          </div>
          <button type="button" className="s7-mcpick-close" aria-label="Fechar" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="s7-mcpick-body">
          {rows.length === 0 ? (
            <div className="s7-mcpick-empty">
              <p>Nenhuma empresa cadastrada.</p>
              <p className="s7-mcpick-empty-hint">Cadastre seu CNPJ em Perfil da Empresa para conectar marketplaces.</p>
              <button
                type="button"
                className="s7-mcpick-btn s7-mcpick-btn--primary"
                onClick={() => {
                  onClose();
                  navigate(profilePath);
                }}
              >
                Ir para Dados da Empresa
              </button>
            </div>
          ) : (
            <>
              {allConnected && !anyAvailable ? (
                <div className="s7-mcpick-all-connected">
                  <p className="s7-mcpick-all-connected-title">
                    Todas as empresas cadastradas já estão conectadas ao {marketplaceLabel}.
                  </p>
                  <p className="s7-mcpick-all-connected-hint">
                    Para vincular outra conta, cadastre um novo CNPJ em Perfil da Empresa.
                  </p>
                  <button
                    type="button"
                    className="s7-mcpick-btn s7-mcpick-btn--primary"
                    onClick={() => {
                      onClose();
                      navigate(profilePath);
                    }}
                  >
                    Cadastrar nova empresa
                  </button>
                </div>
              ) : null}
              <ul className="s7-mcpick-list">
                {rows.map((r) => {
                  const title = r.trade || r.legal || "Empresa";
                  const sub = r.legal && r.trade && r.legal !== r.trade ? r.legal : null;
                  const disabled = !r.id || r.connected || r.inactive;
                  const rowCls = ["s7-mcpick-row", disabled ? "is-disabled" : "is-available"].filter(Boolean).join(" ");
                  return (
                    <li
                      key={r.id || title}
                      className={rowCls}
                      title={
                        r.connected
                          ? `Essa empresa já está conectada ao ${marketplaceLabel}.`
                          : r.inactive
                            ? "Empresa inativa."
                            : undefined
                      }
                    >
                      <div className="s7-mcpick-row-main">
                        <div className="s7-mcpick-row-text">
                          <div className="s7-mcpick-row-title">
                            <span>{title}</span>
                            {r.isPrimary ? <span className="s7-mcpick-badge">Principal</span> : null}
                            {r.connected ? (
                              <span className="s7-mcpick-badge s7-mcpick-badge--muted">Já conectada</span>
                            ) : null}
                            {r.inactive ? <span className="s7-mcpick-badge s7-mcpick-badge--warn">Inativa</span> : null}
                          </div>
                          {sub ? <div className="s7-mcpick-row-legal">{sub}</div> : null}
                          <div className="s7-mcpick-row-cnpj">{r.masked}</div>
                        </div>
                        <div className="s7-mcpick-row-action">
                          <button
                            type="button"
                            className="s7-mcpick-btn s7-mcpick-btn--sm"
                            disabled={disabled}
                            title={
                              r.connected
                                ? `Essa empresa já está conectada ao ${marketplaceLabel}.`
                                : r.inactive
                                  ? "Empresa inativa."
                                  : undefined
                            }
                            onClick={() => {
                              if (!r.id || disabled) return;
                              onSelectCompany(r.id);
                              onClose();
                            }}
                          >
                            Selecionar
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="s7-mcpick-footer">
          <button type="button" className="s7-mcpick-link" onClick={() => navigate(profilePath)}>
            Gerenciar empresas em Perfil da Empresa
          </button>
        </div>
      </div>
    </div>
  );
}
