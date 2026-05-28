import { useCallback, useEffect, useRef, useState } from "react";
import {
  listNotificationInbox,
  markAllInboxRead,
  markInboxItemRead,
} from "../services/centralInboxApi";
import { getSessionToken } from "../config/api";

const REFRESH_MS_OPEN = 60000;

export function useS7Inbox({ enabled = true, pollWhenOpen = false } = {}) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const applyList = useCallback((data, append = false) => {
    const nextItems = Array.isArray(data.items) ? data.items : [];
    setItems((prev) => (append ? [...prev, ...nextItems] : nextItems));
    setUnreadCount(Number(data.unread_count ?? 0));
    setCursor(data.cursor ?? null);
    setHasMore(Boolean(data.has_more));
  }, []);

  const refresh = useCallback(
    async (opts = {}) => {
      if (!enabled) return;
      const token = await getSessionToken();
      if (!token) return;

      const append = opts.append === true;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const pageCursor = append ? opts.cursor ?? null : opts.cursor ?? null;

      const { ok, items: list, unread_count, cursor: nextCursor, has_more, error: err } =
        await listNotificationInbox({
          limit: opts.limit ?? 20,
          cursor: pageCursor,
          unread: opts.unread,
        });

      if (append) setLoadingMore(false);
      else setLoading(false);

      if (!ok) {
        setError(err ?? "Erro ao carregar notificações");
        return;
      }
      applyList({ items: list, unread_count, cursor: nextCursor, has_more }, append);
    },
    [enabled, applyList]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    return refresh({ append: true, cursor });
  }, [hasMore, loadingMore, refresh, cursor]);

  const markOneRead = useCallback(async (id) => {
    const { ok } = await markInboxItemRead(id);
    if (!ok) return false;
    setItems((prev) =>
      prev.map((n) =>
        String(n.id) === String(id)
          ? { ...n, is_read: true, read_at: n.read_at || new Date().toISOString() }
          : n
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    return true;
  }, []);

  const markAllRead = useCallback(async () => {
    const { ok } = await markAllInboxRead();
    if (!ok) return false;
    const readAt = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: readAt })));
    setUnreadCount(0);
    return true;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refresh();
  }, [enabled]);

  useEffect(() => {
    if (!pollWhenOpen || !enabled) {
      if (pollRef.current) clearInterval(pollRef.current);
      return undefined;
    }
    pollRef.current = setInterval(() => refresh(), REFRESH_MS_OPEN);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollWhenOpen, enabled, refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && enabled) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled, refresh]);

  return {
    items,
    unreadCount,
    cursor,
    hasMore,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    markOneRead,
    markAllRead,
  };
}
