import { normalizeOperationalWorkingDays } from "../features/dashboard/operationalWorkingDays.js";

/**
 * Monta payload de perfil no sign-up inicial — campos complementares omitidos quando vazios.
 * CEP/endereço/custo operacional/dias operacionais não são exigidos nesta etapa.
 *
 * @param {Record<string, unknown>} form
 * @param {string} userId
 * @param {string} emailTrimmed
 */
export function montarSignupProfilePayload(form, userId, emailTrimmed) {
  const cepDigits = String(form.cep ?? "").replace(/\D/g, "");
  const numeroDigits = String(form.numero ?? "").replace(/\D/g, "");
  const telefoneDigits = String(form.telefone ?? "").replace(/\D/g, "");
  const opRate = String(form.custo_operacional_padrao ?? "").trim();

  /** @type {Record<string, unknown>} */
  const payload = {
    id: userId,
    nome: form.nome,
    nome_loja: form.nome_loja,
    email: emailTrimmed,
    whatsapp: String(form.whatsapp ?? "").replace(/\D/g, ""),
    cpf_cnpj: String(form.cpf_cnpj ?? "").replace(/\D/g, ""),
    primeiro_login: false,
    created_at: new Date(),
    last_login: new Date(),
    photo_url: "",
  };

  if (telefoneDigits) payload.telefone = telefoneDigits;
  const impostoRaw = String(form.imposto_percentual ?? "").replace("%", "").trim();
  if (impostoRaw !== "") payload.imposto_percentual = Number(impostoRaw);
  if (cepDigits) payload.cep = cepDigits;
  if (form.endereco) payload.endereco = form.endereco;
  if (numeroDigits) payload.numero = numeroDigits;
  if (form.complemento) payload.complemento = form.complemento;
  if (form.bairro) payload.bairro = form.bairro;
  if (form.cidade) payload.cidade = form.cidade;
  if (form.estado) payload.estado = form.estado;
  if (form.operational_day_closes_at) {
    payload.operational_day_closes_at = form.operational_day_closes_at;
  }
  if (Array.isArray(form.operational_working_days) && form.operational_working_days.length > 0) {
    payload.operational_working_days = normalizeOperationalWorkingDays(form.operational_working_days);
  }

  return payload;
}
