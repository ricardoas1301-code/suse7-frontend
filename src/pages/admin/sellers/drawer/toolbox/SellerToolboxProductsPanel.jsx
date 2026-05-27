import { memo, useEffect, useMemo, useRef } from "react";
import { Package } from "lucide-react";
import { logSellerToolbox } from "../../sellerToolboxDevLog";
import { useSellerToolbox } from "./SellerToolboxContext";
import {
  buildSellerToolboxProductsModel,
  resolveSellerToolboxProductsPanelState,
  sellerToolboxProductsBadgeClassName,
} from "./sellerToolboxProductsModel";
import "./SellerToolboxProductsPanel.css";

function SellerToolboxProductsPanelSkeleton() {
  return (
    <div className="seller-toolbox-products-panel__skeleton" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="seller-toolbox-products-panel__skeleton-section">
          <span className="seller-toolbox-products-panel__skeleton-line seller-toolbox-products-panel__skeleton-line--title" />
          <span className="seller-toolbox-products-panel__skeleton-line" />
          <span className="seller-toolbox-products-panel__skeleton-line seller-toolbox-products-panel__skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}

/**
 * @param {{ category: import("./sellerToolboxCategoriesModel").SellerToolboxCategory }} props
 */
function SellerToolboxProductsPanel({ category }) {
  const { sellerId, listPreview, detail, drawerState, toolboxState, isReady } = useSellerToolbox();
  const loggedOpenRef = useRef(false);
  const loggedEmptyRef = useRef(false);

  const panelState = useMemo(
    () =>
      resolveSellerToolboxProductsPanelState({
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
    () => buildSellerToolboxProductsModel({ listPreview, detail }),
    [listPreview, detail],
  );

  useEffect(() => {
    if (loggedOpenRef.current) return;
    loggedOpenRef.current = true;
    logSellerToolbox("products_panel_open", { sellerId, categoryId: category.id });
  }, [sellerId, category.id]);

  useEffect(() => {
    if (panelState !== "empty" || loggedEmptyRef.current) return;
    loggedEmptyRef.current = true;
    logSellerToolbox("products_panel_empty", { sellerId });
  }, [panelState, sellerId]);

  return (
    <section
      className="seller-toolbox-products-panel"
      data-category-id={category.id}
      data-panel-state={panelState}
      data-seller-id={sellerId ?? undefined}
      aria-labelledby="seller-toolbox-products-title"
    >
      <header className="seller-toolbox-products-panel__head">
        <div className="seller-toolbox-products-panel__icon-wrap" aria-hidden>
          <Package className="seller-toolbox-products-panel__icon" strokeWidth={2} />
        </div>
        <div className="seller-toolbox-products-panel__titles">
          <h4 id="seller-toolbox-products-title" className="seller-toolbox-products-panel__title">
            {category.label}
          </h4>
          <p className="seller-toolbox-products-panel__desc">{category.description}</p>
        </div>
      </header>

      <div className="seller-toolbox-products-panel__body">
        {panelState === "loading" ? <SellerToolboxProductsPanelSkeleton /> : null}

        {panelState === "empty" ? (
          <p
            className="seller-toolbox-products-panel__message seller-toolbox-products-panel__message--empty"
            role="status"
          >
            Nenhum dado de produtos ou anúncios disponível para este seller no momento.
          </p>
        ) : null}

        {panelState === "error" ? (
          <p
            className="seller-toolbox-products-panel__message seller-toolbox-products-panel__message--error"
            role="alert"
          >
            Não foi possível exibir os dados de produtos e anúncios. Tente voltar e abrir novamente.
          </p>
        ) : null}

        {panelState === "loaded" ? (
          <div className="seller-toolbox-products-panel__sections">
            <section className="seller-toolbox-products-section">
              <header className="seller-toolbox-products-section__head">
                <h5 className="seller-toolbox-products-section__title">Resumo</h5>
              </header>
              <div className="seller-toolbox-products-section__body">
                <dl className="seller-toolbox-products-kv">
                  <div className="seller-toolbox-products-kv__row">
                    <dt>Produtos</dt>
                    <dd>{model.summary.productsLabel}</dd>
                  </div>
                  <div className="seller-toolbox-products-kv__row">
                    <dt>Anúncios</dt>
                    <dd>{model.summary.listingsLabel}</dd>
                  </div>
                  <div className="seller-toolbox-products-kv__row">
                    <dt>Anúncios ativos</dt>
                    <dd>{model.summary.activeListingsLabel}</dd>
                  </div>
                  <div className="seller-toolbox-products-kv__row">
                    <dt>Última atualização</dt>
                    <dd>{model.summary.lastUpdateLabel}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="seller-toolbox-products-section">
              <header className="seller-toolbox-products-section__head">
                <h5 className="seller-toolbox-products-section__title">Anúncios</h5>
              </header>
              <div className="seller-toolbox-products-section__body">
                {model.listingsIndicators.hasData ? (
                  <dl className="seller-toolbox-products-kv">
                    {model.listingsIndicators.items.map((item) => (
                      <div key={item.key} className="seller-toolbox-products-kv__row">
                        <dt>{item.label}</dt>
                        <dd>{item.valueLabel}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="seller-toolbox-products-panel__inline-empty" role="status">
                    Dados de anúncios não disponíveis
                  </p>
                )}
              </div>
            </section>

            <section className="seller-toolbox-products-section">
              <header className="seller-toolbox-products-section__head">
                <h5 className="seller-toolbox-products-section__title">Saúde operacional</h5>
              </header>
              <div className="seller-toolbox-products-section__body">
                <div className="seller-toolbox-products-health-status">
                  <span className={sellerToolboxProductsBadgeClassName(model.operationalHealth)}>
                    {model.operationalHealthLabel}
                  </span>
                </div>
              </div>
            </section>

            <section className="seller-toolbox-products-section">
              <header className="seller-toolbox-products-section__head">
                <h5 className="seller-toolbox-products-section__title">Distribuição por marketplace</h5>
              </header>
              <div className="seller-toolbox-products-section__body">
                {model.marketplaceDistribution.length > 0 ? (
                  <>
                    <ul className="seller-toolbox-products-distribution">
                      {model.marketplaceDistribution.map((item) => (
                        <li
                          key={item.marketplaceKey}
                          className="seller-toolbox-products-distribution__item"
                        >
                          <strong>{item.marketplaceLabel}</strong>
                          <span>{item.countLabel}</span>
                        </li>
                      ))}
                    </ul>
                    {model.hiddenMarketplaceCount > 0 ? (
                      <p className="seller-toolbox-products-distribution__overflow">
                        +{model.hiddenMarketplaceCount} marketplaces
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="seller-toolbox-products-panel__inline-empty" role="status">
                    Não informado
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <footer className="seller-toolbox-products-panel__foot">
        <span className="seller-toolbox-products-panel__seal">Somente leitura</span>
      </footer>
    </section>
  );
}

export default memo(SellerToolboxProductsPanel);
