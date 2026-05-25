import OpsEmptyState from "./OpsEmptyState";
import {
  contractUnavailableLabel,
  formatOptionalCount,
  formatOptionalText,
  formatRelativeUpdated,
  syncStaleReasonLabel,
} from "./opsPresentation";
import { OPS_DRAWER_EMPTY } from "./opsDrawerEmptyCopy";
import "./ops.css";

const DASH = "—";

/**
 * Saúde operacional agregada no drawer — S_4.7.2 / empty states S_4.7.4.
 * Usa exclusivamente blocos do contrato detail (sem score, sem request extra).
 * @param {{ contract?: Record<string, unknown> | null }} props
 */
export default function OpsGlobalOperationalContext({ contract = null }) {
  if (!contract || typeof contract !== "object") {
    return <OpsEmptyState compact {...OPS_DRAWER_EMPTY.NO_OPERATIONAL} />;
  }

  const overview =
    contract.overview && typeof contract.overview === "object"
      ? /** @type {Record<string, unknown>} */ (contract.overview)
      : null;
  const activity =
    contract.activity && typeof contract.activity === "object"
      ? /** @type {Record<string, unknown>} */ (contract.activity)
      : null;
  const quality =
    contract.quality && typeof contract.quality === "object"
      ? /** @type {Record<string, unknown>} */ (contract.quality)
      : null;
  const ingestion =
    contract.ingestion && typeof contract.ingestion === "object"
      ? /** @type {Record<string, unknown>} */ (contract.ingestion)
      : null;
  const metadata =
    contract.metadata && typeof contract.metadata === "object"
      ? /** @type {Record<string, unknown>} */ (contract.metadata)
      : null;
  const sync =
    metadata?.sync && typeof metadata.sync === "object"
      ? /** @type {Record<string, unknown>} */ (metadata.sync)
      : null;
  const contact =
    overview?.contact && typeof overview.contact === "object"
      ? /** @type {Record<string, unknown>} */ (overview.contact)
      : null;

  const syncValue = (() => {
    if (!sync || sync.stale == null) {
      const rel = formatRelativeUpdated(
        metadata?.record_updated_at != null ? String(metadata.record_updated_at) : null,
      );
      return rel !== DASH ? rel : "Sem histórico suficiente";
    }
    if (sync.stale === true) {
      const lag =
        typeof sync.lag_hours === "number" && Number.isFinite(sync.lag_hours)
          ? ` (${sync.lag_hours} h de defasagem)`
          : "";
      const reason = syncStaleReasonLabel(sync.stale_reason != null ? String(sync.stale_reason) : null);
      return reason !== DASH ? `${reason}${lag}` : `Registro desatualizado${lag}`;
    }
    return formatRelativeUpdated(metadata?.record_updated_at != null ? String(metadata.record_updated_at) : null);
  })();

  const qualityValue = (() => {
    if (quality?.status === "not_available") {
      return contractUnavailableLabel(quality.reason != null ? String(quality.reason) : null);
    }
    if (!quality?.status) {
      return "Informação ainda não calculada";
    }
    return "Indisponível";
  })();

  const ingestionValue = (() => {
    if (ingestion?.status === "not_available") {
      return contractUnavailableLabel(ingestion.reason != null ? String(ingestion.reason) : null);
    }
    if (!ingestion?.status) {
      return "Dados agregados indisponíveis";
    }
    return "Indisponível";
  })();

  const sellersCount =
    typeof activity?.related_sellers_count === "number"
      ? activity.related_sellers_count
      : typeof overview?.total_sellers_related === "number"
        ? overview.total_sellers_related
        : null;

  const channels = Array.isArray(activity?.active_channels)
    ? activity.active_channels.filter(Boolean).map(String)
    : [];

  const contactValue = (() => {
    if (!contact) return "Não informado";
    if (contact.incomplete === true) return "Incompleto";
    const hasEmail = contact.has_email === true;
    const hasPhone = contact.has_phone === true;
    if (hasEmail && hasPhone) return "Completo";
    if (hasEmail || hasPhone) return "Parcial";
    return "Sem contato registrado";
  })();

  const rows = [
    { id: "sync", label: "Sincronização", value: formatOptionalText(syncValue) },
    { id: "quality", label: "Qualidade", value: formatOptionalText(qualityValue) },
    { id: "ingestion", label: "Ingestão", value: formatOptionalText(ingestionValue) },
    {
      id: "relations",
      label: "Relacionamentos",
      value: sellersCount != null ? `${formatOptionalCount(sellersCount)} seller${sellersCount === 1 ? "" : "s"}` : DASH,
      hint: channels.length ? `Canais: ${channels.join(", ")}` : null,
    },
    { id: "contact", label: "Contato", value: formatOptionalText(contactValue) },
  ];

  return (
    <div className="ops-operational-context" aria-label="Saúde operacional agregada">
      <p className="ops-scope-hint">
        Contexto agregado deste registro global — não representa nota operacional individual do cliente.
      </p>
      <dl className="ops-kv ops-operational-context__grid">
        {rows.map((row) => (
          <div key={row.id}>
            <dt>{row.label}</dt>
            <dd className="ops-operational-context__value">{row.value}</dd>
            {row.hint ? <dd className="ops-operational-context__hint">{row.hint}</dd> : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
