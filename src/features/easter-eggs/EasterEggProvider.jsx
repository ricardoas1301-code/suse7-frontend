import { useCallback, useMemo, useState } from "react";
import { obterEasterEgg } from "./easterEggRegistry.js";
import { EasterEggContext } from "./EasterEggContext.js";
import EasterEggCodeModal from "./components/EasterEggCodeModal.jsx";
import EasterEggRewardModal from "./components/EasterEggRewardModal.jsx";
import "./EasterEgg.css";

/** @typedef {"idle" | "code" | "reward"} EasterEggFase */

/**
 * Provider isolado — modais via portal; sem impacto no layout das páginas.
 * @param {{ children: import("react").ReactNode }} props
 */
export function EasterEggProvider({ children }) {
  const [eggAtivoId, setEggAtivoId] = useState(/** @type {string | null} */ (null));
  const [fase, setFase] = useState(/** @type {EasterEggFase} */ ("idle"));
  const [erroCodigo, setErroCodigo] = useState("");

  const eggAtivo = useMemo(() => obterEasterEgg(eggAtivoId ?? ""), [eggAtivoId]);

  const fecharTudo = useCallback(() => {
    setFase("idle");
    setEggAtivoId(null);
    setErroCodigo("");
  }, []);

  const abrirModalCodigo = useCallback((eggId) => {
    const egg = obterEasterEgg(eggId);
    if (!egg) return;
    setEggAtivoId(egg.id);
    setFase("code");
    setErroCodigo("");
  }, []);

  const confirmarCodigo = useCallback(
    (codigoDigitado) => {
      if (!eggAtivo) return;
      const codigo = String(codigoDigitado ?? "").trim();
      if (codigo === String(eggAtivo.secretCode)) {
        setErroCodigo("");
        setFase("reward");
        return;
      }
      setErroCodigo("Código inválido");
    },
    [eggAtivo],
  );

  const valor = useMemo(
    () => ({
      abrirModalCodigo,
    }),
    [abrirModalCodigo],
  );

  return (
    <EasterEggContext.Provider value={valor}>
      {children}
      {fase === "code" && eggAtivo ? (
        <EasterEggCodeModal
          erroCodigo={erroCodigo}
          onConfirmar={confirmarCodigo}
          onFechar={fecharTudo}
        />
      ) : null}
      {fase === "reward" && eggAtivo ? (
        <EasterEggRewardModal reward={eggAtivo.reward} onFechar={fecharTudo} />
      ) : null}
    </EasterEggContext.Provider>
  );
}
