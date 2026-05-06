// src/components/ProfileOnboardingModal.jsx

/* -------------------------------------------------------------
   IMPORTS BÁSICOS — REACT, SUPABASE E ASSETS
   ------------------------------------------------------------- */
import React, { useEffect, useState } from "react";         // React + Hooks
import { supabase } from "../supabaseClient";               // Cliente Supabase
import { ensureSellerCompaniesHydratedFromProfile } from "../services/sellerCompanyBootstrapApi";
import SuseLogo from "../assets/suse7-logo-redonda.png";    // Logo Suse7 redonda


/* -------------------------------------------------------------
   MÁSCARA DE CEP — FORMATO 00000-000
   ------------------------------------------------------------- */
const maskCep = (value) => {
  const cep = value.replace(/\D/g, "").slice(0, 8);         // Mantém só números, máximo 8
  return cep.length > 5                                     // Se tiver mais de 5 dígitos
    ? cep.replace(/(\d{5})(\d)/, "$1-$2")                   // Insere o traço: 00000-000
    : cep;                                                  // Caso contrário, retorna como está
};


/* -------------------------------------------------------------
   MÁSCARA DE WHATSAPP — FORMATO (DD) 9XXXX-XXXX
   ------------------------------------------------------------- */
const maskWhatsapp = (value) => {
  const nums = value.replace(/\D/g, "").slice(0, 11);       // Apenas números, máx 11
  return nums
    .replace(/^(\d{2})(\d)/g, "($1) $2")                    // Coloca DDD entre parênteses
    .replace(/(\d{5})(\d{4})$/, "$1-$2");                   // Formata final: 12345-6789
};


/* -------------------------------------------------------------
   MÁSCARA CPF / CNPJ — DETECÇÃO AUTOMÁTICA
   ------------------------------------------------------------- */
/* -------------------------------------------------------------
   MÁSCARA CPF/CNPJ — DETECÇÃO AUTOMÁTICA
   ------------------------------------------------------------- */
const maskCpfCnpj = (value) => {
  let v = value.replace(/\D/g, "");

  if (v.length <= 11) {
    // CPF
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{2})$/, "$1-$2");
  } else {
    // CNPJ
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d{2})$/, "$1-$2");
  }

  return v.slice(0, 18);
};


/* -------------------------------------------------------------
   MÁSCARA TELEFONE — (DD) XXXX-XXXX
   ------------------------------------------------------------- */
const maskTelefone = (value) => {
  const nums = value.replace(/\D/g, "").slice(0, 10);

  return nums
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d{4})(\d{4})$/, "$1-$2");
};


/* -------------------------------------------------------------
   VALIDAÇÃO CPF — ALGORITMO OFICIAL
   ------------------------------------------------------------- */
const validarCpf = (v) => {
  let cpf = v.replace(/\D/g, "");

  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += cpf[i] * (10 - i);

  let d1 = (soma * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += cpf[i] * (11 - i);

  let d2 = (soma * 10) % 11;
  if (d2 === 10) d2 = 0;

  return d2 === Number(cpf[10]);
};


/* -------------------------------------------------------------
   VALIDAÇÃO CNPJ — ALGORITMO OFICIAL (CORRIGIDO)
   ------------------------------------------------------------- */
const validarCnpj = (value) => {
  let cnpj = value.replace(/\D/g, "");

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(0)) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado == digitos.charAt(1);
};


/* -------------------------------------------------------------
   COMPONENTE PRINCIPAL — MODAL DE ONBOARDING DO PERFIL
   ------------------------------------------------------------- */
const ProfileOnboardingModal = () => {
  /* -----------------------------------------------------------
     STATES PRINCIPAIS DO MODAL
     ----------------------------------------------------------- */
  const [show, setShow] = useState(false);                  // Controla exibição do modal
  const [saving, setSaving] = useState(false);              // Controla estado de "Salvando..."
  const [loadingCep, setLoadingCep] = useState(false);      // Indica busca automática de CEP
  const [errorMsg, setErrorMsg] = useState(null);           // Mensagem de erro (validação / CEP / salvar)
  const [userId, setUserId] = useState(null);               // ID do usuário logado (Supabase)

  /* -----------------------------------------------------------
     STATE DO FORMULÁRIO — CAMPOS DO PERFIL
     ----------------------------------------------------------- */
  const [form, setForm] = useState({
    nome: "",                                               // Nome completo do usuário
    whatsapp: "",                                           // WhatsApp com máscara
    telefone: "",                                           // Telefone fixo (se quiser usar depois)
    nome_loja: "",                                          // Nome da loja
    cep: "",                                                // CEP com máscara
    endereco: "",                                           // Logradouro
    numero: "",                                             // Número
    complemento: "",                                        // Complemento
    bairro: "",                                             // Bairro
    cidade: "",                                             // Cidade
    estado: "",                                             // UF (estado, ex: SP)
    cpf_cnpj: "",                                           // Documento (CPF ou CNPJ)
    imposto_percentual: "",                                 // Percentual de imposto (em %)
  });

  /* -----------------------------------------------------------
     USEEFFECT — ABRIR MODAL NO PRIMEIRO LOGIN
     ----------------------------------------------------------- */
  useEffect(() => {
    const checkProfile = async () => {
      try {
        // 1) Busca sessão atual do Supabase
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) return;                         // Se não houver usuário, não faz nada

        setUserId(session.user.id);                         // Salva o ID do usuário logado

        // 2) Busca o profile desse usuário na tabela "profiles"
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Erro ao carregar profile:", error);
          return;
        }

        // 3) Se for primeiro_login === true, abre o modal
        if (profile?.primeiro_login) {
          setForm((prev) => ({
            ...prev,                                        // Mantém valores atuais
            nome: profile.nome || "",                       // Preenche se já existir
            whatsapp: profile.whatsapp || "",
            telefone: profile.telefone || "",
            nome_loja: profile.nome_loja || "",
            cep: profile.cep || "",
            endereco: profile.endereco || "",
            numero: profile.numero || "",
            complemento: profile.complemento || "",
            bairro: profile.bairro || "",
            cidade: profile.cidade || "",
            estado: profile.estado || "",
            cpf_cnpj: profile.cpf_cnpj || "",
            imposto_percentual: profile.imposto_percentual
              ? String(profile.imposto_percentual)          // Converte número para string
              : "",                                         // Se for nulo, deixa vazio
          }));

          setShow(true);                                    // Mostra o modal
        }
      } catch (err) {
        console.error("Erro no checkProfile:", err);
      }
    };

    checkProfile();                                         // Executa ao montar o componente
  }, []);                                                   // Dependências vazias => roda uma vez


  /* -----------------------------------------------------------
     BUSCA AUTOMÁTICA DO CEP NA API VIACEP
     ----------------------------------------------------------- */
  const buscarCepAutomatico = async (cepLimpo) => {
    setLoadingCep(true);                                    // Ativa indicador de carregamento
    setErrorMsg(null);                                      // Limpa erros anteriores

    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`); // Chama ViaCEP
      const data = await resp.json();                       // Converte resposta em JSON

      if (data.erro) {                                      // CEP inválido / não encontrado
        setErrorMsg("CEP não encontrado.");                 // Mostra mensagem de erro
        setLoadingCep(false);                               // Desativa loading
        return;
      }

      // Atualiza os campos de endereço com base na resposta
      setForm((prev) => ({
        ...prev,
        endereco: data.logradouro || "",                    // Logradouro
        bairro: data.bairro || "",                          // Bairro
        cidade: data.localidade || "",                      // Cidade
        estado: data.uf || "",                              // UF
      }));
    } catch (err) {
      console.error("Erro ao consultar CEP:", err);
      setErrorMsg("Erro ao consultar CEP.");                // Mensagem de erro genérica
    } finally {
      setLoadingCep(false);                                 // Finaliza loading
    }
  };


  /* -----------------------------------------------------------
     HANDLECHANGE — ATUALIZA CAMPOS + APLICA MÁSCARAS
     ----------------------------------------------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;                       // Extrai nome e valor do input
    let maskedValue = value;                                // Valor que será eventualmente mascarado

    // Aplica máscaras específicas
    if (name === "cep") maskedValue = maskCep(value);
    if (name === "whatsapp") maskedValue = maskWhatsapp(value);
    if (name === "cpf_cnpj") maskedValue = maskCpfCnpj(value);
    if (name === "telefone") maskedValue = maskTelefone(value);


    // Atualiza state do formulário
    setForm((prev) => ({
      ...prev,
      [name]: maskedValue,                                  // Substitui o campo alterado
    }));

    // Se o campo for CEP, dispara a busca automática ViaCEP ao completar 8 dígitos
    if (name === "cep") {
      const onlyNums = value.replace(/\D/g, "");            // Remove caracteres não numéricos
      if (onlyNums.length === 8) {                          // CEP completo (8 dígitos)
        buscarCepAutomatico(onlyNums);                      // Chama ViaCEP
      }
    }
  };


  /* -----------------------------------------------------------
   HANDLESUBMIT — SALVAR PERFIL NO SUPABASE (VERSÃO CORRIGIDA)
   ----------------------------------------------------------- */
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!userId) {
    setErrorMsg("Usuário não identificado.");
    return;
  }

  setSaving(true);
  setErrorMsg(null);

  try {
    // Remove máscara do doc
    const doc = form.cpf_cnpj.replace(/\D/g, "");

    // --- Validação CPF / CNPJ ---
    if (doc.length === 11) {
      if (!validarCpf(doc)) {
        setSaving(false);
        return setErrorMsg("CPF inválido.");
      }
    } else if (doc.length === 14) {
      if (!validarCnpj(form.cpf_cnpj)) {
        setSaving(false);
        return setErrorMsg("CNPJ inválido.");
      }
    } else {
      setSaving(false);
      return setErrorMsg("Digite um CPF ou CNPJ válido.");
    }

    // --- Monta payload ---
    const payload = {
      ...form,
      cpf_cnpj: form.cpf_cnpj,
      imposto_percentual:
        form.imposto_percentual !== "" 
          ? Number(form.imposto_percentual)
          : null,
      primeiro_login: false,
    };

    // --- Atualiza Supabase ---
    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId);

    if (error) {
      console.error("Erro Supabase:", error);
      setSaving(false);
      return setErrorMsg("Erro ao salvar. Tente novamente.");
    }

    const boot = await ensureSellerCompaniesHydratedFromProfile();
    if (!boot.ok && import.meta.env.DEV) {
      console.warn("[ProfileOnboarding] Hidratação seller_company:", boot);
    }

    // --- FECHA MODAL ---
    setShow(false);
  } catch (err) {
    console.error("Erro inesperado:", err);
    setErrorMsg("Erro inesperado. Tente novamente.");
  } finally {
    setSaving(false);
  }
};


  /* -----------------------------------------------------------
     SE O MODAL NÃO ESTIVER ATIVO, NÃO RENDERIZA NADA
     ----------------------------------------------------------- */
  if (!show) return null;                                   // Evita renderização desnecessária


  /* -----------------------------------------------------------
     UI DO MODAL — LAYOUT COMPLETO
     ----------------------------------------------------------- */
  return (
    <div className="profile-modal-backdrop">
      {/* -------------------------- CONTAINER PRINCIPAL DO MODAL -------------------------- */}
      <div className="profile-modal">

        {/* -------------------------- LOGO SUSE7 -------------------------- */}
        <img
          src={SuseLogo}                                    // Caminho da logo importada
          alt="Logo Suse7"                                  // Texto alternativo
          className="profile-modal-logo"                    // Classe para estilização no CSS
        />
        <br />

        {/* -------------------------- TÍTULO E DESCRIÇÃO DO MODAL -------------------------- */}
        <div className="profile-modal-header">
          <h2>Bem-vindo ao Suse7 👋</h2>
          <p>
            Preencha os dados iniciais da sua loja. Você poderá editar depois em{" "}
            <b>Meu Perfil</b>.
          </p>
        </div>

        <br />

        {/* -------------------------- FORMULÁRIO PRINCIPAL -------------------------- */}
        <form onSubmit={handleSubmit} className="profile-modal-form">

  {/* LINHA 1 — Nome + Nome da loja */}
  <div className="profile-grid">
    <label>
      Seu nome *
      <input type="text" name="nome" value={form.nome} onChange={handleChange} required />
    </label>

    <label>
      Nome da loja *
      <input type="text" name="nome_loja" value={form.nome_loja} onChange={handleChange} required />
    </label>
  </div>

  {/* LINHA 2 — CPF/CNPJ + Imposto */}
  <div className="profile-grid">
    <label>
      CPF/CNPJ *
      <input type="text" name="cpf_cnpj" value={form.cpf_cnpj} onChange={handleChange} required />
    </label>

    <label>
      Imposto (%) *
      <input type="number" name="imposto_percentual" value={form.imposto_percentual} onChange={handleChange} required />
    </label>
  </div>

  {/* LINHA 3 — WhatsApp + Telefone */}
  <div className="profile-grid">
    <label>
      WhatsApp *
      <input type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange} required />
    </label>

    <label>
      Telefone
      <input type="text" name="telefone" value={form.telefone} onChange={handleChange} />
    </label>
  </div>

  {/* LINHA 4 — CEP + Endereço */}
  <div className="profile-grid">
    <label>
      CEP *
      <input type="text" name="cep" value={form.cep} onChange={handleChange} required />
    </label>

    <label>
      Endereço
      <input type="text" name="endereco" value={form.endereco} onChange={handleChange} required />
    </label>
  </div>

  {/* LINHA 5 — Número + Complemento */}
  <div className="profile-grid">
    <label>
      Número *
      <input type="text" name="numero" value={form.numero} onChange={handleChange} required />
    </label>

    <label>
      Complemento
      <input type="text" name="complemento" value={form.complemento} onChange={handleChange} />
    </label>
  </div>

  {/* LINHA 6 — Bairro + Cidade + UF */}
  <div className="profile-grid-3">
    <label>
      Bairro *
      <input type="text" name="bairro" value={form.bairro} onChange={handleChange} required />
    </label>

    <label>
      Cidade *
      <input type="text" name="cidade" value={form.cidade} onChange={handleChange} required />
    </label>

    <label>
      UF *
      <input type="text" name="estado" maxLength="2" value={form.estado} onChange={handleChange} required />
    </label>
  </div>

  {/* MENSAGEM DE ERRO */}
  {errorMsg && <p style={{ color: "red", marginTop: 10 }}>{errorMsg}</p>}

  {/* BOTÃO */}
  <button type="submit" className="btn-primary" disabled={saving}>
    {saving ? "Salvando..." : "Salvar e começar a usar"}
  </button>
</form>
      </div>
    </div>
  );
};


/* -------------------------------------------------------------
   EXPORT DEFAULT DO COMPONENTE
   ------------------------------------------------------------- */
export default ProfileOnboardingModal;
