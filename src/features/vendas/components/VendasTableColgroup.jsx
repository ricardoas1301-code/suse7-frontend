/**
 * Larguras compartilhadas entre thead (tabela --head) e tbody (tabela --body).
 * Garante o mesmo eixo de coluna no List Sticky Chrome S7 (duas tabelas HTML).
 */
export default function VendasTableColgroup() {
  return (
    <colgroup>
      <col className="vendas-page__col-select" />
      <col className="vendas-page__col-venda" />
      <col className="vendas-page__col-product" />
      <col className="vendas-page__col-account" />
      <col className="vendas-page__col-channel" />
      <col className="vendas-page__col-profit" />
      <col className="vendas-page__col-margin" />
      <col className="vendas-page__col-sale-value" />
      <col className="vendas-page__col-payout" />
      <col className="vendas-page__col-fee" />
      <col className="vendas-page__col-shipping" />
      <col className="vendas-page__col-tax" />
      <col className="vendas-page__col-cost" />
      <col className="vendas-page__col-sale-status" />
    </colgroup>
  );
}
