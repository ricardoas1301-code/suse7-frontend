// ======================================================================
// PERFIL — EMPRESAS (multi-CNPJ) + cards + modal
// Lista/edita seller_companies via API; espelha empresa principal em profiles (layout).
// ======================================================================

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./Profile.css";
import "./DadosEmpresa.css";
import SellerCompanyModal from "./SellerCompanyModal";
import AccountOperationalCycleCard from "./AccountOperationalCycleCard.jsx";
import { buildApiUrl, apiFetch } from "../../config/api";
import { formatCompanyTaxRateDisplay } from "./companyCardDisplayFormat.js";
import perfilEmpresaIllustration from "../../assets/profile/perfil-da-empresa-illustration.png";
import { invalidateOperationalTasksCache } from "../../features/dashboard/operationalTasks/operationalTasksApi.js";

function formatCnpjDisplay(raw) {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (d.length !== 14) return raw ?? "";
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export default function DadosEmpresa() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCompanyId, setModalCompanyId] = useState(null);
  const [modalMode, setModalMode] = useState(/** @type {"create" | "edit"} */ ("edit"));

  const loadCompanies = useCallback(async () => {
    const url = buildApiUrl("/api/seller/companies");
    if (!url) {
      setCompanies([]);
      return;
    }
    const { ok, data } = await apiFetch(url, { method: "GET" });
    if (ok && Array.isArray(data?.companies)) {
      setCompanies(data.companies);
    } else {
      setCompanies([]);
    }
  }, []);

  const syncPrimaryProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const url = buildApiUrl("/api/seller/companies");
    if (!url) return;
    const { ok, data } = await apiFetch(url, { method: "GET" });
    if (!ok || !Array.isArray(data?.companies)) return;
    const primary = data.companies.find((c) => c.is_primary);
    if (!primary?.id) return;
    const oneUrl = buildApiUrl(`/api/seller/companies/${primary.id}`);
    const one = await apiFetch(oneUrl, { method: "GET" });
    if (!one.ok || !one.data?.company) return;
    const c = one.data.company;
    const patch = {
      nome_loja: (c.trade_name && String(c.trade_name).trim()) || c.company_name || null,
      photo_url: c.logo_url || null,
    };
    if (c.document_cnpj) {
      patch.cpf_cnpj = formatCnpjDisplay(c.document_cnpj);
    }
    if (c.default_tax_rate != null && String(c.default_tax_rate).trim() !== "") {
      const n = Number(String(c.default_tax_rate).replace(",", "."));
      if (!Number.isNaN(n)) patch.imposto_percentual = n;
    }
    await supabase.from("profiles").update(patch).eq("id", user.id);
    window.dispatchEvent(new Event("logoUpdated"));
  }, []);

  useEffect(() => {
    const boot = async () => {
      await loadCompanies();
      setLoading(false);
    };
    boot();
  }, [loadCompanies]);

  useEffect(() => {
    if (loading || searchParams.get("editar") !== "principal" || companies.length === 0) return;
    const primary = companies.find((c) => c.is_primary) ?? companies[0];
    if (!primary?.id) return;
    setModalMode("edit");
    setModalCompanyId(primary.id);
    setModalOpen(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("editar");
        return next;
      },
      { replace: true },
    );
  }, [companies, loading, searchParams, setSearchParams]);

  const openEdit = (id) => {
    setModalMode("edit");
    setModalCompanyId(id);
    setModalOpen(true);
  };

  const openCreate = () => {
    setModalMode("create");
    setModalCompanyId(null);
    setModalOpen(true);
  };

  const handleModalSaved = async () => {
    await loadCompanies();
    await syncPrimaryProfile();
    invalidateOperationalTasksCache({ reason: "company_profile_saved" });
  };

  if (loading) {
    return (
      <div className="dados-empresa-page">
        <p>Carregando empresas...</p>
      </div>
    );
  }

  return (
    <div className="dados-empresa-page">
      <div className="profile-card s7-empresa-hero">
        <header className="s7-empresa-page-header">
          <div className="s7-empresa-page-header__spacer" aria-hidden />
          <h2 className="s7-empresa-page-header__title">Perfil da Empresa</h2>
          <div className="s7-empresa-page-header__actions">
            <button type="button" className="s7-btn-nova-empresa" onClick={openCreate}>
              Nova empresa
            </button>
          </div>
        </header>

        <div className="s7-empresa-body">
          <div className="s7-empresa-body__companies">
            <div className="s7-company-cards">
              {companies.length === 0 ? (
                <div className="s7-company-card-empty s7-empresa-empty-panel">
                  <p>Nenhuma empresa cadastrada ainda.</p>
                  <p className="s7-empresa-empty-hint">
                    Se você concluiu o cadastro com <strong>CNPJ</strong>, a empresa principal é criada automaticamente.
                    Atualize a página ou confira o documento em <strong>Meu perfil</strong>. Novos CNPJs entram ao conectar
                    uma nova conta Mercado Livre.
                  </p>
                </div>
              ) : (
                companies.map((c) => {
                  const name = (c.trade_name && String(c.trade_name).trim()) || c.company_name || "Empresa";
                  const letter = name.charAt(0).toUpperCase();
                  const cnpj = c.document_masked || "—";
                  const taxRateLabel = formatCompanyTaxRateDisplay(c.default_tax_rate);

                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`s7-company-card ${c.active === false ? "is-inactive" : ""}`}
                      onClick={() => openEdit(c.id)}
                    >
                      <div className="s7-company-card-avatar">
                        {c.logo_url ? <img src={c.logo_url} alt="" /> : <span>{letter}</span>}
                      </div>
                      <div className="s7-company-card-body">
                        <div className="s7-company-card-title-row">
                          <span className="s7-company-card-name">{name}</span>
                          {c.is_primary ? <span className="s7-badge s7-badge-primary">Principal</span> : null}
                        </div>
                        <p className="s7-company-card-line">
                          <span className="s7-company-card-label">CNPJ:</span>{" "}
                          <span className="s7-company-card-value">{cnpj}</span>
                        </p>
                        <p className="s7-company-card-line">
                          <span className="s7-company-card-label">Alíquota de imposto:</span>{" "}
                          <span className="s7-company-card-value">{taxRateLabel}</span>
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <AccountOperationalCycleCard />
          </div>

          <aside className="s7-empresa-body__illustration" aria-hidden="true">
            <img
              className="s7-empresa-illustration"
              src={perfilEmpresaIllustration}
              alt=""
              decoding="async"
            />
          </aside>
        </div>
      </div>

      <SellerCompanyModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalCompanyId(null);
        }}
        mode={modalMode}
        companyId={modalMode === "create" ? null : modalCompanyId}
        onSaved={handleModalSaved}
      />
    </div>
  );
}
