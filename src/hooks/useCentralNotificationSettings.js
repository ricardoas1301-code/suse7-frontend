import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthBootstrap } from "../contexts/AuthBootstrapContext";
import { applyNotificationChannelsPresentation } from "../constants/notificationChannelPresentation";
import {
  fetchNotificationCategories,
  fetchCentralNotificationPreferences,
  patchCentralNotificationPreferences,
  fetchCentralNotificationRecipients,
  createCentralNotificationRecipient,
  patchCentralNotificationRecipient,
  deleteCentralNotificationRecipient,
  fetchCentralEventDeliveryRules,
  patchCentralEventDeliveryRules,
  fetchDailySalesSummaryAutomationRule,
  patchDailySalesSummaryAutomationRule,
} from "../services/centralNotificationsApi";

/**
 * Estado central de notificações seller (Fase 3.2.2) — sem lógica de envio.
 */
export function useCentralNotificationSettings() {
  const { ready: authReady, loading: authLoading } = useAuthBootstrap();
  const [categories, setCategories] = useState([]);
  const [channelsMeta, setChannelsMeta] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [recipientGroups, setRecipientGroups] = useState([]);
  const [deliveryRules, setDeliveryRules] = useState([]);
  const [dailySalesSummaryRule, setDailySalesSummaryRule] = useState(null);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [loadingRules, setLoadingRules] = useState(true);
  const [loadingDailySalesRule, setLoadingDailySalesRule] = useState(true);

  const [errorCategories, setErrorCategories] = useState(null);
  const [errorPreferences, setErrorPreferences] = useState(null);
  const [errorRecipients, setErrorRecipients] = useState(null);
  const [errorRules, setErrorRules] = useState(null);
  const [errorDailySalesRule, setErrorDailySalesRule] = useState(null);

  const [savingPrefKey, setSavingPrefKey] = useState(null);
  const [savingRuleKey, setSavingRuleKey] = useState(null);
  const [savingAutomationRule, setSavingAutomationRule] = useState(false);
  const [savingRecipient, setSavingRecipient] = useState(false);
  const dailySalesRuleSaveReqRef = useRef(0);

  const prefLookup = useMemo(() => {
    const map = new Map();
    for (const p of preferences) {
      map.set(`${p.category_code}:${p.type_key}`, p);
    }
    return map;
  }, [preferences]);

  const inAppChannelsMeta = useMemo(
    () =>
      applyNotificationChannelsPresentation(
        (channelsMeta ?? []).filter((ch) => ch.key === "in_app")
      ),
    [channelsMeta]
  );

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    setErrorCategories(null);
    const res = await fetchNotificationCategories();
    setLoadingCategories(false);
    if (!res.ok) {
      setErrorCategories(res.error ?? "Erro ao carregar categorias");
      return;
    }
    setCategories(res.categories ?? []);
    setChannelsMeta(res.channels ?? []);
  }, []);

  const loadPreferences = useCallback(async () => {
    setLoadingPreferences(true);
    setErrorPreferences(null);
    const res = await fetchCentralNotificationPreferences();
    setLoadingPreferences(false);
    if (!res.ok) {
      setErrorPreferences(res.error ?? "Erro ao carregar preferências");
      return;
    }
    setPreferences(res.preferences ?? []);
  }, []);

  const loadRecipients = useCallback(async () => {
    setLoadingRecipients(true);
    setErrorRecipients(null);
    const res = await fetchCentralNotificationRecipients();
    setLoadingRecipients(false);
    if (!res.ok) {
      setErrorRecipients(res.error ?? "Erro ao carregar destinatários");
      return;
    }
    setRecipientGroups(res.groups ?? []);
  }, []);

  const loadDeliveryRules = useCallback(async () => {
    setLoadingRules(true);
    setErrorRules(null);
    const res = await fetchCentralEventDeliveryRules();
    setLoadingRules(false);
    if (!res.ok) {
      setErrorRules(res.error ?? "Erro ao carregar regras de entrega");
      return;
    }
    setDeliveryRules(res.rules ?? []);
  }, []);

  const loadDailySalesSummaryRule = useCallback(async () => {
    setLoadingDailySalesRule(true);
    setErrorDailySalesRule(null);
    const res = await fetchDailySalesSummaryAutomationRule();
    setLoadingDailySalesRule(false);
    if (!res.ok) {
      setErrorDailySalesRule(res.error ?? "Erro ao carregar agendamento do resumo diário");
      return;
    }
    setDailySalesSummaryRule(res.rule ?? null);
  }, []);

  const reloadAll = useCallback(async () => {
    await Promise.all([
      loadCategories(),
      loadPreferences(),
      loadRecipients(),
      loadDeliveryRules(),
      loadDailySalesSummaryRule(),
    ]);
  }, [loadCategories, loadPreferences, loadRecipients, loadDeliveryRules, loadDailySalesSummaryRule]);

  useEffect(() => {
    if (authLoading || !authReady) {
      setLoadingCategories(authLoading);
      setLoadingPreferences(authLoading);
      setLoadingRecipients(authLoading);
      setLoadingRules(authLoading);
      setLoadingDailySalesRule(authLoading);
      if (!authLoading && !authReady) {
        setErrorCategories(null);
        setErrorPreferences(null);
        setErrorRecipients(null);
        setErrorRules(null);
        setErrorDailySalesRule(null);
      }
      return;
    }
    reloadAll();
  }, [authLoading, authReady, reloadAll]);

  const setChannelEnabled = useCallback(
    async (categoryCode, typeKey, channel, enabled) => {
      if (channel !== "in_app") {
        return {
          ok: false,
          message: "E-mail e WhatsApp são configurados por destinatário em cada evento.",
        };
      }

      const key = `${categoryCode}:${typeKey}:${channel}`;
      setSavingPrefKey(key);

      const prev = preferences;
      setPreferences((list) =>
        list.map((item) => {
          if (item.category_code !== categoryCode || item.type_key !== typeKey) return item;
          return {
            ...item,
            channels: {
              ...item.channels,
              [channel]: { ...item.channels?.[channel], enabled },
            },
          };
        })
      );

      const res = await patchCentralNotificationPreferences([
        { category_code: categoryCode, type_key: typeKey, channel, enabled },
      ]);

      setSavingPrefKey(null);

      if (!res.ok) {
        setPreferences(prev);
        return { ok: false, message: res.message ?? res.error ?? "Não foi possível salvar." };
      }
      setPreferences(res.preferences ?? []);
      return { ok: true };
    },
    [preferences]
  );

  const setEventDeliveryRule = useCallback(
    async (updates) => {
      const first = updates?.[0];
      const key = first
        ? `${first.category_code}:${first.type_key}:${first.recipient_group_id}:${first.channel}`
        : "rule";
      setSavingRuleKey(key);

      if (import.meta.env.DEV) {
        console.info("[S7_NOTIFICATION_PREF]_EVENT_RULE_TOGGLE", {
          updates,
          preferences_version: null,
        });
        console.info("[S7_NOTIFICATION_PREF]_persist_started", { rule_key: key });
      }

      const prev = deliveryRules;
      setDeliveryRules((list) => {
        const next = [...list];
        for (const u of updates ?? []) {
          const idx = next.findIndex(
            (r) =>
              String(r.category_code) === String(u.category_code) &&
              String(r.type_key) === String(u.type_key) &&
              String(r.recipient_group_id) === String(u.recipient_group_id) &&
              String(r.channel) === String(u.channel)
          );
          if (idx >= 0) {
            next[idx] = { ...next[idx], enabled: Boolean(u.enabled) };
          } else if (u.enabled) {
            next.push({ ...u, enabled: true });
          }
        }
        return next;
      });

      const res = await patchCentralEventDeliveryRules(updates);
      setSavingRuleKey(null);

      if (!res.ok) {
        if (import.meta.env.DEV) {
          console.info("[S7_NOTIFICATION_PREF]_persist_failed", {
            rule_key: key,
            message: res.message ?? res.error,
          });
        }
        setDeliveryRules(prev);
        return { ok: false, message: res.message ?? res.error ?? "Não foi possível salvar regra." };
      }

      if (import.meta.env.DEV) {
        console.info("[S7_NOTIFICATION_PREF]_persist_success", {
          rule_key: key,
          preferences_version: res.rules_version ?? null,
          updated_at: res.updated_at ?? null,
        });
      }

      setDeliveryRules(res.rules ?? []);
      return {
        ok: true,
        rules_version: res.rules_version ?? null,
        updated_at: res.updated_at ?? null,
      };
    },
    [deliveryRules]
  );

  const saveDailySalesSummaryRule = useCallback(
    async (patch) => {
      const requestId = dailySalesRuleSaveReqRef.current + 1;
      dailySalesRuleSaveReqRef.current = requestId;
      setSavingAutomationRule(true);
      const prev = dailySalesSummaryRule;
      const normalizedPatch = {
        ...patch,
        enabled: true,
      };
      setDailySalesSummaryRule((current) => ({
        ...(current ?? {}),
        ...normalizedPatch,
        config:
          normalizedPatch?.config && typeof normalizedPatch.config === "object"
            ? { ...(current?.config ?? {}), ...normalizedPatch.config }
            : current?.config,
      }));

      const res = await patchDailySalesSummaryAutomationRule(normalizedPatch);
      // Ignora resposta fora de ordem para evitar UI divergente do último save.
      if (requestId !== dailySalesRuleSaveReqRef.current) {
        return { ok: false, message: "SAVE_STALE_RESPONSE_IGNORED" };
      }

      setSavingAutomationRule(false);

      if (!res.ok) {
        setDailySalesSummaryRule(prev);
        return { ok: false, message: res.message ?? res.error ?? "Não foi possível salvar agendamento." };
      }

      setDailySalesSummaryRule(res.rule ?? null);
      // Reconfirma do backend SEM acionar o loading global (loadDailySalesSummaryRule
      // ligaria loadingDailySalesRule -> prefsReady=false -> remount do painel e
      // scroll-to-top). O refetch silencioso só atualiza o estado da regra.
      const confirmRes = await fetchDailySalesSummaryAutomationRule();
      if (requestId === dailySalesRuleSaveReqRef.current && confirmRes.ok) {
        setDailySalesSummaryRule(confirmRes.rule ?? null);
      }
      return { ok: true, rule: res.rule };
    },
    [dailySalesSummaryRule]
  );

  const saveRecipient = useCallback(
    async (payload, editingGroupId = null) => {
      setSavingRecipient(true);
      const res = editingGroupId
        ? await patchCentralNotificationRecipient(editingGroupId, payload)
        : await createCentralNotificationRecipient(payload);
      setSavingRecipient(false);
      if (!res.ok) {
        return {
          ok: false,
          message: res.message ?? res.error ?? "Erro ao salvar destinatário.",
          error: res.error,
          duplicated_field: res.duplicated_field,
          field: res.field,
        };
      }
      await loadRecipients();
      return { ok: true, group: res.group };
    },
    [loadRecipients]
  );

  const removeRecipient = useCallback(
    async (groupId) => {
      setSavingRecipient(true);
      const res = await deleteCentralNotificationRecipient(groupId);
      setSavingRecipient(false);
      if (!res.ok) {
        return { ok: false, message: res.message ?? res.error ?? "Erro ao remover." };
      }
      await loadRecipients();
      return { ok: true };
    },
    [loadRecipients]
  );

  return {
    categories,
    channelsMeta: inAppChannelsMeta,
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
    reloadAll,
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
  };
}
