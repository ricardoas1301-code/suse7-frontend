// ======================================================================
// Barra de compartilhamento — modal Editar Produto (padrão Vendas / Raio-X).
// ======================================================================

import { useMemo } from "react";
import VendasRelatorioCanais from "../../features/vendas/reports/VendasRelatorioCanais.jsx";
import { buildVendasAggregatedReport } from "../../features/vendas/reports/buildVendasAggregatedReport.js";
import { buildProductReportContext } from "../../features/products/financial/buildProductReportContext.js";
import { useProductEditFinancial } from "./ProductEditFinancialContext.jsx";
import "./ProductEditShareBar.css";

/**
 * @param {{
 *   productId: string;
 *   productName?: string | null;
 *   productSku?: string | null;
 * }} props
 */
export default function ProductEditShareBar({
  productId,
  productName = null,
  productSku = null,
}) {
  const financial = useProductEditFinancial();
  const nomeExibicao =
    productName != null && String(productName).trim() !== "" ? String(productName).trim() : "Produto";
  const skuExibicao = productSku != null ? String(productSku).trim() : "";

  const reportContext = useMemo(
    () =>
      buildProductReportContext({
        productId,
        productTitle: nomeExibicao,
        productSku: skuExibicao || null,
        summary: financial.summary,
        salesRows: financial.salesHistoryRows,
        salesTotal: financial.salesHistoryTotal,
        truncatedScan: false,
      }),
    [
      productId,
      nomeExibicao,
      skuExibicao,
      financial.summary,
      financial.salesHistoryRows,
      financial.salesHistoryTotal,
    ],
  );

  const aggregatedReport = useMemo(() => {
    if (!financial.summary) return null;
    return buildVendasAggregatedReport({
      context: reportContext,
      executiveSummary: financial.summary,
      executiveHealth: financial.health,
      rankingProducts: null,
      distributionByAccount: [],
    });
  }, [reportContext, financial.summary, financial.health]);

  return (
    <div className="product-edit-share-bar" aria-label="Canais de exportação do produto">
      <VendasRelatorioCanais aggregatedReport={aggregatedReport} reportContext={reportContext} />
    </div>
  );
}
