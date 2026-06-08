import { useMemo } from "react";
import {
  Library,
  CheckCircle2,
  RefreshCw,
  FileEdit,
  Archive,
  CalendarClock,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { calcularDashboard } from "./documentacaoVivaSelectors";

// Dashboard documental executivo (S1_1.9B.6).
// Métricas calculadas apenas sobre os dados locais atuais.

/**
 * @param {{ domains: import("./documentacaoVivaModel").DocDomain[] }} props
 */
export default function DocVivaDashboard({ domains }) {
  const metricas = useMemo(() => calcularDashboard(domains), [domains]);

  const cards = [
    { id: "total", label: "Domínios", valor: metricas.total, icon: Library, tone: "info" },
    { id: "homologados", label: "Homologados", valor: metricas.homologados, icon: CheckCircle2, tone: "sucesso" },
    { id: "emRevisao", label: "Em revisão", valor: metricas.emRevisao, icon: RefreshCw, tone: "alerta" },
    { id: "rascunhos", label: "Rascunhos", valor: metricas.rascunhos, icon: FileEdit, tone: "neutro" },
    { id: "arquivados", label: "Arquivados", valor: metricas.arquivados, icon: Archive, tone: "neutro" },
    { id: "revisoes", label: "Revisões pendentes", valor: metricas.revisoesPendentes, icon: CalendarClock, tone: "info" },
    { id: "revisaoVencida", label: "Revisão vencida", valor: metricas.revisaoVencida, icon: AlertTriangle, tone: "alerta" },
    { id: "alteracaoPendente", label: "Pendente homologação", valor: metricas.alteracaoPendente, icon: ShieldAlert, tone: "alerta" },
  ];

  return (
    <div className="s7-docviva-dash" role="group" aria-label="Indicadores documentais">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.id} className={`s7-docviva-dash__card s7-docviva-dash__card--${card.tone}`}>
            <span className="s7-docviva-dash__icon" aria-hidden>
              <Icon size={16} />
            </span>
            <span className="s7-docviva-dash__valor">{card.valor}</span>
            <span className="s7-docviva-dash__label">{card.label}</span>
          </article>
        );
      })}
    </div>
  );
}
