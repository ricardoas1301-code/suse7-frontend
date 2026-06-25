import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { S7Button } from "../../../ui";
import { fetchAdminAudit } from "../../../../services/adminAuditApi";
import { rotuloOperacao, rotuloEntidade, resumirValor, formatarDataHora } from "./adminAuditModel";

// Segurança Administrativa Global (S1_5) — leitura da trilha de auditoria.
// Demonstra: operação, entidade, campo, before/after, operador, timestamp.

export default function SecurityPanel() {
  const [entries, setEntries] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [degradado, setDegradado] = useState(false);
  const [soCriticas, setSoCriticas] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetchAdminAudit({ limit: 150, onlyCritical: soCriticas });
      if (res.ok) {
        setEntries(res.entries || []);
        setDegradado(Boolean(res.degraded));
      } else {
        setErro(res.error || "Não foi possível carregar a auditoria.");
      }
    } catch {
      setErro("Falha de comunicação ao carregar a auditoria.");
    } finally {
      setCarregando(false);
    }
  }, [soCriticas]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div className="s7-admin-security">
      <div className="s7-admin-security__head">
        <div>
          <h3 className="s7-admin-security__title">
            <ShieldCheck size={18} aria-hidden /> Segurança & Auditoria
          </h3>
          <p className="s7-admin-security__subtitle">
            Trilha administrativa global (before/after, operador e timestamp). Base preparada para
            multi-admin e evolução de permissões.
          </p>
        </div>
        <div className="s7-admin-security__head-actions">
          <label className="s7-admin-security__filtro">
            <input type="checkbox" checked={soCriticas} onChange={(e) => setSoCriticas(e.target.checked)} />
            Só críticas
          </label>
          <S7Button type="button" variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={carregar} disabled={carregando}>
            Recarregar
          </S7Button>
        </div>
      </div>

      {degradado ? (
        <div className="s7-admin-features__aviso">
          Auditoria em modo preparatório — aplique a migration para registro completo.
        </div>
      ) : null}

      {erro ? (
        <div className="s7-admin-plans__erro" role="alert">
          <AlertTriangle size={16} aria-hidden />
          <span>{erro}</span>
        </div>
      ) : null}

      {carregando && entries.length === 0 ? (
        <div className="s7-admin-plans__loading">Carregando auditoria…</div>
      ) : entries.length === 0 ? (
        <div className="s7-admin-plans__empty">Nenhum registro de auditoria ainda.</div>
      ) : (
        <ul className="s7-admin-audit">
          {entries.map((e) => (
            <li key={e.id} className={`s7-admin-audit__item ${e.is_critical ? "s7-admin-audit__item--critico" : ""}`}>
              <div className="s7-admin-audit__top">
                <span className="s7-admin-audit__op">
                  {e.is_critical ? <ShieldAlert size={13} aria-hidden /> : null}
                  {rotuloOperacao(e.operation_type)}
                </span>
                <time className="s7-admin-audit__time">{formatarDataHora(e.created_at)}</time>
              </div>
              <div className="s7-admin-audit__meta">
                <span>{rotuloEntidade(e.entity)}</span>
                {e.field ? <span>· campo: <strong>{e.field}</strong></span> : null}
                <span>· por {e.operator_name}</span>
              </div>
              {e.before != null || e.after != null ? (
                <div className="s7-admin-audit__diff">
                  <span className="s7-admin-audit__before">{resumirValor(e.before)}</span>
                  <span aria-hidden>→</span>
                  <span className="s7-admin-audit__after">{resumirValor(e.after)}</span>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
