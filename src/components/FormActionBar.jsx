// ======================================================================
// COMPONENTE: FormActionBar
// Objetivo:
// - Barra de ações alinhada ao formulário (Salvar / Marcar como pronto)
// - Apenas layout: recebe children (botões) e alinha à direita por padrão
// ======================================================================

import "./FormActionBar.css";

export default function FormActionBar({ children }) {
  return (
    <div className="form-action-bar form-action-bar--right">
      <div className="form-action-bar-inner">
        {children}
      </div>
    </div>
  );
}

