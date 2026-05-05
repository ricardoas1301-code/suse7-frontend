import {
  NOTIFICATION_CATALOG,
  NOTIFICATION_CATEGORY_TABS,
  NOTIFICATION_PRIORITIES,
} from "../constants/notificationPreferences";

const CATEGORY_LABEL_BY_ID = NOTIFICATION_CATEGORY_TABS.reduce((acc, item) => {
  acc[item.category] = item.label;
  return acc;
}, {});

const TYPE_LABEL_BY_ID = NOTIFICATION_CATALOG.flatMap((group) => group.items).reduce((acc, item) => {
  acc[item.type] = item.label;
  return acc;
}, {});

const PRIORITY_LABEL_BY_ID = {
  [NOTIFICATION_PRIORITIES.critical]: "Crítica",
  [NOTIFICATION_PRIORITIES.important]: "Importante",
  [NOTIFICATION_PRIORITIES.medium]: "Média",
  [NOTIFICATION_PRIORITIES.info]: "Informativa",
};

export function getNotificationTypeLabel(type) {
  const key = String(type ?? "").trim().toUpperCase();
  return (TYPE_LABEL_BY_ID[key] ?? key) || "Notificação";
}

export function getNotificationCategoryLabel(category) {
  const key = String(category ?? "").trim();
  return (CATEGORY_LABEL_BY_ID[key] ?? key) || "Categoria";
}

export function getNotificationPriorityLabel(priority) {
  const key = String(priority ?? "").trim().toLowerCase();
  return (PRIORITY_LABEL_BY_ID[key] ?? key) || "Prioridade";
}

export function getTypeOptions() {
  const unique = new Map();
  for (const group of NOTIFICATION_CATALOG) {
    for (const item of group.items) unique.set(item.type, item.label);
  }
  return [...unique.entries()].map(([value, label]) => ({ value, label }));
}

