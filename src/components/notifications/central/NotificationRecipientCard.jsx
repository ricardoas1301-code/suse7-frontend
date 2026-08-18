import { formatWhatsAppBr } from "./recipientContactUi";
import S7StatusBadge from "../../ui/S7StatusBadge";
import "../center/notificationCenterVisualVariants.css";
import "./NotificationRecipientCard.css";

function maskEmail(email) {
  const d = String(email ?? "");
  if (!d.includes("@")) return d || "—";
  const [box, dom] = d.split("@");
  return `${box.slice(0, 2)}•••@${dom}`;
}

function maskWhatsApp(digits) {
  const d = String(digits ?? "").replace(/\D/g, "");
  if (d.length <= 4) return d || "—";
  return `••••${d.slice(-4)}`;
}

function displayEmail(email, showFullContact) {
  const value = String(email ?? "").trim();
  if (!value) return "—";
  return showFullContact ? value : maskEmail(value);
}

function displayWhatsApp(digits, showFullContact) {
  const value = String(digits ?? "").trim();
  if (!value) return "—";
  return showFullContact ? formatWhatsAppBr(value) : maskWhatsApp(value);
}

export default function NotificationRecipientCard({
  group,
  onEdit,
  onDelete,
  busy,
  showFullContact = false,
}) {
  if (!group) return null;

  const email = group.channels?.email;
  const whatsapp = group.channels?.whatsapp;
  const isPrimary = Boolean(group.is_primary);
  const roleLabel = group.role_tag != null && String(group.role_tag).trim() !== "" ? String(group.role_tag) : "—";

  const emailDisplay = displayEmail(email?.destination, showFullContact);
  const whatsappDisplay = displayWhatsApp(whatsapp?.destination, showFullContact);

  return (
    <article
      className={`s7-nrec-card s7-ncenter-card--left-accent-blue ${group.is_active === false ? "s7-nrec-card--inactive" : ""} ${isPrimary ? "s7-nrec-card--primary" : ""}`}
    >
      <header className="s7-nrec-card__head">
        <div className="s7-nrec-card__head-main">
          <div className="s7-nrec-card__title-row">
            <h4>{group.label}</h4>
            {isPrimary ? (
              <span className="s7-nrec-card__primary-badge" title="Destinatário padrão da empresa principal">
                Principal
              </span>
            ) : null}
          </div>
        </div>
        <S7StatusBadge
          label={group.is_active === false ? "Inativo" : "Ativo"}
          tone={group.is_active === false ? "muted" : "success"}
        />
      </header>

      <dl className="s7-nrec-card__facts">
        <div className="s7-nrec-card__fact">
          <dt>Função</dt>
          <dd>{roleLabel}</dd>
        </div>
        <div className="s7-nrec-card__fact s7-nrec-card__fact--email">
          <dt>E-mail</dt>
          <dd className={showFullContact ? "s7-nrec-card__value-full" : undefined}>{emailDisplay}</dd>
        </div>
        <div className="s7-nrec-card__fact">
          <dt>WhatsApp</dt>
          <dd className={showFullContact ? "s7-nrec-card__value-full" : undefined}>{whatsappDisplay}</dd>
        </div>
      </dl>

      <footer className="s7-nrec-card__actions">
        <button type="button" className="s7-nrec-card__btn" disabled={busy} onClick={() => onEdit?.(group)}>
          Editar
        </button>
        {!isPrimary && onDelete ? (
          <button
            type="button"
            className="s7-nrec-card__btn s7-nrec-card__btn--danger"
            disabled={busy}
            onClick={(event) => onDelete?.(group, event)}
          >
            Remover
          </button>
        ) : null}
      </footer>
    </article>
  );
}
