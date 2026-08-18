import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Modal 2 — recompensa (imagem + mensagem).
 * @param {{
 *   reward: {
 *     imageSrc: string;
 *     imageAlt?: string;
 *     paragraphs: string[];
 *   };
 *   onFechar: () => void;
 * }} props
 */
export default function EasterEggRewardModal({ reward, onFechar }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const modalNode = (
    <div
      className="s7-easter-egg__overlay"
      role="presentation"
      onMouseDown={() => onFechar()}
    >
      <div
        className="s7-easter-egg__modal s7-easter-egg__modal--reward"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s7-easter-egg-reward-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="s7-easter-egg__head s7-easter-egg__head--reward">
          <h3 id="s7-easter-egg-reward-title" className="s7-easter-egg__title">
            Segredo encontrado
          </h3>
        </header>

        <div className="s7-easter-egg__reward-body">
          <div className="s7-easter-egg__photo-wrap">
            <img
              src={reward.imageSrc}
              alt={reward.imageAlt || ""}
              className="s7-easter-egg__photo"
              loading="eager"
              decoding="async"
            />
          </div>

          <div className="s7-easter-egg__message">
            {reward.paragraphs.map((linha, index) =>
              linha === "" ? (
                <br key={`spacer-${index}`} />
              ) : (
                <p key={`line-${index}`} className="s7-easter-egg__message-line">
                  {linha}
                </p>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : modalNode;
}
