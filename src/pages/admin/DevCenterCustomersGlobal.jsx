import { useEffect, useState } from "react";
import { devCenterGetCustomersGlobal, devCenterGetCustomerGlobalDetail } from "../../services/devCenterApi";

export default function DevCenterCustomersGlobal() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      devCenterGetCustomersGlobal({ q }).then((r) => {
        if (r.ok) setRows(Array.isArray(r.data?.customers) ? r.data.customers : []);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <section className="dc-module">
      <header className="dc-module__head"><h2>Clientes 360 S7 FULL</h2></header>
      <div className="dc-filter-bar">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, documento, email, telefone ou cidade" />
      </div>
      <div className="dc-table-wrap">
        <table className="dc-table">
          <thead>
            <tr>
              <th>Cliente</th><th>Documento</th><th>Email</th><th>Telefone</th><th>Cidade/Estado</th><th>Total pedidos</th><th>Total comprado</th><th>Total sellers</th><th>Última compra</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={10}>Nenhum cliente global encontrado.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name || "—"}</td><td>{r.document || "—"}</td><td>{r.email || "—"}</td><td>{r.phone || "—"}</td>
                  <td>{[r.city, r.state].filter(Boolean).join("/") || "—"}</td><td>{r.total_orders_global ?? 0}</td>
                  <td>{r.total_spent_global ?? "0.00"}</td><td>{r.total_sellers_related ?? 0}</td>
                  <td>{r.last_purchase_global ? new Date(r.last_purchase_global).toLocaleDateString("pt-BR") : "—"}</td>
                  <td><button type="button" onClick={async () => {
                    const d = await devCenterGetCustomerGlobalDetail(r.id);
                    if (d.ok) setSelected(d.data?.customer ?? null);
                  }}>Ver detalhes</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selected ? (
        <div className="dc-drawer-backdrop" onClick={() => setSelected(null)}>
          <aside className="dc-drawer" onClick={(e) => e.stopPropagation()}>
            <header><h3>{selected.name || "Cliente global"}</h3><button type="button" onClick={() => setSelected(null)}>Fechar</button></header>
            <section>
              <h4>Sellers relacionados</h4>
              <pre>{JSON.stringify(selected.related_sellers ?? [], null, 2)}</pre>
            </section>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

