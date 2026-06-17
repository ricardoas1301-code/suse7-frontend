// ======================================================================
// Preferências > Notificações — Motor central S7 (Fase 3.2.2)
// ======================================================================

import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContext";
import { useCentralNotificationSettings } from "../../hooks/useCentralNotificationSettings";
import NotificationCategoryCard from "../notifications/central/NotificationCategoryCard";
import NotificationRecipientCard from "../notifications/central/NotificationRecipientCard";
import NotificationRecipientModal from "../notifications/central/NotificationRecipientModal";
import { categoryCodesForFocus, focusAnchorId } from "../notifications/central/centralNotificationFocus";
import { mapRecipientApiError } from "../notifications/central/recipientApiErrors";
import "./CentralNotificacoesHub.css";

function BlockSkeleton({ lines = 3 }) {
  return (
    <div className="s7-cnhub-skeleton" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="s7-cnhub-skeleton__line" />
      ))}
    </div>
  );
}

function ErrorBlock({ message, onRetry }) {
  return (
    <div className="s7-cnhub-error" role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="s7-cnhub-error__retry" onClick={onRetry}>
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

export default function CentralNotificacoesHub() {
  const { addNotification } = useNotifications();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState("preferences");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "recipients") setTab("recipients");
  }, [searchParams]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [serverFieldErrors, setServerFieldErrors] = useState(null);

  const focusKey = searchParams.get("focus");
  const focusCodes = useMemo(() => new Set(categoryCodesForFocus(focusKey)), [focusKey]);

  const {
    categories,
    channelsMeta,
    preferences,
    recipientGroups,
    deliveryRules,
    dailySalesSummaryRule,
    prefLookup,
    loadingCategories,
    loadingPreferences,
    loadingRecipients,
    loadingRules,
    loadingDailySalesRule,
    errorCategories,
    errorPreferences,
    errorRecipients,
    errorRules,
    errorDailySalesRule,
    savingPrefKey,
    savingRuleKey,
    savingAutomationRule,
    savingRecipient,
    loadCategories,
    loadPreferences,
    loadRecipients,
    loadDeliveryRules,
    loadDailySalesSummaryRule,
    setChannelEnabled,
    setEventDeliveryRule,
    saveDailySalesSummaryRule,
    saveRecipient,
    removeRecipient,
  } = useCentralNotificationSettings();

  useEffect(() => {
    if (!focusKey || tab !== "preferences" || loadingCategories) return;
    const codes = categoryCodesForFocus(focusKey);
    const target = codes[0];
    if (!target) return;
    const el = document.getElementById(focusAnchorId(target));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusKey, tab, loadingCategories]);

  const openNewRecipient = () => {
    setEditingGroup(null);
    setServerFieldErrors(null);
    setModalOpen(true);
  };

  const openEditRecipient = (group) => {
    setEditingGroup(group);
    setServerFieldErrors(null);
    setModalOpen(true);
  };

  const handleChannelChange = async (categoryCode, typeKey, channel, enabled) => {
    const res = await setChannelEnabled(categoryCode, typeKey, channel, enabled);
    if (!res.ok) {
      addNotification({
        type: "error",
        title: "Preferências",
        message: res.message ?? "Não foi possível salvar.",
      });
    }
  };

  const handleEventRuleChange = async (updates) => {
    const res = await setEventDeliveryRule(updates);
    if (!res.ok) {
      addNotification({
        type: "error",
        title: "Destinatários do evento",
        message: res.message ?? "Não foi possível salvar.",
      });
      return;
    }
    addNotification({
      type: "success",
      title: "Destinatários do evento",
      message: "Destinatários atualizados",
    });
  };

  const handleDailySalesSummaryRuleChange = async (patch) => {
    const res = await saveDailySalesSummaryRule(patch);
    if (!res.ok) {
      addNotification({
        type: "error",
        title: "Resumo de vendas do dia",
        message: res.message ?? "Não foi possível salvar o agendamento.",
      });
      return;
    }
    addNotification({
      type: "success",
      title: "Resumo de vendas do dia",
      message: "Agendamento atualizado",
    });
  };

  const handleRecipientSubmit = async (payload) => {
    setServerFieldErrors(null);
    const res = await saveRecipient(payload, editingGroup?.group_id ?? null);
    if (!res.ok) {
      const mapped = mapRecipientApiError(res);
      if (mapped.field) {
        setServerFieldErrors({ [mapped.field]: mapped.message });
        return;
      }
      addNotification({
        type: "error",
        title: "Destinatários",
        message: mapped.message,
      });
      return;
    }
    setModalOpen(false);
    setServerFieldErrors(null);
    addNotification({
      type: "success",
      title: "Destinatários",
      message: editingGroup ? "Destinatário atualizado." : "Destinatário criado.",
    });
  };

  const handleToggleActive = async (group) => {
    const email = group.channels?.email?.destination ?? "";
    const whatsapp = group.channels?.whatsapp?.destination ?? "";
    const res = await saveRecipient(
      {
        label: group.label,
        role_tag: group.role_tag,
        email,
        whatsapp,
        is_active: group.is_active === false,
      },
      group.group_id
    );
    if (!res.ok) {
      addNotification({ type: "error", title: "Destinatários", message: res.message });
    }
  };

  const handleDelete = async (group) => {
    if (!window.confirm(`Remover destinatário "${group.label}"?`)) return;
    const res = await removeRecipient(group.group_id);
    if (!res.ok) {
      addNotification({ type: "error", title: "Destinatários", message: res.message });
      return;
    }
    addNotification({ type: "success", title: "Destinatários", message: "Destinatário removido." });
  };

  const prefsReady =
    !loadingCategories &&
    !loadingPreferences &&
    !loadingRules &&
    !loadingDailySalesRule &&
    !errorCategories &&
    !errorPreferences &&
    !errorRules &&
    !errorDailySalesRule;

  return (
    <div className="profile-section s7-cnhub">
      <header className="s7-cnhub__hero">
        <div>
          <h2>Central de notificações</h2>
          <p>
            Cadastre pessoas e escolha quem recebe cada alerta por e-mail ou WhatsApp. O envio é
            controlado pelo motor central do Suse7.
          </p>
        </div>
        <div className="s7-cnhub__hero-links">
          <Link to="/perfil/preferencias/notificacoes/historico">Histórico</Link>
        </div>
      </header>

      <nav className="s7-cnhub__tabs" aria-label="Seções de notificações">
        <button
          type="button"
          className={tab === "preferences" ? "s7-cnhub__tab s7-cnhub__tab--active" : "s7-cnhub__tab"}
          onClick={() => setTab("preferences")}
        >
          Eventos e entregas
        </button>
        <button
          type="button"
          className={tab === "recipients" ? "s7-cnhub__tab s7-cnhub__tab--active" : "s7-cnhub__tab"}
          onClick={() => setTab("recipients")}
        >
          Destinatários
        </button>
      </nav>

      {tab === "preferences" ? (
        <section className="s7-cnhub__panel">
          {(loadingCategories || loadingPreferences || loadingRules || loadingDailySalesRule) && (
            <BlockSkeleton lines={4} />
          )}
          {errorCategories ? <ErrorBlock message={errorCategories} onRetry={loadCategories} /> : null}
          {errorPreferences ? (
            <ErrorBlock message={errorPreferences} onRetry={loadPreferences} />
          ) : null}
          {errorRules ? <ErrorBlock message={errorRules} onRetry={loadDeliveryRules} /> : null}
          {errorDailySalesRule ? (
            <ErrorBlock message={errorDailySalesRule} onRetry={loadDailySalesSummaryRule} />
          ) : null}

          {prefsReady ? (
            <div className="s7-cnhub__categories">
              {categories.length === 0 ? (
                <p className="s7-cnhub__empty">Nenhuma categoria disponível no momento.</p>
              ) : (
                categories.map((cat) => (
                  <NotificationCategoryCard
                    key={cat.code}
                    category={cat}
                    channelsMeta={channelsMeta}
                    prefLookup={prefLookup}
                    savingPrefKey={savingPrefKey}
                    savingRuleKey={savingRuleKey}
                    savingAutomationRule={savingAutomationRule}
                    recipientGroups={recipientGroups}
                    deliveryRules={deliveryRules}
                    dailySalesSummaryRule={dailySalesSummaryRule}
                    highlighted={focusCodes.has(cat.code)}
                    onChannelChange={handleChannelChange}
                    onEventRuleChange={handleEventRuleChange}
                    onDailySalesSummaryRuleChange={handleDailySalesSummaryRuleChange}
                  />
                ))
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "recipients" ? (
        <section className="s7-cnhub__panel">
          <div className="s7-cnhub__recipients-head">
            <div>
              <h3>Destinatários</h3>
              <p>Cadastre pessoas com e-mail e/ou WhatsApp. Depois vincule por evento na aba anterior.</p>
            </div>
            <button type="button" className="s7-cnhub__primary" onClick={openNewRecipient}>
              Adicionar destinatário
            </button>
          </div>

          {loadingRecipients ? <BlockSkeleton lines={2} /> : null}
          {errorRecipients ? <ErrorBlock message={errorRecipients} onRetry={loadRecipients} /> : null}

          {!loadingRecipients && !errorRecipients ? (
            recipientGroups.length === 0 ? (
              <div className="s7-cnhub__empty-card">
                <h4>Nenhum destinatário cadastrado</h4>
                <p>Adicione pessoas da sua equipe com pelo menos um canal de contato.</p>
                <button type="button" className="s7-cnhub__primary" onClick={openNewRecipient}>
                  Criar primeiro destinatário
                </button>
              </div>
            ) : (
              <div className="s7-cnhub__recipients-grid">
                {recipientGroups.map((g) => (
                  <NotificationRecipientCard
                    key={g.group_id}
                    group={g}
                    busy={savingRecipient}
                    onEdit={openEditRecipient}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )
          ) : null}
        </section>
      ) : null}

      <NotificationRecipientModal
        open={modalOpen}
        initialGroup={editingGroup}
        saving={savingRecipient}
        serverFieldErrors={serverFieldErrors}
        onClose={() => !savingRecipient && setModalOpen(false)}
        onSubmit={handleRecipientSubmit}
      />
    </div>
  );
}
