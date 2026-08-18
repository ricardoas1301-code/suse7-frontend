// ======================================================================
// Detalhamento de produtos e concorrentes — modal do relatório.
// ======================================================================

import "./ConcorrenciaRelatorioDetalhe.css";

/**
 * @param {{
 *   detalhesProdutos?: readonly {
 *     nome: string;
 *     sku: string;
 *     conta: string;
 *     marketplace: string;
 *     quantidadeConcorrentesLabel: string;
 *     concorrentes: readonly {
 *       nomeLoja: string;
 *       preco: string;
 *       diferencaPreco: string;
 *       posicaoPreco: string;
 *       tipoAnuncio: string;
 *       mercadoLider: string;
 *       reputacao: string;
 *       vendasVendedor: string;
 *       statusAnuncio: string;
 *       ultimaAtualizacao: string;
 *     }[];
 *   }[];
 *   embedded?: boolean;
 * }} props
 */
export default function ConcorrenciaRelatorioDetalhe({ detalhesProdutos = [], embedded = false }) {
  if (!detalhesProdutos.length) {
    return (
      <p
        className={[
          "concorrencia-relatorio-detalhe__empty",
          embedded ? "concorrencia-relatorio-detalhe__empty--embedded" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        Nenhum produto no escopo do relatório.
      </p>
    );
  }

  return (
    <section
      className={[
        "concorrencia-relatorio-detalhe",
        embedded ? "concorrencia-relatorio-detalhe--embedded" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Detalhamento dos produtos"
    >
      <h3 className="vendas-relatorio-modal__section-title">Detalhamento dos produtos</h3>
      <ul className="concorrencia-relatorio-detalhe__list">
        {detalhesProdutos.map((prod, idx) => (
          <li key={`${prod.sku}-${idx}`} className="concorrencia-relatorio-detalhe__product">
            <header className="concorrencia-relatorio-detalhe__product-head">
              <strong className="concorrencia-relatorio-detalhe__product-name">{prod.nome}</strong>
              <span className="concorrencia-relatorio-detalhe__product-meta">
                SKU {prod.sku} · {prod.conta} · {prod.marketplace} · {prod.quantidadeConcorrentesLabel}
              </span>
            </header>
            {prod.concorrentes.length > 0 ? (
              <ul className="concorrencia-relatorio-detalhe__competitors">
                {prod.concorrentes.map((c, cIdx) => (
                  <li key={`${c.nomeLoja}-${cIdx}`} className="concorrencia-relatorio-detalhe__competitor">
                    <div className="concorrencia-relatorio-detalhe__comp-row">
                      <span className="concorrencia-relatorio-detalhe__comp-label">Loja</span>
                      <span className="concorrencia-relatorio-detalhe__comp-value">{c.nomeLoja}</span>
                    </div>
                    <div className="concorrencia-relatorio-detalhe__comp-grid">
                      <div>
                        <span className="concorrencia-relatorio-detalhe__comp-label">Preço</span>
                        <span className="concorrencia-relatorio-detalhe__comp-value">{c.preco}</span>
                      </div>
                      <div>
                        <span className="concorrencia-relatorio-detalhe__comp-label">Diferença</span>
                        <span className="concorrencia-relatorio-detalhe__comp-value">{c.diferencaPreco}</span>
                      </div>
                      <div>
                        <span className="concorrencia-relatorio-detalhe__comp-label">Posição</span>
                        <span className="concorrencia-relatorio-detalhe__comp-value">{c.posicaoPreco}</span>
                      </div>
                      <div>
                        <span className="concorrencia-relatorio-detalhe__comp-label">Tipo</span>
                        <span className="concorrencia-relatorio-detalhe__comp-value">{c.tipoAnuncio}</span>
                      </div>
                      <div>
                        <span className="concorrencia-relatorio-detalhe__comp-label">MercadoLíder</span>
                        <span className="concorrencia-relatorio-detalhe__comp-value">{c.mercadoLider}</span>
                      </div>
                      <div>
                        <span className="concorrencia-relatorio-detalhe__comp-label">Reputação</span>
                        <span className="concorrencia-relatorio-detalhe__comp-value">{c.reputacao}</span>
                      </div>
                      <div>
                        <span className="concorrencia-relatorio-detalhe__comp-label">Vendas vendedor</span>
                        <span className="concorrencia-relatorio-detalhe__comp-value">{c.vendasVendedor}</span>
                      </div>
                      <div>
                        <span className="concorrencia-relatorio-detalhe__comp-label">Status</span>
                        <span className="concorrencia-relatorio-detalhe__comp-value">{c.statusAnuncio}</span>
                      </div>
                      <div className="concorrencia-relatorio-detalhe__comp-span">
                        <span className="concorrencia-relatorio-detalhe__comp-label">Última atualização</span>
                        <span className="concorrencia-relatorio-detalhe__comp-value">{c.ultimaAtualizacao}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="concorrencia-relatorio-detalhe__no-comp">Sem concorrentes cadastrados.</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
