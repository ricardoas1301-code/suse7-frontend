/**
 * Tipos JSDoc — Assinaturas operacional (Dev Center Fase 2)
 */

/**
 * @typedef {"saudavel"|"atencao"|"risco_churn"|"inadimplente"|"trial_expirando"} FinancialHealth
 */

/**
 * @typedef {Object} SubscriptionListRow
 * @property {string} id
 * @property {string} seller_id
 * @property {string} seller_name
 * @property {string} seller_email
 * @property {string | null} seller_photo_url
 * @property {string} plan
 * @property {string | null} plan_key
 * @property {string} billing_status
 * @property {FinancialHealth} financial_health
 * @property {string} billing_cycle
 * @property {string | null} current_period_start
 * @property {string | null} current_period_end
 * @property {string | null} renewal_date
 * @property {string | null} started_at
 * @property {string | null} amount_brl
 * @property {string} payment_method
 * @property {number | null} usage_percent
 * @property {number | null} usage_current
 * @property {number | null} usage_limit
 */

/**
 * @typedef {Object} SubscriptionFilters
 * @property {string} q
 * @property {string} billing_status
 * @property {string} plan
 * @property {string} billing_flag
 * @property {string} health
 * @property {string} renewal
 */

/**
 * @typedef {Object} SubscriptionSummary
 * @property {number} active_subscriptions
 * @property {number} grace_period
 * @property {number} past_due
 * @property {number} trials_active
 * @property {string} mrr_brl
 * @property {string} arr_brl
 * @property {number} churn_risk
 * @property {number} renewals_upcoming
 */

export {};
