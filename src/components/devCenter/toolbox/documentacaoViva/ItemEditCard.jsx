import { Trash2 } from "lucide-react";
import { S7Input, S7Textarea, S7Button } from "../../../ui";
import DocVivaStatusSelect from "./DocVivaStatusSelect";

// Card de edição de um item (S1_1.9A.3).
// Campos reais: Título, Descrição, Observações, Status.
// "Última atualização" é carimbada automaticamente ao salvar (governança).

/**
 * @param {{
 *   item: import("./documentacaoVivaModel").DocItem;
 *   index: number;
 *   onChange: (index: number, patch: Partial<import("./documentacaoVivaModel").DocItem>) => void;
 *   onRemove: (index: number) => void;
 * }} props
 */
export default function ItemEditCard({ item, index, onChange, onRemove }) {
  return (
    <article className="s7-docviva-item-edit">
      <div className="s7-docviva-item-edit__row">
        <S7Input
          label="Título"
          name={`item_title_${index}`}
          value={item.item_title}
          placeholder="Ex.: Fonte Primária"
          onChange={(event) => onChange(index, { item_title: event.target.value })}
        />
        <DocVivaStatusSelect
          name={`item_status_${index}`}
          value={item.item_status}
          onChange={(value) => onChange(index, { item_status: value })}
        />
      </div>

      <S7Textarea
        label="Descrição"
        name={`item_content_${index}`}
        rows={3}
        value={item.item_content}
        placeholder="Ex.: sales_orders, sales_order_items"
        onChange={(event) => onChange(index, { item_content: event.target.value })}
      />

      <S7Textarea
        label="Observações"
        name={`item_notes_${index}`}
        rows={2}
        value={item.item_notes ?? ""}
        placeholder="Notas operacionais (opcional)"
        onChange={(event) => onChange(index, { item_notes: event.target.value })}
      />

      <div className="s7-docviva-item-edit__foot">
        <span className="s7-docviva-item__meta">Última atualização: {item.updated_at}</span>
        <S7Button
          type="button"
          variant="warning"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={() => onRemove(index)}
        >
          Remover
        </S7Button>
      </div>
    </article>
  );
}
