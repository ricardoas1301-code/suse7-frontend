import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { normalizarAcaoConfirmacaoOperacional } from "./devCenterOperationalConfirmModel";
import { logDevCenterOperacional } from "./devCenterOperationalLog";

/** @typedef {import("./devCenterOperationalConfirmModel").DevCenterAcaoConfirmacaoPendente} DevCenterAcaoConfirmacaoPendente */

/**
 * @typedef {{
 *   acaoPendente: DevCenterAcaoConfirmacaoPendente | null;
 *   confirmacaoAberta: boolean;
 *   abrirConfirmacao: (acao: Partial<DevCenterAcaoConfirmacaoPendente>) => boolean;
 *   fecharConfirmacao: () => void;
 *   confirmarAcao: () => DevCenterAcaoConfirmacaoPendente | null;
 * }} DevCenterOperationalConfirmValue
 */

/** @type {import("react").Context<DevCenterOperationalConfirmValue | null>} */
const DevCenterOperationalConfirmContext = createContext(null);

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function DevCenterOperationalConfirmProvider({ children }) {
  const [acaoPendente, setAcaoPendente] = useState(
    /** @type {DevCenterAcaoConfirmacaoPendente | null} */ (null),
  );

  const confirmacaoAberta = acaoPendente != null;

  const fecharConfirmacao = useCallback(() => {
    if (acaoPendente) {
      logDevCenterOperacional("confirmacao_cancelada", { id: acaoPendente.id });
    }
    setAcaoPendente(null);
  }, [acaoPendente]);

  const abrirConfirmacao = useCallback((acao) => {
    const normalizada = normalizarAcaoConfirmacaoOperacional(acao);
    if (!normalizada) return false;

    setAcaoPendente(normalizada);
    logDevCenterOperacional("confirmacao_aberta", {
      id: normalizada.id,
      nivelRisco: normalizada.nivelRisco,
    });
    return true;
  }, []);

  const confirmarAcao = useCallback(() => {
    if (!acaoPendente) return null;

    logDevCenterOperacional("confirmacao_confirmada", {
      id: acaoPendente.id,
      nivelRisco: acaoPendente.nivelRisco,
    });

    const confirmada = acaoPendente;
    setAcaoPendente(null);
    return confirmada;
  }, [acaoPendente]);

  const value = useMemo(
    () => ({
      acaoPendente,
      confirmacaoAberta,
      abrirConfirmacao,
      fecharConfirmacao,
      confirmarAcao,
    }),
    [acaoPendente, confirmacaoAberta, abrirConfirmacao, fecharConfirmacao, confirmarAcao],
  );

  return (
    <DevCenterOperationalConfirmContext.Provider value={value}>
      {children}
    </DevCenterOperationalConfirmContext.Provider>
  );
}

export function useDevCenterOperationalConfirm() {
  const contexto = useContext(DevCenterOperationalConfirmContext);
  if (!contexto) {
    throw new Error(
      "useDevCenterOperationalConfirm deve ser usado dentro de DevCenterOperationalConfirmProvider",
    );
  }
  return contexto;
}

/** @returns {DevCenterOperationalConfirmValue | null} */
export function useDevCenterOperationalConfirmOpcional() {
  return useContext(DevCenterOperationalConfirmContext);
}
