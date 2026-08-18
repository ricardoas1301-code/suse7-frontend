import { Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";

import { useNotifications } from "../../contexts/NotificationContext";

import { useCentralNotificationSettings } from "../../hooks/useCentralNotificationSettings";

import {

  resolveNotificationCenterSectionBySlug,

  pickNotificationCategoriesForSection,

  resolveNotificationCenterLegacyRedirectSlug,
  shouldShowNotificationCenterPopupSection,
  sectionUsesVisualPopupPlaceholders,
} from "../../constants/notificationCenterSections";
import { resolveNotificationCenterVisualPopupPlaceholders } from "../../constants/notificationCenterVisualPopupPlaceholders";

import "./Notificacoes.css";

import NotificationPopupSection from "../notifications/center/NotificationPopupSection";

import NotificationDeliverySection from "../notifications/center/NotificationDeliverySection";

import NotificationCenterSectionCard from "../notifications/center/NotificationCenterSectionCard";

import NotificationCenterPageShell from "./NotificationCenterPageShell";

import { resolveCentralNotificationLoadError } from "../notifications/central/centralNotificationLoadErrors";

import "./NotificationCenterCategoryPage.css";



function BlockSkeleton({ lines = 3 }) {

  return (

    <div className="s7-ncenter-skeleton" aria-hidden>

      {Array.from({ length: lines }).map((_, i) => (

        <div key={i} className="s7-ncenter-skeleton__line" />

      ))}

    </div>

  );

}



function ErrorBlock({ message, onRetry }) {

  return (

    <div className="s7-ncenter-error" role="alert">

      <p>{message}</p>

      {onRetry ? (

        <button type="button" className="s7-ncenter-error__retry" onClick={onRetry}>

          Tentar novamente

        </button>

      ) : null}

    </div>

  );

}



export default function NotificationCenterCategoryPage() {

  const { slug } = useParams();

  const location = useLocation();

  const [searchParams] = useSearchParams();

  const legacyRedirect = resolveNotificationCenterLegacyRedirectSlug(slug);

  if (legacyRedirect) {

    return <Navigate to={`/perfil/preferencias/notificacoes/${legacyRedirect}${location.search}`} replace />;

  }

  const section = resolveNotificationCenterSectionBySlug(slug);

  const highlightTypeKey =

    searchParams.get("event") ?? searchParams.get("highlight") ?? searchParams.get("type");



  const { addNotification } = useNotifications();

  const settings = useCentralNotificationSettings();



  if (!section || section.kind !== "category") {

    return <Navigate to="/perfil/preferencias/notificacoes/destinatarios" replace />;

  }



  const {

    categories,

    channelsMeta,

    prefLookup,

    recipientGroups,

    deliveryRules,

    dailySalesSummaryRule,

    loadingCategories,

    loadingPreferences,

    loadingRules,

    loadingDailySalesRule,

    errorCategories,

    errorPreferences,

    errorRules,

    errorDailySalesRule,

    savingPrefKey,

    savingRuleKey,

    savingAutomationRule,

    loadCategories,

    loadPreferences,

    loadDeliveryRules,

    loadDailySalesSummaryRule,

    setChannelEnabled,

    setEventDeliveryRule,

    saveDailySalesSummaryRule,

  } = settings;



  const loading =

    loadingCategories || loadingPreferences || loadingRules || loadingDailySalesRule;



  const consolidatedLoadError = resolveCentralNotificationLoadError([

    errorCategories,

    errorPreferences,

    errorRules,

    errorDailySalesRule,

  ]);



  const filteredCategories = pickNotificationCategoriesForSection(

    categories,

    section.notificationGroups ?? []

  );

  const useGroupedLayout = Boolean(section.groupedLayout);
  const useVisualPlaceholders = useGroupedLayout && sectionUsesVisualPopupPlaceholders(section.key);
  const visualPopupPlaceholders = useVisualPlaceholders
    ? resolveNotificationCenterVisualPopupPlaceholders(section.key)
    : null;
  const showPopupSection = shouldShowNotificationCenterPopupSection(section);

  const hasNotifications = filteredCategories.some((cat) => (cat.types?.length ?? 0) > 0);



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



  const popupSection = showPopupSection ? (
    <NotificationPopupSection
      categoryKey={section.popupCategory}
      hideHeader={useGroupedLayout}
      layout={useGroupedLayout ? "grid" : "stack"}
      useVisualPlaceholders={useVisualPlaceholders}
      visualPlaceholderItems={visualPopupPlaceholders}
    />
  ) : null;

  const deliverySection = hasNotifications ? (
    <NotificationDeliverySection
      section={section}
      categories={categories}
      channelsMeta={channelsMeta}
      prefLookup={prefLookup}
      savingPrefKey={savingPrefKey}
      savingRuleKey={savingRuleKey}
      savingAutomationRule={savingAutomationRule}
      recipientGroups={recipientGroups}
      deliveryRules={deliveryRules}
      dailySalesSummaryRule={dailySalesSummaryRule}
      onChannelChange={handleChannelChange}
      onEventRuleChange={handleEventRuleChange}
      onDailySalesSummaryRuleChange={handleDailySalesSummaryRuleChange}
      highlightTypeKey={highlightTypeKey}
      loading={loading}
      hideHeader={useGroupedLayout}
      layout={useGroupedLayout ? "grid" : "stack"}
      highlightExpandedRecipients={useGroupedLayout}
    />
  ) : null;



  return (

    <NotificationCenterPageShell title={section.label} subtitle={section.description}>

      {loading ? <BlockSkeleton lines={4} /> : null}

      {consolidatedLoadError ? (
        <ErrorBlock
          message={consolidatedLoadError}
          onRetry={() => {
            loadCategories();
            loadPreferences();
            loadDeliveryRules();
            loadDailySalesSummaryRule();
          }}
        />
      ) : null}



      {!loading && !consolidatedLoadError ? (

        <>

          {useGroupedLayout ? (
            <div className="s7-ncenter-page__sections">
              {showPopupSection ? (
                <NotificationCenterSectionCard
                  title="Alertas pop-up"
                  description="Avisos internos exibidos no app durante a operação."
                >
                  {popupSection}
                </NotificationCenterSectionCard>
              ) : null}

              {hasNotifications ? (
                <NotificationCenterSectionCard
                  title="Notificações"
                  description="Configure os canais e escolha quem receberá cada comunicação da sua operação."
                >
                  {deliverySection}
                </NotificationCenterSectionCard>
              ) : null}
            </div>
          ) : (
            <>
              {popupSection}
              {deliverySection}
            </>
          )}

          {!showPopupSection && !hasNotifications ? (
            <p className="s7-ncenter-page__empty">Nenhuma configuração disponível nesta categoria.</p>
          ) : null}

        </>

      ) : null}

    </NotificationCenterPageShell>

  );

}


