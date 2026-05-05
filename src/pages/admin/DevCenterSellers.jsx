import { useEffect, useState } from "react";
import { devCenterGetSellers } from "../../services/devCenterApi";

export default function DevCenterSellers() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    devCenterGetSellers().then((r) => {
      if (r.ok) setRows(Array.isArray(r.data?.sellers) ? r.data.sellers : []);
    });
  }, []);

  return (
    <section className="dc-module">
      <header className="dc-module__head">
        <h2>Sellers</h2>
      </header>
      <div className="dc-table-wrap">
        <table className="dc-table">
          <thead>
            <tr>
              <th>Nome</th><th>Email</th><th>CNPJ</th><th>Plano</th><th>Status</th><th>Criação</th><th>Último acesso</th><th>Contas conectadas</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={9}>Nenhum seller encontrado.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.nome || "—"}</td><td>{r.email || "—"}</td><td>{r.cnpj || "—"}</td><td>{r.plano || "—"}</td><td>{r.status || "—"}</td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleDateString("pt-BR") : "—"}</td>
                  <td>{r.last_access_at ? new Date(r.last_access_at).toLocaleDateString("pt-BR") : "—"}</td>
                  <td>{r.connected_accounts ?? 0}</td>
                  <td><button type="button" disabled>Ver detalhes</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

