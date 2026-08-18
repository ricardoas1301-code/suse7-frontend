// ======================================================================
// Seletor de empresa para conectar um marketplace (ML hoje; Shopee/Amazon depois).
// ======================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import S7Tooltip from "../ui/S7Tooltip.jsx";
import SellerCompanyModal from "./SellerCompanyModal.jsx";
import "../CompleteProfileModal.css";
import "./marketplaceIntegration/s7ModalStack.css";
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
 *   onCompaniesChanged?: () => void | Promise<void>;
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
  onCompaniesChanged,
  profilePath = "/perfil/dados-empresa",
}) {
  const navigate = useNavigate();
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [highlightCompanyId, setHighlightCompanyId] = useState(null);
  const createCompanyButtonRef = useRef(/** @type {HTMLButtonElement | null} */ (null));

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
    const mapped = list.map((c) => {
      const id = c?.id != null ? String(c.id) : "";
      const trade = c?.trade_name != null && String(c.trade_name).trim() !== "" ? String(c.trade_name).trim() : "";
      const legal = c?.company_name != null && String(c.company_name).trim() !== "" ? String(c.company_name).trim() : "";
      const name = trade || legal || "Empresa";
      const masked = c?.document_masked != null ? String(c.document_masked) : "—";
      const logoUrl = c?.logo_url != null && String(c.logo_url).trim() !== "" ? String(c.logo_url).trim() : "";
      const avatarInitial = name.charAt(0).toUpperCase();
      const isPrimary = c?.is_primary === true;
      const connected = id && connectedSet.has(id);
      const inactive = c?.active === false;
      return { id, name, masked, logoUrl, avatarInitial, isPrimary, connected, inactive };
    });
    if (!highlightCompanyId) return mapped;
    return [...mapped].sort((a, b) => {
      if (a.id === highlightCompanyId) return -1;
      if (b.id === highlightCompanyId) return 1;
      return 0;
    });
  }, [companies, connectedSet, highlightCompanyId]);

  const anyAvailable = rows.some((r) => r.id && !r.connected && !r.inactive);
  const allConnected = rows.length > 0 && rows.every((r) => !r.id || r.connected || r.inactive);

  const openCreateCompany = useCallback(() => {
    setCreateCompanyOpen(true);
  }, []);

  const closeCreateCompany = useCallback(() => {
    setCreateCompanyOpen(false);
    window.requestAnimationFrame(() => {
      createCompanyButtonRef.current?.focus();
    });
  }, []);

  const handleCompanySaved = useCallback(
    async ({ id, isCreate }) => {
      if (isCreate && id) {
        setHighlightCompanyId(String(id));
      }
      setCreateCompanyOpen(false);
      await onCompaniesChanged?.();
      window.requestAnimationFrame(() => {
        createCompanyButtonRef.current?.focus();
      });
    },
    [onCompaniesChanged]
  );

  useEffect(() => {
    if (open) return undefined;
    setCreateCompanyOpen(false);
    setHighlightCompanyId(null);
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open || createCompanyOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape, true);
    return () => document.removeEventListener("keydown", handleEscape, true);
  }, [open, createCompanyOpen, onClose]);

  if (!open) return null;

  const connectedTooltip = `Esta empresa já está conectada ao ${marketplaceLabel}.`;

  const renderRow = (r) => {
    const disabled = !r.id || r.connected || r.inactive;
    const rowCls = [
      "s7-mcpick-row",
      disabled ? "is-disabled" : "is-available",
      r.id && r.id === highlightCompanyId ? "is-highlight" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const selectButton = (
      <button
        type="button"
        className="s7-mcpick-btn s7-mcpick-btn--sm"
        disabled={disabled}
        aria-disabled={disabled || undefined}
        onClick={() => {
          if (!r.id || disabled) return;
          onSelectCompany(r.id);
          onClose();
        }}
      >
        Selecionar
      </button>
    );

    return (
      <li key={r.id || r.name} className={rowCls}>
        <div className="s7-mcpick-row-main">
          <div className="s7-company-card-avatar" aria-hidden="true">
            {r.logoUrl ? <img src={r.logoUrl} alt="" /> : <span>{r.avatarInitial}</span>}
          </div>
          <div className="s7-mcpick-row-text">
            <div className="s7-mcpick-row-title">
              <span>{r.name}</span>
              {r.isPrimary ? <span className="s7-mcpick-badge">Principal</span> : null}
              {r.connected ? <span className="s7-mcpick-badge s7-mcpick-badge--muted">Já conectada</span> : null}
              {r.inactive ? <span className="s7-mcpick-badge s7-mcpick-badge--warn">Inativa</span> : null}
            </div>
            <div className="s7-mcpick-row-cnpj">
              <span className="s7-mcpick-row-cnpj-label">CNPJ:</span>{" "}
              <span className="s7-mcpick-row-cnpj-value">{r.masked}</span>
            </div>
          </div>
          <div className="s7-mcpick-row-action">
            {r.connected ? (
              <S7Tooltip content={connectedTooltip} placement="bottom-start" offset={6} wrap>
                <span className="s7-mcpick-row-action-wrap">{selectButton}</span>
              </S7Tooltip>
            ) : (
              selectButton
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <>
      <div
        className={`profile-modal-backdrop s7-modal-stack-base${createCompanyOpen ? " is-covered" : ""}`}
        role="presentation"
        onMouseDown={createCompanyOpen ? undefined : onClose}
        aria-hidden={createCompanyOpen ? "true" : undefined}
      >
        <div
          className="profile-modal s7-mcpick-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="s7-mcpick-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="profile-modal-header s7-mcpick-header">
            <h2 id="s7-mcpick-title">Conectar ao {marketplaceLabel}</h2>
            <p className="s7-mcpick-sub">Escolha qual CNPJ receberá esta conexão.</p>
          </div>

          <div className="s7-mcpick-body">
            {rows.length === 0 ? (
              <div className="s7-mcpick-empty">
                <p>Nenhuma empresa cadastrada.</p>
                <p className="s7-mcpick-empty-hint">Cadastre uma nova empresa para conectar este marketplace.</p>
                <button
                  ref={createCompanyButtonRef}
                  type="button"
                  className="s7-mcpick-btn s7-mcpick-btn--primary"
                  onClick={openCreateCompany}
                >
                  Cadastrar nova empresa
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
                      Para vincular outra conta, cadastre uma nova empresa.
                    </p>
                    <button
                      ref={createCompanyButtonRef}
                      type="button"
                      className="s7-mcpick-btn s7-mcpick-btn--primary"
                      onClick={openCreateCompany}
                    >
                      Cadastrar nova empresa
                    </button>
                  </div>
                ) : (
                  <div className="s7-mcpick-create-inline">
                    <button
                      ref={createCompanyButtonRef}
                      type="button"
                      className="s7-mcpick-btn s7-mcpick-btn--ghost"
                      onClick={openCreateCompany}
                    >
                      Cadastrar nova empresa
                    </button>
                  </div>
                )}
                <ul className="s7-mcpick-list">{rows.map((r) => renderRow(r))}</ul>
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

      <SellerCompanyModal
        open={createCompanyOpen}
        onClose={closeCreateCompany}
        mode="create"
        companyId={null}
        onSaved={handleCompanySaved}
        stackLayer="top"
      />
    </>
  );
}
