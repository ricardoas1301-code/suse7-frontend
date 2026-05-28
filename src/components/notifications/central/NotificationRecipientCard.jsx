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

export default function NotificationRecipientCard({ group, onEdit, onToggleActive, onDelete, busy }) {
  if (!group) return null;

  const email = group.channels?.email;
  const whatsapp = group.channels?.whatsapp;

  return (
    <article className={`s7-nrec-card ${group.is_active === false ? "s7-nrec-card--inactive" : ""}`}>
      <header className="s7-nrec-card__head">
        <div>
          <h4>{group.label}</h4>
          {group.role_tag ? <span className="s7-nrec-card__role">{group.role_tag}</span> : null}
        </div>
        <span className={group.is_active === false ? "s7-nrec-card__status-off" : "s7-nrec-card__status-on"}>
          {group.is_active === false ? "Inativo" : "Ativo"}
        </span>
      </header>

      <ul className="s7-nrec-card__channels">
        <li className={email ? "s7-nrec-card__ch s7-nrec-card__ch--on" : "s7-nrec-card__ch"}>
          <span>E-mail</span>
          <em>{email ? maskEmail(email.destination) : "—"}</em>
        </li>
        <li className={whatsapp ? "s7-nrec-card__ch s7-nrec-card__ch--on" : "s7-nrec-card__ch"}>
          <span>WhatsApp</span>
          <em>{whatsapp ? maskWhatsApp(whatsapp.destination) : "—"}</em>
        </li>
      </ul>

      <footer className="s7-nrec-card__actions">
        <button type="button" className="s7-nrec-card__btn" disabled={busy} onClick={() => onEdit?.(group)}>
          Editar
        </button>
        <button
          type="button"
          className="s7-nrec-card__btn s7-nrec-card__btn--ghost"
          disabled={busy}
          onClick={() => onToggleActive?.(group)}
        >
          {group.is_active === false ? "Ativar" : "Desativar"}
        </button>
        {onDelete ? (
          <button
            type="button"
            className="s7-nrec-card__btn s7-nrec-card__btn--danger"
            disabled={busy}
            onClick={() => onDelete?.(group)}
          >
            Remover
          </button>
        ) : null}
      </footer>
    </article>
  );
}
