import { memo, useEffect, useMemo, useRef } from "react";
import { CreditCard } from "lucide-react";
import { logSellerToolbox } from "../../sellerToolboxDevLog";
import { useSellerToolbox } from "./SellerToolboxContext";
import SellerToolboxAddExtraDaysAction from "./SellerToolboxAddExtraDaysAction";
import SellerToolboxAddExtraSalesAction from "./SellerToolboxAddExtraSalesAction";
import SellerToolboxTrialActions from "./SellerToolboxTrialActions";
import SellerConsumptionPanel from "./SellerConsumptionPanel";
import {
  buildSellerToolboxSubscriptionModel,
  resolveSellerToolboxSubscriptionPanelState,
  sellerToolboxSubscriptionBadgeClassName,
} from "./sellerToolboxSubscriptionModel";
import "./SellerToolboxSubscriptionPanel.css";

function SellerToolboxSubscriptionPanelSkeleton() {
  return (
    <div className="seller-toolbox-subscription-panel__skeleton" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="seller-toolbox-subscription-panel__skeleton-section">
          <span className="seller-toolbox-subscription-panel__skeleton-line seller-toolbox-subscription-panel__skeleton-line--title" />
          <span className="seller-toolbox-subscription-panel__skeleton-line" />
          <span className="seller-toolbox-subscription-panel__skeleton-line seller-toolbox-subscription-panel__skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}

/**
 * @param {{ category: import("./sellerToolboxCategoriesModel").SellerToolboxCategory }} props
 */
function SellerToolboxSubscriptionPanel({ category }) {
  const { sellerId, listPreview, detail, drawerState, toolboxState, isReady } = useSellerToolbox();
  const loggedOpenRef = useRef(false);
  const loggedEmptyRef = useRef(false);

  const panelState = useMemo(
    () =>
      resolveSellerToolboxSubscriptionPanelState({
        sellerId,
        listPreview,
        detail,
        drawerState,
        toolboxState,
        isReady,
      }),
    [sellerId, listPreview, detail, drawerState, toolboxState, isReady],
  );

  const model = useMemo(
    () => buildSellerToolboxSubscriptionModel({ listPreview, detail }),
    [listPreview, detail],
  );

  useEffect(() => {
    if (loggedOpenRef.current) return;
    loggedOpenRef.current = true;
    logSellerToolbox("subscription_panel_open", { sellerId, categoryId: category.id });
  }, [sellerId, category.id]);

  useEffect(() => {
    if (panelState !== "empty" || loggedEmptyRef.current) return;
    loggedEmptyRef.current = true;
    logSellerToolbox("subscription_panel_empty", { sellerId });
  }, [panelState, sellerId]);

  return (
    <section
      className="seller-toolbox-subscription-panel"
      data-category-id={category.id}
      data-panel-state={panelState}
      data-seller-id={sellerId ?? undefined}
      aria-labelledby="seller-toolbox-subscription-title"
    >
      <header className="seller-toolbox-subscription-panel__head">
        <div className="seller-toolbox-subscription-panel__icon-wrap" aria-hidden>
          <CreditCard className="seller-toolbox-subscription-panel__icon" strokeWidth={2} />
        </div>
        <div className="seller-toolbox-subscription-panel__titles">
          <h4 id="seller-toolbox-subscription-title" className="seller-toolbox-subscription-panel__title">
            {category.label}
          </h4>
          <p className="seller-toolbox-subscription-panel__desc">{category.description}</p>
        </div>
      </header>

      <div className="seller-toolbox-subscription-panel__body">
        {panelState === "loading" ? <SellerToolboxSubscriptionPanelSkeleton /> : null}

        {panelState === "empty" ? (
          <p
            className="seller-toolbox-subscription-panel__message seller-toolbox-subscription-panel__message--empty"
            role="status"
          >
            Nenhum dado de assinatura disponível para este seller no momento.
          </p>
        ) : null}

        {panelState === "error" ? (
          <p
            className="seller-toolbox-subscription-panel__message seller-toolbox-subscription-panel__message--error"
            role="alert"
          >
            Não foi possível exibir os dados de assinatura. Tente voltar e abrir novamente.
          </p>
        ) : null}

        {panelState === "loaded" ? (
          <div className="seller-toolbox-subscription-panel__sections">
            <section className="seller-toolbox-subscription-section">
              <header className="seller-toolbox-subscription-section__head">
                <h5 className="seller-toolbox-subscription-section__title">Plano</h5>
              </header>
              <div className="seller-toolbox-subscription-section__body">
                <dl className="seller-toolbox-subscription-kv">
                  <div className="seller-toolbox-subscription-kv__row">
                    <dt>Nome do plano</dt>
                    <dd>{model.planNameDisplay}</dd>
                  </div>
                  <div className="seller-toolbox-subscription-kv__row">
                    <dt>Valor</dt>
                    <dd>{model.planValueDisplay}</dd>
                  </div>
                  <div className="seller-toolbox-subscription-kv__row">
                    <dt>Tipo de plano</dt>
                    <dd>{model.planTypeDisplay}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="seller-toolbox-subscription-section">
              <header className="seller-toolbox-subscription-section__head">
                <h5 className="seller-toolbox-subscription-section__title">Status</h5>
              </header>
              <div className="seller-toolbox-subscription-section__body">
                <div className="seller-toolbox-subscription-badges">
                  <span className={sellerToolboxSubscriptionBadgeClassName("status")}>
                    {model.statusLabel}
                  </span>
                  {model.inTrial ? (
                    <span className={sellerToolboxSubscriptionBadgeClassName("trial")}>Trial ativo</span>
                  ) : null}
                  {model.inGrace ? (
                    <span className={sellerToolboxSubscriptionBadgeClassName("grace")}>Grace ativo</span>
                  ) : null}
                  {model.isPastDue ? (
                    <span className={sellerToolboxSubscriptionBadgeClassName("past_due")}>Inadimplente</span>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="seller-toolbox-subscription-section">
              <header className="seller-toolbox-subscription-section__head">
                <h5 className="seller-toolbox-subscription-section__title">Ciclo</h5>
              </header>
              <div className="seller-toolbox-subscription-section__body">
                <dl className="seller-toolbox-subscription-kv">
                  <div className="seller-toolbox-subscription-kv__row">
                    <dt>Início do ciclo</dt>
                    <dd>{model.cycleStartLabel}</dd>
                  </div>
                  <div className="seller-toolbox-subscription-kv__row">
                    <dt>Fim do ciclo / renovação</dt>
                    <dd>{model.renewalLabel}</dd>
                  </div>
                  <div className="seller-toolbox-subscription-kv__row">
                    <dt>Dias restantes</dt>
                    <dd>{model.daysRemainingLabel}</dd>
                  </div>
                  <div className="seller-toolbox-subscription-kv__row">
                    <dt>Ciclo</dt>
                    <dd>{model.cycleLabel}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="seller-toolbox-subscription-section">
              <header className="seller-toolbox-subscription-section__head">
                <h5 className="seller-toolbox-subscription-section__title">Consumo</h5>
              </header>
              <div className="seller-toolbox-subscription-section__body">
                <SellerConsumptionPanel />
              </div>
            </section>

            <section className="seller-toolbox-subscription-section">
              <header className="seller-toolbox-subscription-section__head">
                <h5 className="seller-toolbox-subscription-section__title">Operações</h5>
              </header>
              <div className="seller-toolbox-subscription-section__body seller-toolbox-subscription-operations">
                <SellerToolboxAddExtraDaysAction />
                <SellerToolboxAddExtraSalesAction />
                <SellerToolboxTrialActions />
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <footer className="seller-toolbox-subscription-panel__foot">
        <span className="seller-toolbox-subscription-panel__seal">Somente leitura</span>
      </footer>
    </section>
  );
}

export default memo(SellerToolboxSubscriptionPanel);
