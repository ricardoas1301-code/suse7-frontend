// ======================================================================
// S7 — Card padrão oficial de concorrente (UX/UI)
// Reutilizado em: PI Concorrentes, Gerenciar Concorrentes, Selecionar ML.
// Ações (excluir / cadastrar) ficam fora, via overlayAcao.
// ======================================================================

import { useState } from "react";
import S7Icon from "../ui/S7Icon";
import {
  abbreviateCompetitorName,
  displayCompetitorTitle,
  formatFreteConcorrenteLabel,
  formatPrice,
} from "./concorrenciaCompetitorDisplay";
import { montarComparativoConcorrentePreco } from "../pricing/competitivePriceCompare.js";
import "./S7ConcorrenteCard.css";

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
 *   overlayAcao?: import("react").ReactNode;
 *   slotRodape?: import("react").ReactNode;
 *   tituloMaxLen?: number;
 *   vendedorMaxLen?: number;
 *   className?: string;
 * }} props
 */
export function S7ConcorrenteCard({
  thumbUrl = null,
  titulo,
  href = null,
  preco,
  moeda = "BRL",
  shipping = null,
  nomeVendedor = null,
  medalhaVendedor = null,
  precoNosso = null,
  overlayAcao = null,
  slotRodape = null,
  tituloMaxLen = 48,
  vendedorMaxLen = 20,
  className = "",
}) {
  const [imgBroken, setImgBroken] = useState(false);

  const tituloExibicao = displayCompetitorTitle(titulo);
  const tituloCurto = abbreviateCompetitorName(titulo, tituloMaxLen);
  const vendedorExibicao = nomeVendedor ? abbreviateCompetitorName(nomeVendedor, vendedorMaxLen) : null;
  const frete = formatFreteConcorrenteLabel(shipping, moeda);
  const comparativo = montarComparativoConcorrentePreco(precoNosso, preco, moeda);

  const classeCard = ["s7-concorrente-card", className].filter(Boolean).join(" ");

  return (
    <li className={classeCard}>
      <div className="s7-concorrente-card__thumb">
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
          <span className="s7-concorrente-card__thumb-ph" aria-hidden>
            <S7Icon name="image" size={18} />
          </span>
        )}
        {overlayAcao}
      </div>

      <div className="s7-concorrente-card__body">
        {href ? (
          <a
            className="s7-concorrente-card__title"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={tituloExibicao}
          >
            {tituloCurto}
          </a>
        ) : (
          <span className="s7-concorrente-card__title" title={tituloExibicao}>
            {tituloCurto}
          </span>
        )}

        <div className="s7-concorrente-card__price-row">
          <span className="s7-concorrente-card__price">{formatPrice(preco, moeda)}</span>
          {frete ? (
            <span
              className={[
                "s7-concorrente-card__frete",
                frete.tom === "gratis" ? "s7-concorrente-card__frete--gratis" : "s7-concorrente-card__frete--pago",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {frete.texto}
            </span>
          ) : null}
        </div>

        {nomeVendedor || medalhaVendedor ? (
          <span className="s7-concorrente-card__seller">
            {nomeVendedor ? (
              <span
                className="s7-concorrente-card__seller-name"
                title={nomeVendedor !== vendedorExibicao ? nomeVendedor : undefined}
              >
                {vendedorExibicao}
              </span>
            ) : null}
            {nomeVendedor && medalhaVendedor ? (
              <span className="s7-concorrente-card__dot" aria-hidden>
                ·
              </span>
            ) : null}
            {medalhaVendedor ? (
              <span className="s7-concorrente-card__seller-badge">
                <span className="s7-concorrente-card__seller-badge-text">{medalhaVendedor}</span>
                <S7Icon
                  name="mercado_lider_medal"
                  size={11}
                  strokeWidth={2.1}
                  className="s7-concorrente-card__seller-badge-icon"
                  aria-hidden
                />
              </span>
            ) : null}
          </span>
        ) : null}

        {comparativo.rotulo ? (
          <span className={["s7-concorrente-card__compare", comparativo.classe].filter(Boolean).join(" ")}>
            {comparativo.rotulo}
          </span>
        ) : null}

        {slotRodape}
      </div>
    </li>
  );
}
