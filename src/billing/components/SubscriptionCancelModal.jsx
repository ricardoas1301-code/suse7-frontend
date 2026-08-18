import { useCallback, useEffect, useMemo, useState } from "react";
import { S7Button } from "../../components/ui";
import S7DestructiveConfirmationChallenge from "../../components/ui/S7DestructiveConfirmationChallenge";
import { codigosConfirmacaoConferem, normalizarEntradaCodigoConfirmacao } from "../../components/ui/destructiveConfirmationCode";
import {
  createSubscriptionCancelChallenge,
  requestSubscriptionCancellation,
} from "../services/billingApi";
import "../../components/CompleteProfileModal.css";
import "../billing.css";
import "./SubscriptionCancelModal.css";

const CHALLENGE_ERROR_MESSAGES = {
  CONFIRMATION_CODE_INVALID: "O código informado não confere.",
  CONFIRMATION_CHALLENGE_EXPIRED: "O código expirou. Um novo código foi gerado.",
  CONFIRMATION_CHALLENGE_REPLAYED: "Este código já foi utilizado. Gere uma nova confirmação.",
  CONFIRMATION_CHALLENGE_INVALID: "Não foi possível validar a confirmação. Feche e abra o modal novamente.",
  AUTH_SESSION_INVALID: "Sua sessão expirou. Entre novamente para continuar.",
  SUBSCRIPTION_NOT_FOUND: "Não foi possível localizar esta assinatura.",
  SUBSCRIPTION_FORBIDDEN: "Você não possui permissão para cancelar esta assinatura.",
  CANCEL_ALREADY_REQUESTED: "O cancelamento desta assinatura já está agendado.",
  SERVICE_UNAVAILABLE: "Não foi possível concluir o cancelamento agora. Tente novamente em instantes.",
};

function resolveChallengeErrorMessage(code, fallback) {
  if (code && CHALLENGE_ERROR_MESSAGES[code]) {
    return CHALLENGE_ERROR_MESSAGES[code];
  }
  return fallback || CHALLENGE_ERROR_MESSAGES.SERVICE_UNAVAILABLE;
}

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   accessEndsLabel: string;
 *   subscriptionId?: string | null;
 *   onCancelled?: () => void | Promise<void>;
 * }} props
 */
export default function SubscriptionCancelModal({
  open,
  onClose,
  accessEndsLabel,
  subscriptionId,
  onCancelled,
}) {
  const [challengeId, setChallengeId] = useState("");
  const [challengeCode, setChallengeCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const resetState = useCallback(() => {
    setChallengeId("");
    setChallengeCode("");
    setInputCode("");
    setChallengeLoading(false);
    setCancelLoading(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  const loadChallenge = useCallback(async () => {
    setChallengeLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setInputCode("");

    const res = await createSubscriptionCancelChallenge({
      subscription_id: subscriptionId ?? undefined,
    });
    setChallengeLoading(false);

    if (!res.ok) {
      const code = res.data?.code ?? res.error;
      setChallengeId("");
      setChallengeCode("");
      setErrorMessage(resolveChallengeErrorMessage(code, res.error || res.data?.message));
      return false;
    }

    setChallengeId(String(res.data?.challenge_id ?? ""));
    setChallengeCode(String(res.data?.confirmation_code ?? ""));
    return true;
  }, [subscriptionId]);

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }
    void loadChallenge();
  }, [open, loadChallenge, resetState]);

  function handleClose() {
    if (cancelLoading || challengeLoading) return;
    resetState();
    onClose();
  }

  const isConfirmed = useMemo(
    () => codigosConfirmacaoConferem(challengeCode, inputCode),
    [challengeCode, inputCode],
  );

  const localValidationError = useMemo(() => {
    if (inputCode.length !== 4 || isConfirmed || cancelLoading) return null;
    return "O código informado não confere.";
  }, [inputCode, isConfirmed, cancelLoading]);

  useEffect(() => {
    if (isConfirmed) {
      setSuccessMessage("Código confirmado.");
      setErrorMessage(null);
      return;
    }
    setSuccessMessage(null);
  }, [isConfirmed]);

  async function handleConfirmCancellation() {
    if (cancelLoading || challengeLoading || !isConfirmed || !challengeId) return;

    setCancelLoading(true);
    setErrorMessage(null);

    const res = await requestSubscriptionCancellation({
      subscription_id: subscriptionId ?? undefined,
      challenge_id: challengeId,
      confirmation_code: inputCode,
    });

    if (!res.ok) {
      const code = res.data?.code ?? res.error;
      setCancelLoading(false);
      setErrorMessage(resolveChallengeErrorMessage(code, res.error || res.data?.message));
      setSuccessMessage(null);

      if (code === "CONFIRMATION_CHALLENGE_EXPIRED" || code === "CONFIRMATION_CHALLENGE_REPLAYED") {
        await loadChallenge();
      }
      return;
    }

    resetState();
    onClose();
    await onCancelled?.();
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (isConfirmed && !cancelLoading && !challengeLoading) {
        void handleConfirmCancellation();
      }
    }
  }

  if (!open) return null;

  const canCancel = isConfirmed && Boolean(challengeId) && !cancelLoading && !challengeLoading;

  return (
    <div className="profile-modal-backdrop" role="presentation" onClick={handleClose}>
      <div
        className="profile-modal s7-billing-cancel-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s7-billing-cancel-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="s7-billing-cancel-modal-title">Cancelar assinatura?</h3>
        <p>
          Seu plano continuará ativo até o fim do ciclo atual. Depois disso, sua conta voltará para o plano Baby.
        </p>
        <p className="s7-billing-cancel-modal__access-until">Acesso garantido até {accessEndsLabel}.</p>

        <S7DestructiveConfirmationChallenge
          instruction="Digite o código de confirmação para habilitar o cancelamento:"
          code={challengeLoading ? "----" : challengeCode}
          inputValue={inputCode}
          onInputChange={(value) => setInputCode(normalizarEntradaCodigoConfirmacao(value))}
          inputDisabled={cancelLoading || challengeLoading || !challengeCode}
          error={errorMessage || localValidationError}
          successMessage={successMessage}
          onInputKeyDown={handleInputKeyDown}
        />

        <div className="s7-billing-cancel-modal__actions">
          <S7Button variant="primary" disabled={!canCancel} loading={cancelLoading} onClick={handleConfirmCancellation}>
            {cancelLoading ? "Agendando cancelamento…" : "Cancelar assinatura"}
          </S7Button>
        </div>
      </div>
    </div>
  );
}
