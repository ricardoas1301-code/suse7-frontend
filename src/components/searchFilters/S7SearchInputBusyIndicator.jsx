import "./S7SearchInputBusyIndicator.css";

/** Indicador discreto de busca em andamento ÔÇö lado direito do input, sem bloquear digita├º├úo. */
export default function S7SearchInputBusyIndicator() {
  return (
    <span className="s7-search-input-busy-indicator" role="status" aria-label="Pesquisando">
      <span className="s7-search-input-busy-indicator__spinner" aria-hidden="true" />
    </span>
  );
}
