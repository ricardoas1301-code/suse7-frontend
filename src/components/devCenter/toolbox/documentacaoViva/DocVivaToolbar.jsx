import { Search, X } from "lucide-react";
import { S7Input, S7Select, S7Button } from "../../../ui";
import {
  DOC_STATUS_CATALOGO,
  DOC_MATURIDADE_CATALOGO,
  DOC_OWNERS,
} from "./documentacaoVivaModel";

// Toolbar de busca global (S1_1.9B.4) + filtros operacionais (S1_1.9B.5).
// Componente controlado — o estado vive no painel.

/**
 * @param {{
 *   criterios: { termo: string; status: string; maturity: string; owner: string };
 *   onChange: (patch: Partial<{ termo: string; status: string; maturity: string; owner: string }>) => void;
 *   onLimpar: () => void;
 * }} props
 */
export default function DocVivaToolbar({ criterios, onChange, onLimpar }) {
  const temFiltro =
    criterios.termo || criterios.status || criterios.maturity || criterios.owner;

  return (
    <div className="s7-docviva-toolbar">
      <div className="s7-docviva-toolbar__search">
        <S7Input
          name="docviva_busca"
          value={criterios.termo}
          placeholder="Buscar em domínios, itens e observações..."
          onChange={(event) => onChange({ termo: event.target.value })}
          rightElement={<Search size={15} aria-hidden />}
        />
      </div>

      <div className="s7-docviva-toolbar__filters">
        <S7Select
          name="filtro_status"
          value={criterios.status}
          placeholder="Status: todos"
          onChange={(event) => onChange({ status: event.target.value })}
          options={DOC_STATUS_CATALOGO.map((s) => ({ value: s.value, label: s.label }))}
        />
        <S7Select
          name="filtro_maturidade"
          value={criterios.maturity}
          placeholder="Maturidade: todas"
          onChange={(event) => onChange({ maturity: event.target.value })}
          options={DOC_MATURIDADE_CATALOGO.map((m) => ({ value: m.value, label: m.label }))}
        />
        <S7Select
          name="filtro_owner"
          value={criterios.owner}
          placeholder="Responsável: todos"
          onChange={(event) => onChange({ owner: event.target.value })}
          options={DOC_OWNERS.map((o) => ({ value: o, label: o }))}
        />
        {temFiltro ? (
          <S7Button type="button" variant="secondary" size="sm" icon={<X size={14} />} onClick={onLimpar}>
            Limpar
          </S7Button>
        ) : null}
      </div>
    </div>
  );
}
