import { CalendarCheck, CalendarClock, CalendarX, CalendarMinus } from "lucide-react";
import { DOC_REVISAO_ESTADO, situacaoRevisao } from "./documentacaoVivaModel";

// Badge de situação de revisão documental (S1_1.9B.7).
// Estado calculado localmente a partir da próxima revisão.

const ICONES = {
  [DOC_REVISAO_ESTADO.EM_DIA]: CalendarCheck,
  [DOC_REVISAO_ESTADO.PROXIMA]: CalendarClock,
  [DOC_REVISAO_ESTADO.VENCIDA]: CalendarX,
  [DOC_REVISAO_ESTADO.SEM_DATA]: CalendarMinus,
};

/**
 * @param {{ nextReviewAt: string }} props
 */
export default function DocVivaReviewBadge({ nextReviewAt }) {
  const revisao = situacaoRevisao(nextReviewAt);
  const Icon = ICONES[revisao.estado] ?? CalendarMinus;

  return (
    <span className={`s7-docviva-badge s7-docviva-badge--${revisao.tone}`}>
      <Icon size={12} aria-hidden />
      {revisao.label}
    </span>
  );
}
