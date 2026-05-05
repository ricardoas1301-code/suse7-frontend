import { useEffect, useState } from "react";
import { devCenterGetDashboard } from "../../services/devCenterApi";

function card(label, value) {
  return { label, value: value ?? "—" };
}

export default function DevCenterDashboard() {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    devCenterGetDashboard().then((r) => {
      if (r.ok) setSummary(r.data?.summary ?? null);
    });
  }, []);

  const cards = [
    card("Total de sellers", summary?.totalSellers),
    card("Sellers ativos", summary?.sellersAtivos),
    card("Sellers inativos", summary?.sellersInativos),
    card("Receita mensal (MRR)", summary?.mrr),
    card("Receita total", summary?.receitaTotal),
    card("Total clientes global", summary?.totalClientesGlobal),
    card("Pedidos processados", summary?.totalPedidosProcessados),
    card("Integrações ML ativas", summary?.integracoesMlAtivas),
  ];

  return (
    <section className="dc-module">
      <header className="dc-module__head">
        <h2>Dashboard</h2>
      </header>
      <div className="dc-cards-grid">
        {cards.map((c) => (
          <article key={c.label} className="dc-card">
            <span>{c.label}</span>
            <strong>{String(c.value)}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

