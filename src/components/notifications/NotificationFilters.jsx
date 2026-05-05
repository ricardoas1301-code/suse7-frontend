import { NOTIFICATION_CATEGORY_TABS, NOTIFICATION_PRIORITIES } from "../../constants/notificationPreferences";
import { getTypeOptions } from "../../utils/notificationLabels";

const STATUS_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "unread", label: "Não lidas" },
  { value: "read", label: "Lidas" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: NOTIFICATION_PRIORITIES.critical, label: "Crítica" },
  { value: NOTIFICATION_PRIORITIES.important, label: "Importante" },
  { value: NOTIFICATION_PRIORITIES.medium, label: "Média" },
  { value: NOTIFICATION_PRIORITIES.info, label: "Informativa" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "Todas" },
  ...NOTIFICATION_CATEGORY_TABS.map((item) => ({ value: item.category, label: item.label })),
];

const TYPE_OPTIONS = [{ value: "all", label: "Todas" }, ...getTypeOptions()];

export default function NotificationFilters({ filters, onChange, onClear, hasActiveFilters }) {
  return (
    <div className="nd-filters-wrap">
      <div className="nd-filters-grid">
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(value) => onChange({ status: value })}
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          label="Categoria"
          value={filters.category}
          onChange={(value) => onChange({ category: value })}
          options={CATEGORY_OPTIONS}
        />
        <FilterSelect
          label="Prioridade"
          value={filters.priority}
          onChange={(value) => onChange({ priority: value })}
          options={PRIORITY_OPTIONS}
        />
        <FilterSelect
          label="Tipo"
          value={filters.notification_type}
          onChange={(value) => onChange({ notification_type: value })}
          options={TYPE_OPTIONS}
        />
      </div>
      <div className="nd-filters-meta">
        {hasActiveFilters ? <span className="nd-active-chip">Filtros ativos</span> : null}
        {hasActiveFilters ? (
          <button type="button" className="nd-clear-filters" onClick={onClear}>
            Limpar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="nd-filter-select">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

