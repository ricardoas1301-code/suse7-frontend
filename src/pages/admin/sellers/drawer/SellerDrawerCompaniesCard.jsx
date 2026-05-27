import { memo, useMemo, useState } from "react";
import { S7Button } from "../../../../components/ui";
import SellerDrawerSection from "./SellerDrawerSection";

/**
 * @param {{
 *   companies?: Record<string, unknown>[];
 *   state?: "loading" | "loaded" | "empty" | "error";
 * }} props
 */
function SellerDrawerCompaniesCard({ companies = [], state = "loaded" }) {
  const [expanded, setExpanded] = useState(false);
  const list = Array.isArray(companies) ? companies : [];
  const primary = list[0] ?? null;
  const extraCount = Math.max(0, list.length - 1);

  const sortedRest = useMemo(() => list.slice(1), [list]);

  return (
    <SellerDrawerSection
      title="Empresas / CNPJs"
      subtitle="Estrutura operacional"
      state={state === "loaded" && list.length === 0 ? "empty" : state}
      emptyMessage="Nenhuma empresa cadastrada."
    >
      {primary ? (
        <div className="seller-drawer-companies">
          <article className="seller-drawer-companies__primary">
            <strong>{primary.trade_name || primary.company_name || "Empresa principal"}</strong>
            <span>{primary.document_masked ?? "—"}</span>
          </article>

          <p className="seller-drawer-companies__count">
            {list.length === 1 ? "1 empresa vinculada" : `${list.length} empresas vinculadas`}
          </p>

          {extraCount > 0 ? (
            <>
              <S7Button
                type="button"
                variant="secondary"
                size="sm"
                className="seller-drawer-companies__toggle"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
              >
                {expanded ? "Ocultar empresas" : `Ver todas (${list.length})`}
              </S7Button>

              {expanded ? (
                <ul className="seller-drawer-companies__list">
                  {sortedRest.map((company) => (
                    <li key={String(company.id)}>
                      <strong>{company.trade_name || company.company_name || "Empresa"}</strong>
                      <span>{company.document_masked ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </SellerDrawerSection>
  );
}

export default memo(SellerDrawerCompaniesCard);
