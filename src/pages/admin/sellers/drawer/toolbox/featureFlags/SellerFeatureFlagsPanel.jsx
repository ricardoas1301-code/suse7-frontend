import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Flag, Search } from "lucide-react";
import { logSellerToolbox } from "../../../sellerToolboxDevLog";
import { useSellerToolbox } from "../SellerToolboxContext";
import {
  filterSellerFeatureFlags,
  formatFeatureFlagDate,
  resolveFeatureFlagCategoryLabel,
  resolveFeatureFlagSourceLabel,
  resolveFeatureFlagStatusLabel,
  resolveFeatureFlagStatusVariant,
  sellerFeatureFlagCategoryClassName,
  sellerFeatureFlagStatusClassName,
} from "./sellerToolboxFeatureFlagsModel";
import { useSellerFeatureFlagsView } from "./useSellerFeatureFlagsView";
import SellerToolboxEnableFeatureFlagAction from "./SellerToolboxEnableFeatureFlagAction";
import SellerToolboxDisableFeatureFlagAction from "./SellerToolboxDisableFeatureFlagAction";
import "./SellerFeatureFlagsPanel.css";

function SellerFeatureFlagsPanelSkeleton() {
  return (
    <div className="seller-feature-flags-panel__skeleton" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="seller-feature-flags-panel__skeleton-card">
          <span className="seller-feature-flags-panel__skeleton-line seller-feature-flags-panel__skeleton-line--title" />
          <span className="seller-feature-flags-panel__skeleton-line" />
          <span className="seller-feature-flags-panel__skeleton-line seller-feature-flags-panel__skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}

/**
 * @param {{ category: import("../sellerToolboxCategoriesModel").SellerToolboxCategory }} props
 */
function SellerFeatureFlagsPanel({ category }) {
  const { sellerId } = useSellerToolbox();
  const { viewState, flags, enabledCount, disabledCount, loading, error, empty } =
    useSellerFeatureFlagsView();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(/** @type {"all" | "active" | "inactive"} */ ("all"));
  const loggedOpenRef = useRef(false);
  const loggedEmptyRef = useRef(false);

  const filteredFlags = useMemo(
    () =>
      filterSellerFeatureFlags(flags, {
        query: searchQuery,
        statusFilter,
      }),
    [flags, searchQuery, statusFilter],
  );

  useEffect(() => {
    if (viewState !== "loaded" || loggedOpenRef.current) return;
    loggedOpenRef.current = true;
    logSellerToolbox("feature_flags_panel_open", {
      sellerId,
      categoryId: category.id,
      enabledCount,
      disabledCount,
    });
  }, [viewState, sellerId, category.id, enabledCount, disabledCount]);

  useEffect(() => {
    if (!empty || loggedEmptyRef.current) return;
    loggedEmptyRef.current = true;
    logSellerToolbox("feature_flags_panel_empty", { sellerId });
  }, [empty, sellerId]);

  return (
    <section
      className="seller-feature-flags-panel"
      data-category-id={category.id}
      data-panel-state={viewState}
      data-seller-id={sellerId ?? undefined}
      aria-labelledby="seller-feature-flags-panel-title"
    >
      <header className="seller-feature-flags-panel__head">
        <div className="seller-feature-flags-panel__icon-wrap" aria-hidden>
          <Flag className="seller-feature-flags-panel__icon" strokeWidth={2} />
        </div>
        <div className="seller-feature-flags-panel__titles">
          <div className="seller-feature-flags-panel__title-row">
            <h4 id="seller-feature-flags-panel-title" className="seller-feature-flags-panel__title">
              {category.label}
            </h4>
            {import.meta.env.DEV ? (
              <span className="seller-feature-flags-panel__dev-badge">Visualização DEV</span>
            ) : null}
          </div>
          <p className="seller-feature-flags-panel__desc">{category.description}</p>
        </div>
      </header>

      <div className="seller-feature-flags-panel__body">
        {loading ? <SellerFeatureFlagsPanelSkeleton /> : null}

        {empty ? (
          <p
            className="seller-feature-flags-panel__message seller-feature-flags-panel__message--empty"
            role="status"
          >
            Nenhuma feature flag disponível para este seller no momento.
          </p>
        ) : null}

        {error ? (
          <p
            className="seller-feature-flags-panel__message seller-feature-flags-panel__message--error"
            role="alert"
          >
            Não foi possível exibir as feature flags. Tente voltar e abrir novamente.
          </p>
        ) : null}

        {viewState === "loaded" ? (
          <>
            <section className="seller-feature-flags-panel__summary" aria-label="Resumo das flags">
              <div className="seller-feature-flags-panel__summary-item">
                <span className="seller-feature-flags-panel__summary-label">Flags ativas</span>
                <strong className="seller-feature-flags-panel__summary-value seller-feature-flags-panel__summary-value--active">
                  {enabledCount}
                </strong>
              </div>
              <div className="seller-feature-flags-panel__summary-item">
                <span className="seller-feature-flags-panel__summary-label">Flags inativas</span>
                <strong className="seller-feature-flags-panel__summary-value seller-feature-flags-panel__summary-value--inactive">
                  {disabledCount}
                </strong>
              </div>
            </section>

            <div className="seller-feature-flags-panel__toolbar">
              <label className="seller-feature-flags-panel__search">
                <Search className="seller-feature-flags-panel__search-icon" strokeWidth={2} aria-hidden />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Pesquisar flags..."
                  aria-label="Pesquisar flags"
                  className="seller-feature-flags-panel__search-input"
                />
              </label>

              <div
                className="seller-feature-flags-panel__filters"
                role="tablist"
                aria-label="Filtrar por status"
              >
                {[
                  { id: "all", label: "Todas" },
                  { id: "active", label: "Ativas" },
                  { id: "inactive", label: "Inativas" },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === filter.id}
                    className={`seller-feature-flags-panel__filter${
                      statusFilter === filter.id ? " seller-feature-flags-panel__filter--active" : ""
                    }`}
                    onClick={() => setStatusFilter(/** @type {"all" | "active" | "inactive"} */ (filter.id))}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredFlags.length > 0 ? (
              <ul className="seller-feature-flags-panel__list">
                {filteredFlags.map((flag) => {
                  const statusVariant = resolveFeatureFlagStatusVariant(flag.enabled);

                  return (
                    <li key={flag.key} className="seller-feature-flags-panel__item">
                      <article className="seller-feature-flags-panel__card">
                        <div className="seller-feature-flags-panel__card-main">
                          <div className="seller-feature-flags-panel__card-head">
                            <h5 className="seller-feature-flags-panel__card-title">{flag.label}</h5>
                            <span className={sellerFeatureFlagStatusClassName(statusVariant)}>
                              {resolveFeatureFlagStatusLabel(flag.enabled)}
                            </span>
                          </div>
                          <p className="seller-feature-flags-panel__card-desc">{flag.description}</p>
                        </div>

                        <dl className="seller-feature-flags-panel__meta">
                          <div className="seller-feature-flags-panel__meta-row">
                            <dt>Categoria</dt>
                            <dd>
                              <span className={sellerFeatureFlagCategoryClassName(flag.category)}>
                                {resolveFeatureFlagCategoryLabel(flag.category)}
                              </span>
                            </dd>
                          </div>
                          <div className="seller-feature-flags-panel__meta-row">
                            <dt>Origem</dt>
                            <dd>{resolveFeatureFlagSourceLabel(flag.source)}</dd>
                          </div>
                          <div className="seller-feature-flags-panel__meta-row">
                            <dt>Criada em</dt>
                            <dd>{formatFeatureFlagDate(flag.createdAt)}</dd>
                          </div>
                          {flag.updatedAt ? (
                            <div className="seller-feature-flags-panel__meta-row">
                              <dt>Atualizada em</dt>
                              <dd>{formatFeatureFlagDate(flag.updatedAt)}</dd>
                            </div>
                          ) : null}
                        </dl>

                        <div className="seller-feature-flags-panel__actions">
                          <SellerToolboxEnableFeatureFlagAction flag={flag} />
                          <SellerToolboxDisableFeatureFlagAction flag={flag} />
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="seller-feature-flags-panel__inline-empty" role="status">
                Nenhuma flag encontrada para os filtros atuais.
              </p>
            )}
          </>
        ) : null}
      </div>

      <footer className="seller-feature-flags-panel__foot">
        <span className="seller-feature-flags-panel__seal">
          {import.meta.env.DEV
            ? "Simulação local — operações DEV sem backend"
            : "Somente leitura"}
        </span>
      </footer>
    </section>
  );
}

export default memo(SellerFeatureFlagsPanel);
