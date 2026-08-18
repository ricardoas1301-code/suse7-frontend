// ======================================================
// Card de concorrente — modal Gerenciar Concorrentes (ConcorrenciaPage)
// Layout vertical alinhado ao card homologado da PI.
// ======================================================

import { useEffect, useState } from "react";
import S7Icon from "../ui/S7Icon.jsx";
import S7Tooltip from "../ui/S7Tooltip.jsx";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton.jsx";
import {
  abbreviateCompetitorName,
  displayCompetitorTitle,
  formatFreteConcorrenteLabel,
  formatPrice,
} from "./concorrenciaCompetitorDisplay.js";
import { montarComparativoConcorrentePreco } from "../pricing/competitivePriceCompare.js";
import "./ConcorrenciaProdutoConcorrenteCard.css";

/**
 * @param {{
 *   thumbUrl?: string | null;
 *   titulo: string;
 *   tituloMaxCaracteres?: number;
 *   href?: string | null;
 *   preco?: unknown;
 *   moeda?: string;
 *   shipping?: object | null;
 *   nomeVendedor?: string | null;
 *   medalhaVendedor?: string | null;
 *   precoNosso?: unknown;
 *   modoGaleria?: boolean;
 *   urlsGaleria?: string[] | null;
 *   overlayAcao?: import("react").ReactNode;
 *   slotRodape?: import("react").ReactNode;
 *   tagRaiz?: "li" | "div";
 *   ocultarFreteNoPreco?: boolean;
 *   ocultarVendedor?: boolean;
 *   ocultarMedalha?: boolean;
 *   tituloTooltipS7?: boolean;
 *   tituloCopiavelS7?: boolean;
 *   tituloCopiarChave?: string;
 *   anuncioInativo?: boolean;
 * }} props
 */
function ConcorrenteCardGaleria({ urls = [], fallbackThumb = null }) {
  const lista =
    urls.length > 0 ? urls : fallbackThumb != null && String(fallbackThumb).trim() !== "" ? [fallbackThumb] : [];
  const [indice, setIndice] = useState(0);
  const [quebradas, setQuebradas] = useState({});
  const chaveLista = lista.join("|");

  useEffect(() => {
    setIndice(0);
    setQuebradas({});
  }, [chaveLista]);

  const total = lista.length;
  const temMultiplas = total > 1;
  const urlAtual = lista[indice] ?? null;
  const irPara = (novo) => {
    if (total <= 0) return;
    setIndice(((novo % total) + total) % total);
  };

  return (
    <div className="concorrencia-produto-modal__reg-card-carousel">
      <div className="concorrencia-produto-modal__reg-card-thumb">
        {urlAtual && !quebradas[indice] ? (
          <img
            src={urlAtual}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setQuebradas((prev) => ({ ...prev, [indice]: true }))}
          />
        ) : (
          <span className="concorrencia-produto-modal__reg-card-thumb-ph" aria-hidden>
            <S7Icon name="image" size={18} />
          </span>
        )}

        {temMultiplas ? (
          <>
            <button
              type="button"
              className="concorrencia-produto-modal__reg-card-carousel-nav concorrencia-produto-modal__reg-card-carousel-nav--prev"
              aria-label="Imagem anterior"
              onClick={(e) => {
                e.stopPropagation();
                irPara(indice - 1);
              }}
            >
              <S7Icon name="chevron_left" size={13} strokeWidth={2.1} />
            </button>
            <button
              type="button"
              className="concorrencia-produto-modal__reg-card-carousel-nav concorrencia-produto-modal__reg-card-carousel-nav--next"
              aria-label="Próxima imagem"
              onClick={(e) => {
                e.stopPropagation();
                irPara(indice + 1);
              }}
            >
              <S7Icon name="chevron_right" size={13} strokeWidth={2.1} />
            </button>
            <div
              className="concorrencia-produto-modal__reg-card-carousel-dots"
              role="tablist"
              aria-label="Imagens do anúncio"
            >
              {lista.map((_, i) => (
                <button
                  key={`${chaveLista}-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === indice}
                  aria-label={`Imagem ${i + 1} de ${total}`}
                  className={[
                    "concorrencia-produto-modal__reg-card-carousel-dot",
                    i === indice ? "is-active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={(e) => {
                    e.stopPropagation();
                    irPara(i);
                  }}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function ConcorrenciaProdutoConcorrenteCard({
  thumbUrl = null,
  modoGaleria = false,
  urlsGaleria = null,
  titulo,
  tituloMaxCaracteres = 48,
  href = null,
  preco,
  moeda = "BRL",
  shipping = null,
  nomeVendedor = null,
  medalhaVendedor = null,
  precoNosso = null,
  overlayAcao = null,
  slotRodape = null,
  tagRaiz = "li",
  ocultarFreteNoPreco = false,
  ocultarVendedor = false,
  ocultarMedalha = false,
  tituloTooltipS7 = false,
  tituloCopiavelS7 = false,
  tituloCopiarChave = "concorrente",
  anuncioInativo = false,
}) {
  const [imgBroken, setImgBroken] = useState(false);
  const TagRaiz = tagRaiz === "div" ? "div" : "li";

  const tituloExibicao = displayCompetitorTitle(titulo);
  const tituloCurto = abbreviateCompetitorName(titulo, tituloMaxCaracteres);
  const vendedorExibicao = nomeVendedor ? abbreviateCompetitorName(nomeVendedor, 22) : null;
  const frete = formatFreteConcorrenteLabel(shipping, moeda);
  const comparativo = anuncioInativo
    ? { rotulo: null, classe: "" }
    : montarComparativoConcorrentePreco(precoNosso, preco, moeda, {
        classePrefixo: "concorrencia-produto-modal__reg-card-compare",
      });

  const tituloBase =
    href != null && String(href).trim() !== "" ? (
      <a
        className="concorrencia-produto-modal__reg-card-title"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {tituloCurto}
      </a>
    ) : (
      <span className="concorrencia-produto-modal__reg-card-title">{tituloCurto}</span>
    );

  const tituloConteudo =
    tituloTooltipS7 && tituloExibicao ? (
      <S7Tooltip
        content={tituloExibicao}
        placement="top-start"
        offset={6}
        wrap
        className="concorrencia-produto-modal__reg-card-title-tip"
      >
        {tituloBase}
      </S7Tooltip>
    ) : href != null && String(href).trim() !== "" ? (
      <a
        className="concorrencia-produto-modal__reg-card-title"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={tituloExibicao}
      >
        {tituloCurto}
      </a>
    ) : (
      <span className="concorrencia-produto-modal__reg-card-title" title={tituloExibicao}>
        {tituloCurto}
      </span>
    );

  const tituloNode =
    tituloCopiavelS7 && tituloExibicao ? (
      <div className="concorrencia-produto-modal__reg-card-title-wrap s7-copy-group s7-ad-title-copy-row">
        {tituloConteudo}
        <S7CopyButton
          value={tituloExibicao}
          ariaLabel="Copiar título do anúncio"
          tooltipText="Copiar título"
          toastLabel="Título"
          showToast
          iconMode="unicode"
          flashMs={S7_COPY_OFFICIAL_FLASH_MS}
          flashKey={`discover-titulo-${tituloCopiarChave}`}
          className="concorrencia-produto-modal__reg-card-title-copy"
        />
      </div>
    ) : (
      tituloConteudo
    );

  const temRodape = Boolean(comparativo.rotulo || slotRodape);
  const usarGaleria =
    modoGaleria && Array.isArray(urlsGaleria) && urlsGaleria.length > 1;
  const exibirFreteNoPreco = !ocultarFreteNoPreco && frete;
  const exibirVendedor = !ocultarVendedor && nomeVendedor;
  const exibirMedalha = !ocultarMedalha && medalhaVendedor;
  const classeCard = [
    "concorrencia-produto-modal__reg-card",
    anuncioInativo ? "concorrencia-produto-modal__reg-card--inativo" : "",
    ocultarFreteNoPreco && ocultarVendedor && ocultarMedalha
      ? "concorrencia-produto-modal__reg-card--discover-resumo"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <TagRaiz className={classeCard}>
      <div className="concorrencia-produto-modal__reg-card-thumb-row">
        {usarGaleria ? (
          <ConcorrenteCardGaleria urls={urlsGaleria} fallbackThumb={thumbUrl} />
        ) : (
          <div className="concorrencia-produto-modal__reg-card-thumb">
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
              <span className="concorrencia-produto-modal__reg-card-thumb-ph" aria-hidden>
                <S7Icon name="image" size={18} />
              </span>
            )}
          </div>
        )}
        {overlayAcao}
      </div>

      <div className="concorrencia-produto-modal__reg-card-body">
        <div className="concorrencia-produto-modal__reg-card-main">
          {anuncioInativo ? (
            <span className="concorrencia-produto-modal__reg-card-badge-inativo" aria-label="Anúncio inativo">
              Inativo
            </span>
          ) : null}
          {tituloNode}

          <div className="concorrencia-produto-modal__reg-card-details">
            <div className="concorrencia-produto-modal__reg-card-price-row">
              <span className="concorrencia-produto-modal__reg-card-price">
                {formatPrice(preco, moeda)}
              </span>

              {exibirFreteNoPreco ? (
                <>
                  <span
                    className="concorrencia-produto-modal__reg-card-price-frete-sep"
                    aria-hidden
                  />
                  <span
                    className={[
                      "concorrencia-produto-modal__reg-card-frete",
                      "concorrencia-produto-modal__reg-card-frete-line",
                      frete.tom === "pago" ? "concorrencia-produto-modal__reg-card-frete--pago" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {frete.texto}
                  </span>
                </>
              ) : null}
            </div>

            {exibirVendedor ? (
              <span
                className="concorrencia-produto-modal__reg-card-seller-name concorrencia-produto-modal__reg-card-seller-line"
                title={nomeVendedor !== vendedorExibicao ? nomeVendedor : undefined}
              >
                {vendedorExibicao}
              </span>
            ) : null}

            {exibirMedalha ? (
              <span className="concorrencia-produto-modal__reg-card-rep concorrencia-produto-modal__reg-card-medal-line">
                <span className="concorrencia-produto-modal__reg-card-rep-text">
                  {medalhaVendedor}
                </span>
                <S7Icon
                  name="mercado_lider_medal"
                  size={11}
                  strokeWidth={2.1}
                  className="concorrencia-produto-modal__reg-card-rep-icon"
                  aria-hidden
                />
              </span>
            ) : null}
          </div>
        </div>

        {temRodape ? (
          <div className="concorrencia-produto-modal__reg-card-footer">
            {comparativo.rotulo ? (
              <span
                className={["concorrencia-produto-modal__reg-card-compare", comparativo.classe]
                  .filter(Boolean)
                  .join(" ")}
              >
                {comparativo.rotulo}
              </span>
            ) : null}
            {slotRodape}
          </div>
        ) : null}
      </div>
    </TagRaiz>
  );
}
