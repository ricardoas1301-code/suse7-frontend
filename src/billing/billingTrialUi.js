// ======================================================================
// UI — trial lifecycle (S1.HF.6.9A.11)
// Frontend apenas apresenta o contrato do backend — sem recalcular dias.
// ======================================================================

import { BILLING_TRIAL_STATE } from "./billingTrialConstants.js";

/**
 * @param {Record<string, unknown> | null | undefined} source
 */
function readEntitlement(source) {
  if (!source || typeof source !== "object") return {};
  const nested = source.subscription_entitlement;
  if (nested && typeof nested === "object") return /** @type {Record<string, unknown>} */ (nested);
  return /** @type {Record<string, unknown>} */ (source);
}

/**
 * Apresentação canônica — prioriza `trial_presentation` do backend.
 *
 * @param {Record<string, unknown> | null | undefined} source
 */
export function resolveTrialPresentation(source) {
  const ent = readEntitlement(source);
  const fromBackend = ent.trial_presentation;
  if (fromBackend && typeof fromBackend === "object") {
    const title = String(fromBackend.title ?? "").trim();
    const message = String(fromBackend.message ?? "").trim();
    if (title || message) {
      return {
        title: title || "Seu período de teste",
        message: message || "",
        ctaLabel: String(fromBackend.ctaLabel ?? fromBackend.cta_label ?? "Ver planos"),
        ctaPath: String(fromBackend.ctaPath ?? fromBackend.cta_path ?? "/perfil/assinatura"),
        warningKey: ent.trial_warning_key != null ? String(ent.trial_warning_key) : null,
        lifecycleState:
          ent.trial_lifecycle_state != null ? String(ent.trial_lifecycle_state) : null,
        daysRemaining:
          ent.trial_days_remaining != null && Number.isFinite(Number(ent.trial_days_remaining))
            ? Number(ent.trial_days_remaining)
            : null,
      };
    }
  }

  const warningKey = String(ent.trial_warning_key ?? "").toUpperCase();
  const warningCopies = {
    TRIAL_ENDING_D3: {
      title: "Seu teste gratuito termina em 3 dias",
      message: "Escolha um plano para continuar usando todos os recursos da SUSE7 sem interrupções.",
      ctaLabel: "Ver planos",
    },
    TRIAL_ENDING_D2: {
      title: "Faltam 2 dias para o fim do seu teste",
      message: "Seus dados continuarão salvos. Contrate um plano para manter o acesso completo.",
      ctaLabel: "Ver planos",
    },
    TRIAL_ENDING_D1: {
      title: "Seu teste gratuito termina amanhã",
      message: "Contrate um plano para continuar com acesso completo à SUSE7.",
      ctaLabel: "Escolher plano",
    },
    TRIAL_EXPIRED: {
      title: "Seu período de teste terminou",
      message:
        "Seus dados e seu histórico continuam salvos. Escolha um plano para recuperar o acesso completo.",
      ctaLabel: "Escolher plano",
    },
  };
  if (warningCopies[warningKey]) {
    return {
      ...warningCopies[warningKey],
      ctaPath: "/perfil/assinatura",
      warningKey,
      lifecycleState:
        ent.trial_lifecycle_state != null ? String(ent.trial_lifecycle_state) : null,
      daysRemaining:
        ent.trial_days_remaining != null && Number.isFinite(Number(ent.trial_days_remaining))
          ? Number(ent.trial_days_remaining)
          : null,
    };
  }

  const trialState = String(ent.trial_state ?? "").toUpperCase();
  if (!trialState || trialState === "NOT_STARTED") return null;

  // Fallback legado — sem recalcular dias no browser.
  const copies = {
    [BILLING_TRIAL_STATE.ACTIVE]: {
      title: "Seu período de teste",
      message: "Você está aproveitando 15 dias grátis, sem cartão, da SUSE7.",
      ctaLabel: "Escolher meu plano",
    },
    [BILLING_TRIAL_STATE.ENDING_SOON]: {
      title: "Seu período de teste",
      message: "Seu período gratuito termina em breve. Escolha um plano para continuar com acesso completo.",
      ctaLabel: "Escolher meu plano",
    },
    [BILLING_TRIAL_STATE.ENDS_TODAY]: {
      title: "Seu período de teste",
      message: "Seu período gratuito termina hoje. Contrate um plano para manter o acesso completo.",
      ctaLabel: "Escolher plano",
    },
    [BILLING_TRIAL_STATE.EXPIRED]: {
      title: "Seu período de teste terminou",
      message:
        "Seus dados e seu histórico continuam salvos. Escolha um plano para recuperar o acesso completo.",
      ctaLabel: "Escolher plano",
    },
  };

  const copy = copies[trialState];
  if (!copy) return null;
  return {
    ...copy,
    ctaPath: "/perfil/assinatura",
    warningKey: trialState === BILLING_TRIAL_STATE.EXPIRED ? "TRIAL_EXPIRED" : null,
    lifecycleState:
      ent.trial_lifecycle_state != null ? String(ent.trial_lifecycle_state) : null,
    daysRemaining: null,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} source
 */
export function resolveHardPausedPresentation(source) {
  const ent = readEntitlement(source);
  const syncState = String(ent.sync_state ?? "");
  const accessState = String(ent.access_state ?? "");
  if (syncState !== "HARD_PAUSED" && accessState !== "HARD_PAUSED") return null;

  // Pós-trial NÃO é HARD_PAUSED — não misturar com Baby.
  if (
    String(ent.access_owner ?? "") === "TRIAL_LIFECYCLE_ENGINE" ||
    String(ent.access_restriction_reason ?? "") === "TRIAL_EXPIRED" ||
    String(ent.effective_entitlement ?? "") === "TRIAL_EXPIRED_RESTRICTED"
  ) {
    return null;
  }

  const lastUpdated = ent.last_data_updated_at ?? null;
  const dataGap = ent.data_gap ?? null;

  return {
    title: "Limite do plano Baby atingido",
    message:
      "Você utilizou as 60 vendas disponíveis neste ciclo. A sincronização foi pausada para esta conta. Reative um plano pago ou aguarde o início do próximo ciclo Baby.",
    secondaryMessage: buildDataGapMessage(dataGap),
    staleDataLabel: lastUpdated ? `Dados atualizados até ${formatPtDate(lastUpdated)}` : null,
    ctaLabel: "Ver planos",
    secondaryCtaLabel: "Reativar plano anterior",
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} dataGap
 */
function buildDataGapMessage(dataGap) {
  if (!dataGap || typeof dataGap !== "object") return null;
  const start = dataGap.data_gap_start;
  const end = dataGap.data_gap_end;
  if (!start || !end) return null;
  return `Não houve sincronização entre ${formatPtDate(start)} e ${formatPtDate(end)} porque o limite do plano Baby foi atingido.`;
}

/**
 * @param {unknown} iso
 */
function formatPtDate(iso) {
  const raw = String(iso).slice(0, 10);
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return raw;
  return `${d}/${m}/${y}`;
}
