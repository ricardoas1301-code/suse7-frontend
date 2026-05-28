import { memo, useEffect, useMemo, useRef } from "react";
import { Plug } from "lucide-react";
import { logSellerToolbox } from "../../sellerToolboxDevLog";
import { useSellerToolbox } from "./SellerToolboxContext";
import {
  buildSellerToolboxIntegrationsModel,
  resolveSellerToolboxIntegrationsPanelState,
  sellerToolboxIntegrationBadgeClassName,
} from "./sellerToolboxIntegrationsModel";
import SellerToolboxIntegrationsOperations from "./integrations/SellerToolboxIntegrationsOperations";
import "./SellerToolboxIntegrationsPanel.css";

function SellerToolboxIntegrationsPanelSkeleton() {
  return (
    <div className="seller-toolbox-integrations-panel__skeleton" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="seller-toolbox-integrations-panel__skeleton-section">
          <span className="seller-toolbox-integrations-panel__skeleton-line seller-toolbox-integrations-panel__skeleton-line--title" />
          <span className="seller-toolbox-integrations-panel__skeleton-line" />
          <span className="seller-toolbox-integrations-panel__skeleton-line seller-toolbox-integrations-panel__skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}

/**
 * @param {{ category: import("./sellerToolboxCategoriesModel").SellerToolboxCategory }} props
 */
function SellerToolboxIntegrationsPanel({ category }) {
  const { sellerId, listPreview, detail, drawerState, toolboxState, isReady } = useSellerToolbox();
  const loggedOpenRef = useRef(false);
  const loggedEmptyRef = useRef(false);

  const panelState = useMemo(
    () =>
      resolveSellerToolboxIntegrationsPanelState({
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
    () => buildSellerToolboxIntegrationsModel({ listPreview, detail }),
    [listPreview, detail],
  );

  useEffect(() => {
    if (loggedOpenRef.current) return;
    loggedOpenRef.current = true;
    logSellerToolbox("integrations_panel_open", { sellerId, categoryId: category.id });
  }, [sellerId, category.id]);

  useEffect(() => {
    if (panelState !== "empty" || loggedEmptyRef.current) return;
    loggedEmptyRef.current = true;
    logSellerToolbox("integrations_panel_empty", { sellerId });
  }, [panelState, sellerId]);

  return (
    <section
      className="seller-toolbox-integrations-panel"
      data-category-id={category.id}
      data-panel-state={panelState}
      data-seller-id={sellerId ?? undefined}
      aria-labelledby="seller-toolbox-integrations-title"
    >
      <header className="seller-toolbox-integrations-panel__head">
        <div className="seller-toolbox-integrations-panel__icon-wrap" aria-hidden>
          <Plug className="seller-toolbox-integrations-panel__icon" strokeWidth={2} />
        </div>
        <div className="seller-toolbox-integrations-panel__titles">
          <h4 id="seller-toolbox-integrations-title" className="seller-toolbox-integrations-panel__title">
            {category.label}
          </h4>
          <p className="seller-toolbox-integrations-panel__desc">{category.description}</p>
        </div>
      </header>

      <div className="seller-toolbox-integrations-panel__body">
        {panelState === "loading" ? <SellerToolboxIntegrationsPanelSkeleton /> : null}

        {panelState === "empty" ? (
          <p
            className="seller-toolbox-integrations-panel__message seller-toolbox-integrations-panel__message--empty"
            role="status"
          >
            Nenhum dado de integração disponível para este seller no momento.
          </p>
        ) : null}

        {panelState === "error" ? (
          <p
            className="seller-toolbox-integrations-panel__message seller-toolbox-integrations-panel__message--error"
            role="alert"
          >
            Não foi possível exibir os dados de integração. Tente voltar e abrir novamente.
          </p>
        ) : null}

        {panelState === "loaded" ? (
          <div className="seller-toolbox-integrations-panel__sections">
            <section className="seller-toolbox-integrations-section">
              <header className="seller-toolbox-integrations-section__head">
                <h5 className="seller-toolbox-integrations-section__title">Resumo</h5>
              </header>
              <div className="seller-toolbox-integrations-section__body">
                <dl className="seller-toolbox-integrations-kv">
                  <div className="seller-toolbox-integrations-kv__row">
                    <dt>Total de marketplaces</dt>
                    <dd>{model.summary.marketplaceCountLabel}</dd>
                  </div>
                  <div className="seller-toolbox-integrations-kv__row">
                    <dt>Contas conectadas</dt>
                    <dd>{model.summary.connectedAccountsLabel}</dd>
                  </div>
                  <div className="seller-toolbox-integrations-kv__row">
                    <dt>Última sincronização geral</dt>
                    <dd>{model.summary.lastSyncLabel}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="seller-toolbox-integrations-section">
              <header className="seller-toolbox-integrations-section__head">
                <h5 className="seller-toolbox-integrations-section__title">Marketplaces</h5>
              </header>
              <div className="seller-toolbox-integrations-section__body">
                {model.marketplaceList.length > 0 ? (
                  <ul className="seller-toolbox-integrations-marketplaces">
                    {model.marketplaceList.map((item) => (
                      <li key={item.marketplaceKey} className="seller-toolbox-integrations-marketplaces__item">
                        <div className="seller-toolbox-integrations-marketplaces__main">
                          <strong>{item.marketplaceLabel}</strong>
                          <span className={sellerToolboxIntegrationBadgeClassName(item.health)}>
                            {item.statusLabel}
                          </span>
                        </div>
                        <span className="seller-toolbox-integrations-marketplaces__meta">
                          {item.accountCount === 1
                            ? "1 conta"
                            : item.accountCount > 0
                              ? `${item.accountCount} contas`
                              : "Sem contas detalhadas"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="seller-toolbox-integrations-panel__inline-empty" role="status">
                    Nenhum marketplace conectado
                  </p>
                )}
              </div>
            </section>

            <section className="seller-toolbox-integrations-section">
              <header className="seller-toolbox-integrations-section__head">
                <h5 className="seller-toolbox-integrations-section__title">Contas conectadas</h5>
              </header>
              <div className="seller-toolbox-integrations-section__body">
                {model.marketplaceGroups.length > 0 ? (
                  <div className="seller-toolbox-integrations-accounts">
                    {model.marketplaceGroups.map((group) => (
                      <div key={group.marketplaceKey} className="seller-toolbox-integrations-accounts__group">
                        <h6 className="seller-toolbox-integrations-accounts__marketplace">
                          {group.marketplaceLabel}
                        </h6>
                        {group.accounts.length > 0 ? (
                          <ul className="seller-toolbox-integrations-accounts__list">
                            {group.accounts.map((account) => (
                              <li key={account.id} className="seller-toolbox-integrations-accounts__item">
                                <span>{account.label}</span>
                                <SellerToolboxIntegrationsOperations
                                  account={{
                                    id: account.id,
                                    label: account.label,
                                    marketplaceKey: group.marketplaceKey,
                                  }}
                                />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="seller-toolbox-integrations-accounts__empty">Sem contas detalhadas</p>
                        )}
                        {group.hiddenAccountCount > 0 ? (
                          <p className="seller-toolbox-integrations-accounts__overflow">
                            +{group.hiddenAccountCount} conta(s)
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="seller-toolbox-integrations-panel__inline-empty" role="status">
                    Nenhuma conta conectada
                  </p>
                )}
              </div>
            </section>

            <section className="seller-toolbox-integrations-section">
              <header className="seller-toolbox-integrations-section__head">
                <h5 className="seller-toolbox-integrations-section__title">Saúde da conexão</h5>
              </header>
              <div className="seller-toolbox-integrations-section__body">
                {model.healthItems.length > 0 ? (
                  <ul className="seller-toolbox-integrations-health">
                    {model.healthItems.map((item, index) => (
                      <li key={`${item.marketplaceLabel}-${item.accountLabel}-${index}`} className="seller-toolbox-integrations-health__item">
                        <div className="seller-toolbox-integrations-health__copy">
                          <strong>{item.marketplaceLabel}</strong>
                          <span>{item.accountLabel}</span>
                        </div>
                        <span className={sellerToolboxIntegrationBadgeClassName(item.health)}>
                          {item.healthLabel}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="seller-toolbox-integrations-panel__inline-empty" role="status">
                    Não informado
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <footer className="seller-toolbox-integrations-panel__foot">
        <span className="seller-toolbox-integrations-panel__seal">Operações administrativas</span>
      </footer>
    </section>
  );
}

export default memo(SellerToolboxIntegrationsPanel);
