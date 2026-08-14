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
};

export const MISSING_LISTING_SKUS_TASK_ID = "sku_dependency_pending";
export const MISSING_PRODUCT_COSTS_TASK_ID = "missing_product_costs";

export const OPERATIONAL_TASK_ORDER = {
  [MISSING_LISTING_SKUS_TASK_ID]: 5,
  [MISSING_PRODUCT_COSTS_TASK_ID]: 10,
};
