// ======================================================
// CAIXA DE FERRAMENTAS — ABAS INTERNAS
// ------------------------------------------------------
// Separação conceitual e técnica (S1_2.2):
//   • Toolbox Seller  → ferramentas contextuais por seller
//                       (suporte/diagnóstico operacional).
//   • Toolbox Sistema → configurações globais do Suse7
//                       (documentação viva, planos, features,
//                        segurança e auditoria global).
// ======================================================

import { Wrench, BookOpen, ShieldCheck, LayoutTemplate, Radio, FileText } from "lucide-react";

/**
 * @typedef {Object} ToolboxTab
 * @property {string} id
 * @property {string} label
 * @property {import("react").ComponentType<{ size?: number; "aria-hidden"?: boolean }>} icon
 * @property {boolean} enabled  Quando false, exibe placeholder de "em breve".
 * @property {"seller"|"sistema"} group
 */

/** Grupos da Caixa de Ferramentas (ordem e rótulos). */
export const TOOLBOX_GROUPS = Object.freeze([
  { id: "seller", label: "Toolbox Seller", hint: "Ferramentas por seller — suporte e diagnóstico" },
  { id: "sistema", label: "Toolbox Sistema", hint: "Configurações globais do Suse7" },
]);

export const TOOLBOX_TABS = Object.freeze([
  { id: "operacional", label: "Operacional", icon: Wrench, enabled: true, group: "seller" },
  { id: "comunicacao", label: "Comunicação", icon: Radio, enabled: true, group: "seller" },
  { id: "central_templates", label: "Central de Templates", icon: LayoutTemplate, enabled: true, group: "seller" },
  { id: "docs_operacionais", label: "Docs Operacionais", icon: FileText, enabled: true, group: "sistema" },
  { id: "documentacao_viva", label: "Documentação Viva", icon: BookOpen, enabled: true, group: "sistema" },
  { id: "admin_global", label: "Administração Global", icon: ShieldCheck, enabled: true, group: "sistema" },
]);

export const TOOLBOX_TAB_PADRAO = TOOLBOX_TABS[0].id;
