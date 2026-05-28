// ======================================================
// HOOK: useCopyFeedback (LEGADO — depreciado)
//
// Substituir por S7CopyButton + useCopyToClipboard (padrão oficial Suse7).
// Mantido temporariamente para compatibilidade; não usar em código novo.
// ======================================================

import { useState } from "react";

/** @deprecated Use S7CopyButton ou useCopyToClipboard */
export function useCopyFeedback() {
  const [copiedKey, setCopiedKey] = useState(null);

  function handleCopy(text, key) {
    navigator.clipboard.writeText(text ?? "");
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 6000);
  }

  return {
    copiedKey,
    handleCopy,
  };
}
