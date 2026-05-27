/**
 * Tipos JSDoc — Sellers operacional (Dev Center Fase 1)
 */

/**
 * @typedef {"saudavel"|"atencao"|"critico"} OperationalHealth
 * @typedef {"ativa"|"atencao"|"sem_integracao"} IntegrationStatus
 */

/**
 * @typedef {Object} SellerListRow
 * @property {string} id
 * @property {string} nome
 * @property {string} email
 * @property {string | null} telefone
 * @property {string | null} photo_url
 * @property {string | null} cnpj
 * @property {string} plano
 * @property {string | null} plan_key
 * @property {string | null} subscription_status
 * @property {boolean} in_trial
 * @property {boolean} in_grace
 * @property {boolean} is_past_due
 * @property {string} status
 * @property {IntegrationStatus} integration_status
 * @property {OperationalHealth} operational_health
 * @property {string | null} created_at
 * @property {string | null} last_access_at
 * @property {number} connected_accounts
 * @property {number} companies_count
 * @property {string[]} marketplaces
 * @property {number} listings_count
 * @property {number} sales_count
 * @property {number} sales_recent_30d
 */

/**
 * @typedef {Object} SellerFilters
 * @property {string} q
 * @property {string} status
 * @property {string} plan
 * @property {string} integration
 * @property {string} billing
 * @property {string} health
 */

/**
 * @typedef {Object} SellerDetailPayload
 * @property {Record<string, unknown>} seller
 * @property {Record<string, unknown>} identity
 * @property {Record<string, unknown>[]} companies
 * @property {Record<string, unknown>[]} marketplaces
 * @property {Record<string, unknown> | null} subscription
 * @property {Record<string, unknown>} metrics
 * @property {Record<string, unknown>[]} recent_sales
 * @property {Record<string, unknown>[]} recent_events
 * @property {Record<string, unknown>} future_actions
 */

export {};
