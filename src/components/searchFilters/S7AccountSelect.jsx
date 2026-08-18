// Seletor de conta compacto com avatar (filtros de catálogo).
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import S7Icon from "../ui/S7Icon";
import { resolveAccountSelectFields } from "./resolveAccountSelectFields.js";
import "./S7AccountSelect.css";

/**
 * @param {{
 *   id?: string;
 *   accounts?: readonly Record<string, unknown>[];
 *   value?: string;
 *   onChange?: (value: string) => void;
 *   disabled?: boolean;
 *   accountLabel?: (account: Record<string, unknown>) => string;
 *   allLabel?: string;
 * }} props
 */
export default function S7AccountSelect({
  id: idProp,
  accounts = [],
  value = "",
  onChange,
  disabled = false,
  accountLabel,
  allLabel = "Todas as contas",
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selectedId = String(value ?? "").trim();
  const selectedAccount = accounts.find((a) => String(a?.id ?? "").trim() === selectedId) ?? null;
  const selectedFields = selectedAccount
    ? resolveAccountSelectFields(selectedAccount, accountLabel)
    : { id: "", label: allLabel, logoUrl: null, initial: null };

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 200),
      zIndex: 12050,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onScroll = () => updateMenuPosition();
    const onResize = () => updateMenuPosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const renderAvatar = (logoUrl, initial, generic = false) => (
    <span className="s7-account-select__avatar" aria-hidden>
      {generic ? (
        <span className="s7-account-select__avatar-generic">
          <S7Icon name="billing_layers" size={14} strokeWidth={1.75} />
        </span>
      ) : logoUrl ? (
        <img src={logoUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      ) : (
        <span className="s7-account-select__avatar-initial">{initial ?? "?"}</span>
      )}
    </span>
  );

  const menu =
    open && menuStyle
      ? createPortal(
          <div
            ref={menuRef}
            className="s7-account-select__menu"
            style={menuStyle}
            role="listbox"
            aria-labelledby={`${id}-label`}
          >
            <button
              type="button"
              role="option"
              aria-selected={!selectedId}
              className={`s7-account-select__option${!selectedId ? " s7-account-select__option--active" : ""}`}
              onClick={() => {
                onChange?.("");
                setOpen(false);
              }}
            >
              {renderAvatar(null, null, true)}
              <span className="s7-account-select__option-label">{allLabel}</span>
              {!selectedId ? (
                <S7Icon name="check" size={14} strokeWidth={2} className="s7-account-select__check" />
              ) : null}
            </button>
            {accounts.map((a) => {
              const fields = resolveAccountSelectFields(a, accountLabel);
              if (!fields.id) return null;
              const active = fields.id === selectedId;
              return (
                <button
                  key={fields.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`s7-account-select__option${active ? " s7-account-select__option--active" : ""}`}
                  onClick={() => {
                    onChange?.(fields.id);
                    setOpen(false);
                  }}
                >
                  {renderAvatar(fields.logoUrl, fields.initial)}
                  <span className="s7-account-select__option-label">{fields.label}</span>
                  {active ? (
                    <S7Icon name="check" size={14} strokeWidth={2} className="s7-account-select__check" />
                  ) : null}
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="s7-account-select" ref={rootRef}>
      <span className="s7-search-filters-card__sr-only" id={`${id}-label`}>
        Selecionar conta
      </span>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="s7-account-select__trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Selecionar conta: ${selectedFields.label}`}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
      >
        {!selectedId
          ? renderAvatar(null, null, true)
          : renderAvatar(selectedFields.logoUrl, selectedFields.initial)}
        <span className="s7-account-select__value">{selectedFields.label}</span>
        <S7Icon name="chevron_down" size={15} strokeWidth={2} className="s7-account-select__chevron" />
      </button>
      {menu}
    </div>
  );
}
