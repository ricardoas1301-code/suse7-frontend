// ======================================================================
// Blocos do resumo executivo — Relatório de Concorrência.
// Cards (topo) + linhas operacionais (base), alinhado ao Relatório de Vendas.
// ======================================================================

import {
  AlertTriangle,
  CheckCircle,
  Eye,
  PauseCircle,
  Target,
  Trophy,
} from "lucide-react";

/**
 * @param {{
 *   produtosAnalisados: { label: string };
 *   comConcorrentes: { label: string };
 *   semConcorrentes: { label: string };
 *   concorrenciaCompleta: { label: string };
 *   concorrenciaIncompleta: { label: string };
 *   comConcorrentesInativos: { label: string };
 *   totalConcorrentesMonitorados: { label: string };
 * }} resumoExecutivo
 */
export function buildConcorrenciaExecutivoBlocos(resumoExecutivo) {
  const cards = [
    {
      id: "com",
      label: "Com concorrentes",
      value: resumoExecutivo.comConcorrentes.label,
      icon: Target,
      accent: "green",
    },
    {
      id: "total",
      label: "Concorrentes monitorados",
      value: resumoExecutivo.totalConcorrentesMonitorados.label,
      icon: Eye,
      accent: "blue",
    },
    {
      id: "inativos",
      label: "Concorrentes inativos",
      value: resumoExecutivo.comConcorrentesInativos.label,
      icon: PauseCircle,
      accent: "gray",
    },
  ];

  const operacionais = [
    {
      id: "completa",
      label: "Concorrência completa",
      value: resumoExecutivo.concorrenciaCompleta.label,
      icon: CheckCircle,
      accent: "green",
    },
    {
      id: "sem",
      label: "Sem concorrentes",
      value: resumoExecutivo.semConcorrentes.label,
      icon: Trophy,
      accent: "gold",
    },
    {
      id: "incompleta",
      label: "Concorrência incompleta",
      value: resumoExecutivo.concorrenciaIncompleta.label,
      icon: AlertTriangle,
      accent: "orange",
    },
  ];

  return { cards, operacionais };
}

/** Cores para o card compartilhável (PDF / imagem). */
export const CONCORRENCIA_EXEC_ACCENT_COLOR = {
  green: "#059669",
  gold: "#d97706",
  orange: "#f97316",
  gray: "#64748b",
  blue: "#2563eb",
};

/**
 * @param {{
 *   produtosAnalisados: { label: string };
 *   comConcorrentes: { label: string };
 *   semConcorrentes: { label: string };
 *   concorrenciaCompleta: { label: string };
 *   concorrenciaIncompleta: { label: string };
 *   comConcorrentesInativos: { label: string };
 *   totalConcorrentesMonitorados: { label: string };
 * }} resumoExecutivo
 */
export function buildConcorrenciaShareExecBlocos(resumoExecutivo) {
  const { cards, operacionais } = buildConcorrenciaExecutivoBlocos(resumoExecutivo);

  return {
    kpis: cards.map((card) => ({
      label: card.label,
      value: card.value,
      color: CONCORRENCIA_EXEC_ACCENT_COLOR[card.accent] ?? CONCORRENCIA_EXEC_ACCENT_COLOR.gray,
    })),
    operacionais: operacionais.map((op) => ({
      label: op.label,
      value: op.value,
      color: CONCORRENCIA_EXEC_ACCENT_COLOR[op.accent] ?? CONCORRENCIA_EXEC_ACCENT_COLOR.gray,
      icon: op.icon,
    })),
  };
}
