import { Activity } from "lucide-react";
import {
  OBSERVABILIDADE_COMPONENTES,
  OBSERVABILIDADE_FUTURO,
  OBSERVABILIDADE_MOTOR_STATUS,
  OBSERVABILIDADE_PIPELINE,
  OBSERVABILIDADE_TABELAS,
  OBSERVABILIDADE_WORKERS,
} from "./observabilidadeComunicacaoModel";
import "./comunicacao.css";

// ======================================================
// OBSERVABILIDADE — PAINEL (S5.10)
// ======================================================

export default function ObservabilidadeComunicacaoPanel() {
  return (
    <div className="s7-com__content s7-com__content--prefs" role="tabpanel" aria-label="Observabilidade">
      <span className="s7-com__content-icon" aria-hidden>
        <Activity size={22} />
      </span>
      <h3>Observabilidade</h3>
      <p>
        Camada oficial de rastreio do Motor Central ({OBSERVABILIDADE_MOTOR_STATUS.fase}). Reutiliza{" "}
        <code>s7_notification_delivery_logs</code>, dispatches e events — sem segundo sistema de logs.
      </p>

      <dl className="s7-com__status-grid">
        <div>
          <dt>Fonte única</dt>
          <dd>{OBSERVABILIDADE_MOTOR_STATUS.fonteUnica ? "Sim" : "Não"}</dd>
        </div>
        <div>
          <dt>Logs paralelos</dt>
          <dd>{OBSERVABILIDADE_MOTOR_STATUS.sistemaLogsParalelo ? "Sim" : "Não"}</dd>
        </div>
        <div>
          <dt>UX seller</dt>
          <dd>{OBSERVABILIDADE_MOTOR_STATUS.uxSellerPreservada ? "Preservada" : "Alterada"}</dd>
        </div>
      </dl>

      <h4>Pipeline oficial</h4>
      <ol className="s7-com__pipeline">
        {OBSERVABILIDADE_PIPELINE.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <h4>Componentes monitorados</h4>
      <ul className="s7-com__futuro">
        {OBSERVABILIDADE_COMPONENTES.map((c) => (
          <li key={c.id}>
            <strong>{c.label}</strong> — <code>{c.log}</code>
          </li>
        ))}
      </ul>

      <h4>Tabelas oficiais</h4>
      <ul className="s7-com__futuro">
        {OBSERVABILIDADE_TABELAS.map((t) => (
          <li key={t.nome}>
            <code>{t.nome}</code> — {t.papel}
          </li>
        ))}
      </ul>

      <h4>Workers</h4>
      <ul className="s7-com__futuro">
        {OBSERVABILIDADE_WORKERS.map((w) => (
          <li key={w}>
            <code>{w}</code>
          </li>
        ))}
      </ul>

      <h4>Próximas fases</h4>
      <ul className="s7-com__futuro">
        {OBSERVABILIDADE_FUTURO.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <span className="s7-com__reserved">S5.10 — Observabilidade formal (somente leitura)</span>
    </div>
  );
}
