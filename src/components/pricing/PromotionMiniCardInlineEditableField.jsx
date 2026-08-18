// ======================================================

// PI — Edição inline compacta (preço ou percentual) nos mini cards Beta.

// S4.3.6.9 — check único, cancelamento por clique externo, hierarquia final métricas.

// ======================================================



import { useCallback, useEffect, useId, useRef, useState } from "react";



import {

  PromotionMiniCardInlineActionButton,

  PromotionMiniCardPencilButton,

} from "./PromotionMiniCardPencilButton.jsx";

import {

  calcularLarguraInputCh,

  eventoPointerDentroAreaEditorInline,

  extrairNumericoDePercentualExibicao,

  extrairNumericoDePrecoExibicao,

  normalizarDraftNumericoPrecoExibicao,

  normalizarDraftPercentualExibicao,

} from "./promotionMiniCardInlineEditUx.js";

import {

  formatarDecimalBrlExibicao,

  validarPrecoManualSimulacao,

} from "../../features/pricing/promotions/promotionManualSimulationPrice.js";

import { validarPercentualManualSimulacao } from "../../features/pricing/promotions/promotionMiniCardSimulationUx.js";



/**

 * @param {{

 *   mode: "price" | "percent";

 *   displayText: string;

 *   draftSeed?: string | null;

 *   editing: boolean;

 *   showPencil: boolean;

 *   tooltip?: string | null;

 *   ariaLabelEdit: string;

 *   visualVariant?: "price" | "discount";

 *   onStartEdit: () => void;

 *   onCancel: () => void;

 *   onConfirmPrice: (priceBrl: string) => void;

 *   onConfirmPercent: (percentDisplay: string) => void;

 *   validatePriceAgainstOriginal?: (priceBrl: string) => { ok: true } | { ok: false; error: string };

 * }} props

 */

export function PromotionMiniCardInlineEditableField({

  mode,

  displayText,

  draftSeed = null,

  editing,

  showPencil,

  tooltip = null,

  ariaLabelEdit,

  visualVariant = mode === "price" ? "price" : "discount",

  onStartEdit,

  onCancel,

  onConfirmPrice,

  onConfirmPercent,

  validatePriceAgainstOriginal,

}) {

  const inputId = useId();

  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const editorRootRef = useRef(/** @type {HTMLSpanElement | null} */ (null));

  const editandoRef = useRef(false);

  const caretInicialAplicadoRef = useRef(false);

  const [draft, setDraft] = useState("");

  const [erro, setErro] = useState(/** @type {string | null} */ (null));



  const iniciarDraft = useCallback(() => {

    if (mode === "price") {

      if (draftSeed != null && String(draftSeed).trim() !== "") {

        const exibicao = formatarDecimalBrlExibicao(String(draftSeed));

        setDraft(extrairNumericoDePrecoExibicao(exibicao ?? displayText));

        return;

      }

      setDraft(extrairNumericoDePrecoExibicao(displayText));

      return;

    }



    if (draftSeed != null && String(draftSeed).trim() !== "") {

      setDraft(normalizarDraftPercentualExibicao(String(draftSeed)));

      return;

    }

    setDraft(extrairNumericoDePercentualExibicao(displayText));

  }, [mode, displayText, draftSeed]);



  useEffect(() => {

    if (!editing) {

      setDraft("");

      setErro(null);

      editandoRef.current = false;

      caretInicialAplicadoRef.current = false;

      return;

    }



    if (!editandoRef.current) {

      iniciarDraft();

      setErro(null);

      editandoRef.current = true;

      caretInicialAplicadoRef.current = false;

    }

  }, [editing, iniciarDraft]);



  useEffect(() => {

    if (!editing || caretInicialAplicadoRef.current) return;



    caretInicialAplicadoRef.current = true;

    const raf = window.requestAnimationFrame(() => {

      const el = inputRef.current;

      if (el == null) return;

      el.focus();

      try {

        const length = el.value.length;

        el.setSelectionRange(length, length);

      } catch {

        /* caret nativo */

      }

    });

    return () => window.cancelAnimationFrame(raf);

  }, [editing]);



  useEffect(() => {

    if (!editing) return;



    const handleDocumentPointerDown = (event) => {

      if (eventoPointerDentroAreaEditorInline(event, editorRootRef.current)) return;

      onCancel();

    };



    document.addEventListener("pointerdown", handleDocumentPointerDown, true);

    return () => document.removeEventListener("pointerdown", handleDocumentPointerDown, true);

  }, [editing, onCancel]);



  const executarConfirmar = useCallback(() => {

    if (mode === "price") {

      const resultado = validarPrecoManualSimulacao(draft);

      if (!resultado.ok) {

        setErro(resultado.error ?? "Informe um preço válido.");

        return;

      }

      if (validatePriceAgainstOriginal) {

        const gate = validatePriceAgainstOriginal(resultado.priceBrl);

        if (!gate.ok) {

          setErro(gate.error);

          return;

        }

      }

      setErro(null);

      onConfirmPrice(resultado.priceBrl);

      return;

    }



    const resultadoPct = validarPercentualManualSimulacao(draft);

    if (!resultadoPct.ok) {

      setErro(resultadoPct.error ?? "Informe um percentual válido.");

      return;

    }

    setErro(null);

    onConfirmPercent(resultadoPct.percent);

  }, [draft, mode, onConfirmPercent, onConfirmPrice, validatePriceAgainstOriginal]);



  const handleKeyDown = useCallback((event) => {

    event.stopPropagation();

  }, []);



  const rowClass = [

    "pricing-intelligence-page__promotion-mini-card-finance-row",

    visualVariant === "price" ? "pricing-intelligence-page__promotion-mini-card-finance-row--price" : "",

    visualVariant === "discount" ? "pricing-intelligence-page__promotion-mini-card-finance-row--discount" : "",

  ]

    .filter(Boolean)

    .join(" ");



  if (!editing) {

    return (

      <span className={rowClass}>

        <span

          className={[

            "pricing-intelligence-page__promotion-mini-card-finance-text",

            showPencil ? "pricing-intelligence-page__promotion-mini-card-finance-text--editable" : "",

          ]

            .filter(Boolean)

            .join(" ")}

          onClick={

            showPencil

              ? (event) => {

                  event.stopPropagation();

                  onStartEdit();

                }

              : undefined

          }

          onKeyDown={

            showPencil

              ? (event) => {

                  if (event.key === "Enter" || event.key === " ") {

                    event.preventDefault();

                    event.stopPropagation();

                    onStartEdit();

                  }

                }

              : undefined

          }

          role={showPencil ? "button" : undefined}

          tabIndex={showPencil ? 0 : undefined}

        >

          {displayText}

        </span>

        {showPencil ? (

          <span className="pricing-intelligence-page__promotion-mini-card-finance-pencil">

            <PromotionMiniCardPencilButton

              ariaLabel={ariaLabelEdit}

              tooltip={tooltip}

              onClick={(event) => {

                event.stopPropagation();

                onStartEdit();

              }}

            />

          </span>

        ) : null}

      </span>

    );

  }



  const editClass = [

    "pricing-intelligence-page__promotion-mini-card-inline-field",

    visualVariant === "price" ? "pricing-intelligence-page__promotion-mini-card-inline-field--price" : "",

    visualVariant === "discount" ? "pricing-intelligence-page__promotion-mini-card-inline-field--discount" : "",

  ]

    .filter(Boolean)

    .join(" ");



  return (

    <span

      ref={editorRootRef}

      className={editClass}

      onClick={(event) => event.stopPropagation()}

      onKeyDown={(event) => event.stopPropagation()}

    >

      {mode === "price" ? (

        <span className="pricing-intelligence-page__promotion-mini-card-inline-metric">

          <span className="pricing-intelligence-page__promotion-mini-card-inline-prefix pricing-intelligence-page__promotion-mini-card-inline-prefix--currency">

            R$

          </span>

          <input

            ref={inputRef}

            id={inputId}

            type="text"

            inputMode="decimal"

            autoComplete="off"

            className="pricing-intelligence-page__promotion-mini-card-inline-input pricing-intelligence-page__promotion-mini-card-inline-input--ghost pricing-intelligence-page__promotion-mini-card-inline-input--price"

            style={{ width: calcularLarguraInputCh(draft) }}

            value={draft}

            aria-label={ariaLabelEdit}

            aria-invalid={erro != null ? "true" : undefined}

            aria-describedby={erro != null ? `${inputId}-error` : undefined}

            onChange={(event) => {

              setDraft(normalizarDraftNumericoPrecoExibicao(event.target.value));

              if (erro != null) setErro(null);

            }}

            onKeyDown={handleKeyDown}

          />

        </span>

      ) : (

        <span className="pricing-intelligence-page__promotion-mini-card-inline-metric">

          <span className="pricing-intelligence-page__promotion-mini-card-inline-prefix">Desconto de </span>

          <input

            ref={inputRef}

            id={inputId}

            type="text"

            inputMode="decimal"

            autoComplete="off"

            className="pricing-intelligence-page__promotion-mini-card-inline-input pricing-intelligence-page__promotion-mini-card-inline-input--ghost pricing-intelligence-page__promotion-mini-card-inline-input--percent"

            style={{ width: calcularLarguraInputCh(draft) }}

            value={draft}

            aria-label={ariaLabelEdit}

            aria-invalid={erro != null ? "true" : undefined}

            aria-describedby={erro != null ? `${inputId}-error` : undefined}

            onChange={(event) => {

              setDraft(normalizarDraftPercentualExibicao(event.target.value));

              if (erro != null) setErro(null);

            }}

            onKeyDown={handleKeyDown}

          />

          <span className="pricing-intelligence-page__promotion-mini-card-inline-suffix">%</span>

        </span>

      )}



      <span className="pricing-intelligence-page__promotion-mini-card-inline-actions">

        <PromotionMiniCardInlineActionButton

          ariaLabel="Confirmar simulação"

          tooltip="Confirmar simulação"

          onClick={(event) => {

            event.stopPropagation();

            executarConfirmar();

          }}

        />

      </span>



      {erro ? (

        <span

          id={`${inputId}-error`}

          className="pricing-intelligence-page__promotion-mini-card-inline-error"

          role="alert"

        >

          {erro}

        </span>

      ) : null}

    </span>

  );

}


