// ======================================================================
// Painel de informações oficiais ML — modais Discover e Detalhe do concorrente
// ======================================================================

import { montarMetaOficialConcorrente } from "./concorrenciaCompetitorDisplay";
import S7Tooltip from "../ui/S7Tooltip.jsx";
import S7Icon from "../ui/S7Icon.jsx";
import "./ConcorrenciaConcorrenteOficialMeta.css";

function LinhaMeta({
  rotulo,
  valor,
  destaque = false,
  classeValor = "",
  classeLinha = "",
  linhaCompleta = false,
  reservarVazio = false,
  textoPlaceholder = null,
  textoAdaptavel = false,
  tooltipS7 = false,
  tooltipConteudo = null,
  rotuloAntes = null,
  rotuloDepois = null,
}) {
  const vazio = valor == null || String(valor).trim() === "";
  if (vazio && !reservarVazio) return null;
  const exibirPlaceholder = vazio && textoPlaceholder != null && String(textoPlaceholder).trim() !== "";
  const valorExibido = exibirPlaceholder ? textoPlaceholder : vazio ? "\u00A0" : valor;
  const comprimentoTexto =
    textoAdaptavel && !vazio && !exibirPlaceholder ? String(valor).trim().length : 0;
  const exibirTooltipS7 =
    tooltipS7 && !vazio && !exibirPlaceholder && String(tooltipConteudo ?? valor ?? "").trim() !== "";

  const valorNode = (
    <span
      className={[
        "concorrencia-oficial-meta__valor",
        destaque ? "concorrencia-oficial-meta__valor--destaque" : "",
        vazio && !exibirPlaceholder ? "concorrencia-oficial-meta__valor--vazio" : "",
        exibirPlaceholder ? "concorrencia-oficial-meta__valor--placeholder" : "",
        textoAdaptavel ? "concorrencia-oficial-meta__valor--texto-adaptavel" : "",
        classeValor,
      ]
        .filter(Boolean)
        .join(" ")}
      title={
        !exibirTooltipS7 &&
        textoAdaptavel &&
        !vazio &&
        !exibirPlaceholder &&
        valor != null
          ? String(valor)
          : undefined
      }
      style={
        textoAdaptavel && comprimentoTexto > 0
          ? { "--s7-meta-texto-len": String(comprimentoTexto) }
          : undefined
      }
    >
      {valorExibido}
    </span>
  );

  return (
    <div
      className={[
        "concorrencia-oficial-meta__linha",
        linhaCompleta ? "concorrencia-oficial-meta__linha--completa" : "",
        classeLinha,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="concorrencia-oficial-meta__rotulo-wrap">
        {rotuloAntes}
        <span className="concorrencia-oficial-meta__rotulo">{rotulo}</span>
        {rotuloDepois}
      </span>
      <span className="concorrencia-oficial-meta__valor-wrap">
        {exibirTooltipS7 ? (
          <S7Tooltip
            content={String(tooltipConteudo ?? valor)}
            placement="top-start"
            offset={6}
            wrap
            className="concorrencia-oficial-meta__valor-tip"
          >
            {valorNode}
          </S7Tooltip>
        ) : (
          valorNode
        )}
      </span>
    </div>
  );
}

function BlocoMeta({ titulo, children }) {
  const linhas = Array.isArray(children) ? children.filter(Boolean) : children;
  if (!linhas || (Array.isArray(linhas) && linhas.length === 0)) return null;
  return (
    <section className="concorrencia-oficial-meta__bloco">
      <h3 className="concorrencia-oficial-meta__bloco-titulo">{titulo}</h3>
      <div className="concorrencia-oficial-meta__bloco-corpo">{children}</div>
    </section>
  );
}

function LinhaFreteMeta({ meta, ocultarFrete, variante = "discover" }) {
  if (ocultarFrete) return null;
  const reservarDiscover = variante === "discover";
  const freteVazio = meta.frete == null || String(meta.frete).trim() === "";
  if (freteVazio && !reservarDiscover) return null;
  return (
    <LinhaMeta
      rotulo="Frete"
      valor={meta.frete}
      textoPlaceholder={reservarDiscover ? "Não informado" : null}
      reservarVazio={reservarDiscover && freteVazio}
      classeValor={
        freteVazio && reservarDiscover
          ? ""
          : meta.freteTom === "gratis"
            ? "concorrencia-oficial-meta__valor--frete-gratis"
            : meta.freteTom === "pago"
              ? "concorrencia-oficial-meta__valor--frete-pago"
              : ""
      }
    />
  );
}

/**
 * @param {{
 *   competitor: object;
 *   variante?: "discover" | "detalhe";
 *   ocultarFrete?: boolean;
 * }} props
 */
export default function ConcorrenciaConcorrenteOficialMeta({
  competitor,
  variante = "discover",
  ocultarFrete = false,
}) {
  const meta = montarMetaOficialConcorrente(competitor);

  const placeholderDiscover = "Não informado";
  const reservarLinhaVazia = variante === "discover" || variante === "detalhe";
  const placeholderLinhaVazia = variante === "discover" ? placeholderDiscover : null;

  const blocoAnuncioDiscover = (
    <BlocoMeta titulo="Informações do anúncio">
      <LinhaMeta
        rotulo="ID do anúncio"
        valor={meta.idAnuncio}
        reservarVazio
        textoPlaceholder={placeholderDiscover}
      />
      <LinhaFreteMeta meta={meta} ocultarFrete={ocultarFrete} variante={variante} />
      <LinhaMeta
        rotulo="Tipo"
        valor={meta.tipoAnuncio}
        destaque={Boolean(meta.tipoAnuncio)}
        reservarVazio
        textoPlaceholder={placeholderDiscover}
        classeLinha="concorrencia-oficial-meta__linha--tipo-inline"
      />
      <LinhaMeta
        rotulo="Categoria"
        valor={meta.categoria}
        linhaCompleta
        reservarVazio
        textoPlaceholder={placeholderDiscover}
      />
    </BlocoMeta>
  );

  const blocoAnuncioDetalhe = (
    <BlocoMeta titulo="Informações do anúncio">
      <LinhaMeta
        rotulo="ID do anúncio"
        valor={meta.idAnuncio}
        reservarVazio={reservarLinhaVazia}
        textoPlaceholder={placeholderLinhaVazia}
      />
      <LinhaFreteMeta meta={meta} ocultarFrete={ocultarFrete} variante={variante} />
      <LinhaMeta
        rotulo={variante === "discover" ? "Tipo" : "Tipo do anúncio"}
        valor={meta.tipoAnuncio}
        destaque={Boolean(meta.tipoAnuncio)}
        reservarVazio={reservarLinhaVazia}
        textoPlaceholder={placeholderLinhaVazia}
        classeLinha={
          variante === "discover" ? "concorrencia-oficial-meta__linha--tipo-inline" : ""
        }
      />
      <LinhaMeta
        rotulo="Categoria"
        valor={meta.categoria}
        linhaCompleta
        reservarVazio={variante === "discover"}
        textoPlaceholder={variante === "discover" ? placeholderDiscover : null}
      />
      {meta.exibirSeparadoVerificacaoCaptura ? (
        <>
          <LinhaMeta
            rotulo="Última verificação"
            valor={meta.ultimaVerificacao}
            reservarVazio={reservarLinhaVazia}
            textoPlaceholder={placeholderLinhaVazia}
          />
          <LinhaMeta
            rotulo="Preço capturado em"
            valor={meta.precoCapturadoEm}
            reservarVazio={reservarLinhaVazia}
            textoPlaceholder={placeholderLinhaVazia}
          />
        </>
      ) : (
        <LinhaMeta
          rotulo="Última atualização"
          valor={meta.atualizacao}
          reservarVazio={reservarLinhaVazia}
          textoPlaceholder={placeholderLinhaVazia}
        />
      )}
    </BlocoMeta>
  );

  const blocoAnuncio = variante === "discover" ? blocoAnuncioDiscover : blocoAnuncioDetalhe;

  const blocoVendedor = (
    <BlocoMeta titulo="Informações do vendedor">
      <LinhaMeta
        rotulo="Nome da loja"
        valor={meta.nomeLoja}
        reservarVazio={reservarLinhaVazia}
        textoPlaceholder={placeholderLinhaVazia}
        textoAdaptavel={variante === "discover"}
        classeLinha={
          variante === "discover" ? "concorrencia-oficial-meta__linha--nome-loja" : ""
        }
      />
      <LinhaMeta
        rotulo="Seller ID"
        valor={meta.sellerId}
        reservarVazio={reservarLinhaVazia}
        textoPlaceholder={placeholderLinhaVazia}
      />
      <LinhaMeta
        rotulo="Reputação"
        valor={meta.reputacao}
        classeValor={meta.reputacaoClasse}
        reservarVazio={reservarLinhaVazia}
        textoPlaceholder={variante === "discover" ? "—" : placeholderLinhaVazia}
        textoAdaptavel={variante === "discover"}
        tooltipS7={variante === "discover"}
        tooltipConteudo={meta.reputacao}
        classeLinha={
          variante === "discover" ? "concorrencia-oficial-meta__linha--reputacao" : ""
        }
      />
      <LinhaMeta
        rotulo={variante === "detalhe" ? "Mercado" : "MercadoLíder"}
        valor={meta.mercadoLider}
        destaque={Boolean(meta.mercadoLider)}
        rotuloDepois={
          variante === "detalhe" && meta.mercadoLider ? (
            <S7Icon
              name="mercado_lider_medal"
              size={11}
              strokeWidth={2.1}
              className="concorrencia-oficial-meta__rotulo-icone"
              aria-hidden
            />
          ) : null
        }
        reservarVazio={reservarLinhaVazia}
        textoPlaceholder={placeholderLinhaVazia}
        classeLinha="concorrencia-oficial-meta__linha--mercado-lider"
      />
      <LinhaMeta
        rotulo="Vendas"
        valor={meta.vendasVendedor}
        reservarVazio={reservarLinhaVazia}
        textoPlaceholder={placeholderLinhaVazia}
      />
    </BlocoMeta>
  );

  const temBlocoAnuncio =
    variante === "discover" ||
    variante === "detalhe" ||
    meta.tipoAnuncio ||
    meta.categoria ||
    meta.idAnuncio ||
    meta.statusAnuncioDetalhe ||
    meta.statusAnuncio ||
    (!ocultarFrete && meta.frete);
  const temBlocoVendedor =
    variante === "discover" ||
    variante === "detalhe" ||
    meta.nomeLoja ||
    meta.sellerId ||
    meta.reputacao ||
    meta.mercadoLider ||
    meta.vendasVendedor;

  if (!temBlocoAnuncio && !temBlocoVendedor) return null;

  return (
    <div className={`concorrencia-oficial-meta concorrencia-oficial-meta--${variante}`}>
      {temBlocoAnuncio ? blocoAnuncio : null}
      {temBlocoVendedor ? blocoVendedor : null}
    </div>
  );
}
