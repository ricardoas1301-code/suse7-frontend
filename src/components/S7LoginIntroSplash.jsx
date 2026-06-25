import { useEffect, useMemo, useRef, useState } from "react";
import "./S7LoginIntroSplash.css";

const INTRO_VIDEO_SRC = "/brand/abertura-oficial-s7.mp4";
const FAILSAFE_MS = 5500;
const ERROR_REDIRECT_MS = 900;
const EXIT_ANIMATION_MS = 320;

/**
 * @param {{
 *  onFinish: () => void;
 * }} props
 */
export default function S7LoginIntroSplash({ onFinish }) {
  const videoRef = useRef(/** @type {HTMLVideoElement | null} */ (null));
  const errorTimeoutRef = useRef(/** @type {number | null} */ (null));
  const failsafeTimeoutRef = useRef(/** @type {number | null} */ (null));
  const finishingRef = useRef(false);
  const [showContinue, setShowContinue] = useState(false);
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

    const playWithFallback = async () => {
      try {
        video.muted = false;
        await video.play();
        if (!cancelled) setPlaybackMode("audio");
        return;
      } catch {
        try {
          video.muted = true;
          await video.play();
          if (!cancelled) setPlaybackMode("muted");
        } catch {
          if (!cancelled) {
            setPlaybackMode("blocked");
            setShowContinue(true);
            errorTimeoutRef.current = window.setTimeout(() => {
              finishWithTransition();
            }, ERROR_REDIRECT_MS);
          }
        }
      }
    };

    playWithFallback();

    return () => {
      cancelled = true;
      if (failsafeTimeoutRef.current) window.clearTimeout(failsafeTimeoutRef.current);
      if (errorTimeoutRef.current) window.clearTimeout(errorTimeoutRef.current);
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
        onEnded={finishWithTransition}
        onError={() => {
          setShowContinue(true);
          if (!errorTimeoutRef.current) {
            errorTimeoutRef.current = window.setTimeout(() => {
              finishWithTransition();
            }, ERROR_REDIRECT_MS);
          }
        }}
      />

      <button type="button" className="s7-login-intro__skip" onClick={finishWithTransition}>
        Pular
      </button>

      {showContinue ? (
        <button type="button" className="s7-login-intro__continue" onClick={finishWithTransition}>
          Continuar
        </button>
      ) : null}

      {playbackMode === "muted" ? (
        <span className="s7-login-intro__hint">Reprodução silenciosa iniciada</span>
      ) : null}
    </section>
  );
}

