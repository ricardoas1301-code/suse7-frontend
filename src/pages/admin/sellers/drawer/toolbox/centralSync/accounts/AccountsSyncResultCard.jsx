import { memo } from "react";
import {
  accountsSyncIngestionHealthClassName,
  accountsSyncSyncStatusClassName,
  accountsSyncTokenStatusClassName,
  formatAccountsSyncDateTime,
  resolveIngestionHealthLabel,
  resolveSyncStatusLabel,
  resolveTokenStatusLabel,
} from "./accountsSyncModel";
import "./AccountsSyncResultCard.css";

/**
 * @param {{ account: import("./accountsSyncModel").AccountsSyncViewModel }} props
 */
function AccountsSyncResultCard({ account }) {
  return (
    <article className="accounts-sync-result-card">
      <header className="accounts-sync-result-card__head">
        <div className="accounts-sync-result-card__head-copy">
          <span className="accounts-sync-result-card__marketplace">{account.marketplaceLabel}</span>
          <h5 className="accounts-sync-result-card__title">{account.accountLabel}</h5>
          <span className="accounts-sync-result-card__nickname">@{account.sellerNickname}</span>
        </div>
        <span className={accountsSyncTokenStatusClassName(account.tokenStatus)}>
          {resolveTokenStatusLabel(account.tokenStatus)}
        </span>
      </header>

      <div className="accounts-sync-result-card__body">
        <dl className="accounts-sync-result-card__grid">
          <div className="accounts-sync-result-card__row">
            <dt>Marketplace</dt>
            <dd>{account.marketplaceLabel}</dd>
          </div>
          <div className="accounts-sync-result-card__row">
            <dt>Nickname seller</dt>
            <dd>{account.sellerNickname}</dd>
          </div>
          <div className="accounts-sync-result-card__row">
            <dt>Status token</dt>
            <dd>
              <span className={accountsSyncTokenStatusClassName(account.tokenStatus)}>
                {resolveTokenStatusLabel(account.tokenStatus)}
              </span>
            </dd>
          </div>
          <div className="accounts-sync-result-card__row">
            <dt>Expiração token</dt>
            <dd>{formatAccountsSyncDateTime(account.tokenExpiresAt)}</dd>
          </div>
          <div className="accounts-sync-result-card__row">
            <dt>Status sync</dt>
            <dd>
              <span className={accountsSyncSyncStatusClassName(account.syncStatus)}>
                {resolveSyncStatusLabel(account.syncStatus)}
              </span>
            </dd>
          </div>
          <div className="accounts-sync-result-card__row">
            <dt>Último sync</dt>
            <dd>{formatAccountsSyncDateTime(account.lastSyncAt)}</dd>
          </div>
          <div className="accounts-sync-result-card__row">
            <dt>Anúncios vinculados</dt>
            <dd>{account.linkedListingsCount}</dd>
          </div>
          <div className="accounts-sync-result-card__row">
            <dt>Produtos vinculados</dt>
            <dd>{account.linkedProductsCount}</dd>
          </div>
          <div className="accounts-sync-result-card__row">
            <dt>Vendas importadas hoje</dt>
            <dd>{account.salesImportedToday}</dd>
          </div>
          <div className="accounts-sync-result-card__row">
            <dt>Saúde da ingestão</dt>
            <dd>
              <span className={accountsSyncIngestionHealthClassName(account.ingestionHealth)}>
                {resolveIngestionHealthLabel(account.ingestionHealth)}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default memo(AccountsSyncResultCard);
