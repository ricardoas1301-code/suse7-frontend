import { useCallback, useEffect, useMemo } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { PricingIntelligenceContent } from "../components/PricingIntelligenceContent.jsx";

import { useListingsCatalogFetch } from "../features/listings/hooks/useListingsCatalogFetch.js";

import {

  lerLinhaPrecificacaoInteligenteCache,

  salvarLinhaPrecificacaoInteligenteCache,

} from "../features/listings/pricing-intelligence/pricingIntelligenceRowCache.js";

import PricingIntelligencePageSkeleton from "../features/listings/pricing-intelligence/PricingIntelligencePageSkeleton.jsx";

import S7Button from "../components/ui/S7Button";

import S7EmptyState from "../components/ui/S7EmptyState";

import "../components/Anuncios.css";

import "../features/listings/pricing-intelligence/PricingIntelligencePageSkeleton.css";



/**

 * Precificação inteligente em página cheia (`/precificacoes/inteligente/:listingId`).

 * Fonte de verdade: GET /api/ml/listings (product_card_metrics na linha).

 */

export default function PricingIntelligencePage() {

  const { listingId } = useParams();

  const navigate = useNavigate();

  const { catalogRows, listLoading, listError, fetchListings } = useListingsCatalogFetch({});



  const cachedRow = useMemo(

    () => (listingId ? lerLinhaPrecificacaoInteligenteCache(listingId) : null),

    [listingId],

  );



  const rowFromCatalog = useMemo(

    () => catalogRows.find((r) => String(r.id) === String(listingId)),

    [catalogRows, listingId],

  );



  const row = rowFromCatalog ?? cachedRow;



  useEffect(() => {

    void fetchListings();

  }, [listingId, fetchListings]);



  useEffect(() => {

    if (rowFromCatalog && listingId) {

      salvarLinhaPrecificacaoInteligenteCache(listingId, rowFromCatalog);

    }

  }, [rowFromCatalog, listingId]);



  const handleClose = useCallback(() => {

    navigate("/precificacoes", { replace: false });

  }, [navigate]);



  const showSkeleton = listLoading && !row;



  if (showSkeleton) {

    return <PricingIntelligencePageSkeleton />;

  }



  if (listError && !row) {

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

          description="Confira o link ou volte à lista de precificações e abra novamente a partir da grade. Se você abriu em nova aba, o anúncio pode não estar mais na listagem sincronizada."

        />

        <div className="pricing-intelligence-page__actions">

          <S7Button type="button" variant="secondary" onClick={() => void fetchListings()}>

            Recarregar catálogo

          </S7Button>

          <S7Button type="button" variant="primary" onClick={handleClose}>

            Voltar para precificações

          </S7Button>

        </div>

      </div>

    );

  }



  const staleCatalogHint =

    listLoading && !rowFromCatalog

      ? "Atualizando dados do anúncio em segundo plano…"

      : listError && !rowFromCatalog

        ? "Não foi possível atualizar o catálogo agora. Exibindo última versão salva nesta sessão."

        : listError && rowFromCatalog

          ? null

          : null;



  const catalogHint =

    staleCatalogHint ??

    (listError && rowFromCatalog ? "Catálogo atualizado com aviso na última tentativa de sincronização." : null);



  return (

    <div className="pricing-intelligence-page">

      {catalogHint ? (

        <p className="pricing-intelligence-page__status-hint" role="status">

          {catalogHint}

        </p>

      ) : null}



      <PricingIntelligenceContent

        row={row}

        active

        variant="page"

        onClose={handleClose}

        onApplied={fetchListings}

        catalogRefreshing={listLoading && !rowFromCatalog}

      />

    </div>

  );

}

