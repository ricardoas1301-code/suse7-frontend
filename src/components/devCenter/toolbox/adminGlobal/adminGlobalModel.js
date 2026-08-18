// ======================================================
// ADMIN GLOBAL — MODEL DE NAVEGAÇÃO (S1_2.3)
// ------------------------------------------------------
// Seções internas da área administrativa global (Toolbox Sistema).
// Nesta fase só "Planos" é funcional; Features e Segurança nascem
// como placeholders organizados.
// ======================================================

import { LayoutGrid, CreditCard, Flag, ShieldCheck } from "lucide-react";

/**
 * @typedef {Object} AdminGlobalSecao
 * @property {string} id
 * @property {string} label
 * @property {import("react").ComponentType<{ size?: number }>} icon
 * @property {boolean} enabled
 */

export const ADMIN_GLOBAL_SECOES = Object.freeze([
  { id: "visao_geral", label: "Visão Geral", icon: LayoutGrid, enabled: true },
  { id: "planos", label: "Planos", icon: CreditCard, enabled: true },
  { id: "features", label: "Features", icon: Flag, enabled: true },
  { id: "seguranca", label: "Segurança", icon: ShieldCheck, enabled: true },
]);

export const ADMIN_GLOBAL_SECAO_PADRAO = "visao_geral";

/** Fontes possíveis do estado administrativo. */
export const ADMIN_FONTE = Object.freeze({
  BACKEND: "backend",
  INDISPONIVEL: "indisponivel",
});
