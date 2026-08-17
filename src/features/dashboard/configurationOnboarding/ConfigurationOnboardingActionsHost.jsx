import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TermsAcceptanceModal from "../../../components/legal/TermsAcceptanceModal.jsx";
import { persistirAceiteDocumentoLegal } from "../../../services/legalDocumentAcceptanceApi.js";
import { useAuthBootstrap } from "../../../contexts/AuthBootstrapContext.jsx";
import { useNotifications } from "../../../contexts/NotificationContext.jsx";
import { NOTIFICATION_SEVERITY } from "../../../services/notificationTypes.js";
import {
  CONFIGURATION_MILESTONE_ACTION_TYPES,
  resolverAcaoMilestone,
} from "./configurationMilestoneActionRegistry.js";
import ConfigurationCompanyDataModal from "./ConfigurationCompanyDataModal.jsx";
import {
  CONFIGURATION_COMPANY_DATA_MODAL_STATE,
  resolverEstadoModalDadosEmpresa,
} from "./configurationCompanyDataModalState.js";
import ConfigurationPercentModal from "./ConfigurationPercentModal.jsx";
import ConfigurationOperationalCycleModal from "./ConfigurationOperationalCycleModal.jsx";
import ConfigurationMarketplacePreConfirmModal from "./ConfigurationMarketplacePreConfirmModal.jsx";
import { COMPANY_OPERATIONAL_COST_TOOLTIP } from "../../../domain/costs/costSemanticsPresentation.js";
import { executarSalvarConfiguracaoComRefresh } from "./configurationOnboardingSaveFlow.js";
import {
  fetchSellerCompanyForConfiguration,
  patchSellerCompanyForConfiguration,
  createSellerCompanyForConfiguration,
  saveOperationalCycleConfirmation,
} from "./configurationOnboardingWriteApi.js";
import { buildConfigurationCompanyDataCreateBody } from "./configurationOnboardingFormHelpers.js";
import {
  montarUrlRotaMlConnectFrontend,
  validarSessaoParaConexaoMl,
} from "./configurationOnboardingMlConnectApi.js";
import {
  DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
} from "../operationalDayCycle.js";
import {
  DEFAULT_OPERATIONAL_WORKING_DAYS,
} from "../operationalWorkingDays.js";

/**
 * @param {{
 *   snapshot: { configuration?: Record<string, unknown>; milestones?: Record<string, unknown>[]; authorities?: Record<string, unknown> } | null;
 *   activeMilestoneId: string | null;
 *   onClose: () => void;
 *   onRefreshSnapshot: () => Promise<{ ok?: boolean; error?: string } | null>;
 *   onSnapshotUpdated?: () => void;
 * }} props
 */
export default function ConfigurationOnboardingActionsHost({
  snapshot,
  activeMilestoneId,
  onClose,
  onRefreshSnapshot,
  onSnapshotUpdated,
}) {
  const { user } = useAuthBootstrap();
  const { addNotification } = useNotifications();
  const action = resolverAcaoMilestone(activeMilestoneId);
  const open = Boolean(activeMilestoneId && action.implemented);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [company, setCompany] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [companyDataMode, setCompanyDataMode] = useState(
    /** @type {import("./configurationCompanyDataModalState.js").ConfigurationCompanyDataModalState | null} */ (null),
  );
  const savingRef = useRef(false);

  const companyId = useMemo(() => {
    const authorities = snapshot?.authorities;
    if (!authorities || typeof authorities !== "object") return null;
    if (String(authorities.company_resolution ?? "") === "AMBIGUOUS_FAIL_CLOSED") return null;
    const id = authorities.primary_seller_company_id;
    return id != null ? String(id) : null;
  }, [snapshot?.authorities]);

  const companyAmbiguous = useMemo(() => {
    const authorities = snapshot?.authorities;
    if (!authorities || typeof authorities !== "object") return false;
    return String(authorities.company_resolution ?? "") === "AMBIGUOUS_FAIL_CLOSED";
  }, [snapshot?.authorities]);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setSaving(false);
      setError(null);
      setCompany(null);
      setCompanyDataMode(null);
      savingRef.current = false;
      return;
    }

    if (
      action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_COMPANY_DATA ||
      action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_TAX_RATE ||
      action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_OPERATIONAL_COST ||
      action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_ML_PRECONFIRM
    ) {
      if (action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_COMPANY_DATA) {
        const resolved = resolverEstadoModalDadosEmpresa({
          actionType: action.actionType,
          companyId,
          companyAmbiguous,
        });

        setCompanyDataMode(resolved.state);

        if (resolved.state === CONFIGURATION_COMPANY_DATA_MODAL_STATE.ERROR) {
          setLoading(false);
          setError(resolved.error);
          return;
        }

        if (resolved.state === CONFIGURATION_COMPANY_DATA_MODAL_STATE.FIRST_CREATE) {
          setLoading(false);
          setError(null);
          setCompany(null);
          return;
        }

        if (resolved.state === CONFIGURATION_COMPANY_DATA_MODAL_STATE.EDIT_EXISTING && companyId) {
          let cancelled = false;
          setLoading(true);
          setError(null);
          (async () => {
            const result = await fetchSellerCompanyForConfiguration(companyId);
            if (cancelled) return;
            setLoading(false);
            if (!result.ok) {
              const failed = resolverEstadoModalDadosEmpresa({
                actionType: action.actionType,
                companyId,
                companyAmbiguous,
                fetchFailed: true,
                fetchError: result.error,
              });
              setCompanyDataMode(failed.state);
              setError(failed.error);
              return;
            }
            setCompany(result.company);
          })();
          return () => {
            cancelled = true;
          };
        }
      }

      if (action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_ML_PRECONFIRM && companyAmbiguous) {
        setError("Não foi possível identificar a empresa principal. Ajuste em Perfil → Dados da Empresa.");
        return;
      }
      if (!companyId) {
        setError(
          action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_ML_PRECONFIRM
            ? "Empresa principal não encontrada ou ambígua."
            : "Empresa principal não encontrada.",
        );
        return;
      }
      let cancelled = false;
      setLoading(true);
      setError(null);
      (async () => {
        const result = await fetchSellerCompanyForConfiguration(companyId);
        if (cancelled) return;
        setLoading(false);
        if (!result.ok) {
          setError(result.error || "Não foi possível carregar os dados.");
          return;
        }
        setCompany(result.company);
      })();
      return () => {
        cancelled = true;
      };
    }

    setLoading(false);
    setError(null);
    return undefined;
  }, [open, action.actionType, companyId, companyAmbiguous]);

  const handleConfirmMarketplacePreconnect = useCallback(async () => {
    if (!companyId || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);

    const sessao = await validarSessaoParaConexaoMl();
    if (!sessao.ok) {
      savingRef.current = false;
      setSaving(false);
      setError(sessao.error || "Não foi possível validar a sessão.");
      return;
    }

    const rotaConnect = montarUrlRotaMlConnectFrontend({
      sellerCompanyId: companyId,
      intent: "initial_configuration",
    });
    if (!rotaConnect) {
      savingRef.current = false;
      setSaving(false);
      setError("Empresa inválida para conexão.");
      return;
    }

    window.location.assign(rotaConnect);
  }, [companyId]);

  const runSaveFlow = useCallback(
    async (writeFn) => {
      if (savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      setError(null);

      const outcome = await executarSalvarConfiguracaoComRefresh({
        writeFn,
        refreshFn: async () => {
          const refreshed = await onRefreshSnapshot();
          if (refreshed?.ok) onSnapshotUpdated?.();
          return refreshed;
        },
      });

      savingRef.current = false;
      setSaving(false);

      if (!outcome.ok) {
        const errMsg = outcome.error || "Não foi possível concluir a operação.";
        setError(errMsg);
        addNotification({
          event_type: "CONFIGURATION_SAVE_FAILED",
          entity_type: "configuration_onboarding",
          entity_id: activeMilestoneId,
          title: outcome.phase === "refresh" ? "Progresso não atualizado" : "Não foi possível salvar",
          message: errMsg,
          severity: NOTIFICATION_SEVERITY.ERROR,
        });
        return;
      }

      onClose();
    },
    [activeMilestoneId, addNotification, onClose, onRefreshSnapshot, onSnapshotUpdated],
  );

  const handleSaveCompany = useCallback(
    async (body) => {
      if (companyDataMode === CONFIGURATION_COMPANY_DATA_MODAL_STATE.FIRST_CREATE) {
        await runSaveFlow(async () => {
          const result = await createSellerCompanyForConfiguration(buildConfigurationCompanyDataCreateBody(body));
          return { ok: result.ok, error: result.error };
        });
        return;
      }

      if (!companyId) {
        setError("Empresa principal não encontrada.");
        return;
      }
      await runSaveFlow(async () => {
        const result = await patchSellerCompanyForConfiguration(companyId, body);
        return { ok: result.ok, error: result.error };
      });
    },
    [companyDataMode, companyId, runSaveFlow],
  );

  const handleSaveTaxRate = useCallback(
    async (normalized) => {
      if (!companyId) {
        setError("Empresa principal não encontrada.");
        return;
      }
      await runSaveFlow(async () => {
        const result = await patchSellerCompanyForConfiguration(companyId, {
          default_tax_rate: normalized,
        });
        return { ok: result.ok, error: result.error };
      });
    },
    [companyId, runSaveFlow],
  );

  const handleSaveOperationalCost = useCallback(
    async (normalized) => {
      if (!companyId) {
        setError("Empresa principal não encontrada.");
        return;
      }
      await runSaveFlow(async () => {
        const result = await patchSellerCompanyForConfiguration(companyId, {
          operational_cost_rate: normalized,
        });
        return { ok: result.ok, error: result.error };
      });
    },
    [companyId, runSaveFlow],
  );

  const handleSaveOperationalCycle = useCallback(
    async (payload) => {
      await runSaveFlow(async () => {
        const result = await saveOperationalCycleConfirmation(payload);
        return { ok: result.ok, error: result.error };
      });
    },
    [runSaveFlow],
  );

  const handleLegalAccepted = useCallback(
    async (registro) => {
      await runSaveFlow(async () => {
        const res = await persistirAceiteDocumentoLegal(registro);
        return {
          ok: Boolean(res.ok),
          error:
            (res.data && typeof res.data === "object" && typeof res.data.error === "string"
              ? res.data.error
              : null) || res.error || "Não foi possível registrar o aceite.",
        };
      });
    },
    [runSaveFlow],
  );

  if (!open) return null;

  if (action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.LEGAL_FLOW) {
    return (
      <TermsAcceptanceModal
        open
        onClose={saving ? () => {} : onClose}
        onAccepted={(registro) => {
          void handleLegalAccepted(registro);
        }}
      />
    );
  }

  if (action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_COMPANY_DATA) {
    return (
      <ConfigurationCompanyDataModal
        open
        onClose={onClose}
        company={company}
        accountEmail={String(user?.email ?? "")}
        emailLocked={Boolean(String(user?.email ?? "").trim())}
        saving={saving}
        loading={loading}
        error={error}
        onSave={handleSaveCompany}
      />
    );
  }

  if (action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_TAX_RATE) {
    return (
      <ConfigurationPercentModal
        open
        title="Cadastrar alíquota de imposto"
        helperText="Percentual fiscal padrão da empresa."
        fieldLabel="Imposto (%)"
        accessibleInputLabel="Alíquota de imposto (%)"
        emptyMessage="Informe a alíquota de imposto."
        initialValue={company?.default_tax_rate}
        saving={saving}
        loading={loading}
        error={error}
        onClose={onClose}
        onSave={handleSaveTaxRate}
        placeholder="6,00"
      />
    );
  }

  if (action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_OPERATIONAL_COST) {
    return (
      <ConfigurationPercentModal
        open
        title="Cadastrar custo operacional"
        fieldLabel="Custo operacional (%)"
        fieldLabelTooltip={COMPANY_OPERATIONAL_COST_TOOLTIP}
        helperText="Percentual facultativo. Caso não queira informar um custo operacional, clique em 'Não se aplica'."
        accessibleInputLabel="Custo operacional (%)"
        emptyMessage="Informe o custo operacional."
        initialValue={company?.operational_cost_rate}
        saving={saving}
        loading={loading}
        error={error}
        onClose={onClose}
        onSave={handleSaveOperationalCost}
        showNotApplicable
        placeholder="1,00"
      />
    );
  }

  if (action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_OPERATIONAL_CYCLE) {
    return (
      <ConfigurationOperationalCycleModal
        open
        onClose={onClose}
        initialClosesAt={DEFAULT_OPERATIONAL_DAY_CLOSES_AT}
        initialWorkingDays={DEFAULT_OPERATIONAL_WORKING_DAYS}
        saving={saving}
        error={error}
        onSave={handleSaveOperationalCycle}
      />
    );
  }

  if (action.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_ML_PRECONFIRM) {
    return (
      <ConfigurationMarketplacePreConfirmModal
        open
        onClose={onClose}
        company={company}
        loading={loading}
        saving={saving}
        error={error}
        onConfirm={handleConfirmMarketplacePreconnect}
      />
    );
  }

  return null;
}
