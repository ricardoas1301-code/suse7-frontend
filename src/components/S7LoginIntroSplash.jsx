import { useEffect, useMemo, useRef, useState } from "react";
import { logIntroAuthDev } from "../auth/introAuthSession";
import "./S7LoginIntroSplash.css";

const INTRO_VIDEO_SRC = `${import.meta.env.BASE_URL}brand/abertura-oficial-s7.mp4`;
const FAILSAFE_MS = 5500;
const EXIT_ANIMATION_MS = 320;

/**
 * @param {{
 *  onFinish: () => void;
 * }} props
 */
export default function S7LoginIntroSplash({ onFinish }) {
  const videoRef = useRef(/** @type {HTMLVideoElement | null} */ (null));
  const failsafeTimeoutRef = useRef(/** @type {number | null} */ (null));
  const finishingRef = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const [playbackMode, setPlaybackMode] = useState(/** @type {"audio" | "muted" | "blocked"} */ ("audio"));

  const prefersReducedMotion = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true,
    [],
  );

  const finishWithTransition = () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setIsClosing(true);
    window.setTimeout(() => {
      onFinish();
    }, prefersReducedMotion ? 0 : EXIT_ANIMATION_MS);
  };

  const tryPlayVideo = async (reason = "auto") => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.muted = false;
      await video.play();
      setPlaybackMode("audio");
      logIntroAuthDev("intro_video_play_started", { mode: "audio", reason });
      return;
    } catch (audioError) {
      try {
        video.muted = true;
        await video.play();
        setPlaybackMode("muted");
        logIntroAuthDev("intro_video_play_started", { mode: "muted", reason });
        return;
      } catch (mutedError) {
        setPlaybackMode("blocked");
        logIntroAuthDev("intro_video_play_blocked", {
          reason,
          audio_error: audioError?.message ?? "play_audio_failed",
          muted_error: mutedError?.message ?? "play_muted_failed",
        });
        // Em bloqueio total, não travar UX no login social mobile.
        finishWithTransition();
      }
    }
  };

  useEffect(() => {
    if (prefersReducedMotion) {
      const t = window.setTimeout(() => finishWithTransition(), 80);
      return () => window.clearTimeout(t);
    }

    failsafeTimeoutRef.current = window.setTimeout(() => {
      finishWithTransition();
    }, FAILSAFE_MS);

    const video = videoRef.current;
    if (!video) return undefined;

    let cancelled = false;
    void (async () => {
      await tryPlayVideo("auto_after_login");
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
      if (failsafeTimeoutRef.current) window.clearTimeout(failsafeTimeoutRef.current);
    };
  }, [prefersReducedMotion]);

  return (
    <section
      className={[
        "s7-login-intro",
        isClosing ? "s7-login-intro--closing" : "",
        prefersReducedMotion ? "s7-login-intro--reduced" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Abertura oficial S7"
    >
      <video
        ref={videoRef}
        className="s7-login-intro__video"
        src={INTRO_VIDEO_SRC}
        playsInline
        preload="auto"
        onLoadedData={() => {
          logIntroAuthDev("intro_video_loaded", { src: INTRO_VIDEO_SRC });
        }}
        onPlay={() => {
          logIntroAuthDev("intro_video_play_started", { mode: playbackMode, reason: "onPlay" });
        }}
        onEnded={() => {
          finishWithTransition();
        }}
        onError={() => {
          logIntroAuthDev("intro_video_play_blocked", { reason: "video_element_error" });
          finishWithTransition();
        }}
      />
    </section>
  );
}

