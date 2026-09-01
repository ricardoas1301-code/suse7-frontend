// ======================================================================
// Bloco compacto — identidade da loja (logo + nome fantasia + CNPJ)
// Reutilizável em Central de Pendências e fluxos multiconta futuros.
// ======================================================================

import { useState } from "react";
import "./S7StoreIdentityBlock.css";

/**
 * @param {{
 *   storeName?: string | null;
 *   documentFormatted?: string | null;
 *   logoUrl?: string | null;
 *   fallbackInitial?: string;
 *   className?: string;
 * }} props
 */
export default function S7StoreIdentityBlock({
  storeName = null,
  documentFormatted = null,
  logoUrl = null,
  fallbackInitial = "L",
  className = "",
}) {
  const name = storeName != null && String(storeName).trim() ? String(storeName).trim() : null;
  const doc =
    documentFormatted != null && String(documentFormatted).trim()
      ? String(documentFormatted).trim()
      : null;
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(logoUrl) && !logoFailed;

  if (!name && !doc && !showLogo) return null;

  const initial = (fallbackInitial || name || "L").toString().charAt(0).toUpperCase() || "L";

  return (
    <div className={`s7-store-identity ${className}`.trim()} data-store-identity="true">
      {showLogo ? (
        <img
          className="s7-store-identity__logo"
          src={String(logoUrl)}
          alt=""
          width={28}
          height={28}
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span className="s7-store-identity__fallback" aria-hidden>
          {initial}
        </span>
      )}
      <div className="s7-store-identity__text">
        {name ? <p className="s7-store-identity__name">{name}</p> : null}
        {doc ? <p className="s7-store-identity__cnpj">CNPJ: {doc}</p> : null}
      </div>
    </div>
  );
}
