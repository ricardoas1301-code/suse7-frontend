// ======================================================
// ADMIN GLOBAL — CONFIRMAÇÃO DUPLA REUTILIZÁVEL (S1_5.5)
// ------------------------------------------------------
// Fluxo: Confirmar → Confirmar novamente → Executar.
// Componente compartilhado: nenhuma tela reimplementa a lógica.
//
// Uso:
//   const { pedirConfirmacaoDupla } = useAdminConfirm();
//   pedirConfirmacaoDupla({ titulo, descricao, critico, onConfirm });
// ======================================================

import { useCallback, useMemo, useRef, useState } from "react";
import { ShieldAlert, X } from "lucide-react";
import { S7Button } from "../../../../ui";
import { AdminConfirmContext } from "./adminConfirmContext";
import "./adminConfirm.css";

const ESTADO_INICIAL = { aberto: false, etapa: 1, executando: false, config: null };

export function AdminConfirmProvider({ children }) {
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const onConfirmRef = useRef(null);

  const pedirConfirmacaoDupla = useCallback((config) => {
    onConfirmRef.current = typeof config?.onConfirm === "function" ? config.onConfirm : null;
    setEstado({ aberto: true, etapa: 1, executando: false, config });
  }, []);

  const fechar = useCallback(() => {
    onConfirmRef.current = null;
    setEstado(ESTADO_INICIAL);
  }, []);

  const confirmar = useCallback(async () => {
    if (estado.etapa === 1) {
      setEstado((s) => ({ ...s, etapa: 2 }));
      return;
    }
    // etapa 2 → executa
    setEstado((s) => ({ ...s, executando: true }));
    try {
      if (onConfirmRef.current) await onConfirmRef.current();
    } finally {
      onConfirmRef.current = null;
      setEstado(ESTADO_INICIAL);
    }
  }, [estado.etapa]);

  const value = useMemo(() => ({ pedirConfirmacaoDupla }), [pedirConfirmacaoDupla]);

  const cfg = estado.config;
  const critico = Boolean(cfg?.critico);

  return (
    <AdminConfirmContext.Provider value={value}>
      {children}
      {estado.aberto && cfg ? (
        <div className="s7-admin-confirm" data-critico={critico ? "1" : "0"}>
          <div className="s7-admin-confirm__backdrop" aria-hidden onClick={estado.executando ? undefined : fechar} />
          <div
            className="s7-admin-confirm__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="s7-admin-confirm-title"
          >
            <header className="s7-admin-confirm__head">
              <span className={`s7-admin-confirm__tag ${critico ? "s7-admin-confirm__tag--critico" : ""}`}>
                <ShieldAlert size={13} aria-hidden /> {critico ? "Operação crítica" : "Confirmação"}
                {estado.etapa === 2 ? " · etapa 2 de 2" : " · etapa 1 de 2"}
              </span>
              <h4 id="s7-admin-confirm-title" className="s7-admin-confirm__title">
                {cfg.titulo}
              </h4>
            </header>

            <p className="s7-admin-confirm__desc">{cfg.descricao}</p>

            {estado.etapa === 2 ? (
              <p className="s7-admin-confirm__aviso" role="note">
                Confirme novamente para executar. Esta ação não será desfeita automaticamente.
              </p>
            ) : null}

            <footer className="s7-admin-confirm__actions">
              <S7Button type="button" variant="secondary" size="sm" icon={<X size={14} />} onClick={fechar} disabled={estado.executando}>
                Cancelar
              </S7Button>
              <S7Button
                type="button"
                variant={critico ? "warning" : "primary"}
                size="sm"
                onClick={confirmar}
                disabled={estado.executando}
              >
                {estado.executando
                  ? "Executando…"
                  : estado.etapa === 1
                    ? cfg.rotuloConfirmar || "Confirmar"
                    : "Confirmar novamente"}
              </S7Button>
            </footer>
          </div>
        </div>
      ) : null}
    </AdminConfirmContext.Provider>
  );
}
