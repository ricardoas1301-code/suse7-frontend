// ======================================================================
// Modal cadastro / edição de empresa (seller_companies) — multi-CNPJ
// Percentuais como string decimal (vírgula), sem float no frontend.
// ======================================================================

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { buildApiUrl, apiFetch } from "../../config/api";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import "./SellerCompanyModal.css";

function emptyForm() {
  return {
    company_name: "",
    trade_name: "",
    document_cnpj: "",
    tax_regime: "",
    default_tax_rate: "",
    operational_cost_rate: "",
    internal_notes: "",
    phone: "",
    whatsapp: "",
    cep: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_district: "",
    address_city: "",
    address_state: "",
    logo_url: "",
    active: true,
  };
}

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   mode: "create" | "edit";
 *   companyId: string | null;
 *   profileEmail?: string;
 *   onSaved?: (p: { id: string; isCreate: boolean }) => void;
 * }} props
 */
export default function SellerCompanyModal({ open, onClose, mode, companyId, profileEmail, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { addNotification } = useNotifications();

  const loadOne = useCallback(async () => {
    const url = buildApiUrl(`/api/seller/companies/${companyId}`);
    if (!url) return;
    setLoading(true);
    try {
      const { ok, data, error } = await apiFetch(url, { method: "GET" });
      if (!ok || !data?.company) {
        addNotification({
          event_type: "SELLER_COMPANY_LOAD_ERR",
          entity_type: "seller_company",
          entity_id: companyId,
          title: "Não foi possível carregar",
          message: typeof error === "string" ? error : "Tente novamente.",
          severity: NOTIFICATION_SEVERITY.ERROR,
        });
        onClose();
        return;
      }
      const c = data.company;
      setForm({
        company_name: c.company_name ?? "",
        trade_name: c.trade_name ?? "",
        document_cnpj: c.document_cnpj != null ? String(c.document_cnpj).replace(/\D/g, "") : "",
        tax_regime: c.tax_regime ?? "",
        default_tax_rate: c.default_tax_rate != null && c.default_tax_rate !== "" ? String(c.default_tax_rate).replace(".", ",") : "",
        operational_cost_rate:
          c.operational_cost_rate != null && c.operational_cost_rate !== ""
            ? String(c.operational_cost_rate).replace(".", ",")
            : "",
        internal_notes: c.internal_notes ?? "",
        phone: c.phone ?? "",
        whatsapp: c.whatsapp ?? "",
        cep: c.cep ?? "",
        address_street: c.address_street ?? "",
        address_number: c.address_number ?? "",
        address_complement: c.address_complement ?? "",
        address_district: c.address_district ?? "",
        address_city: c.address_city ?? "",
        address_state: c.address_state ?? "",
        logo_url: c.logo_url ?? "",
        active: c.active !== false,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, onClose, addNotification]);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && companyId) {
      loadOne();
    } else {
      setForm(emptyForm());
    }
  }, [open, mode, companyId, loadOne]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((p) => ({ ...p, [name]: checked }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleDecimalComma = (name) => (e) => {
    let v = e.target.value.replace(/[^0-9,]/g, "");
    if ((v.match(/,/g) || []).length > 1) return;
    if (v.includes(",")) {
      const [int, dec] = v.split(",");
      v = `${int.slice(0, 6)},${dec.slice(0, 4)}`;
    } else {
      v = v.slice(0, 8);
    }
    setForm((p) => ({ ...p, [name]: v }));
  };

  const handleCnpj = (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 14);
    setForm((p) => ({ ...p, document_cnpj: d }));
  };

  const handleCep = async (e) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 8);
    if (value.length > 5) value = value.replace(/^(\d{5})(\d{1,3})$/, "$1-$2");
    setForm((p) => ({ ...p, cep: value }));
    if (value.length === 9) {
      const cepClean = value.replace("-", "");
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm((p) => ({
            ...p,
            address_street: data.logradouro || p.address_street,
            address_district: data.bairro || p.address_district,
            address_city: data.localidade || p.address_city,
            address_state: data.uf || p.address_state,
          }));
        }
      } catch {
        /* ignore */
      }
    }
  };

  const handleLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const suffix = mode === "edit" && companyId ? companyId : `new-${Date.now()}`;
    const path = `logos/${user.id}-company-${suffix}.${ext}`;
    const { error: upErr } = await supabase.storage.from("profiles").upload(path, file, { upsert: true });
    if (upErr) {
      addNotification({
        event_type: "SELLER_COMPANY_LOGO_ERR",
        entity_type: "seller_company",
        entity_id: companyId,
        title: "Upload da logo",
        message: upErr.message || "Falha ao enviar imagem.",
        severity: NOTIFICATION_SEVERITY.ERROR,
      });
      return;
    }
    const { data } = supabase.storage.from("profiles").getPublicUrl(path);
    const logoUrl = `${data.publicUrl}?t=${Date.now()}`;
    setForm((p) => ({ ...p, logo_url: logoUrl }));
  };

  const handleSave = async () => {
    const urlBase = buildApiUrl("/api/seller/companies");
    if (!urlBase) {
      addNotification({
        event_type: "SELLER_COMPANY_CFG",
        entity_type: "seller_company",
        entity_id: null,
        title: "Configuração",
        message: "Defina VITE_API_BASE_URL para salvar empresas.",
        severity: NOTIFICATION_SEVERITY.WARNING,
      });
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        const body = {
          company_name: form.company_name.trim(),
          trade_name: form.trade_name.trim() || null,
          document_cnpj: form.document_cnpj.replace(/\D/g, ""),
          tax_regime: form.tax_regime.trim() || null,
          default_tax_rate: form.default_tax_rate.trim() || null,
          operational_cost_rate: form.operational_cost_rate.trim() || null,
          internal_notes: form.internal_notes || null,
          phone: form.phone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          cep: form.cep.trim() || null,
          address_street: form.address_street.trim() || null,
          address_number: form.address_number.trim() || null,
          address_complement: form.address_complement.trim() || null,
          address_district: form.address_district.trim() || null,
          address_city: form.address_city.trim() || null,
          address_state: form.address_state.trim() || null,
          logo_url: form.logo_url.trim() || null,
          active: form.active,
        };
        const { ok, data, error } = await apiFetch(urlBase, { method: "POST", body });
        if (!ok || !data?.company?.id) {
          addNotification({
            event_type: "SELLER_COMPANY_SAVE_ERR",
            entity_type: "seller_company",
            entity_id: null,
            title: "Empresa não salva",
            message: typeof error === "string" ? error : data?.error || "Verifique os dados.",
            severity: NOTIFICATION_SEVERITY.ERROR,
          });
          return;
        }
        addNotification({
          event_type: "SELLER_COMPANY_CREATED",
          entity_type: "seller_company",
          entity_id: data.company.id,
          title: "Empresa cadastrada",
          message: "Dados salvos com sucesso.",
          severity: NOTIFICATION_SEVERITY.INFO,
        });
        onSaved?.({ id: data.company.id, isCreate: true });
        onClose();
        return;
      }

      const patchUrl = buildApiUrl(`/api/seller/companies/${companyId}`);
      const body = {
        company_name: form.company_name.trim(),
        trade_name: form.trade_name.trim() || null,
        tax_regime: form.tax_regime.trim() || null,
        default_tax_rate: form.default_tax_rate.trim() || null,
        operational_cost_rate: form.operational_cost_rate.trim() || null,
        internal_notes: form.internal_notes || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        cep: form.cep.trim() || null,
        address_street: form.address_street.trim() || null,
        address_number: form.address_number.trim() || null,
        address_complement: form.address_complement.trim() || null,
        address_district: form.address_district.trim() || null,
        address_city: form.address_city.trim() || null,
        address_state: form.address_state.trim() || null,
        logo_url: form.logo_url.trim() || null,
        active: form.active,
      };
      const { ok, data, error } = await apiFetch(patchUrl, { method: "PATCH", body });
      if (!ok) {
        addNotification({
          event_type: "SELLER_COMPANY_SAVE_ERR",
          entity_type: "seller_company",
          entity_id: companyId,
          title: "Empresa não salva",
          message: typeof error === "string" ? error : data?.error || "Tente novamente.",
          severity: NOTIFICATION_SEVERITY.ERROR,
        });
        return;
      }
      addNotification({
        event_type: "SELLER_COMPANY_UPDATED",
        entity_type: "seller_company",
        entity_id: companyId,
        title: "Empresa atualizada",
        message: "Alterações salvas.",
        severity: NOTIFICATION_SEVERITY.INFO,
      });
      onSaved?.({ id: companyId, isCreate: false });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const title = mode === "create" ? "Nova empresa" : "Editar empresa";
  const letter = (form.trade_name || form.company_name || "?").charAt(0).toUpperCase();

  return (
    <div className="s7-company-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="s7-company-modal-h">
      <div className="s7-company-modal">
        <div className="s7-company-modal-top">
          {form.logo_url ? (
            <img className="s7-company-modal-logo" src={form.logo_url} alt="" />
          ) : (
            <div className="s7-company-modal-logo-ph">{letter}</div>
          )}
          <h2 id="s7-company-modal-h" className="s7-company-modal-title">
            {title}
          </h2>
          <p className="s7-company-modal-sub">
            Cadastro de CNPJ para precificação, impostos e vínculo com contas de marketplace. O login do Suse7 continua
            sendo o e-mail da sua conta.
          </p>
        </div>

        {profileEmail ? (
          <div className="s7-company-modal-grid" style={{ marginTop: 0 }}>
            <div className="s7-field-full">
              <label>E-mail da conta Suse7</label>
              <input value={profileEmail} disabled />
            </div>
          </div>
        ) : null}

        {loading ? (
          <p style={{ textAlign: "center", color: "#6b7280", marginTop: 24 }}>Carregando...</p>
        ) : (
          <>
            <div className="s7-company-modal-grid">
              <div className="s7-field-full logo-row">
                <label>Logo</label>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogo} />
              </div>

              <div className="s7-field-full">
                <label>Razão social *</label>
                <input name="company_name" value={form.company_name} onChange={handleChange} autoComplete="organization" />
              </div>

              <div>
                <label>Nome fantasia</label>
                <input name="trade_name" value={form.trade_name} onChange={handleChange} />
              </div>

              <div>
                <label>CNPJ {mode === "edit" ? "" : "*"}</label>
                <input
                  name="document_cnpj"
                  value={form.document_cnpj}
                  onChange={handleCnpj}
                  disabled={mode === "edit"}
                  inputMode="numeric"
                  placeholder="Somente números"
                />
              </div>

              <div>
                <label>Regime fiscal</label>
                <input name="tax_regime" value={form.tax_regime} onChange={handleChange} placeholder="Ex.: Simples Nacional" />
              </div>

              <div>
                <label>Alíquota / imposto padrão (%)</label>
                <input value={form.default_tax_rate} onChange={handleDecimalComma("default_tax_rate")} placeholder="0,00" />
              </div>

              <div>
                <label>Custo operacional padrão (%)</label>
                <input
                  value={form.operational_cost_rate}
                  onChange={handleDecimalComma("operational_cost_rate")}
                  placeholder="0,00"
                />
              </div>

              <div className="s7-field-full">
                <label>Observações internas</label>
                <textarea name="internal_notes" value={form.internal_notes} onChange={handleChange} />
              </div>

              <div>
                <label>Telefone</label>
                <input name="phone" value={form.phone} onChange={handleChange} />
              </div>

              <div>
                <label>WhatsApp</label>
                <input name="whatsapp" value={form.whatsapp} onChange={handleChange} />
              </div>

              <div>
                <label>CEP</label>
                <input value={form.cep} onChange={handleCep} placeholder="00000-000" />
              </div>

              <div className="s7-field-full">
                <label>Endereço</label>
                <input name="address_street" value={form.address_street} onChange={handleChange} />
              </div>

              <div>
                <label>Número</label>
                <input name="address_number" value={form.address_number} onChange={handleChange} />
              </div>

              <div>
                <label>Complemento</label>
                <input name="address_complement" value={form.address_complement} onChange={handleChange} />
              </div>

              <div>
                <label>Bairro</label>
                <input name="address_district" value={form.address_district} onChange={handleChange} />
              </div>

              <div>
                <label>Cidade</label>
                <input name="address_city" value={form.address_city} onChange={handleChange} />
              </div>

              <div>
                <label>Estado (UF)</label>
                <input name="address_state" value={form.address_state} onChange={handleChange} maxLength={2} />
              </div>

              {mode === "edit" ? (
                <div className="s7-field-full" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" id="s7-co-active" name="active" checked={form.active} onChange={handleChange} />
                  <label htmlFor="s7-co-active" style={{ marginBottom: 0 }}>
                    Empresa ativa
                  </label>
                </div>
              ) : null}
            </div>

            <div className="s7-company-modal-actions">
              <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
