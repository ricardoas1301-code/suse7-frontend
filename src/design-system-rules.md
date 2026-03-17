# Design System S7 — Regras Oficiais

Estas regras existem para manter consistência visual e acelerar o
desenvolvimento de novas telas no Suse7.

## Regra 1 — Inputs

- Nenhum `input` HTML cru nas telas.
- Sempre usar **S7FormField + S7Input**, **S7Select** ou **S7Textarea**.
- Altura visual é definida pelos estilos globais em
  `Suse7-Design-System.css` (`.s7-input`, `.s7-select`, `.s7-textarea`):
  - `padding: 6px 8px`
  - `font-size: 14px`
  - `border-radius: 8px`
  - `background: #f9fafb`
  - **sem height ou min-height fixa**.

## Regra 2 — Botões

- Nenhum `<button>` estilizado manualmente nas telas.
- Sempre usar **S7Button** (e variantes: primário, secundário, danger).

## Regra 3 — Tooltips

- Nenhum tooltip manual (title HTML, hacks de CSS, etc.).
- Sempre usar **S7Tooltip** com o padrão:
  - `placement="bottom-start"`
  - `offset={6}`

## Regra 4 — Grids e layout

- Evitar `display: grid`/`flex` complexos diretamente nas páginas.
- Preferir:
  - **S7Grid** para grades simples.
  - **S7Stack** para empilhar elementos com `gap`.
  - **S7Section** para blocos de formulário/página.
  - **S7InputGroup** para linha com input + ações.

## Regra 5 — CSS visual

- Nenhum CSS visual direto em páginas/containers de alto nível.
- CSS visual deve ficar:
  - nos componentes S7 (`src/components/ui/**`), ou
  - em arquivos do design system global (`styles/Suse7-Design-System.css`).
- Telas podem ter apenas CSS de layout específico (ex.: grid de colunas,
  largura de painéis) e posicionamento.

## Regra 6 — Componentes de formulário

- Todos os formulários devem usar:
  - **S7FormField** para label + erro + ajuda.
  - **S7Input / S7Select / S7Textarea** como campos base.
  - **S7ChipInput** quando houver campos baseados em chips/tags.
  - **S7Toggle** para liga/desliga.

## Regra 7 — Cabeçalhos e seções

- Cabeçalhos de página:
  - Usar **S7PageHeader** (`title`, `subtitle`, `actions`).
- Blocos de formulário:
  - Usar **S7Section** para agrupar campos com título e ações locais.

## Regra 8 — Tabelas

- Listagens tabulares devem usar **S7Table** como base visual.
- Lógica de ordenação/paginação pode ser construída em cima dele, mas o
  estilo base da tabela deve vir deste componente.

## Regra 9 — Evolução

- Novas necessidades de UI devem primeiro ser discutidas como **novo
  componente S7** ou extensão dos existentes.
- Evitar adicionar CSS ad-hoc em telas; em vez disso:
  - criar/estender um componente S7,
  - ou adicionar uma variação controlada (prop) em um componente
    existente.

