import { useCallback, useEffect, useState } from "react";
import S7Icon from "../ui/S7Icon.jsx";
import { resolverInicialAvatarLojaHeader } from "../../domain/seller/resolverUrlAvatarLoja.js";
import "./Avatar.css";

/**
 * Avatar/logo da empresa principal no header — fallback seguro (sem imagem quebrada).
 * @param {{
 *   logoUrl?: string | null;
 *   companyName?: string | null;
 *   size?: "sm" | "lg";
 *   className?: string;
 * }} props
 */
export default function SellerCompanyHeaderAvatar({
  logoUrl = null,
  companyName = null,
  size = "sm",
  className = "",
}) {
  const [failed, setFailed] = useState(false);
  const resolvedUrl = logoUrl != null ? String(logoUrl).trim() : "";
  const showImage = Boolean(resolvedUrl) && !failed;
  const initial = resolverInicialAvatarLojaHeader(companyName);

  useEffect(() => {
    setFailed(false);
  }, [resolvedUrl]);

  const handleError = useCallback(() => {
    setFailed(true);
  }, []);

  const sizeClass = size === "lg" ? "logo-lg" : "logo-sm";

  return (
    <div className={["suse7-avatar", sizeClass, className].filter(Boolean).join(" ")}>
      {showImage ? (
        <img src={resolvedUrl} alt="" decoding="async" onError={handleError} />
      ) : initial && initial !== "E" ? (
        <span className="avatar-placeholder" aria-hidden>
          {initial}
        </span>
      ) : (
        <span className="avatar-placeholder avatar-placeholder--icon" aria-hidden>
          <S7Icon name="catalog_filter_mkt" size={size === "lg" ? 28 : 18} />
        </span>
      )}
    </div>
  );
}
