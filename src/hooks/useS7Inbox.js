import { useCallback, useEffect, useState } from "react";
import { useAuthBootstrap } from "../contexts/AuthBootstrapContext";
import {
  acquireInboxPollSlot,
  getSharedInboxSnapshot,
  markSharedInboxAllRead,
  markSharedInboxItemRead,
  refreshSharedInbox,
  subscribeSharedInbox,
} from "./sharedInboxStore";

/**
 * Inbox central — gated por authReady, single-flight compartilhado, poll só com UI aberta.
 *
 * @param {{ enabled?: boolean; pollWhenOpen?: boolean }} [options]
 */
export function useS7Inbox({ enabled = true, pollWhenOpen = false } = {}) {
  const { ready: authReady, user, signedOut } = useAuthBootstrap();
  const effectivelyEnabled = Boolean(enabled && authReady && !signedOut);

  const [snapshot, setSnapshot] = useState(() => getSharedInboxSnapshot());

  useEffect(() => subscribeSharedInbox(setSnapshot), []);

  useEffect(() => {
    if (!effectivelyEnabled) {
      // Logout / auth não pronta: não dispara request.
      return undefined;
    }
    void refreshSharedInbox({ force: false });
    return undefined;
  }, [effectivelyEnabled, user?.id]);

  useEffect(() => {
    if (!effectivelyEnabled || !pollWhenOpen) return undefined;
    return acquireInboxPollSlot();
  }, [effectivelyEnabled, pollWhenOpen]);

  useEffect(() => {
    if (!effectivelyEnabled || !pollWhenOpen) return undefined;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshSharedInbox({ force: true });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [effectivelyEnabled, pollWhenOpen]);

  const refresh = useCallback(
    async (opts = {}) => {
      if (!effectivelyEnabled) return;
      await refreshSharedInbox({
        force: true,
        append: opts.append === true,
        cursor: opts.cursor,
        limit: opts.limit,
        unread: opts.unread,
      });
    },
    [effectivelyEnabled],
  );

  const loadMore = useCallback(() => {
    if (!snapshot.hasMore || snapshot.loadingMore || !effectivelyEnabled) return;
    return refresh({ append: true, cursor: snapshot.cursor });
  }, [snapshot.hasMore, snapshot.loadingMore, snapshot.cursor, effectivelyEnabled, refresh]);

  const markOneRead = useCallback(async (id) => {
    if (!effectivelyEnabled) return false;
    return markSharedInboxItemRead(id);
  }, [effectivelyEnabled]);

  const markAllRead = useCallback(async () => {
    if (!effectivelyEnabled) return false;
    return markSharedInboxAllRead();
  }, [effectivelyEnabled]);

  return {
    items: snapshot.items,
    unreadCount: snapshot.unreadCount,
    cursor: snapshot.cursor,
    hasMore: snapshot.hasMore,
    loading: effectivelyEnabled ? snapshot.loading : false,
    loadingMore: snapshot.loadingMore,
    error: snapshot.error,
    refresh,
    loadMore,
    markOneRead,
    markAllRead,
  };
}
