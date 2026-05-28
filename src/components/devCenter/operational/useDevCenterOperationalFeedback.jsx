import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { normalizarFeedbackOperacional } from "./devCenterOperationalFeedbackModel";
import { logDevCenterOperacional } from "./devCenterOperationalLog";

/** @typedef {import("./devCenterOperationalFeedbackModel").DevCenterFeedbackOperacional} DevCenterFeedbackOperacional */

/**
 * @typedef {{
 *   feedback: DevCenterFeedbackOperacional | null;
 *   feedbackVisivel: boolean;
 *   exibirFeedback: (input: Partial<DevCenterFeedbackOperacional>) => boolean;
 *   limparFeedback: () => void;
 * }} DevCenterOperationalFeedbackValue
 */

/** @type {import("react").Context<DevCenterOperationalFeedbackValue | null>} */
const DevCenterOperationalFeedbackContext = createContext(null);

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function DevCenterOperationalFeedbackProvider({ children }) {
  const [feedback, setFeedback] = useState(/** @type {DevCenterFeedbackOperacional | null} */ (null));

  const feedbackVisivel = feedback != null;

  const limparFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  const exibirFeedback = useCallback((input) => {
    const normalizado = normalizarFeedbackOperacional(input);
    if (!normalizado) return false;

    setFeedback(normalizado);
    logDevCenterOperacional("feedback_exibido", { tipo: normalizado.tipo, titulo: normalizado.titulo });
    return true;
  }, []);

  const value = useMemo(
    () => ({
      feedback,
      feedbackVisivel,
      exibirFeedback,
      limparFeedback,
    }),
    [feedback, feedbackVisivel, exibirFeedback, limparFeedback],
  );

  return (
    <DevCenterOperationalFeedbackContext.Provider value={value}>
      {children}
    </DevCenterOperationalFeedbackContext.Provider>
  );
}

export function useDevCenterOperationalFeedback() {
  const contexto = useContext(DevCenterOperationalFeedbackContext);
  if (!contexto) {
    throw new Error(
      "useDevCenterOperationalFeedback deve ser usado dentro de DevCenterOperationalFeedbackProvider",
    );
  }
  return contexto;
}

/** @returns {DevCenterOperationalFeedbackValue | null} */
export function useDevCenterOperationalFeedbackOpcional() {
  return useContext(DevCenterOperationalFeedbackContext);
}
