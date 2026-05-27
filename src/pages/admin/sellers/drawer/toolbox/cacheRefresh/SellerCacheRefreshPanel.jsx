import { memo, useEffect, useRef } from "react";
import { Database } from "lucide-react";
import { logSellerToolbox } from "../../../sellerToolboxDevLog";
import { useSellerToolbox } from "../SellerToolboxContext";
import {
  formatCacheRefreshTimestamp,
  resolveCacheRefreshScopeLabel,
  resolveClearOperationalCacheScopeLabel,
  resolveReloadPanelDataLabel,
} from "./sellerToolboxCacheRefreshModel";
import { useSellerCacheRefreshView } from "./useSellerCacheRefreshView";
import SellerToolboxRefreshSellerAction from "./SellerToolboxRefreshSellerAction";
import SellerToolboxClearOperationalCacheAction from "./SellerToolboxClearOperationalCacheAction";
import SellerToolboxReloadPanelDataAction from "./SellerToolboxReloadPanelDataAction";
import "./SellerCacheRefreshPanel.css";

function SellerCacheRefreshPanelSkeleton() {
  return (
    <div className="seller-cache-refresh-panel__skeleton" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <span
          key={index}
          className="seller-cache-refresh-panel__skeleton-line seller-cache-refresh-panel__skeleton-line--block"
        />
      ))}
    </div>
  );
}

/**
 * @param {{
 *   title: string;
 *   description: string;
 *   lastEventLabel: string;
 *   lastEventAt: string | null;
 *   itemsLabel: string;
 *   itemKeys: string[];
 *   resolveItemLabel: (key: string) => string;
 *   emptyItemsText: string;
 *   action: import("react").ReactNode;
 * }} props
 */
function CacheRefreshOperationBlock({
  title,
  description,
  lastEventLabel,
  lastEventAt,
  itemsLabel,
  itemKeys,
  resolveItemLabel,
  emptyItemsText,
  action,
}) {
  return (
    <article className="seller-cache-refresh-panel__operation">
      <header className="seller-cache-refresh-panel__operation-head">
        <h5 className="seller-cache-refresh-panel__operation-title">{title}</h5>
        <p className="seller-cache-refresh-panel__operation-desc">{description}</p>
      </header>

      <div className="seller-cache-refresh-panel__operation-body">
        <div className="seller-cache-refresh-panel__operation-meta">
          <span className="seller-cache-refresh-panel__operation-meta-label">{lastEventLabel}</span>
          <strong className="seller-cache-refresh-panel__timestamp">
            {lastEventAt ? formatCacheRefreshTimestamp(lastEventAt) : "—"}
          </strong>
        </div>

        <div className="seller-cache-refresh-panel__operation-items">
          <span className="seller-cache-refresh-panel__operation-meta-label">{itemsLabel}</span>
          {itemKeys.length > 0 ? (
            <ul className="seller-cache-refresh-panel__scopes">
              {itemKeys.map((itemKey) => (
                <li key={itemKey} className="seller-cache-refresh-panel__scope">
                  {resolveItemLabel(itemKey)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="seller-cache-refresh-panel__inline-empty" role="status">
              {emptyItemsText}
            </p>
          )}
        </div>

        <div className="seller-cache-refresh-panel__operation-action">{action}</div>
      </div>
    </article>
  );
}

/**
 * @param {{ category: import("../sellerToolboxCategoriesModel").SellerToolboxCategory }} props
 */
function SellerCacheRefreshPanel({ category }) {
  const { sellerId } = useSellerToolbox();
  const {
    viewState,
    lastRefreshedAt,
    refreshedScopes,
    lastClearedAt,
    clearedScopes,
    lastReloadedAt,
    reloadedPanels,
    loading,
    error,
  } = useSellerCacheRefreshView();
  const loggedOpenRef = useRef(false);

  useEffect(() => {
    if (viewState !== "loaded" || loggedOpenRef.current) return;
    loggedOpenRef.current = true;
    logSellerToolbox("cache_refresh_panel_open", {
      sellerId,
      categoryId: category.id,
      hasRefresh: Boolean(lastRefreshedAt),
      hasClear: Boolean(lastClearedAt),
      hasReload: Boolean(lastReloadedAt),
    });
  }, [viewState, sellerId, category.id, lastRefreshedAt, lastClearedAt, lastReloadedAt]);

  return (
    <section
      className="seller-cache-refresh-panel"
      data-category-id={category.id}
      data-panel-state={viewState}
      data-seller-id={sellerId ?? undefined}
      aria-labelledby="seller-cache-refresh-panel-title"
    >
      <header className="seller-cache-refresh-panel__head">
        <div className="seller-cache-refresh-panel__icon-wrap" aria-hidden>
          <Database className="seller-cache-refresh-panel__icon" strokeWidth={2} />
        </div>
        <div className="seller-cache-refresh-panel__titles">
          <div className="seller-cache-refresh-panel__title-row">
            <h4 id="seller-cache-refresh-panel-title" className="seller-cache-refresh-panel__title">
              Cache / Refresh
            </h4>
            {import.meta.env.DEV ? (
              <span className="seller-cache-refresh-panel__dev-badge">DEV</span>
            ) : null}
          </div>
          <p className="seller-cache-refresh-panel__desc">{category.description}</p>
        </div>
      </header>

      <div className="seller-cache-refresh-panel__body">
        {loading ? <SellerCacheRefreshPanelSkeleton /> : null}

        {viewState === "empty" ? (
          <p
            className="seller-cache-refresh-panel__message seller-cache-refresh-panel__message--empty"
            role="status"
          >
            Refresh operacional indisponível para este seller no momento.
          </p>
        ) : null}

        {error ? (
          <p
            className="seller-cache-refresh-panel__message seller-cache-refresh-panel__message--error"
            role="alert"
          >
            Não foi possível exibir o painel de refresh. Tente voltar e abrir novamente.
          </p>
        ) : null}

        {viewState === "loaded" ? (
          <div className="seller-cache-refresh-panel__operations">
            <CacheRefreshOperationBlock
              title="Forçar refresh do seller"
              description="Simula a atualização dos dados operacionais exibidos no drawer."
              lastEventLabel="Último refresh"
              lastEventAt={lastRefreshedAt}
              itemsLabel="Escopos atualizados"
              itemKeys={refreshedScopes}
              resolveItemLabel={resolveCacheRefreshScopeLabel}
              emptyItemsText="Nenhum escopo atualizado ainda."
              action={<SellerToolboxRefreshSellerAction />}
            />

            <CacheRefreshOperationBlock
              title="Limpar cache operacional"
              description="Simula a limpeza dos dados temporários operacionais da Toolbox."
              lastEventLabel="Última limpeza de cache"
              lastEventAt={lastClearedAt}
              itemsLabel="Escopos limpos"
              itemKeys={clearedScopes}
              resolveItemLabel={resolveClearOperationalCacheScopeLabel}
              emptyItemsText="Nenhum escopo limpo ainda."
              action={<SellerToolboxClearOperationalCacheAction />}
            />

            <CacheRefreshOperationBlock
              title="Recarregar dados do painel"
              description="Simula o recarregamento dos dados exibidos no Drawer e na Toolbox."
              lastEventLabel="Último recarregamento"
              lastEventAt={lastReloadedAt}
              itemsLabel="Painéis recarregados"
              itemKeys={reloadedPanels}
              resolveItemLabel={resolveReloadPanelDataLabel}
              emptyItemsText="Nenhum painel recarregado ainda."
              action={<SellerToolboxReloadPanelDataAction />}
            />
          </div>
        ) : null}
      </div>

      <footer className="seller-cache-refresh-panel__foot">
        <span className="seller-cache-refresh-panel__seal">
          {import.meta.env.DEV
            ? "Simulação local — cache/refresh sem backend"
            : "Somente leitura"}
        </span>
      </footer>
    </section>
  );
}

export default memo(SellerCacheRefreshPanel);
