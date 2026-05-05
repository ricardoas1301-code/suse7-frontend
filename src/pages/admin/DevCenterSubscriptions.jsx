import { useEffect, useState } from "react";
import { devCenterGetSubscriptions } from "../../services/devCenterApi";

export default function DevCenterSubscriptions() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    devCenterGetSubscriptions().then((r) => {
      if (r.ok) setRows(Array.isArray(r.data?.subscriptions) ? r.data.subscriptions : []);
    });
  }, []);

  return (
    <section className="dc-module">
      <header className="dc-module__head"><h2>Assinaturas</h2></header>
      <div className="dc-table-wrap">
        <table className="dc-table">
          <thead>
            <tr><th>Seller</th><th>Plano</th><th>Status</th><th>Início</th><th>Expiração</th><th>Valor</th><th>Método</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={7}>Sem assinaturas disponíveis.</td></tr> : rows.map((r) => (
              <tr key={r.seller_id}>
                <td>{r.seller_name || "—"}</td><td>{r.plan || "—"}</td><td>{r.status || "—"}</td>
                <td>{r.started_at ? new Date(r.started_at).toLocaleDateString("pt-BR") : "—"}</td>
                <td>{r.expires_at ? new Date(r.expires_at).toLocaleDateString("pt-BR") : "—"}</td>
                <td>{r.amount_brl ?? "—"}</td><td>{r.payment_method || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

