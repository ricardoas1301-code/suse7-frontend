// ============================================================
// Painel — destinatários por canal (WhatsApp / e-mail) na tela de tipos de alerta
// Persistência apenas via API (backend como fonte da verdade)
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  NOTIFICATION_ROUTING_CHANNELS,
  NOTIFICATION_ROUTING_TYPE_LOOKUP,
} from "../../constants/notificationRoutingCatalog";
import { putNotificationRoutingRulesBatch } from "../../services/notificationRoutingService";
import "./NotificationRoutingRecipientsPanel.css";

function formatWhatsAppMasked(digits) {
  const d = String(digits || "").replace(/\D/g, "");
  if (d.length < 4) return d || "—";
  const tail = d.slice(-4);
  const head = d.slice(0, Math.max(0, d.length - 4));
  const masked = head.replace(/\d/g, "•");
  return `${masked}${tail}`;
}

function selectionFromRules(routingKey, channel, rules) {
  /** @type {Record<string, { enabled: boolean, accounts: Set<string> }>} */
  const map = {};
  const list = Array.isArray(rules) ? rules : [];
  for (const r of list) {
    if (!r?.active) continue;
    if (r.notification_type !== routingKey || r.notification_channel !== channel) continue;
    const cid = r.contact_id != null ? String(r.contact_id) : "";
    if (!cid) continue;
    if (!map[cid]) map[cid] = { enabled: true, accounts: new Set() };
    const aid = r.marketplace_account_id != null ? String(r.marketplace_account_id) : "";
    if (aid) map[cid].accounts.add(aid);
  }
  return map;
}

function buildPayloadRules(selection, supportsAccountRouting) {
  const rules = [];
  for (const [cid, row] of Object.entries(selection)) {
    if (!row?.enabled) continue;
    const ids = [...(row.accounts || new Set())];
    if (supportsAccountRouting && ids.length === 0) continue;
    rules.push({
      contact_id: cid,
      marketplace_account_ids: supportsAccountRouting ? ids : [],
    });
  }
  return rules;
}

export default function NotificationRoutingRecipientsPanel({
  routingKey,
  channel,
  contacts,
  marketplaceAccounts,
  routingRules,
  masterChannelEnabled,
  addNotification,
}) {
  const catalogMeta = NOTIFICATION_ROUTING_TYPE_LOOKUP[routingKey] ?? null;
  const supportsAccountRouting = catalogMeta?.supportsAccountRouting !== false;

  const [expanded, setExpanded] = useState(false);
  const [selection, setSelection] = useState({});
  const [saving, setSaving] = useState(false);
  const warnedNoAccountsRef = useRef(false);

  const filteredContacts = useMemo(() => {
    const list = Array.isArray(contacts) ? contacts : [];
    const active = list.filter((c) => c?.active !== false);
    if (channel === NOTIFICATION_ROUTING_CHANNELS.whatsapp) {
      return active.filter((c) => String(c?.whatsapp || "").replace(/\D/g, "").length > 0);
    }
    if (channel === NOTIFICATION_ROUTING_CHANNELS.email) {
      return active.filter((c) => String(c?.email || "").trim());
    }
    return [];
  }, [contacts, channel]);

  const rulesFingerprint = useMemo(() => {
    const rows = Array.isArray(routingRules) ? routingRules : [];
    return rows
      .filter(
        (r) =>
          r?.active &&
          r.notification_type === routingKey &&
          r.notification_channel === channel
      )
      .map((r) => `${r.contact_id ?? ""}:${r.marketplace_account_id ?? ""}`)
      .sort()
      .join("|");
  }, [routingRules, routingKey, channel]);

  useEffect(() => {
    setSelection(selectionFromRules(routingKey, channel, routingRules));
    warnedNoAccountsRef.current = false;
  }, [routingKey, channel, rulesFingerprint]); // eslint-disable-line react-hooks/exhaustive-deps -- sync quando o backend muda

  const channelTitle =
    channel === NOTIFICATION_ROUTING_CHANNELS.whatsapp ? "Destinatários WhatsApp" : "Destinatários e-mail";

  const persist = useCallback(
    async (nextSelection) => {
      const rulesPayload = buildPayloadRules(nextSelection, supportsAccountRouting);
      setSaving(true);
      const res = await putNotificationRoutingRulesBatch({
        notification_type: routingKey,
        notification_channel: channel,
        rules: rulesPayload,
      });
      setSaving(false);
      if (!res.ok) {
        addNotification?.({
          type: "error",
          title: "Roteamento",
          message: res.error ?? "Não foi possível salvar destinatários.",
        });
        return false;
      }
      window.dispatchEvent(new Event("suse7:routingRulesChanged"));
      return true;
    },
    [routingKey, channel, supportsAccountRouting, addNotification]
  );

  const toggleExpanded = () => setExpanded((v) => !v);

  const toggleContact = async (contactId, checked) => {
    const cid = String(contactId);
    const next = { ...selection };
    if (checked) {
      next[cid] = { enabled: true, accounts: new Set(next[cid]?.accounts || []) };
      setSelection(next);
      if (!supportsAccountRouting) {
        await persist(next);
        return;
      }
      if (marketplaceAccounts.length === 0) {
        if (!warnedNoAccountsRef.current) {
          warnedNoAccountsRef.current = true;
          addNotification?.({
            type: "warning",
            title: channelTitle,
            message: "Conecte uma conta marketplace para escolher onde este alerta se aplica.",
          });
        }
        return;
      }
      return;
    }
    delete next[cid];
    setSelection(next);
    await persist(next);
  };

  const toggleAccount = async (contactId, accountId, checked) => {
    const cid = String(contactId);
    const aid = String(accountId);
    const base = selection[cid]?.enabled ? selection[cid] : { enabled: true, accounts: new Set() };
    const acc = new Set(base.accounts || []);
    if (checked) acc.add(aid);
    else acc.delete(aid);
    const next = {
      ...selection,
      [cid]: { enabled: true, accounts: acc },
    };
    setSelection(next);
    await persist(next);
  };

  if (!routingKey || !catalogMeta) return null;

  const supported = catalogMeta.supportedChannels?.includes(channel);
  if (!supported) return null;

  if (!masterChannelEnabled) return null;

  return (
    <div className="notif-routing-panel">
      <button type="button" className="notif-routing-panel__toggle" onClick={toggleExpanded}>
        <span>{channelTitle}</span>
        <span className={`notif-routing-panel__chev ${expanded ? "is-open" : ""}`} aria-hidden />
      </button>

      {expanded ? (
        <div className="notif-routing-panel__body">
          {saving ? <p className="notif-routing-panel__hint">Salvando…</p> : null}

          {filteredContacts.length === 0 ? (
            <div className="notif-routing-panel__empty">
              <p>Nenhum destinatário com {channel === NOTIFICATION_ROUTING_CHANNELS.whatsapp ? "WhatsApp" : "e-mail"} cadastrado.</p>
              <Link className="notif-routing-panel__link" to="/perfil/preferencias/notificacoes/destinatarios">
                Cadastrar destinatários
              </Link>
            </div>
          ) : (
            <ul className="notif-routing-panel__list">
              {filteredContacts.map((c) => {
                const cid = String(c.id);
                const row = selection[cid];
                const checked = Boolean(row?.enabled);
                const waLabel =
                  channel === NOTIFICATION_ROUTING_CHANNELS.whatsapp ? formatWhatsAppMasked(c.whatsapp) : null;
                const emLabel =
                  channel === NOTIFICATION_ROUTING_CHANNELS.email ? String(c.email || "").trim() : null;

                return (
                  <li key={cid} className="notif-routing-panel__item">
                    <label className="notif-routing-panel__contact-row">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(ev) => toggleContact(cid, ev.target.checked)}
                        disabled={saving}
                      />
                      <span className="notif-routing-panel__contact-meta">
                        <strong>{c.name}</strong>
                        {c.role ? <span className="notif-routing-panel__role"> — {c.role}</span> : null}
                        <span className="notif-routing-panel__chan-line">
                          {channel === NOTIFICATION_ROUTING_CHANNELS.whatsapp ? (
                            <>WhatsApp: {waLabel}</>
                          ) : (
                            <>E-mail: {emLabel}</>
                          )}
                        </span>
                      </span>
                    </label>

                    {checked && supportsAccountRouting ? (
                      <div className="notif-routing-panel__accounts">
                        {marketplaceAccounts.length === 0 ? (
                          <p className="notif-routing-panel__warn">
                            Nenhuma conta marketplace conectada ainda.
                          </p>
                        ) : (
                          <ul>
                            {marketplaceAccounts.map((acc) => {
                              const aid = String(acc.id ?? acc.marketplace_account_id ?? "");
                              const label =
                                acc.nickname ||
                                acc.account_alias ||
                                acc.ml_nickname ||
                                acc.external_seller_id ||
                                aid.slice(0, 8);
                              const mp = acc.marketplace ? String(acc.marketplace).replace(/_/g, " ") : "Marketplace";
                              const status = acc.status ? String(acc.status) : "";
                              const picked = row?.accounts?.has(aid);
                              return (
                                <li key={aid}>
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={picked}
                                      disabled={saving || !aid}
                                      onChange={(ev) => toggleAccount(cid, aid, ev.target.checked)}
                                    />
                                    <span>
                                      {mp} — {label}
                                      {acc.external_seller_id ? (
                                        <span className="notif-routing-panel__sub">
                                          {" "}
                                          · ID {acc.external_seller_id}
                                        </span>
                                      ) : null}
                                      {status ? (
                                        <span className="notif-routing-panel__sub"> · {status}</span>
                                      ) : null}
                                    </span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    ) : null}

                    {checked && supportsAccountRouting && marketplaceAccounts.length > 0 ? (
                      <p className="notif-routing-panel__micro">
                        Marque as contas marketplace pelas quais este alerta deve ser encaminhado.
                      </p>
                    ) : null}

                    {checked && !supportsAccountRouting ? (
                      <p className="notif-routing-panel__micro">
                        Este alerta usa roteamento global (sem seleção por conta neste tipo).
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
