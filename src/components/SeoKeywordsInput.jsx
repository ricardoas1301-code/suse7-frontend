/**
 * SeoKeywordsInput — Tag Input estilo Bling para palavras-chave SEO
 * - Enter/Tab cria tag
 * - Paste com vírgula/; split em múltiplas tags
 * - Chips removíveis com X
 * - Sem tags vazias/duplicadas, limite 10
 */

import { useCallback, useEffect, useRef, useState } from "react";
import "./SeoKeywordsInput.css";

const MAX_TAGS = 10;
const SEPARATORS = /[,;]+/;

function parseValue(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split(SEPARATORS)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function toStorageString(tags) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

export function SeoKeywordsInput({ value = "", onChange, placeholder, id, className = "", disabled }) {
  const [tags, setTags] = useState(() => parseValue(value));
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const parsed = parseValue(value);
    setTags(parsed);
  }, [value]);

  const notify = useCallback(
    (newTags) => {
      setTags(newTags);
      onChange?.(toStorageString(newTags));
    },
    [onChange]
  );

  const addTag = useCallback(
    (raw) => {
      const t = String(raw || "").trim().toLowerCase();
      if (!t) return;
      setTags((prev) => {
        if (prev.includes(t) || prev.length >= MAX_TAGS) return prev;
        const next = [...prev, t];
        onChange?.(toStorageString(next));
        return next;
      });
      setInputVal("");
    },
    [onChange]
  );

  const removeTag = useCallback(
    (index) => {
      setTags((prev) => {
        const next = prev.filter((_, i) => i !== index);
        onChange?.(toStorageString(next));
        return next;
      });
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        addTag(inputVal);
        return;
      }
      if (e.key === "Backspace" && !inputVal && tags.length > 0) {
        e.preventDefault();
        removeTag(tags.length - 1);
        return;
      }
    },
    [inputVal, tags, addTag, removeTag]
  );

  const handlePaste = useCallback(
    (e) => {
      const pasted = e.clipboardData?.getData("text") || "";
      const parts = pasted.split(SEPARATORS).map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (parts.length <= 1) return;
      e.preventDefault();
      setTags((prev) => {
        const seen = new Set(prev);
        const toAdd = parts.filter((p) => !seen.has(p) && seen.add(p));
        const next = [...prev, ...toAdd].slice(0, MAX_TAGS);
        onChange?.(toStorageString(next));
        return next;
      });
      setInputVal("");
    },
    [onChange]
  );

  const handleInputChange = (e) => {
    setInputVal(e.target.value);
  };

  const handleBlur = () => {
    if (inputVal.trim()) addTag(inputVal);
  };

  const canAdd = tags.length < MAX_TAGS;

  return (
    <div className={`seo-keywords-input ${className}`.trim()} id={id}>
      <div className="seo-keywords-input-inner">
        {tags.map((tag, i) => (
          <span key={`${tag}-${i}`} className="seo-keywords-tag">
            {tag}
            <button
              type="button"
              className="seo-keywords-tag-remove"
              onClick={() => removeTag(i)}
              aria-label={`Remover ${tag}`}
              tabIndex={-1}
            >
              ×
            </button>
          </span>
        ))}
        {canAdd && (
          <input
            ref={inputRef}
            type="text"
            className="seo-keywords-input-field"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={handleBlur}
            placeholder={tags.length === 0 ? placeholder : ""}
            disabled={disabled}
            autoComplete="off"
          />
        )}
      </div>
      {tags.length >= MAX_TAGS && (
        <span className="seo-keywords-hint">Máximo {MAX_TAGS} tags</span>
      )}
    </div>
  );
}
