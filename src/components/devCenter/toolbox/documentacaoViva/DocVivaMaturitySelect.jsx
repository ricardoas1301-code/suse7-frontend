import { S7Select } from "../../../ui";
import { DOC_MATURIDADE_CATALOGO } from "./documentacaoVivaModel";

// Select de maturidade documental amarrado ao catálogo (S1_1.9B.3).

/**
 * @param {{ label?: string; value: string; onChange: (value: string) => void; name?: string }} props
 */
export default function DocVivaMaturitySelect({ label = "Maturidade", value, onChange, name = "maturity" }) {
  return (
    <S7Select
      label={label}
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      options={DOC_MATURIDADE_CATALOGO.map((m) => ({ value: m.value, label: m.label }))}
    />
  );
}
