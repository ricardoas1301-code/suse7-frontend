import { useCallback, useEffect, useState } from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import {
  DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
  DEFAULT_OPERATIONAL_WORKING_DAYS,
  isAccountOperationalCycleDirty,
  loadAccountOperationalCycle,
  saveAccountOperationalCycle,
} from "../../services/accountOperationalCycleService.js";
import OperationalCloseTimePicker from "./OperationalCloseTimePicker.jsx";
import OperationalWorkingDaysField from "./OperationalWorkingDaysField.jsx";
import "./AccountOperationalCycleCard.css";

export default function AccountOperationalCycleCard() {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closesAt, setClosesAt] = useState(DEFAULT_OPERATIONAL_DAY_CLOSES_AT);
  const [workingDays, setWorkingDays] = useState(DEFAULT_OPERATIONAL_WORKING_DAYS);
  const [baseline, setBaseline] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await loadAccountOperationalCycle();
    const next = data ?? {
      closesAt: DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
      workingDays: DEFAULT_OPERATIONAL_WORKING_DAYS,
    };
    setClosesAt(next.closesAt);
    setWorkingDays(next.workingDays);
    setBaseline(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = isAccountOperationalCycleDirty(
    { closesAt, workingDays },
    baseline ?? { closesAt: DEFAULT_OPERATIONAL_DAY_CLOSES_AT, workingDays: DEFAULT_OPERATIONAL_WORKING_DAYS },
  );

  const handleSave = async () => {
    setSaving(true);
    const result = await saveAccountOperationalCycle({ closesAt, workingDays });
    setSaving(false);
    if (!result.ok) {
      addNotification({
        title: "Configuração não salva",
        message: result.error ?? "Tente novamente.",
        severity: NOTIFICATION_SEVERITY.ERROR,
      });
      return;
    }
    const saved = { closesAt, workingDays };
    setBaseline(saved);
    addNotification({
      title: "Configuração salva",
      message: "Ciclo operacional atualizado para todos os CNPJs.",
      severity: NOTIFICATION_SEVERITY.SUCCESS,
    });
  };

  if (loading) {
    return (
      <section className="s7-account-cycle-card s7-account-cycle-card--loading" aria-label="Ciclo operacional da conta">
        <p className="s7-account-cycle-card__loading">Carregando ciclo operacional...</p>
      </section>
    );
  }

  return (
    <section className="s7-account-cycle-card" aria-labelledby="s7-account-cycle-card-title">
      <header className="s7-account-cycle-card__head">
        <h3 id="s7-account-cycle-card-title" className="s7-account-cycle-card__title">
          Ciclo operacional da conta
        </h3>
        <p className="s7-account-cycle-card__desc">
          Esta configuração se aplica a todos os CNPJs e define o fechamento do Resumo Diário.
        </p>
      </header>

      <div className="s7-account-cycle-card__controls">
        <OperationalWorkingDaysField
          className="s7-account-cycle-card__days"
          value={workingDays}
          onChange={setWorkingDays}
          title="Dias de operação"
          helpText=""
          compactLabels
        />

        <div className="s7-account-cycle-card__actions">
          <OperationalCloseTimePicker
            className="s7-account-cycle-card__time"
            id="account_operational_day_closes_at"
            label="Hora de encerramento operacional"
            value={closesAt}
            onChange={(nextValue) => setClosesAt(nextValue || DEFAULT_OPERATIONAL_DAY_CLOSES_AT)}
            disabled={saving}
          />

          <button
            type="button"
            className="s7-account-cycle-card__save btn-primary s7-btn-brand-primary"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </section>
  );
}
