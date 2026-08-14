import { CONFIGURATION_MILESTONE_IDS } from "./configurationOnboardingTypes.js";

/** Ordem canônica de apresentação (UI only). */
export const CONFIGURATION_MILESTONE_PRESENTATION_ORDER = [
  CONFIGURATION_MILESTONE_IDS.COMPANY_DATA,
  CONFIGURATION_MILESTONE_IDS.LEGAL_ACCEPTANCE,
  CONFIGURATION_MILESTONE_IDS.TAX_RATE,
  CONFIGURATION_MILESTONE_IDS.OPERATIONAL_COST,
  CONFIGURATION_MILESTONE_IDS.OPERATIONAL_CYCLE,
  CONFIGURATION_MILESTONE_IDS.FIRST_MARKETPLACE_CONNECTION,
];

/** @type {Record<string, { label: string; description: string; icon: string; order: number; actionVisualType: string }>} */
export const CONFIGURATION_MILESTONE_PRESENTATION = {
  [CONFIGURATION_MILESTONE_IDS.COMPANY_DATA]: {
    label: "Dados da empresa",
    description: "Razão social, CNPJ e contatos da empresa principal.",
    icon: "building",
    order: 1,
    actionVisualType: "MODAL_FUTURE",
  },
  [CONFIGURATION_MILESTONE_IDS.LEGAL_ACCEPTANCE]: {
    label: "Termos de uso",
    description: "Aceite jurídico vigente da conta.",
    icon: "file_text",
    order: 2,
    actionVisualType: "MODAL_FUTURE",
  },
  [CONFIGURATION_MILESTONE_IDS.TAX_RATE]: {
    label: "Alíquota de imposto",
    description: "Percentual fiscal padrão da empresa.",
    icon: "percent",
    order: 3,
    actionVisualType: "MODAL_FUTURE",
  },
  [CONFIGURATION_MILESTONE_IDS.OPERATIONAL_COST]: {
    label: "Custo operacional",
    description: "Percentual operacional padrão da empresa.",
    icon: "percent",
    order: 4,
    actionVisualType: "MODAL_FUTURE",
  },
  [CONFIGURATION_MILESTONE_IDS.OPERATIONAL_CYCLE]: {
    label: "Configuração operacional",
    description: "Horário de fechamento e dias úteis da operação.",
    icon: "clock",
    order: 5,
    actionVisualType: "MODAL_FUTURE",
  },
  [CONFIGURATION_MILESTONE_IDS.FIRST_MARKETPLACE_CONNECTION]: {
    label: "Conectar marketplace",
    description: "Primeira integração com canal de vendas.",
    icon: "link",
    order: 6,
    actionVisualType: "NAVIGATION_FUTURE",
  },
};

const UNKNOWN_PRESENTATION = {
  label: "Etapa de configuração",
  description: "Etapa reconhecida pelo backend, sem rótulo local registrado.",
  icon: "help_circle",
  order: 999,
  actionVisualType: "UNKNOWN",
  isUnknown: true,
};

/**
 * @param {string | null | undefined} milestoneId
 */
export function obterApresentacaoMilestone(milestoneId) {
  const id = String(milestoneId ?? "").trim();
  const known = CONFIGURATION_MILESTONE_PRESENTATION[id];
  if (known) return { ...known, id, isUnknown: false };
  if (import.meta.env?.DEV && id) {
    console.warn("[S7_CONFIGURATION_ONBOARDING] milestone sem apresentação registrada:", id);
  }
  return { ...UNKNOWN_PRESENTATION, id: id || "UNKNOWN", isUnknown: true };
}

/**
 * @param {readonly Record<string, unknown>[]} milestones
 */
export function ordenarMilestonesParaApresentacao(milestones) {
  const rows = Array.isArray(milestones) ? milestones : [];
  const orderMap = new Map(CONFIGURATION_MILESTONE_PRESENTATION_ORDER.map((id, index) => [id, index]));
  return [...rows].sort((a, b) => {
    const ai = orderMap.get(String(a?.id ?? "")) ?? 999;
    const bi = orderMap.get(String(b?.id ?? "")) ?? 999;
    return ai - bi;
  });
}
