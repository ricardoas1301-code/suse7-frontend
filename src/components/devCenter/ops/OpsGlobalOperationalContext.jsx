import {
  contractUnavailableLabel,
  formatRelativeUpdated,
  syncStaleReasonLabel,
} from "./opsPresentation";
import "./ops.css";

const DASH = "—";

/**
 * Saúde operacional agregada no drawer — S_4.7.2.
 * Usa exclusivamente blocos do contrato detail (sem score, sem request extra).
 * @param {{ contract?: Record<string, unknown> | null }} props
 */
export default function OpsGlobalOperationalContext({ contract = null }) {
  const overview = /** @type {Record<string, unknown> | null | undefined} */ (contract?.overview);
  const activity = /** @type {Record<string, unknown> | null | undefined} */ (contract?.activity);
  const quality = /** @type {Record<string, unknown> | null | undefined} */ (contract?.quality);
  const ingestion = /** @type {Record<string, unknown> | null | undefined} */ (contract?.ingestion);
  const metadata = /** @type {Record<string, unknown> | null | undefined} */ (contract?.metadata);
  const sync = /** @type {Record<string, unknown> | null | undefined} */ (metadata?.sync);
  const contact = /** @type {Record<string, unknown> | null | undefined} */ (overview?.contact);

  const syncValue = (() => {
    if (!sync || sync.stale == null) {
      const rel = formatRelativeUpdated(
        metadata?.record_updated_at != null ? String(metadata.record_updated_at) : null,
      );
      return rel !== DASH ? rel : "Indisponível";
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
    return "Indisponível";
  })();

  const ingestionValue = (() => {
    if (ingestion?.status === "not_available") {
      return contractUnavailableLabel(ingestion.reason != null ? String(ingestion.reason) : null);
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
    if (!contact) return DASH;
    if (contact.incomplete === true) return "Incompleto";
    const hasEmail = contact.has_email === true;
    const hasPhone = contact.has_phone === true;
    if (hasEmail && hasPhone) return "Completo";
    if (hasEmail || hasPhone) return "Parcial";
    return "Sem contato";
  })();

  const rows = [
    { id: "sync", label: "Sincronização", value: syncValue },
    { id: "quality", label: "Qualidade", value: qualityValue },
    { id: "ingestion", label: "Ingestão", value: ingestionValue },
    {
      id: "relations",
      label: "Relacionamentos",
      value: sellersCount != null ? `${sellersCount} seller${sellersCount === 1 ? "" : "s"}` : DASH,
      hint: channels.length ? `Canais: ${channels.join(", ")}` : null,
    },
    { id: "contact", label: "Contato", value: contactValue },
  ];

  return (
    <section className="ops-operational-context" aria-label="Saúde operacional agregada">
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
    </section>
  );
}
