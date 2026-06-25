// ======================================================
// PI.2.11C — Aba Concorrentes da Precificação Inteligente (somente leitura).
// Reutiliza GET /api/competition/products/:productId/competitors via competitionApi.
// ======================================================

import { useCallback, useEffect, useState } from "react";

import { listProductCompetitors } from "../../services/competitionApi.js";
import {
  displayCompetitorTitle,
  formatPowerSeller,
  pickCompetitorPrice,
  pickCompetitorSellerName,
  pickCompetitorThumbnail,
  resolveRegisteredCompetitorHref,
} from "../concorrencia/concorrenciaCompetitorDisplay.js";
import { PricingIntelligenceConcorrenteCard } from "./PricingIntelligenceConcorrenteCard.jsx";

const LIMITE_EXIBICAO = 6;

/**
 * @param {{
 *   productId: string | null;
 *   active: boolean;
 *   precoNosso?: number | string | null;
 *   onListaProntaChange?: (pronto: boolean) => void;
 * }} props
 */
export function PricingIntelligenceCompetitorsPanel({
  productId,
  active,
  precoNosso = null,
  onListaProntaChange,
}) {
  const [competitors, setCompetitors] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [listaHidratada, setListaHidratada] = useState(false);

  const carregarConcorrentes = useCallback(async () => {
    if (!productId) {
      setCompetitors([]);
      setError(null);
      setLoading(false);
      setListaHidratada(true);
      return;
    }
    setListaHidratada(false);
    setLoading(true);
    setError(null);
    const res = await listProductCompetitors(productId);
    if (res.ok) {
      const list = Array.isArray(res.competitors) ? res.competitors : [];
      setCompetitors(list.slice(0, LIMITE_EXIBICAO));
    } else {
      setCompetitors([]);
      setError(res.error || "Não foi possível carregar os concorrentes.");
    }
    setLoading(false);
    setListaHidratada(true);
  }, [productId]);

  useEffect(() => {
    if (!active) {
      setListaHidratada(false);
      return;
    }
    void carregarConcorrentes();
  }, [active, carregarConcorrentes]);

  const semProduto = productId == null || String(productId).trim() === "";

  useEffect(() => {
    if (!active || !onListaProntaChange) return;
    onListaProntaChange(semProduto || listaHidratada);
  }, [active, semProduto, listaHidratada, onListaProntaChange]);

  return (
    <div className="pricing-intelligence-page__competitors-panel">
      {semProduto ? (
        <p className="pricing-intelligence-page__competitors-empty" role="status">
          Vincule este anúncio a um produto para visualizar concorrentes cadastrados.
        </p>
      ) : loading ? (
        <p className="pricing-intelligence-page__competitors-state" role="status">
          Carregando concorrentes…
        </p>
      ) : error ? (
        <div
          className="pricing-intelligence-page__competitors-state pricing-intelligence-page__competitors-state--error"
          role="alert"
        >
          <p>{error}</p>
          <button
            type="button"
            className="pricing-intelligence-page__competitors-retry"
            onClick={() => void carregarConcorrentes()}
          >
            Tentar novamente
          </button>
        </div>
      ) : competitors.length === 0 ? (
        <p className="pricing-intelligence-page__competitors-empty" role="status">
          Este produto ainda não possui concorrentes cadastrados.
        </p>
      ) : (
        <ul className="pricing-intelligence-page__competitors-grid" aria-label="Concorrentes cadastrados">
          {competitors.map((c) => {
            const id = String(c.id ?? c.competitor_listing_id ?? Math.random());
            const shipping =
              c.shipping != null && typeof c.shipping === "object"
                ? /** @type {Record<string, unknown>} */ (c.shipping)
                : null;
            const priceInfo = pickCompetitorPrice(c);

            return (
              <PricingIntelligenceConcorrenteCard
                key={id}
                thumbUrl={pickCompetitorThumbnail(c)}
                titulo={displayCompetitorTitle(c.competitor_title)}
                href={resolveRegisteredCompetitorHref(c)}
                preco={priceInfo.value}
                moeda={priceInfo.currency}
                shipping={shipping}
                nomeVendedor={pickCompetitorSellerName(c)}
                medalhaVendedor={formatPowerSeller(
                  c.reputation != null && typeof c.reputation === "object" ? c.reputation : null,
                )}
                precoNosso={precoNosso}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
