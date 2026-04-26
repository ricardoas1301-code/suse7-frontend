import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PricingIntelligenceContent } from "../components/PricingIntelligenceContent.jsx";
import { useListingsCatalogFetch } from "../features/listings/hooks/useListingsCatalogFetch.js";
import S7Button from "../components/ui/S7Button";
import S7EmptyState from "../components/ui/S7EmptyState";
import "../components/Anuncios.css";

/**
 * Precificação inteligente em página cheia (`/precificacoes/inteligente/:listingId`).
 * Carrega a linha a partir do catálogo ML já existente (GET /api/ml/listings).
 */
export default function PricingIntelligencePage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { catalogRows, listLoading, listError, fetchListings } = useListingsCatalogFetch({});

  const row = useMemo(
    () => catalogRows.find((r) => String(r.id) === String(listingId)),
    [catalogRows, listingId],
  );

  const handleClose = useCallback(() => {
    navigate("/precificacoes", { replace: false });
  }, [navigate]);

  if (listLoading) {
    return (
      <div className="pricing-intelligence-page" role="status">
        <p className="anuncios-sell-popover__muted">Carregando anúncio…</p>
      </div>
    );
  }

  if (listError) {
    return (
      <div className="pricing-intelligence-page">
        <S7EmptyState title="Não foi possível carregar o catálogo" description={listError} />
        <div className="pricing-intelligence-page__actions">
          <S7Button type="button" variant="secondary" onClick={() => void fetchListings()}>
            Tentar novamente
          </S7Button>
          <S7Button type="button" variant="primary" onClick={handleClose}>
            Voltar para precificações
          </S7Button>
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="pricing-intelligence-page">
        <S7EmptyState
          title="Anúncio não encontrado"
          description="Confira o link ou volte à lista de precificações e abra novamente a partir da grade."
        />
        <div className="pricing-intelligence-page__actions">
          <S7Button type="button" variant="primary" onClick={handleClose}>
            Voltar para precificações
          </S7Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-intelligence-page">
      <PricingIntelligenceContent
        row={row}
        active
        variant="page"
        onClose={handleClose}
        onApplied={fetchListings}
      />
    </div>
  );
}
