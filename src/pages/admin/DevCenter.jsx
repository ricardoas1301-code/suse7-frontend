// ======================================================================
// Dev Center — centro de comando (MVP: ricardo@suse7.com.br)
// ======================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardCopy,
  Eraser,
  Save,
  Plus,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Circle,
  History,
  Sparkles,
} from "lucide-react";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import {
  devCenterCreateMission,
  devCenterDeleteDecision,
  devCenterGetMission,
  devCenterListMissions,
  devCenterPatchContext,
  devCenterPatchDecision,
  devCenterPatchMission,
  devCenterPostDecision,
  devCenterSaveAll,
  devCenterPostNextStep,
  devCenterPatchNextStep,
  devCenterDeleteNextStep,
} from "../../services/devCenterApi";
import "./DevCenter.css";

const STATUS_OPTS = [
  { value: "nao_iniciada", label: "Não iniciada" },
  { value: "iniciada", label: "Iniciada" },
  { value: "em_analise", label: "Em análise" },
  { value: "em_execucao", label: "Em execução" },
  { value: "em_validacao", label: "Em validação" },
  { value: "concluida", label: "Concluída" },
  { value: "arquivada", label: "Arquivada" },
];

const PRIORITY_OPTS = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Crítica" },
];

export function statusLabel(v) {
  return STATUS_OPTS.find((o) => o.value === v)?.label ?? v;
}

export function priorityLabel(v) {
  return PRIORITY_OPTS.find((o) => o.value === v)?.label ?? v;
}

/** @param {{ status: string }} m */
function missionSidebarSection(m) {
  const s = m.status;
  if (s === "arquivada") return "arquivadas";
  if (s === "concluida") return "concluidas";
  if (s === "nao_iniciada") return "proximas";
  return "atual";
}

/**
 * @param {object} mission
 * @param {object[]} decisions
 * @param {{ rico: string; neo: string; pedro: string }} handoff
 * @param {object[]} nextSteps
 */
export function buildFullDevContextText(mission, decisions, handoff, nextSteps) {
  const decBlock =
    decisions && decisions.length
      ? decisions
          .map((d, i) => {
            const dt = d.created_at
              ? new Date(d.created_at).toLocaleString("pt-BR")
              : "";
            const line = `${i + 1}. ${d.decision_text || ""}`.trim();
            const head = dt ? `${line} (${dt})` : line;
            return d.reason && String(d.reason).trim()
              ? `${head}\n   Motivo: ${d.reason}`
              : head;
          })
          .join("\n")
      : "—";

  const stepsBlock =
    nextSteps && nextSteps.length
      ? nextSteps
          .map((s) => `${s.is_done ? "[x]" : "[ ]"} ${s.text || ""}`.trim())
          .join("\n")
      : "—";

  const nz = (s) => (s && String(s).trim() ? String(s) : "—");

  const execBlock = [
    `Objetivo: ${nz(mission?.exec_objective)}`,
    `Contexto: ${nz(mission?.exec_context)}`,
    `Problema atual: ${nz(mission?.exec_problem)}`,
    `Onde parou: ${nz(mission?.exec_where_stopped)}`,
  ].join("\n");

  return [
    `MISSÃO: ${mission?.title ?? "—"}`,
    `STATUS: ${statusLabel(mission?.status)}`,
    `MÓDULO: ${mission?.module && String(mission.module).trim() ? mission.module : "—"}`,
    "",
    "RESUMO EXECUTIVO:",
    execBlock,
    mission?.summary && String(mission.summary).trim()
      ? `\nResumo (livre):\n${mission.summary}`
      : "",
    "",
    "RICO:",
    nz(handoff?.rico),
    "",
    "NEO:",
    nz(handoff?.neo),
    "",
    "PEDRO:",
    nz(handoff?.pedro),
    "",
    "DECISÕES:",
    decBlock,
    "",
    "PRÓXIMOS PASSOS:",
    stepsBlock,
  ]
    .filter(Boolean)
    .join("\n");
}

async function copyText(text, onDone, onErr) {
  try {
    await navigator.clipboard.writeText(text);
    onDone?.();
  } catch {
    onErr?.();
  }
}

/** @param {{ label: string; value: string; onChange: (v: string) => void; onCopy: () => void; onClear: () => void; onSave: () => void; saving?: boolean }} props */
function HandoffCard({ label, value, onChange, onCopy, onClear, onSave, saving }) {
  return (
    <div className="dev-center__handoff-card">
      <div className="dev-center__handoff-card-head">
        <span className="dev-center__handoff-name">{label}</span>
        <div className="dev-center__handoff-actions">
          <button type="button" className="s7-btn dev-center__btn-tight s7-btn--ghost" onClick={onCopy}>
            <ClipboardCopy size={16} />
            Copiar
          </button>
          <button type="button" className="s7-btn dev-center__btn-tight s7-btn--ghost" onClick={onClear}>
            <Eraser size={16} />
            Limpar
          </button>
          <button
            type="button"
            className="s7-btn dev-center__btn-tight s7-btn--primary"
            onClick={onSave}
            disabled={saving}
          >
            <Save size={16} />
            Salvar
          </button>
        </div>
      </div>
      <textarea
        className="dev-center__textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Contexto e handoff — ${label}…`}
        spellCheck={false}
      />
    </div>
  );
}

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return String(iso);
  }
}

export default function DevCenter() {
  const { addNotification } = useNotifications();
  const [booting, setBooting] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [missions, setMissions] = useState(/** @type {any[]} */ ([]));
  const [selectedId, setSelectedId] = useState(/** @type {string|null} */ (null));
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [mission, setMission] = useState(/** @type {any|null} */ (null));
  const [decisions, setDecisions] = useState(/** @type {any[]} */ ([]));
  const [nextSteps, setNextSteps] = useState(/** @type {any[]} */ ([]));
  const [history, setHistory] = useState(/** @type {any[]} */ ([]));
  const [rico, setRico] = useState("");
  const [neo, setNeo] = useState("");
  const [pedro, setPedro] = useState("");
  const [savingHandoff, setSavingHandoff] = useState(/** @type {null | "rico" | "neo" | "pedro"} */ (null));
  const [savingAll, setSavingAll] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newMissionTitle, setNewMissionTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [newDecisionText, setNewDecisionText] = useState("");
  const [newDecisionReason, setNewDecisionReason] = useState("");
  const [newStepText, setNewStepText] = useState("");

  const notifyOk = (msg) =>
    addNotification({
      event_type: "DEV_CENTER",
      title: "Dev Center",
      message: msg,
      severity: NOTIFICATION_SEVERITY.INFO,
    });

  const notifyErr = (msg) =>
    addNotification({
      event_type: "DEV_CENTER",
      title: "Dev Center",
      message: msg,
      severity: NOTIFICATION_SEVERITY.WARNING,
    });

  const refreshMissions = useCallback(async () => {
    const r = await devCenterListMissions();
    if (r.ok && r.data?.missions) {
      setMissions(r.data.missions);
      return r.data.missions;
    }
    return null;
  }, []);

  const loadDetail = useCallback(
    async (id) => {
      const r = await devCenterGetMission(id);
      if (!r.ok || !r.data?.mission) {
        notifyErr(r.error || "Não foi possível carregar a missão.");
        return;
      }
      setMission(r.data.mission);
      setDecisions(r.data.decisions ?? []);
      setNextSteps(r.data.next_steps ?? []);
      setHistory(r.data.history ?? []);
      setRico(r.data.context?.rico_text ?? "");
      setNeo(r.data.context?.neo_text ?? "");
      setPedro(r.data.context?.pedro_text ?? "");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBooting(true);
      const r = await devCenterListMissions();
      if (cancelled) return;
      if (!r.ok) {
        setAllowed(false);
        setBooting(false);
        return;
      }
      setAllowed(true);
      const list = r.data?.missions ?? [];
      setMissions(list);
      if (list.length) {
        setSelectedId((prev) => prev ?? list[0].id);
      }
      setBooting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId || !allowed) return;
    let cancelled = false;
    (async () => {
      setLoadingDetail(true);
      await loadDetail(selectedId);
      if (!cancelled) setLoadingDetail(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, allowed, loadDetail]);

  const fullContextText = useMemo(
    () =>
      mission
        ? buildFullDevContextText(mission, decisions, { rico, neo, pedro }, nextSteps)
        : "",
    [mission, decisions, rico, neo, pedro, nextSteps]
  );

  const grouped = useMemo(() => {
    const g = { atual: [], proximas: [], concluidas: [], arquivadas: [] };
    for (const m of missions) {
      g[missionSidebarSection(m)].push(m);
    }
    const sortFn = (a, b) =>
      new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    g.atual.sort(sortFn);
    g.proximas.sort(sortFn);
    g.concluidas.sort(sortFn);
    g.arquivadas.sort(sortFn);
    return g;
  }, [missions]);

  const handleCopyFull = () => {
    copyText(
      fullContextText,
      () => notifyOk("Contexto completo copiado."),
      () => notifyErr("Não foi possível copiar.")
    );
  };

  const saveEverything = async () => {
    if (!mission?.id) return;
    setSavingAll(true);
    const r = await devCenterSaveAll(mission.id, {
      mission: { ...mission },
      context: { rico_text: rico, neo_text: neo, pedro_text: pedro },
      next_steps: nextSteps.map((s) => ({
        id: s.id,
        text: s.text,
        is_done: s.is_done,
      })),
    });
    setSavingAll(false);
    if (!r.ok) {
      notifyErr(r.data?.message || r.error || "Falha ao salvar tudo.");
      return;
    }
    if (r.data?.mission) {
      setMission(r.data.mission);
      setDecisions(r.data.decisions ?? []);
      setNextSteps(r.data.next_steps ?? []);
      setHistory(r.data.history ?? []);
      setRico(r.data.context?.rico_text ?? "");
      setNeo(r.data.context?.neo_text ?? "");
      setPedro(r.data.context?.pedro_text ?? "");
    }
    await refreshMissions();
    notifyOk("Tudo salvo no servidor.");
  };

  const clearDrafts = async () => {
    if (!selectedId) return;
    setLoadingDetail(true);
    await loadDetail(selectedId);
    setLoadingDetail(false);
    notifyOk("Rascunhos descartados — restaurado do servidor.");
  };

  const markComplete = async () => {
    if (!mission?.id || mission.status !== "em_validacao") {
      notifyErr('Só é possível concluir a partir de "Em validação". Avance o status no fluxo.');
      return;
    }
    const r = await devCenterPatchMission(mission.id, { status: "concluida" });
    if (!r.ok) {
      notifyErr(r.data?.message || r.error || "Falha ao concluir.");
      return;
    }
    setMission(r.data.mission);
    await refreshMissions();
    notifyOk("Missão marcada como concluída. Você pode arquivar quando quiser.");
  };

  const archiveMission = async () => {
    if (!mission?.id || mission.status !== "concluida") return;
    const r = await devCenterPatchMission(mission.id, { status: "arquivada" });
    if (!r.ok) {
      notifyErr(r.error || "Falha ao arquivar.");
      return;
    }
    setMission(r.data.mission);
    await refreshMissions();
    notifyOk("Missão arquivada.");
  };

  const saveContextSlice = async (key, value) => {
    if (!selectedId) return;
    const map = { rico: "rico_text", neo: "neo_text", pedro: "pedro_text" };
    const field = map[key];
    setSavingHandoff(key);
    const r = await devCenterPatchContext(selectedId, { [field]: value });
    setSavingHandoff(null);
    if (!r.ok) {
      notifyErr(r.error || "Falha ao salvar handoff.");
      return;
    }
    await loadDetail(selectedId);
    notifyOk(`Handoff ${key === "rico" ? "Rico" : key === "neo" ? "Neo" : "Pedro"} salvo.`);
  };

  const saveMissionFieldsOnly = async () => {
    if (!mission?.id) return;
    const r = await devCenterPatchMission(mission.id, {
      title: mission.title,
      status: mission.status,
      priority: mission.priority,
      module: mission.module,
      summary: mission.summary,
      owner_email: mission.owner_email,
      exec_objective: mission.exec_objective,
      exec_context: mission.exec_context,
      exec_problem: mission.exec_problem,
      exec_where_stopped: mission.exec_where_stopped,
    });
    if (!r.ok) {
      notifyErr(r.data?.message || r.error || "Falha ao salvar.");
      return;
    }
    setMission(r.data.mission);
    await refreshMissions();
    notifyOk("Dados atualizados.");
  };

  const handleCreateMission = async () => {
    const t = newMissionTitle.trim();
    if (!t) {
      notifyErr("Informe o título.");
      return;
    }
    setCreating(true);
    const r = await devCenterCreateMission({
      title: t,
      status: "nao_iniciada",
      priority: "medium",
    });
    setCreating(false);
    if (!r.ok || !r.data?.mission?.id) {
      notifyErr(r.error || "Não foi possível criar.");
      return;
    }
    setNewMissionTitle("");
    setShowNewModal(false);
    await refreshMissions();
    setSelectedId(r.data.mission.id);
    notifyOk("Missão criada.");
  };

  const addDecision = async () => {
    if (!selectedId) return;
    const dt = newDecisionText.trim();
    if (!dt) {
      notifyErr("Preencha a decisão.");
      return;
    }
    const r = await devCenterPostDecision(selectedId, {
      decision_text: dt,
      reason: newDecisionReason.trim() || null,
    });
    if (!r.ok || !r.data?.decision) {
      notifyErr(r.error || "Falha.");
      return;
    }
    setDecisions((prev) => [...prev, r.data.decision]);
    setNewDecisionText("");
    setNewDecisionReason("");
    await loadDetail(selectedId);
    notifyOk("Decisão registrada.");
  };

  const removeDecision = async (id) => {
    const r = await devCenterDeleteDecision(id);
    if (!r.ok) {
      notifyErr(r.error || "Falha ao excluir.");
      return;
    }
    setDecisions((prev) => prev.filter((d) => d.id !== id));
    await loadDetail(selectedId);
    notifyOk("Decisão removida.");
  };

  const updateDecisionLocal = (id, field, v) => {
    setDecisions((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: v } : d)));
  };

  const saveDecisionRow = async (id) => {
    const d = decisions.find((x) => x.id === id);
    if (!d) return;
    const r = await devCenterPatchDecision(id, {
      decision_text: d.decision_text,
      reason: d.reason,
    });
    if (!r.ok) notifyErr(r.error || "Falha ao salvar decisão.");
    else {
      notifyOk("Decisão salva.");
      await loadDetail(selectedId);
    }
  };

  const addNextStep = async () => {
    if (!selectedId) return;
    const t = newStepText.trim();
    if (!t) {
      notifyErr("Digite o passo.");
      return;
    }
    const r = await devCenterPostNextStep(selectedId, { text: t });
    if (!r.ok || !r.data?.next_step) {
      notifyErr(r.error || "Falha ao adicionar passo.");
      return;
    }
    setNextSteps((prev) => [...prev, r.data.next_step]);
    setNewStepText("");
    await loadDetail(selectedId);
    notifyOk("Passo adicionado.");
  };

  const toggleStep = async (step) => {
    const r = await devCenterPatchNextStep(step.id, { is_done: !step.is_done });
    if (!r.ok) {
      notifyErr(r.error || "Falha.");
      return;
    }
    setNextSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, is_done: !s.is_done } : s)));
  };

  const removeStep = async (id) => {
    const r = await devCenterDeleteNextStep(id);
    if (!r.ok) {
      notifyErr(r.error || "Falha.");
      return;
    }
    setNextSteps((prev) => prev.filter((s) => s.id !== id));
    await loadDetail(selectedId);
  };

  const renderMissionList = (list, empty) =>
    list.length === 0 ? (
      <p className="dev-center__sidebar-empty">{empty}</p>
    ) : (
      list.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`dev-center__mission-item ${selectedId === m.id ? "is-active" : ""}`}
          onClick={() => setSelectedId(m.id)}
        >
          <span className="dev-center__mission-title">{m.title}</span>
          <span className="dev-center__mission-meta">
            {statusLabel(m.status)} · {priorityLabel(m.priority)}
            {m.module ? ` · ${m.module}` : ""}
          </span>
        </button>
      ))
    );

  if (booting) {
    return (
      <div className="dev-center dev-center--loading">
        <div className="dev-center__spinner" />
        <p className="dev-center__muted">Carregando Dev Center…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="dev-center dev-center--forbidden">
        <ShieldAlert size={48} strokeWidth={1.25} />
        <h1 className="s7-title">Acesso restrito</h1>
        <p className="dev-center__muted">
          O Dev Center está disponível apenas para contas autorizadas (administrador interno ou e-mail na allowlist).
          O acesso é validado no servidor.
        </p>
      </div>
    );
  }

  return (
    <div className="dev-center">
      <header className="dev-center__topbar">
        <div className="dev-center__topbar-main">
          <span className="dev-center__badge dev-center__badge--admin">
            <Sparkles size={14} />
            Admin dev · acesso restrito
          </span>
          <h1 className="dev-center__title">Dev Center</h1>
          <p className="dev-center__subtitle">Centro de comando do desenvolvimento Suse7</p>
        </div>
        <div className="dev-center__topbar-actions">
          <button type="button" className="s7-btn s7-btn--secondary" onClick={() => setShowNewModal(true)}>
            <Plus size={18} />
            Nova missão
          </button>
          <button
            type="button"
            className="s7-btn s7-btn--primary"
            onClick={handleCopyFull}
            disabled={!mission}
          >
            <ClipboardCopy size={18} />
            Copiar contexto completo
          </button>
        </div>
      </header>

      {showNewModal && (
        <div className="dev-center__modal-overlay" role="dialog" aria-modal="true">
          <div className="dev-center__modal">
            <h3 className="dev-center__h3">Nova missão</h3>
            <input
              className="dev-center__input dev-center__input--full"
              value={newMissionTitle}
              onChange={(e) => setNewMissionTitle(e.target.value)}
              placeholder="Título da missão"
              autoFocus
            />
            <div className="dev-center__modal-actions">
              <button type="button" className="s7-btn s7-btn--ghost" onClick={() => setShowNewModal(false)}>
                Cancelar
              </button>
              <button type="button" className="s7-btn s7-btn--primary" onClick={handleCreateMission} disabled={creating}>
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dev-center__grid">
        <aside className="dev-center__sidebar">
          <div className="dev-center__sidebar-section">
            <div className="dev-center__sidebar-title">Missão atual</div>
            {renderMissionList(grouped.atual, "Nenhuma em andamento.")}
          </div>
          <div className="dev-center__sidebar-section">
            <div className="dev-center__sidebar-title">Próximas</div>
            {renderMissionList(grouped.proximas, "Nenhuma na fila.")}
          </div>
          <div className="dev-center__sidebar-section">
            <div className="dev-center__sidebar-title">Concluídas</div>
            {renderMissionList(grouped.concluidas, "Nenhuma concluída.")}
          </div>
          <div className="dev-center__sidebar-section">
            <div className="dev-center__sidebar-title">Arquivadas</div>
            {renderMissionList(grouped.arquivadas, "Nenhuma arquivada.")}
          </div>
        </aside>

        <main className="dev-center__main">
          {!selectedId && (
            <div className="dev-center__card dev-center__empty-main">
              <p>Selecione uma missão ou crie uma nova.</p>
            </div>
          )}
          {selectedId && loadingDetail && (
            <div className="dev-center__card dev-center__loading-card">
              <div className="dev-center__spinner" />
            </div>
          )}
          {selectedId && !loadingDetail && mission && (
            <>
              <section className="dev-center__card dev-center__mission-hero">
                <div className="dev-center__mission-hero-grid">
                  <div>
                    <h2 className="dev-center__h2">{mission.title}</h2>
                    <p className="dev-center__hero-meta">
                      <span>{statusLabel(mission.status)}</span>
                      <span className="dev-center__dot">·</span>
                      <span>{priorityLabel(mission.priority)}</span>
                      <span className="dev-center__dot">·</span>
                      <span>{mission.module || "— módulo"}</span>
                    </p>
                  </div>
                  <div className="dev-center__hero-right">
                    <div className="dev-center__kv">
                      <span className="dev-center__k">Responsável</span>
                      <span className="dev-center__v">{mission.owner_email || "—"}</span>
                    </div>
                    <div className="dev-center__kv">
                      <span className="dev-center__k">Última atualização</span>
                      <span className="dev-center__v">{formatWhen(mission.updated_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="dev-center__form-grid dev-center__form-grid--tight">
                  <label className="dev-center__field">
                    <span>Título</span>
                    <input
                      className="dev-center__input"
                      value={mission.title ?? ""}
                      onChange={(e) => setMission({ ...mission, title: e.target.value })}
                    />
                  </label>
                  <label className="dev-center__field">
                    <span>Status</span>
                    <select
                      className="dev-center__input"
                      value={mission.status}
                      onChange={(e) => setMission({ ...mission, status: e.target.value })}
                    >
                      {STATUS_OPTS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="dev-center__field">
                    <span>Prioridade</span>
                    <select
                      className="dev-center__input"
                      value={mission.priority}
                      onChange={(e) => setMission({ ...mission, priority: e.target.value })}
                    >
                      {PRIORITY_OPTS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="dev-center__field dev-center__field--full">
                    <span>Módulo</span>
                    <input
                      className="dev-center__input"
                      value={mission.module ?? ""}
                      onChange={(e) => setMission({ ...mission, module: e.target.value })}
                    />
                  </label>
                  <label className="dev-center__field dev-center__field--full">
                    <span>Responsável (e-mail)</span>
                    <input
                      className="dev-center__input"
                      value={mission.owner_email ?? ""}
                      onChange={(e) => setMission({ ...mission, owner_email: e.target.value })}
                    />
                  </label>
                </div>
                <button type="button" className="s7-btn s7-btn--secondary" onClick={saveMissionFieldsOnly}>
                  <Save size={18} />
                  Aplicar dados da missão
                </button>
              </section>

              <section className="dev-center__card">
                <h2 className="dev-center__h2">Resumo executivo</h2>
                <p className="dev-center__hint">
                  Objetivo, contexto, problema e onde parou — visão única para handoff e futura base de conhecimento.
                </p>
                <div className="dev-center__exec-grid">
                  <label className="dev-center__field dev-center__field--full">
                    <span>Objetivo</span>
                    <textarea
                      className="dev-center__textarea dev-center__textarea--compact"
                      value={mission.exec_objective ?? ""}
                      onChange={(e) => setMission({ ...mission, exec_objective: e.target.value })}
                    />
                  </label>
                  <label className="dev-center__field dev-center__field--full">
                    <span>Contexto</span>
                    <textarea
                      className="dev-center__textarea dev-center__textarea--compact"
                      value={mission.exec_context ?? ""}
                      onChange={(e) => setMission({ ...mission, exec_context: e.target.value })}
                    />
                  </label>
                  <label className="dev-center__field dev-center__field--full">
                    <span>Problema atual</span>
                    <textarea
                      className="dev-center__textarea dev-center__textarea--compact"
                      value={mission.exec_problem ?? ""}
                      onChange={(e) => setMission({ ...mission, exec_problem: e.target.value })}
                    />
                  </label>
                  <label className="dev-center__field dev-center__field--full">
                    <span>Onde parou</span>
                    <textarea
                      className="dev-center__textarea dev-center__textarea--compact"
                      value={mission.exec_where_stopped ?? ""}
                      onChange={(e) => setMission({ ...mission, exec_where_stopped: e.target.value })}
                    />
                  </label>
                  <label className="dev-center__field dev-center__field--full">
                    <span>Resumo livre (opcional)</span>
                    <textarea
                      className="dev-center__textarea dev-center__textarea--compact"
                      value={mission.summary ?? ""}
                      onChange={(e) => setMission({ ...mission, summary: e.target.value })}
                    />
                  </label>
                </div>
              </section>

              <section className="dev-center__card">
                <h2 className="dev-center__h2">Handoff da missão</h2>
                <p className="dev-center__hint">Contexto compartilhado entre Rico, Neo e Pedro</p>
                <div className="dev-center__handoff-grid">
                  <HandoffCard
                    label="Rico"
                    value={rico}
                    onChange={setRico}
                    onCopy={() =>
                      copyText(rico || "—", () => notifyOk("Bloco Rico copiado."), () => notifyErr("Falha ao copiar."))
                    }
                    onClear={() => setRico("")}
                    onSave={() => saveContextSlice("rico", rico)}
                    saving={savingHandoff === "rico"}
                  />
                  <HandoffCard
                    label="Neo"
                    value={neo}
                    onChange={setNeo}
                    onCopy={() =>
                      copyText(neo || "—", () => notifyOk("Bloco Neo copiado."), () => notifyErr("Falha ao copiar."))
                    }
                    onClear={() => setNeo("")}
                    onSave={() => saveContextSlice("neo", neo)}
                    saving={savingHandoff === "neo"}
                  />
                  <HandoffCard
                    label="Pedro"
                    value={pedro}
                    onChange={setPedro}
                    onCopy={() =>
                      copyText(
                        pedro || "—",
                        () => notifyOk("Bloco Pedro copiado."),
                        () => notifyErr("Falha ao copiar.")
                      )
                    }
                    onClear={() => setPedro("")}
                    onSave={() => saveContextSlice("pedro", pedro)}
                    saving={savingHandoff === "pedro"}
                  />
                </div>

                <div className="dev-center__action-bar">
                  <button type="button" className="s7-btn s7-btn--primary" onClick={handleCopyFull}>
                    <ClipboardCopy size={18} />
                    Copiar contexto completo
                  </button>
                  <button type="button" className="s7-btn s7-btn--primary" onClick={saveEverything} disabled={savingAll}>
                    <Save size={18} />
                    Salvar tudo
                  </button>
                  <button type="button" className="s7-btn s7-btn--secondary" onClick={clearDrafts}>
                    Limpar rascunhos
                  </button>
                  <button
                    type="button"
                    className="s7-btn s7-btn--secondary"
                    onClick={markComplete}
                    disabled={mission.status !== "em_validacao"}
                  >
                    <CheckCircle2 size={18} />
                    Marcar missão como concluída
                  </button>
                  {mission.status === "concluida" && (
                    <button type="button" className="s7-btn s7-btn--ghost" onClick={archiveMission}>
                      Arquivar missão
                    </button>
                  )}
                </div>
              </section>

              <section className="dev-center__card">
                <h2 className="dev-center__h2">Decisões tomadas</h2>
                <div className="dev-center__decisions">
                  {decisions.map((d) => (
                    <div key={d.id} className="dev-center__decision-row">
                      <div className="dev-center__decision-main">
                        <textarea
                          className="dev-center__textarea dev-center__textarea--compact"
                          value={d.decision_text ?? ""}
                          onChange={(e) => updateDecisionLocal(d.id, "decision_text", e.target.value)}
                          placeholder="Decisão"
                        />
                        <input
                          className="dev-center__input"
                          value={d.reason ?? ""}
                          onChange={(e) => updateDecisionLocal(d.id, "reason", e.target.value)}
                          placeholder="Motivo"
                        />
                        <span className="dev-center__decision-date">{formatWhen(d.created_at)}</span>
                      </div>
                      <div className="dev-center__decision-actions">
                        <button
                          type="button"
                          className="s7-btn s7-btn--secondary dev-center__btn-tight"
                          onClick={() => saveDecisionRow(d.id)}
                        >
                          <Save size={16} />
                          Salvar
                        </button>
                        <button
                          type="button"
                          className="s7-btn dev-center__btn-tight dev-center__btn-icon"
                          aria-label="Excluir"
                          onClick={() => removeDecision(d.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dev-center__new-decision">
                  <textarea
                    className="dev-center__textarea dev-center__textarea--compact"
                    value={newDecisionText}
                    onChange={(e) => setNewDecisionText(e.target.value)}
                    placeholder="Nova decisão…"
                  />
                  <input
                    className="dev-center__input"
                    value={newDecisionReason}
                    onChange={(e) => setNewDecisionReason(e.target.value)}
                    placeholder="Motivo (opcional)"
                  />
                  <button type="button" className="s7-btn s7-btn--secondary" onClick={addDecision}>
                    <Plus size={18} />
                    Adicionar decisão
                  </button>
                </div>
              </section>

              <section className="dev-center__card">
                <h2 className="dev-center__h2">Próximos passos</h2>
                <ul className="dev-center__checklist">
                  {nextSteps.map((s) => (
                    <li key={s.id} className="dev-center__check-item">
                      <button
                        type="button"
                        className="dev-center__check-toggle"
                        onClick={() => toggleStep(s)}
                        aria-pressed={s.is_done}
                      >
                        {s.is_done ? <CheckCircle2 size={22} className="done" /> : <Circle size={22} />}
                      </button>
                      <span className={s.is_done ? "is-done" : ""}>{s.text}</span>
                      <button
                        type="button"
                        className="dev-center__check-remove"
                        onClick={() => removeStep(s.id)}
                        aria-label="Remover passo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="dev-center__add-step">
                  <input
                    className="dev-center__input"
                    value={newStepText}
                    onChange={(e) => setNewStepText(e.target.value)}
                    placeholder="Novo passo…"
                    onKeyDown={(e) => e.key === "Enter" && addNextStep()}
                  />
                  <button type="button" className="s7-btn s7-btn--secondary" onClick={addNextStep}>
                    <Plus size={18} />
                    Adicionar
                  </button>
                </div>
              </section>

              <section className="dev-center__card dev-center__history-card">
                <h2 className="dev-center__h2">
                  <History size={20} className="dev-center__inline-icon" />
                  Histórico
                </h2>
                <p className="dev-center__hint">
                  Mudanças de status, saves e decisões — base para auditoria e evolução com IA.
                </p>
                <ul className="dev-center__history-list">
                  {history.length === 0 ? (
                    <li className="dev-center__muted">Nenhum evento ainda.</li>
                  ) : (
                    history.map((h) => (
                      <li key={h.id} className="dev-center__history-item">
                        <div className="dev-center__history-head">
                          <strong>{h.event_type}</strong>
                          <time>{formatWhen(h.created_at)}</time>
                        </div>
                        <pre className="dev-center__history-json">
                          {h.content ? JSON.stringify(h.content, null, 2) : "—"}
                        </pre>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
