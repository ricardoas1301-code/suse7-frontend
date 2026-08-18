import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import SellerCompanyModal from "../../../components/Profile/SellerCompanyModal.jsx";
import { buildApiUrl, apiFetch } from "../../../config/api.js";
import { ensureAuthSessionBootstrapped } from "../../../auth/authBootstrapService.js";
import { invalidateOperationalTasksCache } from "./operationalTasksApi.js";

/** @typedef {{ company?: "principal"; intent?: "avatar" | "address" }} OpenSellerCompanyModalOptions */

/** @type {React.Context<{ openSellerCompanyModal: (options?: OpenSellerCompanyModalOptions) => Promise<boolean> } | null>} */
const GlobalSellerCompanyModalContext = createContext(null);

async function fetchPrimarySellerCompanyId() {
  const url = buildApiUrl("/api/seller/companies");
  if (!url) return null;

  await ensureAuthSessionBootstrapped();
  const { ok, data } = await apiFetch(url, { method: "GET" });
  if (!ok || !Array.isArray(data?.companies) || data.companies.length === 0) return null;

  const primary = data.companies.find((row) => row?.is_primary) ?? data.companies[0];
  const id = primary?.id != null ? String(primary.id).trim() : "";
  return id || null;
}

/**
 * Provider global — reutiliza SellerCompanyModal sem navegação de rota.
 * @param {{ children: import("react").ReactNode }} props
 */
export function GlobalSellerCompanyModalProvider({ children }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [companyId, setCompanyId] = useState(/** @type {string | null} */ (null));
  const primaryCompanyIdRef = useRef(/** @type {string | null} */ (null));

  const openSellerCompanyModal = useCallback(async (options = {}) => {
    if (String(options.company ?? "principal") !== "principal") return false;

    let resolvedId = primaryCompanyIdRef.current;
    if (!resolvedId) {
      resolvedId = await fetchPrimarySellerCompanyId();
      if (!resolvedId) return false;
      primaryCompanyIdRef.current = resolvedId;
    }

    setCompanyId(resolvedId);
    setModalOpen(true);
    return true;
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleSaved = useCallback(() => {
    invalidateOperationalTasksCache({ reason: "global_seller_company_modal_saved" });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("logoUpdated"));
    }
  }, []);

  const value = useMemo(
    () => ({
      openSellerCompanyModal,
    }),
    [openSellerCompanyModal],
  );

  return (
    <GlobalSellerCompanyModalContext.Provider value={value}>
      {children}
      <SellerCompanyModal
        open={modalOpen}
        onClose={handleClose}
        mode="edit"
        companyId={companyId}
        onSaved={handleSaved}
        stackLayer="top"
      />
    </GlobalSellerCompanyModalContext.Provider>
  );
}

/** @returns {{ openSellerCompanyModal: (options?: OpenSellerCompanyModalOptions) => Promise<boolean> } | null} */
export function useGlobalSellerCompanyModal() {
  return useContext(GlobalSellerCompanyModalContext);
}
