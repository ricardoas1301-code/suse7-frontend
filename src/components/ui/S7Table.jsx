// ======================================================================
// S7Table
// Tabela básica padronizada para o Suse7.
// - Não contém paginação ou ordenação; é apenas visual.
// ======================================================================

import "./S7Table.css";

export default function S7Table({ columns = [], rows = [], emptyMessage = "Nenhum registro encontrado." }) {
  const hasData = rows && rows.length > 0;

  return (
    <div className="s7-table__wrapper">
      <table className="s7-table">
        {columns.length > 0 && (
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key || col.id || col.label}>{col.label}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {hasData ? (
            rows.map((row, rowIndex) => (
              <tr key={row.id || row.key || rowIndex}>
                {columns.map((col) => (
                  <td key={col.key || col.id || col.label}>
                    {typeof col.render === "function"
                      ? col.render(row)
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="s7-table__empty"
                colSpan={Math.max(columns.length, 1)}
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

