import { useEffect, useMemo, useRef, useState } from "react";
import { useS7Inbox } from "../../../hooks/useS7Inbox";
import VendasGerarRelatorioModal from "../../../features/vendas/reports/VendasGerarRelatorioModal";
import { buildDailySalesSummaryNotificationModalData } from "../../../features/vendas/reports/buildDailySalesSummaryNotificationModalData";
import {
  emitOpenDailySalesSummaryModal,
  getDailySalesSummaryOpenEventName,
} from "./dailySalesSummaryModalBus";

const AUTO_OPEN_STORAGE_KEY = "s7:daily-sales-summary:auto-opened-events:v1";

/**
 * @param {Record<string, unknown> | null | undefined} item
 */
function isDailySalesSummaryNotification(item) {
  const eventType = String(item?.event_type_key ?? "").toUpperCase();
  if (eventType === "SALES:DAILY_SALES_SUMMARY") return true;
  const category = String(item?.category_code ?? "").toUpperCase();
  const type = String(item?.type_key ?? "").toUpperCase();
  return category === "SALES" && type === "DAILY_SALES_SUMMARY";
}

/**
 * @param {Record<string, unknown> | null | undefined} item
 */
function shouldOpenPopup(item) {
  const payload =
    item?.event_payload && typeof item.event_payload === "object" ? item.event_payload : null;
  const channels =
    payload?.channels && typeof payload.channels === "object" ? payload.channels : null;
  return channels?.popup === true;
}

function getAutoOpenedEvents() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(AUTO_OPEN_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((id) => String(id)).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * @param {string} eventId
 */
function rememberAutoOpenedEvent(eventId) {
  if (typeof window === "undefined" || !eventId) return;
  const existing = getAutoOpenedEvents();
  if (existing.includes(eventId)) return;
  const next = [eventId, ...existing].slice(0, 200);
  window.localStorage.setItem(AUTO_OPEN_STORAGE_KEY, JSON.stringify(next));
}

export default function DailySalesSummaryNotificationModalHost() {
  const mountedAtMsRef = useRef(Date.now());
  const [modalData, setModalData] = useState(null);
  const [open, setOpen] = useState(false);
  const { items } = useS7Inbox({ enabled: true, pollWhenOpen: true });

  const autoOpenedSet = useMemo(() => new Set(getAutoOpenedEvents()), []);

  useEffect(() => {
    const eventName = getDailySalesSummaryOpenEventName();
    /** @param {Event} ev */
    const onOpen = (ev) => {
      const detail = ev instanceof CustomEvent ? ev.detail : null;
      const inboxItem =
        detail?.inboxItem && typeof detail.inboxItem === "object" ? detail.inboxItem : null;
      if (!inboxItem || !isDailySalesSummaryNotification(inboxItem)) return;
      setModalData(buildDailySalesSummaryNotificationModalData(inboxItem));
      setOpen(true);
    };
    window.addEventListener(eventName, onOpen);
    return () => window.removeEventListener(eventName, onOpen);
  }, []);

  useEffect(() => {
    for (const item of items) {
      if (!isDailySalesSummaryNotification(item)) continue;
      if (!shouldOpenPopup(item)) continue;

      const eventId = item?.event_id != null ? String(item.event_id) : "";
      if (!eventId || autoOpenedSet.has(eventId)) continue;

      const createdAtMs = Date.parse(String(item?.created_at ?? ""));
      if (!Number.isFinite(createdAtMs)) continue;
      if (createdAtMs < mountedAtMsRef.current) continue;

      rememberAutoOpenedEvent(eventId);
      autoOpenedSet.add(eventId);
      emitOpenDailySalesSummaryModal(item, "auto_popup");
      break;
    }
  }, [items, autoOpenedSet]);

  return (
    <VendasGerarRelatorioModal
      open={open}
      onClose={() => setOpen(false)}
      modalTitle={modalData?.modalTitle ?? "Resumo de vendas"}
      modalSubtitle={modalData?.modalSubtitle ?? "Período analisado"}
      reportContext={modalData?.reportContext ?? null}
      aggregatedReport={modalData?.aggregatedReport ?? null}
      executivePreview={modalData?.executivePreview ?? null}
      visibleActions={["copy", "print", "csv"]}
    />
  );
}
