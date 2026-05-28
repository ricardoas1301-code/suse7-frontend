// ======================================================================
// Modal cadastro / edição de empresa (seller_companies) — multi-CNPJ
// Layout alinhado ao CompleteProfileModal; upload em bucket dedicado.
// ======================================================================

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { buildApiUrl, apiFetch } from "../../config/api";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import {
  formatPhoneBr,
  formatCpfCnpjBr,
  formatCepBr,
  sanitizeTaxPercentCommaInput,
} from "../../utils/profileInputMasks";
import { isValidCnpjInput, normalizeCnpjDigits } from "../../utils/cnpjValidation";
import "../CompleteProfileModal.css";
import suse7Logo from "../../assets/suse7-logo-redonda.png";
import "./SellerCompanyModal.css";

const COMPANY_LOGOS_BUCKET =
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET_COMPANY_LOGOS ?? "company-logos";

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

function sanitizeLogoFileName(originalName, ext) {
  const withoutExt = String(originalName ?? "logo").replace(/\.[^.\\/]+$/g, "");
  const base =
    withoutExt.replace(/[/\\]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 64) || "logo";
  return `${base}.${ext}`;
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
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
        default_tax_rate:
          c.default_tax_rate != null && c.default_tax_rate !== "" ? String(c.default_tax_rate).replace(".", ",") : "",
        operational_cost_rate:
          c.operational_cost_rate != null && c.operational_cost_rate !== ""
            ? String(c.operational_cost_rate).replace(".", ",")
            : "",
        internal_notes: c.internal_notes ?? "",
        phone: c.phone ? formatPhoneBr(String(c.phone).replace(/\D/g, "")) : "",
        whatsapp: c.whatsapp ? formatPhoneBr(String(c.whatsapp).replace(/\D/g, "")) : "",
        cep: c.cep ? formatCepBr(String(c.cep).replace(/\D/g, "")) : "",
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

  const handleTaxPercent = (field) => (e) => {
    const next = sanitizeTaxPercentCommaInput(e.target.value);
    if (next === null) return;
    setForm((p) => ({ ...p, [field]: next }));
  };

  const handlePhoneField = (field) => (e) => {
    const only = e.target.value.replace(/\D/g, "");
    setForm((p) => ({ ...p, [field]: formatPhoneBr(only) }));
  };

  const handleCnpjInput = (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 14);
    setForm((p) => ({ ...p, document_cnpj: d }));
  };

  const handleCepChange = (e) => {
    const only = e.target.value.replace(/\D/g, "").slice(0, 8);
    setForm((p) => ({ ...p, cep: formatCepBr(only) }));
  };

  const handleCepBlur = async () => {
    const cepLimpo = form.cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (data.erro) return;
      setForm((p) => ({
        ...p,
        address_street: data.logradouro || p.address_street,
        address_district: data.bairro || p.address_district,
        address_city: data.localidade || p.address_city,
        address_state: data.uf || p.address_state,
      }));
    } catch {
      /* ignore */
    }
  };

  const handleLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      addNotification({
        title: "Upload da logo",
        message: "Sessão inválida. Faça login novamente.",
        severity: NOTIFICATION_SEVERITY.ERROR,
      });
      return;
    }

    const extRaw = (file.name.split(".").pop() || "jpg").toLowerCase();
    const ext = ["jpg", "jpeg", "png", "webp"].includes(extRaw) ? (extRaw === "jpeg" ? "jpg" : extRaw) : "jpg";
    const mime =
      ext === "jpg" ? "image/jpeg" : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    const companySegment =
      mode === "edit" && companyId && String(companyId).trim() !== ""
        ? String(companyId).trim()
        : `draft-${Date.now()}`;
    const safeFile = sanitizeLogoFileName(file.name, ext);
    const path = `${user.id}/${companySegment}/${Date.now()}-${safeFile}`;

    setUploadingLogo(true);
    try {
      const { error: upErr } = await supabase.storage.from(COMPANY_LOGOS_BUCKET).upload(path, file, {
        upsert: true,
        contentType: file.type && file.type.startsWith("image/") ? file.type : mime,
      });
      if (upErr) {
        addNotification({
          event_type: "SELLER_COMPANY_LOGO_ERR",
          entity_type: "seller_company",
          entity_id: companyId,
          title: "Upload da logo",
          message:
            upErr.message?.includes("Bucket not found") || upErr.message?.includes("not found")
              ? `Bucket "${COMPANY_LOGOS_BUCKET}" não encontrado no Supabase. Aplique a migration 20260512120000_storage_company_logos_bucket.sql (ou crie o bucket manualmente).`
              : upErr.message || "Falha ao enviar imagem.",
          severity: NOTIFICATION_SEVERITY.ERROR,
        });
        return;
      }
      const { data: pub } = supabase.storage.from(COMPANY_LOGOS_BUCKET).getPublicUrl(path);
      const logoUrl = pub?.publicUrl ?? "";
      if (!logoUrl) {
        addNotification({
          title: "Upload da logo",
          message: "Não foi possível obter a URL pública do arquivo.",
          severity: NOTIFICATION_SEVERITY.ERROR,
        });
        return;
      }
      setForm((p) => ({ ...p, logo_url: logoUrl }));
      addNotification({
        title: "Upload da logo",
        message: "Imagem enviada. Clique em Salvar para persistir na empresa.",
        severity: NOTIFICATION_SEVERITY.INFO,
      });
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
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
      const digitsPhone = (s) => (s != null ? String(s).replace(/\D/g, "") : "");
      if (mode === "create") {
        const docDigits = normalizeCnpjDigits(form.document_cnpj);
        if (!isValidCnpjInput(docDigits)) {
          console.warn("[company/profile] cnpj_validation_failed", { mode: "create", reason: "invalid_format_or_checksum" });
          addNotification({
            event_type: "SELLER_COMPANY_CNPJ_INVALID",
            entity_type: "seller_company",
            entity_id: null,
            title: "CNPJ inválido",
            message: "CNPJ inválido. Confira os números e tente novamente.",
            severity: NOTIFICATION_SEVERITY.ERROR,
          });
          return;
        }
        const body = {
          company_name: form.company_name.trim(),
          trade_name: form.trade_name.trim() || null,
          document_cnpj: docDigits,
          tax_regime: form.tax_regime.trim() || null,
          default_tax_rate: form.default_tax_rate.trim() || null,
          operational_cost_rate: form.operational_cost_rate.trim() || null,
          internal_notes: form.internal_notes || null,
          phone: digitsPhone(form.phone) || null,
          whatsapp: digitsPhone(form.whatsapp) || null,
          cep: form.cep.replace(/\D/g, "") || null,
          address_street: form.address_street.trim() || null,
          address_number: form.address_number.trim() || null,
          address_complement: form.address_complement.trim() || null,
          address_district: form.address_district.trim() || null,
          address_city: form.address_city.trim() || null,
          address_state: form.address_state.trim() || null,
          logo_url: form.logo_url.trim() || null,
          active: form.active,
        };
        const { ok, data, error, status } = await apiFetch(urlBase, { method: "POST", body });
        if (!ok || !data?.company?.id) {
          const serverErr = typeof error === "string" ? error : data?.error || "Verifique os dados.";
          if (status === 409 || /já está cadastrado|já cadastrado/i.test(serverErr)) {
            console.warn("[company/profile] duplicate_cnpj_blocked", { mode: "create", source: "api_response" });
          }
          if (status === 400 && /CNPJ inválido/i.test(serverErr)) {
            console.warn("[company/profile] cnpj_validation_failed", { mode: "create", source: "api_response" });
          }
          addNotification({
            event_type: "SELLER_COMPANY_SAVE_ERR",
            entity_type: "seller_company",
            entity_id: null,
            title: "Empresa não salva",
            message: serverErr,
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
        phone: digitsPhone(form.phone) || null,
        whatsapp: digitsPhone(form.whatsapp) || null,
        cep: form.cep.replace(/\D/g, "") || null,
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
    <div className="profile-modal-backdrop" role="presentation">
      <div
        className="profile-modal s7-seller-company-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s7-seller-company-modal-h"
      >
        <div className="profile-modal-header">
          <img src={suse7Logo} alt="" className="profile-modal-logo" />
          <h2 id="s7-seller-company-modal-h">{title}</h2>
          <p>Dados fiscais e de contato da empresa. O login do Suse7 continua sendo o e-mail da sua conta.</p>
        </div>

        {profileEmail ? (
          <div className="profile-modal-form">
            <div className="profile-grid">
              <label className="s7-co-field-full">
                E-mail da conta Suse7
                <input value={profileEmail} disabled />
              </label>
            </div>
          </div>
        ) : null}

        {loading ? (
          <p className="s7-co-loading">Carregando...</p>
        ) : (
          <form
            className="profile-modal-form"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="profile-grid">
              <label className="s7-co-field-full s7-co-logo-row">
                Logo da empresa
                <span className="s7-co-logo-preview-wrap">
                  {form.logo_url ? (
                    <img className="s7-co-logo-preview" src={form.logo_url} alt="" />
                  ) : (
                    <span className="s7-co-logo-ph">{letter}</span>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogo}
                    disabled={uploadingLogo || saving}
                    className="s7-co-file-input"
                  />
                  {uploadingLogo ? <span className="s7-co-upload-hint">Enviando...</span> : null}
                </span>
              </label>
            </div>

            <div className="profile-grid">
              <label className="s7-co-field-full">
                Razão social *
                <input name="company_name" value={form.company_name} onChange={handleChange} autoComplete="organization" />
              </label>
            </div>

            <div className="profile-grid">
              <label>
                Nome fantasia
                <input name="trade_name" value={form.trade_name} onChange={handleChange} />
              </label>
              <label>
                CNPJ {mode === "edit" ? "" : "*"}
                <input
                  name="document_cnpj"
                  value={formatCpfCnpjBr(form.document_cnpj)}
                  onChange={handleCnpjInput}
                  disabled={mode === "edit"}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </label>
            </div>

            <div className="profile-grid">
              <label>
                Regime fiscal
                <input name="tax_regime" value={form.tax_regime} onChange={handleChange} placeholder="Ex.: Simples Nacional" />
              </label>
              <label>
                Alíquota / imposto padrão (%)
                <input value={form.default_tax_rate} onChange={handleTaxPercent("default_tax_rate")} placeholder="Ex.: 6 ou 13,28" />
              </label>
            </div>

            <div className="profile-grid">
              <label>
                Custo operacional padrão (%)
                <input
                  value={form.operational_cost_rate}
                  onChange={handleTaxPercent("operational_cost_rate")}
                  placeholder="Ex.: 2 ou 5,5"
                />
              </label>
              <label>
                Estado (UF)
                <input name="address_state" value={form.address_state} onChange={handleChange} maxLength={2} placeholder="SP" />
              </label>
            </div>

            <div className="profile-grid">
              <label className="s7-co-field-full">
                Observações internas
                <textarea name="internal_notes" value={form.internal_notes} onChange={handleChange} className="s7-co-textarea" rows={3} />
              </label>
            </div>

            <div className="profile-grid">
              <label>
                Telefone
                <input name="phone" value={form.phone} onChange={handlePhoneField("phone")} inputMode="tel" autoComplete="tel" />
              </label>
              <label>
                WhatsApp
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handlePhoneField("whatsapp")}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>
            </div>

            <div className="profile-grid">
              <label>
                CEP
                <input name="cep" value={form.cep} onChange={handleCepChange} onBlur={handleCepBlur} placeholder="00000-000" />
              </label>
              <label>
                Número
                <input name="address_number" value={form.address_number} onChange={handleChange} />
              </label>
            </div>

            <div className="profile-grid">
              <label className="s7-co-field-full">
                Endereço
                <input name="address_street" value={form.address_street} onChange={handleChange} />
              </label>
            </div>

            <div className="profile-grid-3">
              <label>
                Complemento
                <input name="address_complement" value={form.address_complement} onChange={handleChange} />
              </label>
              <label>
                Bairro
                <input name="address_district" value={form.address_district} onChange={handleChange} />
              </label>
              <label>
                Cidade
                <input name="address_city" value={form.address_city} onChange={handleChange} />
              </label>
            </div>

            {mode === "edit" ? (
              <div className="profile-grid">
                <label className="s7-co-field-full s7-co-checkbox-row">
                  <input type="checkbox" id="s7-co-active" name="active" checked={form.active} onChange={handleChange} />
                  <span>Empresa ativa</span>
                </label>
              </div>
            ) : null}

            <div className="s7-co-modal-actions">
              <button type="button" className="btn-ghost-s7" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleSave} disabled={saving || uploadingLogo}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
