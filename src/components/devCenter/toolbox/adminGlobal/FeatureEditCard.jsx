import { useState } from "react";
import { Pencil, Save, X, CheckCircle2, AlertTriangle, Power, PowerOff } from "lucide-react";
import { S7Input, S7Textarea, S7Select, S7Button } from "../../../ui";
import {
  ROLLOUT_CATALOGO,
  metaFeatureStatus,
  metaRollout,
} from "./adminFeaturesModel";

// Card de feature: leitura + edição (label/descrição/categoria/rollout/ordem).
// Habilitar/desabilitar global é ação crítica → passa por confirmação dupla
// (tratada no FeaturesPanel via onToggleStatus).

/**
 * @param {{
 *   feature: object;
 *   salvando: boolean;
 *   onSave: (featureId: string, patch: object) => Promise<{ ok: boolean; error?: string }>;
 *   onToggleStatus: (feature: object) => void;
 * }} props
 */
export default function FeatureEditCard({ feature, salvando, onSave, onToggleStatus }) {
  const [editando, setEditando] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [draft, setDraft] = useState(montarDraft(feature));

  const status = metaFeatureStatus(feature.status);
  const rollout = metaRollout(feature.rollout_stage);
  const ativa = feature.status === "ativa";

  const iniciar = () => {
    setDraft(montarDraft(feature));
    setFeedback(null);
    setEditando(true);
  };

  const salvar = async () => {
    const ordem = Number(draft.sort_order);
    const patch = {
      label: draft.label.trim(),
      description: draft.description,
      category: draft.category.trim() || "geral",
      rollout_stage: draft.rollout_stage,
      sort_order: Number.isInteger(ordem) && ordem >= 0 ? ordem : feature.sort_order,
    };
    const res = await onSave(feature.id, patch);
    if (res.ok) {
      setFeedback({ tipo: "sucesso", msg: "Feature atualizada." });
      setEditando(false);
    } else {
      setFeedback({ tipo: "erro", msg: res.error || "Falha ao salvar." });
    }
  };

  return (
    <article className="s7-admin-feature">
      <div className="s7-admin-feature__head">
        <div className="s7-admin-feature__title-wrap">
          <h4 className="s7-admin-feature__title">{feature.label}</h4>
          <span className="s7-admin-feature__key">{feature.feature_key}</span>
        </div>
        <div className="s7-admin-feature__badges">
          <span className={`s7-admin-feature__badge s7-admin-feature__badge--${status.tone}`}>{status.label}</span>
          <span className={`s7-admin-feature__badge s7-admin-feature__badge--${rollout.tone}`}>{rollout.label}</span>
        </div>
      </div>

      {!editando ? (
        <>
          <p className="s7-admin-feature__desc">
            {feature.description || <span className="s7-admin-feature__desc--vazio">Sem descrição.</span>}
          </p>
          <div className="s7-admin-feature__meta">
            <span>Categoria: <strong>{feature.category}</strong></span>
            <span>Ordem: <strong>{feature.sort_order}</strong></span>
          </div>
          <div className="s7-admin-feature__actions">
            <S7Button
              type="button"
              variant={ativa ? "warning" : "primary"}
              size="sm"
              icon={ativa ? <PowerOff size={14} /> : <Power size={14} />}
              onClick={() => onToggleStatus(feature)}
              disabled={salvando}
            >
              {ativa ? "Desabilitar" : "Habilitar"}
            </S7Button>
            <S7Button type="button" variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={iniciar}>
              Editar
            </S7Button>
          </div>
        </>
      ) : (
        <div className="s7-admin-feature__editor">
          <S7Input
            label="Nome"
            name={`flabel_${feature.id}`}
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
          />
          <S7Textarea
            label="Descrição"
            name={`fdesc_${feature.id}`}
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
          <div className="s7-admin-feature__editor-grid">
            <S7Input
              label="Categoria"
              name={`fcat_${feature.id}`}
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            />
            <S7Select
              label="Rollout"
              name={`froll_${feature.id}`}
              value={draft.rollout_stage}
              onChange={(e) => setDraft((d) => ({ ...d, rollout_stage: e.target.value }))}
              options={ROLLOUT_CATALOGO.map((s) => ({ value: s.value, label: s.label }))}
            />
            <S7Input
              label="Ordem"
              name={`ford_${feature.id}`}
              type="number"
              min="0"
              value={draft.sort_order}
              onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
            />
          </div>
          <div className="s7-admin-feature__editor-actions">
            <S7Button type="button" variant="secondary" size="sm" icon={<X size={14} />} onClick={() => setEditando(false)} disabled={salvando}>
              Cancelar
            </S7Button>
            <S7Button type="button" variant="primary" size="sm" icon={<Save size={14} />} onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </S7Button>
          </div>
        </div>
      )}

      {feedback ? (
        <p className={`s7-admin-feature__feedback s7-admin-feature__feedback--${feedback.tipo}`}>
          {feedback.tipo === "sucesso" ? <CheckCircle2 size={14} aria-hidden /> : <AlertTriangle size={14} aria-hidden />}
          {feedback.msg}
        </p>
      ) : null}
    </article>
  );
}

function montarDraft(feature) {
  return {
    label: feature.label ?? "",
    description: feature.description ?? "",
    category: feature.category ?? "geral",
    rollout_stage: feature.rollout_stage ?? "ga",
    sort_order: feature.sort_order != null ? String(feature.sort_order) : "0",
  };
}
