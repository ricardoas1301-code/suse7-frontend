/**
 * Orquestração canônica: write → refresh snapshot (sem autoridade local de milestone).
 * @param {{
 *   writeFn: () => Promise<{ ok: boolean; error?: string; refreshOnly?: boolean }>;
 *   refreshFn: () => Promise<{ ok?: boolean; error?: string } | null>;
 * }} params
 */
export async function executarSalvarConfiguracaoComRefresh({ writeFn, refreshFn }) {
  const writeResult = await writeFn();
  if (!writeResult.ok) {
    return {
      ok: false,
      phase: "write",
      error: writeResult.error || "Não foi possível salvar.",
    };
  }

  if (writeResult.refreshOnly) {
    const refreshResult = await refreshFn();
    if (!refreshResult?.ok) {
      return {
        ok: false,
        phase: "refresh",
        writeOk: true,
        error:
          refreshResult?.error ||
          "Dados salvos, mas não foi possível atualizar o progresso. Tente atualizar novamente.",
        refreshRetryable: true,
      };
    }
    return { ok: true, phase: "complete", snapshot: refreshResult };
  }

  const refreshResult = await refreshFn();
  if (!refreshResult?.ok) {
    return {
      ok: false,
      phase: "refresh",
      writeOk: true,
      error:
        refreshResult?.error ||
        "Dados salvos, mas não foi possível atualizar o progresso. Tente atualizar novamente.",
      refreshRetryable: true,
    };
  }

  return { ok: true, phase: "complete", snapshot: refreshResult };
}

/**
 * @param {() => Promise<{ ok?: boolean; error?: string } | null>} refreshFn
 */
export async function tentarRefreshSnapshotAposWrite(refreshFn) {
  const refreshResult = await refreshFn();
  if (!refreshResult?.ok) {
    return {
      ok: false,
      error: refreshResult?.error || "Não foi possível atualizar o progresso.",
    };
  }
  return { ok: true, snapshot: refreshResult };
}
