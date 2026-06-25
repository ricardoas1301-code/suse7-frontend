// ======================================================
// Card de concorrente — aba Concorrentes da Precificação Inteligente
// Padrão visual homologável antes de replicar aos outros modais.
// ======================================================

import { useState } from "react";
import S7Icon from "../ui/S7Icon.jsx";
import {
  abbreviateCompetitorName,
  displayCompetitorTitle,
  formatFreteConcorrenteLabel,
  formatPrice,
} from "../concorrencia/concorrenciaCompetitorDisplay.js";
import { calcularComparativoPrecoPi } from "./pricingIntelligenceConcorrenteCardCompare.js";
import "./PricingIntelligenceConcorrenteCard.css";

/**
 * @param {{
 *   thumbUrl?: string | null;
 *   titulo: string;
 *   href?: string | null;
 *   preco?: unknown;
 *   moeda?: string;
 *   shipping?: object | null;
 *   nomeVendedor?: string | null;
 *   medalhaVendedor?: string | null;
 *   precoNosso?: unknown;
 * }} props
 */
export function PricingIntelligenceConcorrenteCard({
  thumbUrl = null,
  titulo,
  href = null,
  preco,
  moeda = "BRL",
  shipping = null,
  nomeVendedor = null,
  medalhaVendedor = null,
  precoNosso = null,
}) {
  const [imgBroken, setImgBroken] = useState(false);

  const tituloExibicao = displayCompetitorTitle(titulo);
  const tituloCurto = abbreviateCompetitorName(titulo, 48);
  const vendedorExibicao = nomeVendedor ? abbreviateCompetitorName(nomeVendedor, 22) : null;
  const frete = formatFreteConcorrenteLabel(shipping, moeda);
  const comparativo = calcularComparativoPrecoPi(precoNosso, preco, moeda);

  const tituloNode =
    href != null && String(href).trim() !== "" ? (
      <a
        className="pricing-intelligence-page__competitor-mini-card-title"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={tituloExibicao}
      >
        {tituloCurto}
      </a>
    ) : (
      <span className="pricing-intelligence-page__competitor-mini-card-title" title={tituloExibicao}>
        {tituloCurto}
      </span>
    );

  return (
    <li className="pricing-intelligence-page__competitor-mini-card">
      <div className="pricing-intelligence-page__competitor-mini-card-thumb">
        {thumbUrl && !imgBroken ? (
          <img
            src={thumbUrl}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgBroken(true)}
          />
        ) : (
          <span className="pricing-intelligence-page__competitor-mini-card-thumb-ph" aria-hidden>
            <S7Icon name="image" size={18} />
          </span>
        )}
      </div>

      <div className="pricing-intelligence-page__competitor-mini-card-body">
        <div className="pricing-intelligence-page__competitor-mini-card-main">
          {tituloNode}

          <div className="pricing-intelligence-page__competitor-mini-card-details">
            <span className="pricing-intelligence-page__competitor-mini-card-price">
              {formatPrice(preco, moeda)}
            </span>

            {frete ? (
              <span
                className={[
                  "pricing-intelligence-page__competitor-mini-card-frete",
                  "pricing-intelligence-page__competitor-mini-card-frete-line",
                  frete.tom === "pago" ? "pricing-intelligence-page__competitor-mini-card-frete--pago" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {frete.texto}
              </span>
            ) : null}

            {nomeVendedor ? (
              <span
                className="pricing-intelligence-page__competitor-mini-card-seller-name pricing-intelligence-page__competitor-mini-card-seller-line"
                title={nomeVendedor !== vendedorExibicao ? nomeVendedor : undefined}
              >
                {vendedorExibicao}
              </span>
            ) : null}

            {medalhaVendedor ? (
              <span className="pricing-intelligence-page__competitor-mini-card-seller-badge pricing-intelligence-page__competitor-mini-card-medal-line">
                <span className="pricing-intelligence-page__competitor-mini-card-seller-badge-text">
                  {medalhaVendedor}
                </span>
                <S7Icon
                  name="mercado_lider_medal"
                  size={11}
                  strokeWidth={2.1}
                  className="pricing-intelligence-page__competitor-mini-card-seller-badge-icon"
                  aria-hidden
                />
              </span>
            ) : null}
          </div>
        </div>

        {comparativo ? (
          <div className="pricing-intelligence-page__competitor-mini-card-footer">
            <span
              className={[
                "pricing-intelligence-page__competitor-mini-card-compare",
                comparativo.classe,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {comparativo.rotulo}
            </span>
          </div>
        ) : null}
      </div>
    </li>
  );
}
