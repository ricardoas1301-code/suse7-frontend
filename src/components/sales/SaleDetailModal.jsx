// ======================================================
// Modal “Raio-x da venda” — dados e financeiro só via GET /api/sales/detail
// ======================================================

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { buildApiUrl, apiFetch } from "../../config/api";
import S7Button from "../ui/S7Button";
import S7Icon from "../ui/S7Icon";
import { getSaleHealthUi } from "../../utils/saleHealthUi";
import "../../styles/VendasPage.css";

const DASH = "—";

function formatBrlApi(s) {
  if (s == null || String(s).trim() === "") return DASH;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDatePt(iso) {
  if (iso == null || String(iso).trim() === "") return DASH;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return DASH;
  return new Date(t).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortUuid(id) {
  if (id == null || String(id).trim() === "") return DASH;
  const s = String(id);
  return s.length > 10 ? `${s.slice(0, 8)}…` : s;
}

/**
 * @param {{ open: boolean; itemId: string | null; onClose: () => void }} props
 */
export default function SaleDetailModal({ open, itemId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    if (!open || !itemId) {
      setPayload(null);
      setErr(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      const url = buildApiUrl(`/api/sales/detail?item_id=${encodeURIComponent(itemId)}`);
      if (!url) {
        setErr("API não configurada.");
        setLoading(false);
        return;
      }
      const res = await apiFetch(url, { method: "GET" });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setErr(res.error ?? "Não foi possível carregar o detalhe.");
        setPayload(null);
        return;
      }
      setPayload(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, itemId]);

  if (!open || typeof document === "undefined") return null;

  const b = payload?.blocks;
  const row = b?.summary?.row;
  const order = b?.summary?.order;
  const fin = b?.financial_breakdown;
  const pm = b?.profit_margin;
  const pc = b?.pricing_comparison;
  const insights = Array.isArray(b?.insights) ? b.insights : [];
  const healthFin =
    fin && typeof fin === "object"
      ? { ...fin, health: pm?.health ?? fin.health }
      : pm && typeof pm === "object"
        ? { health: pm.health }
        : null;
  const healthUi = getSaleHealthUi(healthFin);

  return createPortal(
    <>
      <div className="vendas-detail__backdrop" aria-hidden onClick={onClose} />
      <div className="vendas-detail__dialog" role="dialog" aria-modal="true" aria-labelledby="vendas-detail-title">
        <div className="vendas-detail__head">
          <div>
            <h2 id="vendas-detail-title" className="vendas-detail__title">
              Raio-x da venda
            </h2>
            <p className="vendas-detail__subtitle">Análise detalhada importada do marketplace (somente leitura)</p>
          </div>
          <button type="button" className="vendas-detail__close" onClick={onClose} aria-label="Fechar">
            <S7Icon name="close" size={20} strokeWidth={2} />
          </button>
        </div>

        {loading ? <p className="vendas-detail__muted">Carregando…</p> : null}
        {err ? (
          <p className="vendas-page__error" role="alert">
            {err}
          </p>
        ) : null}

        {!loading && !err && row ? (
          <div className="vendas-detail__body">
            <section className="vendas-detail__section">
              <h3 className="vendas-detail__section-title">1 · Resumo da venda</h3>
              <dl className="vendas-detail__dl">
                <div>
                  <dt>Data</dt>
                  <dd>{formatDatePt(row.sale_date)}</dd>
                </div>
                <div>
                  <dt>Pedido (interno)</dt>
                  <dd>{shortUuid(row.order_internal_id)}</dd>
                </div>
                <div>
                  <dt>Pedido e-commerce</dt>
                  <dd>{row.external_order_id ?? DASH}</dd>
                </div>
                <div>
                  <dt>Canal</dt>
                  <dd>{row.marketplace_label ?? row.marketplace ?? DASH}</dd>
                </div>
                <div>
                  <dt>Título</dt>
                  <dd className="vendas-detail__dd-wide">{row.title_snapshot ?? DASH}</dd>
                </div>
                <div>
                  <dt>Qtd.</dt>
                  <dd>{row.quantity ?? DASH}</dd>
                </div>
              </dl>
              {order?.order_status != null ? (
                <p className="vendas-detail__muted">Status no marketplace: {String(order.order_status)}</p>
              ) : null}
            </section>

            <section className="vendas-detail__section">
              <h3 className="vendas-detail__section-title">2 · Breakdown financeiro</h3>
              <dl className="vendas-detail__dl">
                <div>
                  <dt>Valor da venda</dt>
                  <dd>{formatBrlApi(fin?.sale_price)}</dd>
                </div>
                <div>
                  <dt>Custo do produto (cadastro)</dt>
                  <dd>{formatBrlApi(row.product_cost_only_brl)}</dd>
                </div>
                <div>
                  <dt>Comissão</dt>
                  <dd>{formatBrlApi(fin?.commission)}</dd>
                </div>
                <div>
                  <dt>Frete (parte seller)</dt>
                  <dd>{formatBrlApi(fin?.shipping_cost)}</dd>
                </div>
                <div>
                  <dt>Impostos</dt>
                  <dd>{formatBrlApi(fin?.taxes)}</dd>
                </div>
                <div>
                  <dt>Valor recebido</dt>
                  <dd>{formatBrlApi(fin?.net_received)}</dd>
                </div>
              </dl>
            </section>

            <section className="vendas-detail__section">
              <h3 className="vendas-detail__section-title">3 · Lucro e margem</h3>
              <dl className="vendas-detail__dl">
                <div>
                  <dt>Lucro (R$)</dt>
                  <dd>{formatBrlApi(pm?.profit_brl ?? fin?.profit_brl)}</dd>
                </div>
                <div>
                  <dt>Margem (%)</dt>
                  <dd>
                    {pm?.margin_percent != null && String(pm.margin_percent).trim() !== ""
                      ? `${String(pm.margin_percent).replace(".", ",")} %`
                      : DASH}
                  </dd>
                </div>
                <div>
                  <dt>Saúde da venda</dt>
                  <dd>
                    <span className={`vendas-health-badge ${healthUi.badgeClass}`}>
                      {healthUi.showDot ? <span className="vendas-health-badge-dot" aria-hidden /> : null}
                      <span className="vendas-health-badge-text">{healthUi.label}</span>
                    </span>
                  </dd>
                </div>
              </dl>
            </section>

            <section className="vendas-detail__section">
              <h3 className="vendas-detail__section-title">4 · Precificação</h3>
              <p className="vendas-detail__muted">{pc?.message ?? DASH}</p>
            </section>

            <section className="vendas-detail__section">
              <h3 className="vendas-detail__section-title">5 · Insights</h3>
              {insights.length === 0 ? (
                <p className="vendas-detail__muted">Nenhum alerta automático para esta linha.</p>
              ) : (
                <ul className="vendas-detail__insights">
                  {insights.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
            </section>

            <div className="vendas-detail__footer">
              <S7Button type="button" variant="secondary" onClick={onClose}>
                Fechar
              </S7Button>
            </div>
          </div>
        ) : null}
      </div>
    </>,
    document.body,
  );
}
