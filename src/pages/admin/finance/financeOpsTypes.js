/**
 * @typedef {Object} FinanceSummary
 * @property {string} mrr_brl
 * @property {string} arr_brl
 * @property {string} receita_mes_atual_brl
 * @property {string} receita_recebida_brl
 * @property {string} receita_pendente_brl
 * @property {string} receita_grace_brl
 * @property {string} receita_risco_brl
 * @property {number} receita_cancelada_count
 * @property {number} inadimplencia
 * @property {number} churn_risco
 * @property {number} sellers_pagantes
 * @property {number} trials_ativos
 * @property {number} renovacoes_proximas
 * @property {string} ticket_medio_brl
 * @property {number} assinaturas_ativas
 */

/**
 * @typedef {Object} FinanceListRow
 * @property {string} id
 * @property {string} seller_id
 * @property {string} seller_name
 * @property {string} seller_email
 * @property {string | null} seller_photo_url
 * @property {string} plan
 * @property {string} billing_status
 * @property {string} financial_health
 * @property {string} payment_status
 * @property {string} payment_method
 * @property {string | null} renewal_date
 * @property {string | null} last_charge_at
 * @property {string} last_charge_brl
 * @property {string} mrr_brl
 * @property {number | null} usage_percent
 */

/**
 * @typedef {Object} FinanceFilters
 * @property {string} q
 * @property {string} payment_status
 * @property {string} plan
 * @property {string} billing_flag
 * @property {string} health
 * @property {string} renewal
 * @property {string} payment_method
 */

export {};
