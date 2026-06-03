// ======================================================
// CENTRAL DE TEMPLATES — MODEL DE NAVEGAÇÃO (S5.4)
// ------------------------------------------------------
// Estrutura inicial read-only da Central de Templates (Motor Central de
// Comunicação). Espelha o Registro Oficial de Canais — nesta fase apenas
// estrutura/navegação/espaço reservado. SEM CRUD, edição ou criação.
// ======================================================

import { Mail, MessageCircle, Bell, MonitorSmartphone, Megaphone } from "lucide-react";

/**
 * @typedef {Object} CentralTemplatesSecao
 * @property {string} id          identificador interno
 * @property {string} channelCode código canônico do canal (Registro de Canais)
 * @property {string} label
 * @property {import("react").ComponentType<{ size?: number }>} icon
 * @property {string} descricao
 * @property {boolean} enabled    quando false, área reservada para fase futura
 * @property {string} [motorPhase] fase do Motor Central que formalizou o canal
 * @property {boolean} [canalOficial] reconhecido estruturalmente pelo Motor Central
 * @property {string[]} [futuro] capacidades previstas (sem implementar nesta fase)
 */

/** Seções da Central de Templates (uma por canal de comunicação). */
export const CENTRAL_TEMPLATES_SECOES = Object.freeze([
  {
    id: "email",
    channelCode: "email",
    label: "Templates de E-mail",
    icon: Mail,
    descricao: "Modelos de comunicação por e-mail.",
    enabled: false,
  },
  {
    id: "whatsapp",
    channelCode: "whatsapp",
    label: "Templates de WhatsApp",
    icon: MessageCircle,
    descricao: "Modelos de mensagens de WhatsApp.",
    enabled: false,
  },
  {
    id: "sininho",
    channelCode: "in_app",
    label: "Templates da Central Sininho",
    icon: Bell,
    descricao:
      "Central Sininho oficial do Motor Central (S5.8): modelos do inbox in-app com severidade e deep-link.",
    enabled: false,
    canalOficial: true,
    motorPhase: "S5.8",
    futuro: ["cadastro", "versionamento", "preview"],
  },
  {
    id: "popup",
    channelCode: "popup",
    label: "Templates de Pop-up",
    icon: MonitorSmartphone,
    descricao:
      "Canal Pop-up oficial do Motor Central (S5.7): modelos in-app com tipos informativo, sucesso, aviso e crítico.",
    enabled: false,
    canalOficial: true,
    motorPhase: "S5.7",
    futuro: ["cadastro", "versionamento", "preview"],
  },
  {
    id: "banner",
    channelCode: "banner",
    label: "Templates de Banner Interno",
    icon: Megaphone,
    descricao: "Modelos de banners internos.",
    enabled: false,
  },
]);

export const CENTRAL_TEMPLATES_SECAO_PADRAO = CENTRAL_TEMPLATES_SECOES[0].id;
