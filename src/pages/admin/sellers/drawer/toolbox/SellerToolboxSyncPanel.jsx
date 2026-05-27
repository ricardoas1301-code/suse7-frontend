import { memo, useEffect, useMemo, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { logSellerToolbox } from "../../sellerToolboxDevLog";
import { useSellerToolbox } from "./SellerToolboxContext";
import {
  buildSellerToolboxSyncModel,
  resolveSellerToolboxSyncPanelState,
  sellerToolboxSyncBadgeClassName,
} from "./sellerToolboxSyncModel";
import "./SellerToolboxSyncPanel.css";

function SellerToolboxSyncPanelSkeleton() {
  return (
    <div className="seller-toolbox-sync-panel__skeleton" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="seller-toolbox-sync-panel__skeleton-section">
          <span className="seller-toolbox-sync-panel__skeleton-line seller-toolbox-sync-panel__skeleton-line--title" />
          <span className="seller-toolbox-sync-panel__skeleton-line" />
          <span className="seller-toolbox-sync-panel__skeleton-line seller-toolbox-sync-panel__skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}

/**
 * @param {{ category: import("./sellerToolboxCategoriesModel").SellerToolboxCategory }} props
 */
function SellerToolboxSyncPanel({ category }) {
  const { sellerId, listPreview, detail, drawerState, toolboxState, isReady } = useSellerToolbox();
  const loggedOpenRef = useRef(false);
  const loggedEmptyRef = useRef(false);

  const panelState = useMemo(
    () =>
      resolveSellerToolboxSyncPanelState({
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
    () => buildSellerToolboxSyncModel({ listPreview, detail }),
    [listPreview, detail],
  );

  useEffect(() => {
    if (loggedOpenRef.current) return;
    loggedOpenRef.current = true;
    logSellerToolbox("sync_panel_open", { sellerId, categoryId: category.id });
  }, [sellerId, category.id]);

  useEffect(() => {
    if (panelState !== "empty" || loggedEmptyRef.current) return;
    loggedEmptyRef.current = true;
    logSellerToolbox("sync_panel_empty", { sellerId });
  }, [panelState, sellerId]);

  return (
    <section
      className="seller-toolbox-sync-panel"
      data-category-id={category.id}
      data-panel-state={panelState}
      data-seller-id={sellerId ?? undefined}
      aria-labelledby="seller-toolbox-sync-title"
    >
      <header className="seller-toolbox-sync-panel__head">
        <div className="seller-toolbox-sync-panel__icon-wrap" aria-hidden>
          <RefreshCw className="seller-toolbox-sync-panel__icon" strokeWidth={2} />
        </div>
        <div className="seller-toolbox-sync-panel__titles">
          <h4 id="seller-toolbox-sync-title" className="seller-toolbox-sync-panel__title">
            {category.label}
          </h4>
          <p className="seller-toolbox-sync-panel__desc">{category.description}</p>
        </div>
      </header>

      <div className="seller-toolbox-sync-panel__body">
        {panelState === "loading" ? <SellerToolboxSyncPanelSkeleton /> : null}

        {panelState === "empty" ? (
          <p
            className="seller-toolbox-sync-panel__message seller-toolbox-sync-panel__message--empty"
            role="status"
          >
            Nenhum dado de sincronização disponível para este seller no momento.
          </p>
        ) : null}

        {panelState === "error" ? (
          <p
            className="seller-toolbox-sync-panel__message seller-toolbox-sync-panel__message--error"
            role="alert"
          >
            Não foi possível exibir os dados de sincronização. Tente voltar e abrir novamente.
          </p>
        ) : null}

        {panelState === "loaded" ? (
          <div className="seller-toolbox-sync-panel__sections">
            <section className="seller-toolbox-sync-section">
              <header className="seller-toolbox-sync-section__head">
                <h5 className="seller-toolbox-sync-section__title">Resumo</h5>
              </header>
              <div className="seller-toolbox-sync-section__body">
                <div className="seller-toolbox-sync-summary-status">
                  <span className={sellerToolboxSyncBadgeClassName(model.summary.aggregateHealth)}>
                    {model.summary.aggregateStatusLabel}
                  </span>
                </div>
                <dl className="seller-toolbox-sync-kv">
                  <div className="seller-toolbox-sync-kv__row">
                    <dt>Última sincronização geral</dt>
                    <dd>{model.summary.lastSyncLabel}</dd>
                  </div>
                  <div className="seller-toolbox-sync-kv__row">
                    <dt>Contas consideradas</dt>
                    <dd>{model.summary.accountsConsideredLabel}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="seller-toolbox-sync-section">
              <header className="seller-toolbox-sync-section__head">
                <h5 className="seller-toolbox-sync-section__title">Últimas sincronizações</h5>
              </header>
              <div className="seller-toolbox-sync-section__body">
                {model.recentSyncs.length > 0 ? (
                  <>
                    <ul className="seller-toolbox-sync-recent">
                      {model.recentSyncs.map((item) => (
                        <li key={item.id} className="seller-toolbox-sync-recent__item">
                          <div className="seller-toolbox-sync-recent__copy">
                            <strong>{item.marketplaceLabel}</strong>
                            <span>{item.accountLabel}</span>
                            <span className="seller-toolbox-sync-recent__time">{item.lastSyncLabel}</span>
                          </div>
                          <span className={sellerToolboxSyncBadgeClassName(item.health)}>
                            {item.statusLabel}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {model.hiddenRecentSyncCount > 0 ? (
                      <p className="seller-toolbox-sync-recent__overflow">
                        +{model.hiddenRecentSyncCount} sincronizações
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="seller-toolbox-sync-panel__inline-empty" role="status">
                    Não informado
                  </p>
                )}
              </div>
            </section>

            <section className="seller-toolbox-sync-section">
              <header className="seller-toolbox-sync-section__head">
                <h5 className="seller-toolbox-sync-section__title">Pendências</h5>
              </header>
              <div className="seller-toolbox-sync-section__body">
                {model.pendingItems.length > 0 ? (
                  <ul className="seller-toolbox-sync-pending">
                    {model.pendingItems.map((item, index) => (
                      <li key={`${item.label}-${index}`} className="seller-toolbox-sync-pending__item">
                        <strong>{item.label}</strong>
                        <span>{item.reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="seller-toolbox-sync-panel__inline-empty" role="status">
                    Nenhuma pendência identificada
                  </p>
                )}
              </div>
            </section>

            <section className="seller-toolbox-sync-section">
              <header className="seller-toolbox-sync-section__head">
                <h5 className="seller-toolbox-sync-section__title">Saúde do sync</h5>
              </header>
              <div className="seller-toolbox-sync-section__body">
                {model.healthItems.length > 0 ? (
                  <ul className="seller-toolbox-sync-health">
                    {model.healthItems.map((item, index) => (
                      <li
                        key={`${item.marketplaceLabel}-${item.accountLabel}-${index}`}
                        className="seller-toolbox-sync-health__item"
                      >
                        <div className="seller-toolbox-sync-health__copy">
                          <strong>{item.marketplaceLabel}</strong>
                          <span>{item.accountLabel}</span>
                        </div>
                        <span className={sellerToolboxSyncBadgeClassName(item.health)}>
                          {item.healthLabel}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="seller-toolbox-sync-panel__inline-empty" role="status">
                    Não informado
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <footer className="seller-toolbox-sync-panel__foot">
        <span className="seller-toolbox-sync-panel__seal">Somente leitura</span>
      </footer>
    </section>
  );
}

export default memo(SellerToolboxSyncPanel);
