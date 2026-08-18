import enzoSecretImage from "../../../assets/easter-eggs/enzo-secret.png";

/** ID oficial — Easter Egg Dashboard / Resumo Diário */
export const DASHBOARD_RESUMO_DIARIO_ENZO_ID = "dashboard-resumo-diario-enzo";

/** Código secreto local (sem backend). */
export const DASHBOARD_RESUMO_DIARIO_ENZO_CODE = "3333";

export const dashboardResumoDiarioEnzoEgg = {
  id: DASHBOARD_RESUMO_DIARIO_ENZO_ID,
  secretCode: DASHBOARD_RESUMO_DIARIO_ENZO_CODE,
  reward: {
    imageSrc: enzoSecretImage,
    imageAlt: "Enzo — segredo da equipe SUSE7",
    paragraphs: [
      "🚀 Você encontrou um segredo do SUSE7!",
      "",
      "Grandes projetos não nascem prontos.",
      "Eles são construídos por pessoas que decidiram não desistir.",
      "",
      "Rumo à liberdade financeira, geográfica e de tempo.",
      "Equipe SUSE7 💙🧡",
    ],
  },
};
