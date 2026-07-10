import { supabase } from "../supabaseClient";
import { logIntroAuthDev } from "./introAuthSession";

const CHANNEL_NAME = "s7-auth-session-bridge";
const RESPONSE_TIMEOUT_MS = 900;

/** @type {BroadcastChannel | null} */
let channel = null;
let listenerInstalled = false;
let suppressSignedOutBroadcast = false;

/** @type {Map<string, { resolve: (value: { accessToken: string; refreshToken: string; userId: string | null } | null) => void; timeoutId: number }>} */
const pendingRequests = new Map();

function createRequestId() {
  return `s7_req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getChannel() {
  if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") {
    return null;
  }
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

/**
 * @param {import("@supabase/supabase-js").Session | null} session
 */
function toSessionPayload(session) {
  const accessToken = String(session?.access_token ?? "").trim();
  const refreshToken = String(session?.refresh_token ?? "").trim();
  if (!accessToken || !refreshToken) return null;
  return {
    accessToken,
    refreshToken,
    userId: session?.user?.id != null ? String(session.user.id) : null,
  };
}

/**
 * @param {() => import("@supabase/supabase-js").Session | null} getSessionSnapshot
 */
export function installCrossTabSessionBridge(getSessionSnapshot) {
  if (listenerInstalled) return () => {};
  const bc = getChannel();
  if (!bc) {
    logIntroAuthDev("intro_skipped_reason", { reason: "broadcast_channel_unavailable" });
    return () => {};
  }

  const onMessage = async (event) => {
    const payload = event?.data && typeof event.data === "object" ? event.data : null;
    const type = payload?.type != null ? String(payload.type) : "";

    if (type === "REQUEST_SESSION") {
      const requestId = payload?.requestId != null ? String(payload.requestId) : "";
      if (!requestId) return;
      const sessionPayload = toSessionPayload(getSessionSnapshot());
      if (!sessionPayload) return;
      bc.postMessage({ type: "SESSION_RESPONSE", requestId, ...sessionPayload });
      return;
    }

    if (type === "SESSION_RESPONSE") {
      const requestId = payload?.requestId != null ? String(payload.requestId) : "";
      const pending = pendingRequests.get(requestId);
      if (!pending) return;
      window.clearTimeout(pending.timeoutId);
      pendingRequests.delete(requestId);
      const accessToken = payload?.accessToken != null ? String(payload.accessToken) : "";
      const refreshToken = payload?.refreshToken != null ? String(payload.refreshToken) : "";
      const userId = payload?.userId != null ? String(payload.userId) : null;
      if (!accessToken || !refreshToken) {
        pending.resolve(null);
        return;
      }
      pending.resolve({ accessToken, refreshToken, userId });
      return;
    }

    if (type === "SIGN_OUT_ALL_TABS") {
      suppressSignedOutBroadcast = true;
      await supabase.auth.signOut({ scope: "local" });
    }
  };

  bc.addEventListener("message", onMessage);
  listenerInstalled = true;

  return () => {
    bc.removeEventListener("message", onMessage);
    listenerInstalled = false;
  };
}

export async function requestSessionFromOtherTabs() {
  const bc = getChannel();
  if (!bc) return null;

  const requestId = createRequestId();
  const responsePromise = new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      pendingRequests.delete(requestId);
      resolve(null);
    }, RESPONSE_TIMEOUT_MS);
    pendingRequests.set(requestId, {
      resolve,
      timeoutId,
    });
  });

  bc.postMessage({ type: "REQUEST_SESSION", requestId });
  return responsePromise;
}

export function broadcastSignOutToOtherTabs() {
  const bc = getChannel();
  if (!bc) return;
  bc.postMessage({ type: "SIGN_OUT_ALL_TABS" });
}

export function shouldBroadcastSignedOutEvent() {
  if (!suppressSignedOutBroadcast) return true;
  suppressSignedOutBroadcast = false;
  return false;
}
