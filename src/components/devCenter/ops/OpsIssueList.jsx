import S7Tooltip from "../../ui/S7Tooltip";
import { issueCodeLabel } from "./opsPresentation";
import OpsEmptyState from "./OpsEmptyState";
import "./ops.css";

/**
 * @param {{ issues?: Array<{ code?: string; dimension?: string }> }} props
 */
export default function OpsIssueList({ issues = [] }) {
  if (!issues.length) {
    return <OpsEmptyState compact title="Nenhum problema" message="Sem issues reportadas pelo backend." />;
  }

  return (
    <ul className="ops-issue-list">
      {issues.map((issue, idx) => {
        const code = String(issue.code ?? "unknown");
        const dim = String(issue.dimension ?? "geral");
        const label = issueCodeLabel(code);
        return (
          <li key={`${code}-${idx}`}>
            <S7Tooltip content={`Dimensão: ${dim}`}>
              <span className="ops-issue-list__pill">{label}</span>
            </S7Tooltip>
          </li>
        );
      })}
    </ul>
  );
}
