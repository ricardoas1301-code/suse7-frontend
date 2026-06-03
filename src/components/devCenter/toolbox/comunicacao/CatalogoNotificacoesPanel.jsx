import { BookMarked } from "lucide-react";
import {
  CATALOGO_CANAIS,
  CATALOGO_CATEGORIAS,
  CATALOGO_FUTURO,
  CATALOGO_GRUPOS_DOMINIO,
  CATALOGO_MOTOR_STATUS,
  CATALOGO_OBRIGATORIEDADE,
  CATALOGO_PRIORIDADES,
  CATALOGO_TABELAS,
} from "./catalogoNotificacoesModel";
import "./comunicacao.css";

// ======================================================
// CATÁLOGO DE NOTIFICAÇÕES — PAINEL (S5.11)
// ======================================================

export default function CatalogoNotificacoesPanel() {
  return (
    <div className="s7-com__content s7-com__content--prefs" role="tabpanel" aria-label="Catálogo de Notificações">
      <span className="s7-com__content-icon" aria-hidden>
        <BookMarked size={22} />
      </span>
      <h3>Catálogo de Notificações</h3>
      <p>
        Infraestrutura oficial ({CATALOGO_MOTOR_STATUS.fase}) para receber centenas de notificações no
        futuro. Esqueleto apenas — <strong>{CATALOGO_MOTOR_STATUS.notificacoesCadastradas}</strong>{" "}
        notificações novas nesta fase.
      </p>

      <dl className="s7-com__status-grid">
        <div>
          <dt>Modo</dt>
          <dd>{CATALOGO_MOTOR_STATUS.esqueleto ? "Esqueleto" : "Completo"}</dd>
        </div>
        <div>
          <dt>Fonte futura</dt>
          <dd>Backend (categories + event_types)</dd>
        </div>
      </dl>

      <h4>Grupos de domínio (tipos futuros)</h4>
      <ul className="s7-com__futuro">
        {CATALOGO_GRUPOS_DOMINIO.map((g) => (
          <li key={g.code}>
            <strong>{g.label}</strong> — <code>{g.code}</code>
          </li>
        ))}
      </ul>

      <h4>Categorias suportadas</h4>
      <p className="s7-com__inline-codes">
        {CATALOGO_CATEGORIAS.map((c) => (
          <code key={c}>{c}</code>
        ))}
      </p>

      <h4>Prioridades suportadas</h4>
      <ul className="s7-com__futuro">
        {CATALOGO_PRIORIDADES.map((p) => (
          <li key={p}>
            <code>{p}</code>
          </li>
        ))}
      </ul>

      <h4>Canais suportados</h4>
      <ul className="s7-com__futuro">
        {CATALOGO_CANAIS.map((c) => (
          <li key={c.code}>
            <code>{c.code}</code> — {c.status}
          </li>
        ))}
      </ul>

      <h4>Obrigatoriedade</h4>
      <ul className="s7-com__futuro">
        {CATALOGO_OBRIGATORIEDADE.map((o) => (
          <li key={o}>
            <code>{o}</code>
          </li>
        ))}
      </ul>

      <h4>Tabelas oficiais</h4>
      <ul className="s7-com__futuro">
        {CATALOGO_TABELAS.map((t) => (
          <li key={t}>
            <code>{t}</code>
          </li>
        ))}
      </ul>

      <h4>Próximas fases</h4>
      <ul className="s7-com__futuro">
        {CATALOGO_FUTURO.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <span className="s7-com__reserved">S5.11 — Catálogo (somente leitura)</span>
    </div>
  );
}
