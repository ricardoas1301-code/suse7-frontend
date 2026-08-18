// ======================================================================
// Envelope visual homologado no Dashboard — blocos executivos em páginas operacionais.
// Reutiliza tokens/layout do Dashboard sem duplicar componentes de negócio.
// ======================================================================

import { forwardRef } from "react";
import "../Dashboard.css";
import "../../styles/S7CoreKpis.css";

const S7OperationalExecutiveBlock = forwardRef(function S7OperationalExecutiveBlock(
  { className = "", children },
  ref,
) {
  return (
    <div
      ref={ref}
      className={["dashboard-page", "s7-operational-executive-block", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
});

export default S7OperationalExecutiveBlock;
