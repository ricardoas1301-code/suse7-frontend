import { memo } from "react";
import { useAccountsSyncView } from "./useAccountsSyncView";
import SellerToolboxIntegrationOperationButton from "../../integrations/SellerToolboxIntegrationOperationButton";
import { SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID } from "./sellerToolboxValidateMarketplaceTokenOperation";
import { SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID } from "./sellerToolboxForceMarketplaceSyncOperation";
import "./AccountsSyncOperations.css";

function AccountsSyncOperations() {
  const { account } = useAccountsSyncView();
  if (!account) return null;

  return (
    <section className="accounts-sync-operations" aria-label="Ações operacionais da conta marketplace">
      <header className="accounts-sync-operations__head">
        <h5 className="accounts-sync-operations__title">Ações operacionais</h5>
        <p className="accounts-sync-operations__desc">
          Validação de token e sincronização via backend com auditoria operacional.
        </p>
      </header>

      <div className="accounts-sync-operations__buttons">
        <SellerToolboxIntegrationOperationButton
          actionId={SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID}
          label="Revalidar token"
          loadingLabel="Revalidando..."
          confirmTitle="Revalidar token da conta?"
          confirmDescription="Consulta o backend para verificar o token desta conta marketplace."
          accountId={account.accountId}
          accountLabel={account.accountLabel}
          marketplace={account.marketplace}
          className="accounts-sync-operations__btn"
        />
        <SellerToolboxIntegrationOperationButton
          actionId={SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID}
          label="Sincronizar agora"
          loadingLabel="Sincronizando..."
          confirmTitle="Forçar sincronização agora?"
          confirmDescription="Enfileira jobs de sync imediato para esta conta marketplace."
          doubleConfirmTitle="Confirmação reforçada — sincronizar agora?"
          doubleConfirmDescription="Esta operação enfileira sync imediato e pode gerar carga no marketplace."
          accountId={account.accountId}
          accountLabel={account.accountLabel}
          marketplace={account.marketplace}
          className="accounts-sync-operations__btn"
        />
      </div>
    </section>
  );
}

export default memo(AccountsSyncOperations);
