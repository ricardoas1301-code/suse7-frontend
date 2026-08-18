import { S7Select } from "../../../ui";
import { DOC_STATUS_CATALOGO } from "./documentacaoVivaModel";

// Select de status amarrado ao catálogo central (S1_1.9A.4).
// Não aceita valores livres — só os do catálogo.

/**
 * @param {{ label?: string; value: string; onChange: (value: string) => void; name?: string }} props
 */
export default function DocVivaStatusSelect({ label = "Status", value, onChange, name = "status" }) {
  return (
    <S7Select
      label={label}
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      options={DOC_STATUS_CATALOGO.map((status) => ({ value: status.value, label: status.label }))}
    />
  );
}
