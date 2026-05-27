import { memo, useEffect, useMemo, useRef } from "react";
import { User } from "lucide-react";
import { logSellerToolbox } from "../../sellerToolboxDevLog";
import { useSellerToolbox } from "./SellerToolboxContext";
import {
  buildSellerToolboxAccountModel,
  formatAccountField,
  resolveSellerToolboxAccountPanelState,
  sellerToolboxAccountStatusClassName,
} from "./sellerToolboxAccountModel";
import "./SellerToolboxAccountPanel.css";

function SellerToolboxAccountPanelSkeleton() {
  return (
    <div className="seller-toolbox-account-panel__skeleton" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="seller-toolbox-account-panel__skeleton-section">
          <span className="seller-toolbox-account-panel__skeleton-line seller-toolbox-account-panel__skeleton-line--title" />
          <span className="seller-toolbox-account-panel__skeleton-line" />
          <span className="seller-toolbox-account-panel__skeleton-line seller-toolbox-account-panel__skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}

/**
 * @param {{ category: import("./sellerToolboxCategoriesModel").SellerToolboxCategory }} props
 */
function SellerToolboxAccountPanel({ category }) {
  const { sellerId, listPreview, detail, drawerState, toolboxState, isReady } = useSellerToolbox();
  const loggedOpenRef = useRef(false);
  const loggedEmptyRef = useRef(false);

  const panelState = useMemo(
    () =>
      resolveSellerToolboxAccountPanelState({
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
    () => buildSellerToolboxAccountModel({ sellerId, listPreview, detail }),
    [sellerId, listPreview, detail],
  );

  useEffect(() => {
    if (loggedOpenRef.current) return;
    loggedOpenRef.current = true;
    logSellerToolbox("account_panel_open", { sellerId, categoryId: category.id });
  }, [sellerId, category.id]);

  useEffect(() => {
    if (panelState !== "empty" || loggedEmptyRef.current) return;
    loggedEmptyRef.current = true;
    logSellerToolbox("account_panel_empty", { sellerId });
  }, [panelState, sellerId]);

  return (
    <section
      className="seller-toolbox-account-panel"
      data-category-id={category.id}
      data-panel-state={panelState}
      data-seller-id={sellerId ?? undefined}
      aria-labelledby="seller-toolbox-account-title"
    >
      <header className="seller-toolbox-account-panel__head">
        <div className="seller-toolbox-account-panel__icon-wrap" aria-hidden>
          <User className="seller-toolbox-account-panel__icon" strokeWidth={2} />
        </div>
        <div className="seller-toolbox-account-panel__titles">
          <h4 id="seller-toolbox-account-title" className="seller-toolbox-account-panel__title">
            {category.label}
          </h4>
          <p className="seller-toolbox-account-panel__desc">{category.description}</p>
        </div>
      </header>

      <div className="seller-toolbox-account-panel__body">
        {panelState === "loading" ? <SellerToolboxAccountPanelSkeleton /> : null}

        {panelState === "empty" ? (
          <p className="seller-toolbox-account-panel__message seller-toolbox-account-panel__message--empty" role="status">
            Nenhum dado de conta disponível para este seller no momento.
          </p>
        ) : null}

        {panelState === "error" ? (
          <p className="seller-toolbox-account-panel__message seller-toolbox-account-panel__message--error" role="alert">
            Não foi possível exibir os dados de conta. Tente voltar e abrir novamente.
          </p>
        ) : null}

        {panelState === "loaded" ? (
          <div className="seller-toolbox-account-panel__sections">
            <section className="seller-toolbox-account-section">
              <header className="seller-toolbox-account-section__head">
                <h5 className="seller-toolbox-account-section__title">Identidade</h5>
              </header>
              <div className="seller-toolbox-account-section__body">
                <div className="seller-toolbox-account-identity">
                  {model.photoUrl ? (
                    <img
                      src={model.photoUrl}
                      alt=""
                      className="seller-toolbox-account-identity__avatar"
                    />
                  ) : (
                    <span className="seller-toolbox-account-identity__avatar seller-toolbox-account-identity__avatar--placeholder">
                      {model.initial}
                    </span>
                  )}
                  <div className="seller-toolbox-account-identity__copy">
                    <p className="seller-toolbox-account-identity__name">
                      {formatAccountField(model.nome, "—")}
                    </p>
                    <p className="seller-toolbox-account-identity__id">
                      ID {model.sellerIdSummary}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="seller-toolbox-account-section">
              <header className="seller-toolbox-account-section__head">
                <h5 className="seller-toolbox-account-section__title">Contato</h5>
              </header>
              <div className="seller-toolbox-account-section__body">
                <dl className="seller-toolbox-account-kv">
                  <div className="seller-toolbox-account-kv__row">
                    <dt>E-mail</dt>
                    <dd>{formatAccountField(model.email)}</dd>
                  </div>
                  <div className="seller-toolbox-account-kv__row">
                    <dt>Telefone</dt>
                    <dd>{formatAccountField(model.telefone)}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="seller-toolbox-account-section">
              <header className="seller-toolbox-account-section__head">
                <h5 className="seller-toolbox-account-section__title">Status</h5>
              </header>
              <div className="seller-toolbox-account-section__body">
                <dl className="seller-toolbox-account-kv">
                  <div className="seller-toolbox-account-kv__row">
                    <dt>Status da conta</dt>
                    <dd>
                      {model.accountStatus ? (
                        <span className={sellerToolboxAccountStatusClassName(model.accountStatus)}>
                          {model.accountStatusLabel}
                        </span>
                      ) : (
                        formatAccountField(null)
                      )}
                    </dd>
                  </div>
                  <div className="seller-toolbox-account-kv__row">
                    <dt>Data de cadastro</dt>
                    <dd>{model.createdAtLabel}</dd>
                  </div>
                  <div className="seller-toolbox-account-kv__row">
                    <dt>Plano atual</dt>
                    <dd>{formatAccountField(model.planLabel === "—" ? null : model.planLabel)}</dd>
                  </div>
                </dl>
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <footer className="seller-toolbox-account-panel__foot">
        <span className="seller-toolbox-account-panel__seal">Somente leitura</span>
      </footer>
    </section>
  );
}

export default memo(SellerToolboxAccountPanel);
