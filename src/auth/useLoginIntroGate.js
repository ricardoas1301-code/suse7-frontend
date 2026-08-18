import { useCallback, useEffect, useState } from "react";
import {
  getIntroPlaybackDecision,
  logIntroAuthDev,
  markIntroPlayedForCurrentSession,
} from "./introAuthSession.js";

/**
 * Gate determinístico do vídeo de abertura pós-login.
 * Nunca desativa o intro só porque auth/bootstrap ainda não terminou —
 * evita flash do Dashboard antes do vídeo.
 *
 * @param {boolean} authReady
 * @param {import("@supabase/supabase-js").User | null} user
 */
export function useLoginIntroGate(authReady, user) {
  const [introActive, setIntroActive] = useState(() => getIntroPlaybackDecision().shouldPlay);

  useEffect(() => {
    if (!authReady || !user) return;
    const decision = getIntroPlaybackDecision();
    logIntroAuthDev("intro_playback_decision", decision);
    if (decision.shouldPlay) {
      setIntroActive(true);
    }
  }, [authReady, user]);

  const finishIntro = useCallback(() => {
    markIntroPlayedForCurrentSession("layout_intro_complete");
    setIntroActive(false);
  }, []);

  return { introActive, finishIntro };
}
