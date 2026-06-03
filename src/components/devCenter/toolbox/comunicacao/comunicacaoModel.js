// ======================================================
// COMUNICAÇÃO — MODEL DE NAVEGAÇÃO (S5.8)
// ------------------------------------------------------
// Módulo superior do Dev Center para o Motor Central de Comunicação.
// Estrutura inicial read-only — sem CRUD, edição ou telas completas.
// ======================================================

import { Mail, MessageCircle, MonitorSmartphone, Bell } from "lucide-react";

/**
 * @typedef {Object} ComunicacaoSecao
 * @property {string} id
 * @property {string} channelCode código canônico do Registro de Canais
 * @property {string} label
 * @property {import("react").ComponentType<{ size?: number }>} icon
 * @property {string} descricao
 * @property {boolean} canalOficial reconhecido pelo Motor Central
 * @property {string} motorPhase fase que formalizou o canal
 * @property {string[]} futuro capacidades previstas
 */

/** Canais oficiais do Motor Central (navegação reservada). */
export const COMUNICACAO_SECOES = Object.freeze([
  {
    id: "email",
    channelCode: "email",
    label: "Canal E-mail",
    icon: Mail,
    descricao: "Canal E-mail oficial (S5.5): outbox, worker e integração com o Dispatcher.",
    canalOficial: true,
    motorPhase: "S5.5",
    futuro: ["políticas", "sandbox", "deliverability"],
  },
  {
    id: "whatsapp",
    channelCode: "whatsapp",
    label: "Canal WhatsApp",
    icon: MessageCircle,
    descricao: "Canal WhatsApp oficial (S5.6): Z-API, outbox e fluxo Raio-X preservado.",
    canalOficial: true,
    motorPhase: "S5.6",
    futuro: ["multi-provider", "destinatários", "rastreio"],
  },
  {
    id: "popup",
    channelCode: "popup",
    label: "Canal Pop-up",
    icon: MonitorSmartphone,
    descricao: "Canal Pop-up oficial (S5.7): mensagens in-app contextuais (infra preparada).",
    canalOficial: true,
    motorPhase: "S5.7",
    futuro: ["templates", "preview", "persistência"],
  },
  {
    id: "sininho",
    channelCode: "in_app",
    label: "Central Sininho",
    icon: Bell,
    descricao:
      "Central Sininho oficial (S5.8): inbox in-app, histórico, leitura, deep-links e rastreio.",
    canalOficial: true,
    motorPhase: "S5.8",
    futuro: ["timeline", "arquivamento", "preferências"],
  },
]);

export const COMUNICACAO_SECAO_PADRAO = COMUNICACAO_SECOES[3].id;
