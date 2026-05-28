import { useEffect, useRef } from "react";
import { S7Button } from "../../components/ui";
import { recordRenewalNoticeSeen } from "../services/billingApi";
import { renewalNoticeBannerClass } from "../renewalNoticeUi";
import "./RenewalNoticePopup.css";

/**
 * @param {{
 *   open: boolean;
 *   renewalNotice: Record<string, unknown> | null;
 *   onRenew: () => void;
 *   onClose: () => void;
 * }} props
 */
export default function RenewalNoticePopup({ open, renewalNotice, onRenew, onClose }) {
  const recordedRef = useRef(false);

  useEffect(() => {
    if (!open || !renewalNotice?.renewal_cycle_id || recordedRef.current) return;
    recordedRef.current = true;
    recordRenewalNoticeSeen(String(renewalNotice.renewal_cycle_id), {
      event: "popup_shown",
      level: renewalNotice.level ? String(renewalNotice.level) : null,
    });
  }, [open, renewalNotice]);

  if (!open || !renewalNotice) return null;

  const dismissible = renewalNotice.popup_policy?.dismissible !== false;
  const levelClass = renewalNoticeBannerClass(renewalNotice.level);

  async function handleDismiss() {
    if (renewalNotice?.renewal_cycle_id) {
      await recordRenewalNoticeSeen(String(renewalNotice.renewal_cycle_id), {
        event: "popup_dismissed",
        level: renewalNotice.level ? String(renewalNotice.level) : null,
      });
    }
    onClose();
  }

  return (
    <div className="s7-renewal-notice-popup" role="dialog" aria-modal="true" aria-labelledby="s7-renewal-notice-title">
      <div className={`s7-renewal-notice-popup__panel ${levelClass}`}>
        <h3 id="s7-renewal-notice-title">{renewalNotice.title}</h3>
        <p>{renewalNotice.message}</p>
        <div className="s7-renewal-notice-popup__actions">
          {renewalNotice.action_label ? (
            <S7Button variant="primary" onClick={onRenew}>
              {renewalNotice.action_label}
            </S7Button>
          ) : null}
          {dismissible ? (
            <S7Button variant="secondary" onClick={handleDismiss}>
              Agora não
            </S7Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
