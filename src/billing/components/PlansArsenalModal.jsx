import { useRef } from "react";
import { SUSE7_ARSENAL_MODAL_TITLE, SUSE7_COMPLETE_ARSENAL } from "../suse7CompleteArsenal";
import { useS7DialogFocus } from "../../components/ui/useS7DialogFocus";
import "./PlansArsenalModal.css";

const MODAL_ID = "s7-plans-arsenal-modal";

/**
 * @param {{ open: boolean; onClose: () => void }} props
 */
export default function PlansArsenalModal({ open, onClose }) {
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  useS7DialogFocus({ open, onClose, containerRef: panelRef });

  if (!open) return null;

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="s7-plans-arsenal-modal-overlay" role="presentation" onMouseDown={handleOverlayMouseDown}>
      <div
        ref={panelRef}
        id={MODAL_ID}
        className="s7-plans-arsenal-modal profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s7-plans-arsenal-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="s7-plans-arsenal-modal-title" className="s7-plans-arsenal-modal__title">
          {SUSE7_ARSENAL_MODAL_TITLE}
        </h2>
        <div className="s7-plans-arsenal-modal__body">
          {SUSE7_COMPLETE_ARSENAL.map((section) => (
            <section key={section.id} className="s7-plans-arsenal-modal__section" aria-labelledby={`${section.id}-title`}>
              <h3 id={`${section.id}-title`}>{section.title}</h3>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export { MODAL_ID as PLANS_ARSENAL_MODAL_ID };
