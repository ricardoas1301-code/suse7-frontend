import { memo } from "react";
import { S7Button } from "../../components/ui";
import S7Icon from "../../components/ui/S7Icon";
import BillingFinanceEmptyState from "./BillingFinanceEmptyState";
import "./BillingNotificationList.css";

/**
 * @param {{
 *   notifications: NonNullable<ReturnType<import("../billingFinancialExperienceUi").normalizeBillingNotification>>[];
 *   loading?: boolean;
 *   error?: string;
 *   onRetry?: () => void;
 * }} props
 */
function BillingNotificationList({ notifications, loading = false, error = "", onRetry }) {
  if (loading) {
    return (
      <section className="s7-billing-notifications s7-billing-notifications--loading" aria-busy="true">
        <header className="s7-billing-notifications__header">
          <h2>Notificações recentes</h2>
        </header>
        <div className="s7-billing-notifications__skeleton" />
        <div className="s7-billing-notifications__skeleton s7-billing-notifications__skeleton--short" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="s7-billing-notifications s7-billing-notifications--error" aria-live="polite">
        <header className="s7-billing-notifications__header">
          <h2>Notificações recentes</h2>
        </header>
        <p className="s7-billing-notifications__error">{error}</p>
        {onRetry ? (
          <S7Button variant="secondary" size="sm" onClick={onRetry}>
            Tentar novamente
          </S7Button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="s7-billing-notifications" aria-label="Notificações recentes">
      <header className="s7-billing-notifications__header">
        <h2>Notificações recentes</h2>
        <p>Alertas de pagamento, renovação e status da assinatura.</p>
      </header>

      {notifications.length === 0 ? (
        <BillingFinanceEmptyState
          iconName="empty"
          title="Nenhuma notificação financeira recente"
          description="Quando houver confirmações, falhas ou alertas de renovação, você verá aqui."
        />
      ) : (
        <ul className="s7-billing-notifications__list">
          {notifications.map((item, index) => (
            <li
              key={item.id}
              className="s7-billing-notifications__item"
              style={{ "--s7-notif-stagger": `${Math.min(index, 10) * 35}ms` }}
            >
              <div className={`s7-billing-notifications__icon s7-billing-notifications__icon--${item.icon}`}>
                <S7Icon name={item.s7IconName} size={16} strokeWidth={2} />
              </div>
              <div className="s7-billing-notifications__body">
                <div className="s7-billing-notifications__meta-row">
                  <span className="s7-billing-notifications__category">{item.category}</span>
                  <time className="s7-billing-notifications__time">{item.createdAtLabel}</time>
                </div>
                <h3 className="s7-billing-notifications__title">{item.title}</h3>
                {item.body ? <p className="s7-billing-notifications__text">{item.body}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default memo(BillingNotificationList);
