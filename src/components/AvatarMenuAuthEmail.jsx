import { useEffect, useRef, useState } from "react";
import S7Tooltip from "./ui/S7Tooltip.jsx";

/**
 * E-mail autenticado no cabeçalho do menu — ellipsis + tooltip oficial quando truncado.
 * @param {{ email: string }} props
 */
export default function AvatarMenuAuthEmail({ email }) {
  const textRef = useRef(/** @type {HTMLSpanElement | null} */ (null));
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) {
      setTruncated(false);
      return;
    }
    setTruncated(el.scrollWidth > el.clientWidth + 1);
  }, [email]);

  if (!email) return null;

  const label = (
    <span ref={textRef} className="avatar-menu-email">
      {email}
    </span>
  );

  if (!truncated) {
    return label;
  }

  return (
    <S7Tooltip content={email} placement="bottom-start" offset={6} wrap>
      {label}
    </S7Tooltip>
  );
}
