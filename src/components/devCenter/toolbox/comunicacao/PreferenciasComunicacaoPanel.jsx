import { Settings2 } from "lucide-react";
import {
  PREFERENCIAS_APIS,
  PREFERENCIAS_FUTURO,
  PREFERENCIAS_MOTOR_STATUS,
  PREFERENCIAS_PIPELINE,
  PREFERENCIAS_TABELAS,
} from "./preferenciasComunicacaoModel";
import "./comunicacao.css";

// ======================================================
// PREFERÊNCIAS DE COMUNICAÇÃO — PAINEL (S5.9)
// Governança e visibilidade — sem CRUD / edição.
// ======================================================

export default function PreferenciasComunicacaoPanel() {
  return (
    <div className="s7-com__content s7-com__content--prefs" role="tabpanel" aria-label="Preferências de Comunicação">
      <span className="s7-com__content-icon" aria-hidden>
        <Settings2 size={22} />
      </span>
      <h3>Preferências de Comunicação</h3>
      <p>
        Camada oficial de governança do Motor Central ({PREFERENCIAS_MOTOR_STATUS.fase}). Reutiliza a
        Central de Notificações existente — uma única fonte de verdade para preferências,
        destinatários e regras por evento.
      </p>

      <dl className="s7-com__status-grid">
        <div>
          <dt>Fonte única</dt>
          <dd>{PREFERENCIAS_MOTOR_STATUS.fonteUnica ? "Sim" : "Não"}</dd>
        </div>
        <div>
          <dt>Motor paralelo</dt>
          <dd>{PREFERENCIAS_MOTOR_STATUS.motorParalelo ? "Sim" : "Não"}</dd>
        </div>
        <div>
          <dt>UX seller</dt>
          <dd>{PREFERENCIAS_MOTOR_STATUS.uxPreservada ? "Preservada" : "Alterada"}</dd>
        </div>
      </dl>

      <h4>Pipeline de entrega</h4>
      <ol className="s7-com__pipeline">
        {PREFERENCIAS_PIPELINE.map((step) => (
          <li key={step.ordem}>
            <strong>{step.camada}</strong> — {step.detalhe}
          </li>
        ))}
      </ol>

      <h4>Tabelas oficiais</h4>
      <ul className="s7-com__futuro">
        {PREFERENCIAS_TABELAS.map((t) => (
          <li key={t.id}>
            <code>{t.nome}</code> — {t.papel}
          </li>
        ))}
      </ul>

      <h4>APIs seller (preservadas)</h4>
      <ul className="s7-com__futuro">
        {PREFERENCIAS_APIS.map((api) => (
          <li key={api}>
            <code>{api}</code>
          </li>
        ))}
      </ul>

      <h4>Próximas fases</h4>
      <ul className="s7-com__futuro">
        {PREFERENCIAS_FUTURO.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <span className="s7-com__reserved">S5.9 — Governança formal (somente leitura)</span>
    </div>
  );
}
