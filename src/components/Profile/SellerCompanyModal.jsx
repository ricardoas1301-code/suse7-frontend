// ======================================================================
// Modal cadastro / edição de empresa (seller_companies) — multi-CNPJ
// Layout compartilhado create/edit; upload em bucket dedicado.
// ======================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import { buildApiUrl, apiFetch } from "../../config/api";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import {
  formatPhoneBr,
  formatCpfCnpjBr,
  formatCepBr,
} from "../../utils/profileInputMasks";
import { isValidCnpjInput, normalizeCnpjDigits } from "../../utils/cnpjValidation";
import SellerCompanyFormBody from "./SellerCompanyFormBody.jsx";
import {
  buildSellerCompanyCreateBody,
  buildSellerCompanyEditPatchBody,
  mapSellerCompanyApiToForm,
  validateSellerCompanyCepInput,
  validateSellerCompanyCreateForm,
} from "./sellerCompanyFormMapper.js";
import { useModalBackdropDismiss } from "../../utils/modalBackdropDismiss.js";
import "../CompleteProfileModal.css";
import "./marketplaceIntegration/s7ModalStack.css";
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
    contact_email: "",
  };
}

function sanitizeLogoFileName(originalName, ext) {
  const withoutExt = String(originalName ?? "logo").replace(/\.[^.\\/]+$/g, "");
  const base =
    withoutExt.replace(/[/\\]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 64) || "logo";
  return `${base}.${ext}`;
}

function isValidCompanyContactEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (email === "") return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeCompanyContactEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  return email === "" ? null : email;
}

function sellerCompanySaveErrorMessage(error, data) {
  const serverErr = typeof error === "string" ? error : data?.error || "";
  if (/schema cache|could not find the .* column/i.test(serverErr)) {
    return "Não foi possível salvar as alterações. Tente novamente.";
  }
  return serverErr || "Não foi possível salvar as alterações. Tente novamente.";
}

/** @param {HTMLFormElement | null} formEl */
function clearSellerCompanyCreateFieldValidity(formEl) {
  if (!formEl) return;
  formEl.querySelectorAll("input, textarea, select").forEach((el) => {
    if ("setCustomValidity" in el) {
      el.setCustomValidity("");
    }
  });
}

/**
 * Toast lateral + balão nativo do browser (seta no campo), preservando ordem canônica de validação.
 * @param {HTMLFormElement | null} formEl
 * @param {string | undefined} field
 * @param {string} message
 */
function showSellerCompanyCreateFieldValidation(formEl, field, message) {
  if (!field || !formEl) return;
  clearSellerCompanyCreateFieldValidity(formEl);
  const el = formEl.querySelector(`[name="${field}"]`);
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
  el.focus();
  el.scrollIntoView({ block: "nearest" });
  el.setCustomValidity(message);
  el.reportValidity();
}

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   mode: "create" | "edit";
 *   companyId: string | null;
 *   primaryCompanyId?: string | null;
 *   onSaved?: (p: { id: string; isCreate: boolean }) => void;
 *   stackLayer?: "standalone" | "top";
 * }} props
 */
export default function SellerCompanyModal({
  open,
  onClose,
  mode,
  companyId,
  onSaved,
  stackLayer = "standalone",
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isPrimaryCompany, setIsPrimaryCompany] = useState(false);
  const [accountLoginEmail, setAccountLoginEmail] = useState("");
  const [baselineContactEmail, setBaselineContactEmail] = useState("");
  const [baselineCep, setBaselineCep] = useState("");
  const logoInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const formRef = useRef(/** @type {HTMLFormElement | null} */ (null));
  const { addNotification } = useNotifications();
  const {
    handleBackdropPointerDown,
    handleBackdropPointerUp,
    handleBackdropPointerCancel,
  } = useModalBackdropDismiss(onClose);

  const isCreateMode = mode === "create";

  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const resolveAccountLoginEmail = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return user?.email ?? "";
    const { data: prof } = await supabase.from("profiles").select("email").eq("id", user.id).maybeSingle();
    return prof?.email ?? user.email ?? "";
  }, []);

  const loadOne = useCallback(async () => {
    const editCompanyId = companyId != null ? String(companyId).trim() : "";
    if (!editCompanyId) return;
    const url = buildApiUrl(`/api/seller/companies/${editCompanyId}`);
    if (!url) return;
    setLoading(true);
    try {
      const { ok, data, error } = await apiFetch(url, { method: "GET" });
      if (!ok || !data?.company) {
        addNotification({
          event_type: "SELLER_COMPANY_LOAD_ERR",
          entity_type: "seller_company",
          entity_id: editCompanyId,
          title: "Não foi possível carregar",
          message: typeof error === "string" ? error : "Tente novamente.",
          severity: NOTIFICATION_SEVERITY.ERROR,
        });
        onClose();
        return;
      }
      const c = data.company;
      const accountEmail = c.is_primary ? await resolveAccountLoginEmail() : "";
      if (c.is_primary) setAccountLoginEmail(accountEmail);
      const mapped = mapSellerCompanyApiToForm(c, { accountEmail });
      setIsPrimaryCompany(Boolean(mapped.is_primary));
      setBaselineContactEmail(mapped.is_primary ? accountEmail : mapped.contact_email ?? "");
      setBaselineCep(mapped.cep ?? "");

      let phoneDisplay = c.phone ? formatPhoneBr(String(c.phone).replace(/\D/g, "")) : "";
      if (!phoneDisplay) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          const { data: profileRow } = await supabase
            .from("profiles")
            .select("telefone")
            .eq("id", user.id)
            .maybeSingle();
          const profilePhoneDigits = String(profileRow?.telefone ?? "").replace(/\D/g, "");
          if (profilePhoneDigits) {
            phoneDisplay = formatPhoneBr(profilePhoneDigits);
          }
        }
      }

      setForm({
        ...mapped,
        phone: phoneDisplay,
        whatsapp: c.whatsapp ? formatPhoneBr(String(c.whatsapp).replace(/\D/g, "")) : "",
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, onClose, addNotification, resolveAccountLoginEmail]);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && companyId) {
      loadOne();
    } else {
      setForm(emptyForm());
      setIsPrimaryCompany(false);
      setAccountLoginEmail("");
      setBaselineContactEmail("");
      setBaselineCep("");
    }
  }, [open, mode, companyId, loadOne]);

  const handleChange = (e) => {
    if (isCreateMode) clearSellerCompanyCreateFieldValidity(formRef.current);
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((p) => ({ ...p, [name]: checked }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleTaxPercent = (field) => (value) => {
    if (isCreateMode) clearSellerCompanyCreateFieldValidity(formRef.current);
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handlePhoneField = (field) => (e) => {
    if (isCreateMode) clearSellerCompanyCreateFieldValidity(formRef.current);
    const only = e.target.value.replace(/\D/g, "");
    setForm((p) => ({ ...p, [field]: formatPhoneBr(only) }));
  };

  const handleCnpjInput = (e) => {
    if (isCreateMode) clearSellerCompanyCreateFieldValidity(formRef.current);
    const d = e.target.value.replace(/\D/g, "").slice(0, 14);
    setForm((p) => ({ ...p, document_cnpj: d }));
  };

  const handleCepChange = (e) => {
    if (isCreateMode) clearSellerCompanyCreateFieldValidity(formRef.current);
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

    const focusCreateRequiredField = (field, message) => {
      showSellerCompanyCreateFieldValidation(formRef.current, field, message);
    };

    setSaving(true);
    try {
      if (mode !== "create") {
        const cepValidation = validateSellerCompanyCepInput(form.cep);
        if (!cepValidation.ok) {
          addNotification({
            event_type: "SELLER_COMPANY_CEP_INVALID",
            entity_type: "seller_company",
            entity_id: companyId,
            title: "CEP inválido",
            message: cepValidation.message,
            severity: NOTIFICATION_SEVERITY.ERROR,
          });
          return;
        }
      }

      if (mode === "create") {
        const requiredValidation = validateSellerCompanyCreateForm(form);
        if (!requiredValidation.ok) {
          addNotification({
            event_type: "SELLER_COMPANY_REQUIRED",
            entity_type: "seller_company",
            entity_id: null,
            title: "Campos obrigatórios",
            message: requiredValidation.message,
            severity: NOTIFICATION_SEVERITY.ERROR,
          });
          focusCreateRequiredField(requiredValidation.field, requiredValidation.message);
          return;
        }

        const docDigits = normalizeCnpjDigits(form.document_cnpj);
        if (!isValidCnpjInput(docDigits)) {
          console.warn("[company/profile] cnpj_validation_failed", { mode: "create", reason: "invalid_format_or_checksum" });
          const cnpjMessage = "CNPJ inválido. Confira os números e tente novamente.";
          addNotification({
            event_type: "SELLER_COMPANY_CNPJ_INVALID",
            entity_type: "seller_company",
            entity_id: null,
            title: "CNPJ inválido",
            message: cnpjMessage,
            severity: NOTIFICATION_SEVERITY.ERROR,
          });
          focusCreateRequiredField("document_cnpj", cnpjMessage);
          return;
        }
        const body = buildSellerCompanyCreateBody(form);
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
            message: sellerCompanySaveErrorMessage(error, data),
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

      if (!isValidCompanyContactEmail(isPrimaryCompany ? accountLoginEmail : form.contact_email)) {
        addNotification({
          event_type: "SELLER_COMPANY_EMAIL_INVALID",
          entity_type: "seller_company",
          entity_id: companyId,
          title: "E-mail inválido",
          message: "Informe um e-mail de contato válido para a empresa.",
          severity: NOTIFICATION_SEVERITY.ERROR,
        });
        return;
      }

      const editCompanyId = companyId != null ? String(companyId).trim() : "";
      if (!editCompanyId) {
        addNotification({
          event_type: "SELLER_COMPANY_SAVE_ERR",
          entity_type: "seller_company",
          entity_id: null,
          title: "Empresa não salva",
          message: "Identificador da empresa inválido.",
          severity: NOTIFICATION_SEVERITY.ERROR,
        });
        return;
      }

      const patchUrl = buildApiUrl(`/api/seller/companies/${editCompanyId}`);
      const body = buildSellerCompanyEditPatchBody(form, {
        isPrimary: isPrimaryCompany,
        baselineContactEmail,
        baselineCep,
      });
      const { ok, data, error } = await apiFetch(patchUrl, { method: "PATCH", body });
      if (!ok) {
        addNotification({
          event_type: "SELLER_COMPANY_SAVE_ERR",
          entity_type: "seller_company",
          entity_id: companyId,
          title: "Empresa não salva",
          message: sellerCompanySaveErrorMessage(error, data),
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

  const stackClass = stackLayer === "top" ? "s7-modal-stack-top" : "";

  return (
    <div
      className={`profile-modal-backdrop ${stackClass}`.trim()}
      role="presentation"
      onPointerDown={handleBackdropPointerDown}
      onPointerUp={handleBackdropPointerUp}
      onPointerCancel={handleBackdropPointerCancel}
    >
      <div
        className="profile-modal s7-seller-company-modal s7-seller-company-modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s7-seller-company-modal-h"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-modal-header s7-co-form-header">
          <h2 id="s7-seller-company-modal-h">{title}</h2>
          <p className="s7-co-form-subtitle">
            Dados fiscais e de contato da empresa.{" "}
            <span className="s7-co-required-legend">
              <span className="s7-co-required" aria-hidden="true">
                *
              </span>{" "}
              Campos obrigatórios
            </span>
          </p>
        </div>

        {loading ? (
          <p className="s7-co-loading">Carregando...</p>
        ) : (
          <form
            ref={formRef}
            className="profile-modal-form s7-co-form"
            noValidate={isCreateMode}
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
          >
            <SellerCompanyFormBody
              form={form}
              isEdit={!isCreateMode}
              isCreate={isCreateMode}
              isPrimaryCompany={isPrimaryCompany}
              accountLoginEmail={accountLoginEmail}
              letter={letter}
              logoInputRef={logoInputRef}
              uploadingLogo={uploadingLogo}
              saving={saving}
              onChange={handleChange}
              onTaxPercent={handleTaxPercent}
              onPhoneField={handlePhoneField}
              onCnpjInput={handleCnpjInput}
              onCepChange={handleCepChange}
              onCepBlur={handleCepBlur}
              onLogo={handleLogo}
              onLogoActivate={() => logoInputRef.current?.click()}
            />

            <div className="s7-co-modal-actions">
              <button type="submit" className="btn-primary s7-btn-brand-primary" disabled={saving || uploadingLogo}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
