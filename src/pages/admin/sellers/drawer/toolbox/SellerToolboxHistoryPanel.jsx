import { memo, useEffect, useMemo, useRef } from "react";
import { History } from "lucide-react";
import { logSellerToolbox } from "../../sellerToolboxDevLog";
import { useSellerToolbox } from "./SellerToolboxContext";
import {
  buildSellerToolboxHistoryModel,
  resolveSellerToolboxHistoryPanelState,
  sellerToolboxHistoryBadgeClassName,
} from "./sellerToolboxHistoryModel";
import "./SellerToolboxHistoryPanel.css";

function SellerToolboxHistoryPanelSkeleton() {
  return (
    <div className="seller-toolbox-history-panel__skeleton" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="seller-toolbox-history-panel__skeleton-section">
          <span className="seller-toolbox-history-panel__skeleton-line seller-toolbox-history-panel__skeleton-line--title" />
          <span className="seller-toolbox-history-panel__skeleton-line" />
          <span className="seller-toolbox-history-panel__skeleton-line seller-toolbox-history-panel__skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}

/**
 * @param {{ category: import("./sellerToolboxCategoriesModel").SellerToolboxCategory }} props
 */
function SellerToolboxHistoryPanel({ category }) {
  const { sellerId, listPreview, detail, drawerState, toolboxState, isReady } = useSellerToolbox();
  const loggedOpenRef = useRef(false);
  const loggedEmptyRef = useRef(false);

  const panelState = useMemo(
    () =>
      resolveSellerToolboxHistoryPanelState({
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
    () => buildSellerToolboxHistoryModel({ listPreview, detail }),
    [listPreview, detail],
  );

  useEffect(() => {
    if (loggedOpenRef.current) return;
    loggedOpenRef.current = true;
    logSellerToolbox("history_panel_open", { sellerId, categoryId: category.id });
  }, [sellerId, category.id]);

  useEffect(() => {
    if (panelState !== "empty" || loggedEmptyRef.current) return;
    loggedEmptyRef.current = true;
    logSellerToolbox("history_panel_empty", { sellerId });
  }, [panelState, sellerId]);

  const lastActivityItems = [
    model.lastActivity.lastSaleLabel
      ? { key: "sale", label: "Última venda", value: model.lastActivity.lastSaleLabel }
      : null,
    model.lastActivity.lastSyncLabel
      ? { key: "sync", label: "Última sincronização", value: model.lastActivity.lastSyncLabel }
      : null,
    model.lastActivity.lastChangeLabel
      ? { key: "change", label: "Última alteração conhecida", value: model.lastActivity.lastChangeLabel }
      : null,
  ].filter((item) => item != null);

  return (
    <section
      className="seller-toolbox-history-panel"
      data-category-id={category.id}
      data-panel-state={panelState}
      data-seller-id={sellerId ?? undefined}
      aria-labelledby="seller-toolbox-history-title"
    >
      <header className="seller-toolbox-history-panel__head">
        <div className="seller-toolbox-history-panel__icon-wrap" aria-hidden>
          <History className="seller-toolbox-history-panel__icon" strokeWidth={2} />
        </div>
        <div className="seller-toolbox-history-panel__titles">
          <h4 id="seller-toolbox-history-title" className="seller-toolbox-history-panel__title">
            {category.label}
          </h4>
          <p className="seller-toolbox-history-panel__desc">{category.description}</p>
        </div>
      </header>

      <div className="seller-toolbox-history-panel__body">
        {panelState === "loading" ? <SellerToolboxHistoryPanelSkeleton /> : null}

        {panelState === "empty" ? (
          <p
            className="seller-toolbox-history-panel__message seller-toolbox-history-panel__message--empty"
            role="status"
          >
            Nenhum histórico disponível para este seller no momento.
          </p>
        ) : null}

        {panelState === "error" ? (
          <p
            className="seller-toolbox-history-panel__message seller-toolbox-history-panel__message--error"
            role="alert"
          >
            Não foi possível exibir o histórico. Tente voltar e abrir novamente.
          </p>
        ) : null}

        {panelState === "loaded" ? (
          <div className="seller-toolbox-history-panel__sections">
            <section className="seller-toolbox-history-section">
              <header className="seller-toolbox-history-section__head">
                <h5 className="seller-toolbox-history-section__title">Resumo</h5>
              </header>
              <div className="seller-toolbox-history-section__body">
                <div className="seller-toolbox-history-summary-status">
                  <span className={sellerToolboxHistoryBadgeClassName(model.summary.aggregateStatus)}>
                    {model.summary.aggregateStatusLabel}
                  </span>
                </div>
                <dl className="seller-toolbox-history-kv">
                  <div className="seller-toolbox-history-kv__row">
                    <dt>Eventos conhecidos</dt>
                    <dd>{model.summary.totalEventsLabel}</dd>
                  </div>
                  <div className="seller-toolbox-history-kv__row">
                    <dt>Última atividade</dt>
                    <dd>{model.summary.lastActivityLabel}</dd>
                  </div>
                  <div className="seller-toolbox-history-kv__row">
                    <dt>Origem dos dados</dt>
                    <dd>{model.summary.dataSourceLabel}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="seller-toolbox-history-section">
              <header className="seller-toolbox-history-section__head">
                <h5 className="seller-toolbox-history-section__title">Eventos recentes</h5>
              </header>
              <div className="seller-toolbox-history-section__body">
                {model.recentEvents.length > 0 ? (
                  <>
                    <ol className="seller-toolbox-history-timeline">
                      {model.recentEvents.map((item) => (
                        <li key={item.id} className="seller-toolbox-history-timeline__item">
                          <span className="seller-toolbox-history-timeline__dot" aria-hidden />
                          <div className="seller-toolbox-history-timeline__copy">
                            <div className="seller-toolbox-history-timeline__headline">
                              <span className="seller-toolbox-history-timeline__type">{item.typeLabel}</span>
                              <time className="seller-toolbox-history-timeline__when">{item.whenLabel}</time>
                            </div>
                            <p className="seller-toolbox-history-timeline__desc">{item.description}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    {model.hiddenEventCount > 0 ? (
                      <p className="seller-toolbox-history-timeline__overflow">
                        +{model.hiddenEventCount} eventos
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="seller-toolbox-history-panel__inline-empty" role="status">
                    Nenhum evento recente disponível
                  </p>
                )}
              </div>
            </section>

            <section className="seller-toolbox-history-section">
              <header className="seller-toolbox-history-section__head">
                <h5 className="seller-toolbox-history-section__title">Atividades comerciais</h5>
              </header>
              <div className="seller-toolbox-history-section__body">
                {model.commercialActivities.length > 0 ? (
                  <ul className="seller-toolbox-history-commercial">
                    {model.commercialActivities.map((item) => (
                      <li key={item.id} className="seller-toolbox-history-commercial__item">
                        <strong>{item.label}</strong>
                        <span>{item.detail}</span>
                        <time>{item.whenLabel}</time>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="seller-toolbox-history-panel__inline-empty" role="status">
                    Nenhuma atividade comercial recente disponível
                  </p>
                )}
              </div>
            </section>

            <section className="seller-toolbox-history-section">
              <header className="seller-toolbox-history-section__head">
                <h5 className="seller-toolbox-history-section__title">Última atividade</h5>
              </header>
              <div className="seller-toolbox-history-section__body">
                {lastActivityItems.length > 0 ? (
                  <dl className="seller-toolbox-history-kv">
                    {lastActivityItems.map((item) => (
                      <div key={item.key} className="seller-toolbox-history-kv__row">
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="seller-toolbox-history-panel__inline-empty" role="status">
                    Não informado
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <footer className="seller-toolbox-history-panel__foot">
        <span className="seller-toolbox-history-panel__seal">Somente leitura</span>
      </footer>
    </section>
  );
}

export default memo(SellerToolboxHistoryPanel);
