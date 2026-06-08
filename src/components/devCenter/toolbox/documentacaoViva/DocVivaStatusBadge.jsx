// Badge de status reutilizável da Documentação Viva.
// Recebe rótulo + tom (sucesso | info | alerta | neutro) já resolvidos pelo model.

/**
 * @param {{ label: string; tone: string }} props
 */
export default function DocVivaStatusBadge({ label, tone = "neutro" }) {
  return <span className={`s7-docviva-badge s7-docviva-badge--${tone}`}>{label}</span>;
}
