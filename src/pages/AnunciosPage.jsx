import { useRef } from "react";
import ListingsWorkspace from "../features/listings/components/ListingsWorkspace";
import ListingsHealthCenter from "../features/dashboard/components/ListingsHealthCenter.jsx";
import S7OperationalExecutiveBlock from "../components/dashboard/S7OperationalExecutiveBlock.jsx";
import "./AnunciosPage.css";

/** Rota dedicada à saúde e gestão do anúncio (conteúdo, vínculo, status). */
export default function AnunciosPage() {
  const anunciosExecutiveRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const anunciosFiltersRef = useRef(/** @type {HTMLElement | null} */ (null));

  return (
    <div className="anuncios-page">
      <S7OperationalExecutiveBlock ref={anunciosExecutiveRef}>
        <ListingsHealthCenter
          className="dashboard-page__listings-health"
          sectionJumpDownTargetRef={anunciosFiltersRef}
          sectionJumpDownAriaLabel="Ir para busca e filtros"
        />
      </S7OperationalExecutiveBlock>
      <ListingsWorkspace
        mode="anuncios"
        filtersSectionRef={anunciosFiltersRef}
        sectionJumpUpTargetRef={anunciosExecutiveRef}
        sectionJumpUpAriaLabel="Voltar para a Central de Saúde do Anúncio"
      />
    </div>
  );
}
