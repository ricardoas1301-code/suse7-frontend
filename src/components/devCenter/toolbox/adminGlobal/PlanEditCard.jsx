import { useState } from "react";
import { Pencil, Save, X, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { S7Input, S7Textarea, S7Select, S7Button } from "../../../ui";
import {
  PLAN_STATUS_CATALOGO,
  metaPlanStatus,
  formatarPrecoBRL,
  formatarLimiteVendas,
  validarPrecoInput,
} from "./adminPlansModel";

// Card de um plano: leitura escaneável + edição segura (S1_3.2..S1_3.6).
// O frontend só exibe e envia formato seguro; o backend valida e persiste.

/**
 * @param {{
 *   plan: object;
 *   salvando: boolean;
 *   onSave: (planId: string, patch: object) => Promise<{ ok: boolean; error?: string }>;
 * }} props
 */
export default function PlanEditCard({ plan, salvando, onSave }) {
  const [editando, setEditando] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [draft, setDraft] = useState(montarDraft(plan));

  const status = metaPlanStatus(plan.status);

  function montarDraftLocal() {
    setDraft(montarDraft(plan));
  }

  const iniciar = () => {
    montarDraftLocal();
    setFeedback(null);
    setEditando(true);
  };

  const cancelar = () => {
    setEditando(false);
    setFeedback(null);
  };

  const salvar = async () => {
    const preco = validarPrecoInput(draft.price);
    if (!preco.valido) {
      setFeedback({ tipo: "erro", msg: "Valor mensal inválido. Use o formato 0,00." });
      return;
    }

    let limite = null;
    const limiteTrim = String(draft.limite).trim();
    if (limiteTrim !== "") {
      const n = Number(limiteTrim);
      if (!Number.isInteger(n) || n < 0) {
        setFeedback({ tipo: "erro", msg: "Limite de vendas deve ser um inteiro válido." });
        return;
      }
      limite = n;
    }

    const ordem = Number(draft.sort_order);
    const patch = {
      name: draft.name.trim(),
      price_monthly: preco.valor,
      sales_limit_monthly: limite,
      description: draft.description,
      status: draft.status,
      sort_order: Number.isInteger(ordem) && ordem >= 0 ? ordem : plan.sort_order,
    };

    const res = await onSave(plan.id, patch);
    if (res.ok) {
      setFeedback({ tipo: "sucesso", msg: "Plano atualizado." });
      setEditando(false);
    } else {
      setFeedback({ tipo: "erro", msg: res.error || "Falha ao salvar o plano." });
    }
  };

  return (
    <article className="s7-admin-plan">
      <div className="s7-admin-plan__head">
        <div className="s7-admin-plan__title-wrap">
          <h4 className="s7-admin-plan__title">{plan.name || plan.plan_key || "—"}</h4>
          <span className="s7-admin-plan__key">{plan.plan_key}</span>
        </div>
        <div className="s7-admin-plan__badges">
          <span className={`s7-admin-plan__badge s7-admin-plan__badge--${status.tone}`}>
            {status.label}
          </span>
          {plan.is_internal ? (
            <span className="s7-admin-plan__badge s7-admin-plan__badge--alerta">
              <Lock size={11} aria-hidden /> Interno
            </span>
          ) : null}
        </div>
      </div>

      {!editando ? (
        <>
          <div className="s7-admin-plan__grid">
            <div className="s7-admin-plan__field">
              <span className="s7-admin-plan__label">Valor mensal</span>
              <span className="s7-admin-plan__value">{formatarPrecoBRL(plan.price_monthly)}</span>
            </div>
            <div className="s7-admin-plan__field">
              <span className="s7-admin-plan__label">Limite de vendas</span>
              <span className="s7-admin-plan__value">{formatarLimiteVendas(plan.sales_limit_monthly)}</span>
            </div>
            <div className="s7-admin-plan__field">
              <span className="s7-admin-plan__label">Ordem</span>
              <span className="s7-admin-plan__value">{plan.sort_order}</span>
            </div>
          </div>
          {plan.description ? (
            <p className="s7-admin-plan__desc">{plan.description}</p>
          ) : (
            <p className="s7-admin-plan__desc s7-admin-plan__desc--vazio">Sem descrição comercial.</p>
          )}
          <div className="s7-admin-plan__actions">
            <S7Button type="button" variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={iniciar}>
              Editar plano
            </S7Button>
          </div>
        </>
      ) : (
        <div className="s7-admin-plan__editor">
          <S7Input
            label="Nome comercial"
            name={`name_${plan.id}`}
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <div className="s7-admin-plan__editor-grid">
            <S7Input
              label="Valor mensal (R$)"
              name={`price_${plan.id}`}
              value={draft.price}
              inputMode="decimal"
              placeholder="0,00"
              onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
            />
            <S7Input
              label="Limite de vendas/mês"
              name={`limite_${plan.id}`}
              type="number"
              min="0"
              placeholder="Vazio = ilimitado"
              value={draft.limite}
              onChange={(e) => setDraft((d) => ({ ...d, limite: e.target.value }))}
            />
            <S7Select
              label="Status"
              name={`status_${plan.id}`}
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
              options={PLAN_STATUS_CATALOGO.map((s) => ({ value: s.value, label: s.label }))}
            />
            <S7Input
              label="Ordem"
              name={`ordem_${plan.id}`}
              type="number"
              min="0"
              value={draft.sort_order}
              onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
            />
          </div>
          <S7Textarea
            label="Descrição comercial"
            name={`desc_${plan.id}`}
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
          <div className="s7-admin-plan__editor-actions">
            <S7Button type="button" variant="secondary" size="sm" icon={<X size={14} />} onClick={cancelar} disabled={salvando}>
              Cancelar
            </S7Button>
            <S7Button type="button" variant="primary" size="sm" icon={<Save size={14} />} onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar alterações"}
            </S7Button>
          </div>
        </div>
      )}

      {feedback ? (
        <p className={`s7-admin-plan__feedback s7-admin-plan__feedback--${feedback.tipo}`}>
          {feedback.tipo === "sucesso" ? (
            <CheckCircle2 size={14} aria-hidden />
          ) : (
            <AlertTriangle size={14} aria-hidden />
          )}
          {feedback.msg}
        </p>
      ) : null}
    </article>
  );
}

/** Monta o rascunho de edição a partir do plano. */
function montarDraft(plan) {
  return {
    name: plan.name ?? "",
    price: plan.price_monthly != null ? String(plan.price_monthly).replace(".", ",") : "",
    limite: plan.sales_limit_monthly != null ? String(plan.sales_limit_monthly) : "",
    description: plan.description ?? "",
    status: plan.status ?? "ativo",
    sort_order: plan.sort_order != null ? String(plan.sort_order) : "0",
  };
}
