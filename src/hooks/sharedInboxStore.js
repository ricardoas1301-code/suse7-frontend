// ======================================================================
// Inbox compartilhada — single-flight + cache curto + um poller global
// Evita S7NotificationCenter + DailySales host duplicarem GET /inbox.
// ======================================================================

import {
  listNotificationInbox,
  markAllInboxRead as apiMarkAllRead,
  markInboxItemRead as apiMarkOneRead,
} from "../services/centralInboxApi";
import { getSessionToken } from "../config/api";

const CACHE_TTL_MS = 15_000;
const POLL_MS = 60_000;

/** @typedef {{
 *   items: any[];
 *   unreadCount: number;
 *   cursor: string | null;
 *   hasMore: boolean;
 *   loading: boolean;
 *   loadingMore: boolean;
 *   error: string | null;
 *   fetchedAt: number;
 * }} InboxSharedState */

/** @type {InboxSharedState} */
let state = {
  items: [],
  unreadCount: 0,
  cursor: null,
  hasMore: false,
  loading: false,
  loadingMore: false,
  error: null,
  fetchedAt: 0,
};

/** @type {Set<(s: InboxSharedState) => void>} */
const listeners = new Set();

/** @type {Promise<void> | null} */
let inflight = null;

/** @type {ReturnType<typeof setInterval> | null} */
let pollTimer = null;

/** @type {number} */
let openUiCount = 0;

function emit() {
  const snapshot = { ...state };
  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch {
      // ignore
    }
  }
}

/**
 * @param {Partial<InboxSharedState>} patch
 */
function patchState(patch) {
  state = { ...state, ...patch };
  emit();
}

/**
 * @param {{ force?: boolean; append?: boolean; cursor?: string | null; limit?: number; unread?: boolean }} [opts]
 */
export async function refreshSharedInbox(opts = {}) {
  const token = await getSessionToken();
  if (!token) {
    patchState({ loading: false, loadingMore: false, error: null });
    return;
  }

  const append = opts.append === true;
  const force = opts.force === true;
  const now = Date.now();

  if (!force && !append && inflight == null && state.fetchedAt > 0 && now - state.fetchedAt < CACHE_TTL_MS) {
    return;
  }

  if (inflight && !append) {
    await inflight;
    return;
  }

  const run = (async () => {
    if (append) patchState({ loadingMore: true, error: null });
    else patchState({ loading: true, error: null });

    const result = await listNotificationInbox({
      limit: opts.limit ?? 20,
      cursor: append ? opts.cursor ?? state.cursor : opts.cursor ?? null,
      unread: opts.unread,
    });

    if (!result.ok) {
      patchState({
        loading: false,
        loadingMore: false,
        error: result.error ?? "Erro ao carregar notificações",
      });
      return;
    }

    const nextItems = Array.isArray(result.items) ? result.items : [];
    patchState({
      items: append ? [...state.items, ...nextItems] : nextItems,
      unreadCount: Number(result.unread_count ?? 0),
      cursor: result.cursor ?? null,
      hasMore: Boolean(result.has_more),
      loading: false,
      loadingMore: false,
      error: null,
      fetchedAt: Date.now(),
    });
  })();

  if (!append) {
    inflight = run.finally(() => {
      inflight = null;
    });
    await inflight;
    return;
  }

  await run;
}

function ensurePoller() {
  if (pollTimer != null) return;
  if (openUiCount <= 0) return;
  pollTimer = setInterval(() => {
    if (openUiCount <= 0) return;
    void refreshSharedInbox({ force: true });
  }, POLL_MS);
}

function stopPoller() {
  if (pollTimer != null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/** Host UI abriu superfície que permite polling. */
export function acquireInboxPollSlot() {
  openUiCount += 1;
  ensurePoller();
  return () => {
    openUiCount = Math.max(0, openUiCount - 1);
    if (openUiCount <= 0) stopPoller();
  };
}

/**
 * @param {(s: InboxSharedState) => void} listener
 */
export function subscribeSharedInbox(listener) {
  listeners.add(listener);
  listener({ ...state });
  return () => {
    listeners.delete(listener);
  };
}

export function getSharedInboxSnapshot() {
  return { ...state };
}

export async function markSharedInboxItemRead(id) {
  const { ok } = await apiMarkOneRead(id);
  if (!ok) return false;
  patchState({
    items: state.items.map((n) =>
      String(n.id) === String(id)
        ? { ...n, is_read: true, read_at: n.read_at || new Date().toISOString() }
        : n,
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  });
  return true;
}

export async function markSharedInboxAllRead() {
  const { ok } = await apiMarkAllRead();
  if (!ok) return false;
  const readAt = new Date().toISOString();
  patchState({
    items: state.items.map((n) => ({ ...n, is_read: true, read_at: readAt })),
    unreadCount: 0,
  });
  return true;
}

export function resetSharedInboxForTests() {
  stopPoller();
  inflight = null;
  openUiCount = 0;
  state = {
    items: [],
    unreadCount: 0,
    cursor: null,
    hasMore: false,
    loading: false,
    loadingMore: false,
    error: null,
    fetchedAt: 0,
  };
}
