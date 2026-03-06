// ======================================================
// HOOK: useCopyFeedback
// Mostra ✓ por 5 segundos após copiar texto
// ======================================================

import { useState } from "react";

export function useCopyFeedback() {
  const [copiedKey, setCopiedKey] = useState(null);

  function handleCopy(text, key) {
    navigator.clipboard.writeText(text ?? "");
    // feedback imediato
    setCopiedKey(key);
    // mantém o check visível por 6 segundos
    setTimeout(() => {
      setCopiedKey(null);
    }, 6000);
  }

  return {
    copiedKey,
    handleCopy,
  };
}
