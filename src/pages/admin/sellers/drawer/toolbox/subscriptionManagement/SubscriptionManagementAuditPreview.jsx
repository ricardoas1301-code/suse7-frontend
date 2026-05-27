import { memo } from "react";
import { buildSubscriptionManagementAuditSummary } from "./subscriptionManagementAuditModel";
import "./SubscriptionManagementAuditPreview.css";

/**
 * @param {{ auditLogs: import("./subscriptionManagementAuditModel").SubscriptionManagementAuditLogEntry[] }} props
 */
function SubscriptionManagementAuditPreview({ auditLogs }) {
  const summary = buildSubscriptionManagementAuditSummary(auditLogs);

  if (!summary.totalLogs) {
    return (
      <section className="subscription-management-audit-preview" aria-label="Auditoria administrativa">
        <header className="subscription-management-audit-preview__head">
          <h5 className="subscription-management-audit-preview__title">Auditoria administrativa</h5>
          <span className="subscription-management-audit-preview__immutable">Imutável</span>
        </header>
        <p className="subscription-management-audit-preview__empty" role="status">
          Nenhum registro de auditoria ainda. Operações bem-sucedidas geram logs imutáveis locais.
        </p>
      </section>
    );
  }

  return (
    <section className="subscription-management-audit-preview" aria-label="Auditoria administrativa">
      <header className="subscription-management-audit-preview__head">
        <h5 className="subscription-management-audit-preview__title">Auditoria administrativa</h5>
        <span className="subscription-management-audit-preview__immutable">Imutável</span>
      </header>

      <dl className="subscription-management-audit-preview__grid">
        <div className="subscription-management-audit-preview__item">
          <dt>Total logs</dt>
          <dd>{summary.totalLogs}</dd>
        </div>
        <div className="subscription-management-audit-preview__item">
          <dt>Último admin</dt>
          <dd>{summary.lastAdmin ?? "—"}</dd>
        </div>
        <div className="subscription-management-audit-preview__item subscription-management-audit-preview__item--wide">
          <dt>Último log</dt>
          <dd>
            <code className="subscription-management-audit-preview__audit-id">
              {summary.lastLog?.auditId ?? "—"}
            </code>
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default memo(SubscriptionManagementAuditPreview);
