// ======================================================================
// Constantes — Central de Tarefas Operacionais (frontend)
// ======================================================================

export const OPERATIONAL_TASK_STATUS = {
  REQUIRES_ACTION: "requires_action",
  ATTENTION: "attention",
  OPTIONAL: "optional",
  INFORMATIONAL: "informational",
  COMPLETED: "completed",
};

export const OPERATIONAL_TASK_PRIORITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export const OPERATIONAL_TASK_ACTION_TYPES = {
  OPEN_BULK_LISTING_SKUS: "open_bulk_listing_skus",
  OPEN_BULK_PRODUCT_COSTS: "open_bulk_product_costs",
  OPEN_ML_INITIAL_SYNC_MODAL: "open_ml_initial_sync_modal",
  OPEN_ML_SYNC_MODAL: "open_ml_sync_modal",
  OPEN_COMPANY_EDIT: "open_company_edit",
  /** @deprecated compat — redireciona para open_company_edit */
  OPEN_PROFILE_AVATAR: "open_profile_avatar",
  /** @deprecated compat — redireciona para open_company_edit */
  OPEN_PROFILE_CONTACT: "open_profile_contact",
};

export const MISSING_LISTING_SKUS_TASK_ID = "sku_dependency_pending";
export const MISSING_PRODUCT_COSTS_TASK_ID = "missing_product_costs";

export const OPERATIONAL_TASK_ORDER = {
  [MISSING_LISTING_SKUS_TASK_ID]: 5,
  [MISSING_PRODUCT_COSTS_TASK_ID]: 10,
};
