// Menu compacto de filtros rápidos (substitui linha de chips).

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";

import S7Icon from "../ui/S7Icon";

import "./S7QuickFiltersDropdown.css";



/**

 * @typedef {{

 *   key: string;

 *   label: string;

 *   icon: string;

 *   iconTone: string;

 *   active?: boolean;

 *   disabled?: boolean;

 *   title?: string;

 *   section?: string;

 *   sectionLabel?: string;

 *   buttonLabel?: string;

 *   onSelect: () => void;

 * }} S7QuickFilterMenuItem

 */



/**

 * @param {{

 *   id?: string;

 *   label?: string;

 *   items?: S7QuickFilterMenuItem[];

 * }} props

 */

export default function S7QuickFiltersDropdown({

  id: idProp,

  label = "Filtros rápidos",

  items = [],

}) {

  const autoId = useId();

  const id = idProp ?? autoId;

  const [open, setOpen] = useState(false);

  const [menuStyle, setMenuStyle] = useState(null);

  const rootRef = useRef(null);

  const triggerRef = useRef(null);

  const menuRef = useRef(null);



  const activeItems = useMemo(() => items.filter((item) => item.active === true), [items]);

  const activeCount = activeItems.length;

  const singleActive = activeCount === 1 ? activeItems[0] : null;

  const menuGroups = useMemo(() => {
    /** @type {Array<{ sectionKey: string; sectionLabel: string | null; items: typeof items }>} */
    const groups = [];
    /** @type {Map<string, typeof items>} */
    const map = new Map();
    /** @type {string[]} */
    const order = [];

    for (const item of items) {
      const sectionKey = String(item.section ?? "").trim();
      if (!map.has(sectionKey)) {
        map.set(sectionKey, []);
        order.push(sectionKey);
      }
      map.get(sectionKey)?.push(item);
    }

    for (const sectionKey of order) {
      const groupItems = map.get(sectionKey) ?? [];
      if (!groupItems.length) continue;
      const sectionLabel =
        sectionKey && groupItems[0]?.sectionLabel
          ? String(groupItems[0].sectionLabel)
          : null;
      groups.push({ sectionKey, sectionLabel, items: groupItems });
    }

    return groups;
  }, [items]);



  const triggerIcon = singleActive?.icon ?? "filter";

  const triggerIconTone = singleActive?.iconTone ?? "neutral";

  const triggerLabel = singleActive?.buttonLabel ?? singleActive?.label ?? label;



  const updateMenuPosition = useCallback(() => {

    const el = triggerRef.current;

    if (!el) return;

    const rect = el.getBoundingClientRect();

    setMenuStyle({

      position: "fixed",

      top: rect.bottom + 4,

      left: rect.left,

      width: Math.max(rect.width, 240),

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



  const menu =

    open && menuStyle

      ? createPortal(

          <div ref={menuRef} className="s7-quick-filters-dropdown__menu" style={menuStyle} role="menu">

            {menuGroups.map((group, groupIndex) => (
              <div key={group.sectionKey || `group-${groupIndex}`} className="s7-quick-filters-dropdown__section">
                {group.sectionLabel ? (
                  <div className="s7-quick-filters-dropdown__section-label" role="presentation">
                    {group.sectionLabel}
                  </div>
                ) : null}
                {groupIndex > 0 && group.sectionLabel ? (
                  <div className="s7-quick-filters-dropdown__section-divider" aria-hidden />
                ) : null}
                {group.items.map((item) => (
              <button

                key={item.key}

                type="button"

                role="menuitemradio"

                aria-checked={item.active === true}

                disabled={item.disabled === true}

                className={`s7-quick-filters-dropdown__item${item.active ? " s7-quick-filters-dropdown__item--active" : ""}`}

                onClick={() => {

                  if (item.disabled) return;

                  item.onSelect();

                  setOpen(false);

                }}

              >

                <span

                  className={`s7-quick-filters-dropdown__item-icon products-catalog__filter-chip-icon products-catalog__filter-chip-icon--${item.iconTone}`}

                  aria-hidden

                >

                  <S7Icon name={item.icon} size={15} strokeWidth={1.65} />

                </span>

                <span className="s7-quick-filters-dropdown__item-label">{item.label}</span>

                {item.active ? (

                  <S7Icon name="check" size={14} strokeWidth={2} className="s7-quick-filters-dropdown__check" />

                ) : null}

              </button>
                ))}
              </div>
            ))}

          </div>,

          document.body

        )

      : null;



  return (

    <div className="s7-quick-filters-dropdown" ref={rootRef}>

      <span className="s7-search-filters-card__sr-only" id={`${id}-label`}>

        {label}

      </span>

      <button

        ref={triggerRef}

        type="button"

        id={id}

        className="s7-quick-filters-dropdown__trigger"

        aria-haspopup="menu"

        aria-expanded={open}

        aria-labelledby={`${id}-label`}

        onClick={() => setOpen((v) => !v)}

      >

        <span

          className={`s7-quick-filters-dropdown__trigger-icon-wrap products-catalog__filter-chip-icon products-catalog__filter-chip-icon--${triggerIconTone}`}

          aria-hidden

        >

          <S7Icon name={triggerIcon} size={15} strokeWidth={1.65} />

        </span>

        <span className="s7-quick-filters-dropdown__trigger-label">{triggerLabel}</span>

        {activeCount > 1 ? (

          <span className="s7-quick-filters-dropdown__count" aria-label={`${activeCount} filtros ativos`}>

            {activeCount}

          </span>

        ) : null}

        <S7Icon name="chevron_down" size={15} strokeWidth={2} className="s7-quick-filters-dropdown__chevron" />

      </button>

      {menu}

    </div>

  );

}


