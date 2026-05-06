// ======================================================================
// PERFIL — EMPRESAS (multi-CNPJ) + cards + modal
// Lista/edita seller_companies via API; espelha empresa principal em profiles (layout).
// ======================================================================

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import "./Profile.css";
import "./DadosEmpresa.css";
import SellerCompanyModal from "./SellerCompanyModal";
import { buildApiUrl, apiFetch } from "../../config/api";

function formatCnpjDisplay(raw) {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (d.length !== 14) return raw ?? "";
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function rateToDisplay(v) {
  if (v == null || v === "") return "—";
  return String(v).replace(".", ",");
}

export default function DadosEmpresa() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [profileEmail, setProfileEmail] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCompanyId, setModalCompanyId] = useState(null);

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setProfileEmail(user.email);
      const { data: prof } = await supabase.from("profiles").select("email").eq("id", user?.id).maybeSingle();
      if (prof?.email) setProfileEmail(prof.email);
      await loadCompanies();
      setLoading(false);
    };
    boot();
  }, [loadCompanies]);

  const openEdit = (id) => {
    setModalCompanyId(id);
    setModalOpen(true);
  };

  const handleModalSaved = async () => {
    await loadCompanies();
    await syncPrimaryProfile();
  };

  if (loading) {
    return (
      <div className="dados-empresa-container profile-content">
        <p>Carregando empresas...</p>
      </div>
    );
  }

  return (
    <div className="dados-empresa-container profile-content">
      <div className="profile-card s7-empresa-hero">
        <div className="form-header">
          <h2>Perfil da Empresa</h2>
        </div>
        <p className="s7-empresa-intro">
          Visualize e edite os dados da sua empresa. A empresa principal alimenta o nome e a logo no menu. Para
          cadastrar um <strong>novo CNPJ</strong>, use <strong>Integrações → Mercado Livre → Conectar nova conta</strong>{" "}
          (cada nova conta ML pode ser vinculada a uma empresa).
        </p>

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
                    <div className="s7-company-card-meta">{c.document_masked || "—"}</div>
                    <div className="s7-company-card-footer">
                      <span className={`s7-status-dot ${c.active !== false ? "on" : "off"}`} />
                      <span>{c.active !== false ? "Ativa" : "Inativa"}</span>
                      <span className="s7-company-card-hint">Imposto padrão: {rateToDisplay(c.default_tax_rate)}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <SellerCompanyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode="edit"
        companyId={modalCompanyId}
        profileEmail={profileEmail}
        onSaved={handleModalSaved}
      />
    </div>
  );
}
