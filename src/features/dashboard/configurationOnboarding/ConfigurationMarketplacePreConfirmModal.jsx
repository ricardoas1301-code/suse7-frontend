import S7Button from "../../../components/ui/S7Button.jsx";

import S7ImportantNotice from "../../../components/ui/S7ImportantNotice.jsx";

import { MarketplaceConnectionVisual } from "../../../components/Profile/marketplaceIntegration/MarketplaceIntegrationPageLayout.jsx";

import {

  ML_INTEGRATION_HISTORICAL_SALES_MESSAGE,

  ML_INTEGRATION_OAUTH_INTRO,

  ML_INTEGRATION_PRE_AUTH_ACCOUNT_CONFIRM,

} from "../../../components/Profile/marketplaceIntegration/mercadoLivreIntegrationCopy.js";

import { mercadoLivrePresentation } from "../../../components/Profile/marketplaceIntegration/mercadoLivrePresentation.js";

import ConfigurationTaskModalShell from "./ConfigurationTaskModalShell.jsx";

import { CONFIGURATION_TASK_MODAL_SIZE } from "./configurationTaskModalSizes.js";

import { resolverNomeEmpresaPreConfirmacao } from "./configurationOnboardingDocumentMask.js";

import { formatCpfCnpjBr } from "../../../utils/profileInputMasks.js";

import "./ConfigurationOnboardingModals.css";



const ML_HISTORICAL_SALES_PARAGRAPHS = ML_INTEGRATION_HISTORICAL_SALES_MESSAGE.split(/\n\n+/)

  .map((para) => para.trim())

  .filter(Boolean);



/**

 * @param {Record<string, unknown> | null | undefined} company

 */

function resolverCnpjCompletoEmpresa(company) {

  const raw = company?.document_cnpj ?? company?.document ?? null;

  if (raw == null || String(raw).trim() === "") return "—";

  const digits = String(raw).replace(/\D/g, "");

  if (digits.length !== 14) return String(raw).trim();

  return formatCpfCnpjBr(digits);

}



/**

 * @param {{

 *   open: boolean;

 *   onClose: () => void;

 *   company: Record<string, unknown> | null;

 *   loading?: boolean;

 *   saving?: boolean;

 *   error?: string | null;

 *   onConfirm: () => void | Promise<void>;

 * }} props

 */

export default function ConfigurationMarketplacePreConfirmModal({

  open,

  onClose,

  company,

  loading = false,

  saving = false,

  error = null,

  onConfirm,

}) {

  const busy = loading || saving;

  const nome = resolverNomeEmpresaPreConfirmacao(company);

  const cnpj = resolverCnpjCompletoEmpresa(company);

  const connectionVisual = mercadoLivrePresentation.connectionVisual;



  return (

    <ConfigurationTaskModalShell

      open={open}

      title="Conecte sua conta ao Mercado Livre"

      hideTitle

      marketplaceSlug="mercado_livre"

      showMarketplaceChannelBadge

      channelBadgePrefix="Conecte sua conta ao"

      bodySurface="white"

      onClose={onClose}

      loading={loading}

      error={error}

      closeDisabled={busy}

      size={CONFIGURATION_TASK_MODAL_SIZE.WIDE}

      primaryAction={

        <S7Button variant="primary" disabled={busy || !company} onClick={() => void onConfirm()}>

          {saving ? "Redirecionando…" : "Conectar ao Mercado Livre"}

        </S7Button>

      }

    >

      <div className="configuration-onboarding-preconfirm">

        <dl className="configuration-onboarding-preconfirm__facts">

          <div className="configuration-onboarding-preconfirm__row">

            <dt>Loja</dt>

            <dd>{nome}</dd>

          </div>

          <div className="configuration-onboarding-preconfirm__row">

            <dt>CNPJ</dt>

            <dd>{cnpj}</dd>

          </div>

        </dl>



        <div className="configuration-onboarding-preconfirm__hero">

          <div className="configuration-onboarding-preconfirm__hero-copy">

            <p className="configuration-onboarding-preconfirm__intro">{ML_INTEGRATION_OAUTH_INTRO}</p>

            {ML_HISTORICAL_SALES_PARAGRAPHS.map((para) => (

              <p key={para.slice(0, 48)} className="configuration-onboarding-preconfirm__intro-secondary">

                {para}

              </p>

            ))}

          </div>

          <div className="configuration-onboarding-preconfirm__hero-visual" aria-hidden="true">

            <MarketplaceConnectionVisual

              platformLogoSrc={connectionVisual.platformLogoSrc}

              platformLogoAlt={connectionVisual.platformLogoAlt}

              marketplaceLogoSrc={connectionVisual.marketplaceLogoSrc}

              marketplaceLogoAlt={connectionVisual.marketplaceLogoAlt}

              connectorSymbol="→"

            />

          </div>

        </div>



        <S7ImportantNotice>{ML_INTEGRATION_PRE_AUTH_ACCOUNT_CONFIRM}</S7ImportantNotice>

      </div>

    </ConfigurationTaskModalShell>

  );

}

