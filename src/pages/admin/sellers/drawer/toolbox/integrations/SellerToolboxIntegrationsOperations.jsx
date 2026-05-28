import { memo } from "react";
import SellerToolboxIntegrationOperationButton from "./SellerToolboxIntegrationOperationButton";
import { SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID } from "../centralSync/accounts/sellerToolboxValidateMarketplaceTokenOperation";
import { SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID } from "../centralSync/accounts/sellerToolboxForceMarketplaceSyncOperation";
import { SELLER_TOOLBOX_REIMPORT_MARKETPLACE_ACCOUNT_ACTION_ID } from "./sellerToolboxReimportMarketplaceAccountOperation";
import { SELLER_TOOLBOX_INVALIDATE_INTEGRATION_CACHE_ACTION_ID } from "./sellerToolboxInvalidateIntegrationCacheOperation";
import { SELLER_TOOLBOX_REFRESH_INTEGRATION_HEALTH_ACTION_ID } from "./sellerToolboxRefreshIntegrationHealthOperation";
import "./SellerToolboxIntegrationsOperations.css";

/**
 * @param {{
 *   account: { id: string; label: string; marketplaceKey?: string };
 * }} props
 */
function SellerToolboxIntegrationsOperations({ account }) {
  if (!account?.id) return null;

  const accountId = String(account.id);
  const accountLabel = String(account.label ?? "Conta");
  const marketplace = String(account.marketplaceKey ?? "");

  return (
    <section
      className="seller-toolbox-integrations-operations"
      aria-label={`Ações operacionais — ${accountLabel}`}
    >
      <header className="seller-toolbox-integrations-operations__head">
        <h6 className="seller-toolbox-integrations-operations__title">{accountLabel}</h6>
        <p className="seller-toolbox-integrations-operations__desc">
          Operações administrativas reais — persistidas no backend com auditoria.
        </p>
      </header>

      <div className="seller-toolbox-integrations-operations__buttons">
        <SellerToolboxIntegrationOperationButton
          actionId={SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID}
          label="Revalidar token"
          loadingLabel="Revalidando..."
          confirmTitle="Revalidar token da conta?"
          confirmDescription="Consulta o backend para verificar o token desta conta marketplace."
          accountId={accountId}
          accountLabel={accountLabel}
          marketplace={marketplace}
        />
        <SellerToolboxIntegrationOperationButton
          actionId={SELLER_TOOLBOX_REFRESH_INTEGRATION_HEALTH_ACTION_ID}
          label="Atualizar saúde"
          loadingLabel="Atualizando..."
          confirmTitle="Atualizar saúde da integração?"
          confirmDescription="Recalcula e persiste o snapshot de saúde desta conta."
          accountId={accountId}
          accountLabel={accountLabel}
          marketplace={marketplace}
        />
        <SellerToolboxIntegrationOperationButton
          actionId={SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID}
          label="Sincronizar agora"
          loadingLabel="Sincronizando..."
          confirmTitle="Forçar sincronização agora?"
          confirmDescription="Enfileira jobs de sync imediato para esta conta marketplace."
          doubleConfirmTitle="Confirmação reforçada — sincronizar agora?"
          doubleConfirmDescription="Esta operação enfileira sync imediato e pode gerar carga no marketplace."
          accountId={accountId}
          accountLabel={accountLabel}
          marketplace={marketplace}
        />
        <SellerToolboxIntegrationOperationButton
          actionId={SELLER_TOOLBOX_REIMPORT_MARKETPLACE_ACCOUNT_ACTION_ID}
          label="Reimportar conta"
          loadingLabel="Reimportando..."
          confirmTitle="Reimportar conta marketplace?"
          confirmDescription="Reprocessa a importação inicial desta conta via jobs de sync."
          doubleConfirmTitle="Confirmação reforçada — reimportar conta?"
          doubleConfirmDescription="Reimportação completa — use somente para correções operacionais."
          accountId={accountId}
          accountLabel={accountLabel}
          marketplace={marketplace}
        />
        <SellerToolboxIntegrationOperationButton
          actionId={SELLER_TOOLBOX_INVALIDATE_INTEGRATION_CACHE_ACTION_ID}
          label="Invalidar cache"
          loadingLabel="Invalidando..."
          confirmTitle="Invalidar cache operacional?"
          confirmDescription="Marca invalidação de cache para integrações, toolbox e resumo do seller."
          doubleConfirmTitle="Confirmação reforçada — invalidar cache?"
          doubleConfirmDescription="Invalidação de cache afeta leituras operacionais até o próximo reload."
          accountId={accountId}
          accountLabel={accountLabel}
          marketplace={marketplace}
        />
      </div>
    </section>
  );
}

export default memo(SellerToolboxIntegrationsOperations);
