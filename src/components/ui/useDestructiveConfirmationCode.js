import { useCallback, useMemo, useState } from "react";
import {
  codigosConfirmacaoConferem,
  gerarCodigoConfirmacaoDestrutiva,
  normalizarEntradaCodigoConfirmacao,
} from "./destructiveConfirmationCode";

/**
 * Hook para confirmação local por código (ex.: Concorrência).
 * O cancelamento de assinatura usa desafio emitido pelo backend.
 */
export function useDestructiveConfirmationCode() {
  const [challengeCode, setChallengeCode] = useState("");
  const [inputCode, setInputCodeRaw] = useState("");

  const startChallenge = useCallback((externalCode) => {
    setChallengeCode(
      typeof externalCode === "string" && externalCode.length > 0
        ? normalizarEntradaCodigoConfirmacao(externalCode)
        : gerarCodigoConfirmacaoDestrutiva(),
    );
    setInputCodeRaw("");
  }, []);

  const resetChallenge = useCallback(() => {
    setChallengeCode("");
    setInputCodeRaw("");
  }, []);

  const setInputCode = useCallback((value) => {
    setInputCodeRaw(normalizarEntradaCodigoConfirmacao(value));
  }, []);

  const normalizedInput = useMemo(
    () => normalizarEntradaCodigoConfirmacao(inputCode),
    [inputCode],
  );

  const isConfirmed = useMemo(
    () => codigosConfirmacaoConferem(challengeCode, normalizedInput),
    [challengeCode, normalizedInput],
  );

  const validationError = useMemo(() => {
    if (normalizedInput.length !== 4 || isConfirmed) return null;
    return "O código informado não confere.";
  }, [normalizedInput, isConfirmed]);

  return {
    challengeCode,
    inputCode: normalizedInput,
    setInputCode,
    isConfirmed,
    validationError,
    startChallenge,
    resetChallenge,
  };
}
