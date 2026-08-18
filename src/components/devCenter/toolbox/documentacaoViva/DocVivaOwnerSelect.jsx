import { S7Select } from "../../../ui";
import { DOC_OWNERS } from "./documentacaoVivaModel";

// Select de responsável documental amarrado ao catálogo de owners (S1_1.9B.1).

/**
 * @param {{ label?: string; value: string; onChange: (value: string) => void; name?: string }} props
 */
export default function DocVivaOwnerSelect({ label = "Responsável", value, onChange, name = "owner" }) {
  return (
    <S7Select
      label={label}
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      options={DOC_OWNERS.map((owner) => ({ value: owner, label: owner }))}
    />
  );
}
