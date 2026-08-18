import { useRef, useState } from "react";

import { useNotifications } from "../../contexts/NotificationContext";

import { useCentralNotificationSettings } from "../../hooks/useCentralNotificationSettings";

import NotificationRecipientCard from "../notifications/central/NotificationRecipientCard";

import NotificationRecipientModal from "../notifications/central/NotificationRecipientModal";

import NotificationRecipientDeleteModal from "../notifications/central/NotificationRecipientDeleteModal";

import { mapRecipientApiError } from "../notifications/central/recipientApiErrors";

import NotificationCenterPageShell from "./NotificationCenterPageShell";

import "../Profile/CentralNotificacoesHub.css";

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

export default function NotificationCenterRecipientsPage() {
  const { addNotification } = useNotifications();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [serverFieldErrors, setServerFieldErrors] = useState(null);
  const deleteTriggerRef = useRef(/** @type {HTMLButtonElement | null} */ (null));

  const {
    recipientGroups,
    loadingRecipients,
    errorRecipients,
    savingRecipient,
    loadRecipients,
    saveRecipient,
    removeRecipient,
  } = useCentralNotificationSettings();

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

  const openDeleteRecipient = (group, triggerEl) => {
    if (group?.is_primary) return;
    deleteTriggerRef.current = triggerEl instanceof HTMLButtonElement ? triggerEl : null;
    setDeleteError(null);
    setDeleteTarget(group);
  };

  const closeDeleteRecipient = () => {
    if (savingRecipient) return;
    setDeleteTarget(null);
    setDeleteError(null);
    deleteTriggerRef.current?.focus?.();
    deleteTriggerRef.current = null;
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.group_id || deleteTarget.is_primary) return;
    setDeleteError(null);
    const res = await removeRecipient(deleteTarget.group_id);
    if (!res.ok) {
      setDeleteError(res.message ?? "Não foi possível remover o destinatário. Tente novamente.");
      return;
    }
    setDeleteTarget(null);
    deleteTriggerRef.current?.focus?.();
    deleteTriggerRef.current = null;
    addNotification({ type: "success", title: "Destinatários", message: "Destinatário removido." });
  };

  return (
    <>
      <NotificationCenterPageShell
        className="s7-ncenter-recipients-page"
        title="Destinatários"
        subtitle="Cadastre e gerencie as pessoas que poderão receber as notificações do SUSE7 por e-mail ou WhatsApp. Depois, escolha quais destinatários receberão cada alerta, resumo, relatório ou comunicação da sua operação."
        headerAction={
          <button type="button" className="s7-cnhub__primary" onClick={openNewRecipient}>
            Adicionar destinatário
          </button>
        }
      >
        <section className="s7-cnhub__panel s7-ncenter-recipients-panel">
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
                    showFullContact
                    onEdit={openEditRecipient}
                    onDelete={(group, event) => openDeleteRecipient(group, event?.currentTarget)}
                  />
                ))}
              </div>
            )
          ) : null}
        </section>
      </NotificationCenterPageShell>

      <NotificationRecipientModal
        open={modalOpen}
        initialGroup={editingGroup}
        saving={savingRecipient}
        serverFieldErrors={serverFieldErrors}
        onClose={() => !savingRecipient && setModalOpen(false)}
        onSubmit={handleRecipientSubmit}
      />

      <NotificationRecipientDeleteModal
        open={Boolean(deleteTarget)}
        group={deleteTarget}
        saving={savingRecipient}
        errorMessage={deleteError}
        onClose={closeDeleteRecipient}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
