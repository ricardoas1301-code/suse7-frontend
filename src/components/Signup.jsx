// src/components/Signup.jsx

import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import GoogleIcon from "../assets/google.png";
import "./Signup.css";
import Suse7Alert from "../components/Suse7Alert";


// --- Funções de Validação de CPF/CNPJ (CNPJ Corrigido Novamente) ---
const validarCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let soma = 0;
  let resto;
  for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  return true;
};

// 🔥 CNPJ VALIDATION CORRIGIDA DEFINITIVAMENTE
function validarCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g, "");
  if (cnpj.length !== 14) return false;

  // Elimina CNPJs inválidos conhecidos
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
}

export default function Signup() {
  const navigate = useNavigate();

  // --- Estados para mostrar/esconder senha ---
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // -------------------------------
  // CAMPOS DO FORMULÁRIO
  // -------------------------------
  const [form, setForm] = useState({
    nome: "",
    nome_loja: "",
    email: "",
    whatsapp: "",
    telefone: "",
    cpf_cnpj: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    imposto_percentual: "",
    senha: "",
    senha2: "",
    termos: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alertData, setAlertData] = useState(null);


  // ----------------------------------------
  // Atualizar campos com MÁSCARAS e validação numérica
  // ----------------------------------------
  const update = (field, value) => {
    let formattedValue = value;
    let newErrors = { ...errors, [field]: "" };

    const onlyNumbers = value.replace(/\D/g, '');

    if (field === 'whatsapp' || field === 'telefone') {
      formattedValue = onlyNumbers.slice(0, 11)
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{4})$/, '$1-$2')
        .replace(/(\d{5})(\d{4})$/, '$1-$2');
    } else if (field === 'cep') {
      formattedValue = onlyNumbers.slice(0, 8)
        .replace(/^(\d{5})(\d)/, '$1-$2');
    } else if (field === 'cpf_cnpj') {
      if (onlyNumbers.length <= 11) { 
        formattedValue = onlyNumbers.slice(0, 11)
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      } else { 
        formattedValue = onlyNumbers.slice(0, 14)
          .replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/\.(\d{3})(\d)/, '.$1/$2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      }
    } else if (field === 'imposto_percentual') {
      formattedValue = onlyNumbers.slice(0, 2);
      formattedValue = formattedValue ? `${formattedValue}%` : "";
    } else if (field === 'estado') {
      formattedValue = value.toUpperCase().slice(0, 2);
    } else if (field === 'numero') {
      formattedValue = onlyNumbers;
    }

    setForm({ ...form, [field]: formattedValue });
    setErrors(newErrors);
  };

  // ----------------------------------------
  // ViaCEP - Preencher endereço automático
  // ----------------------------------------
  const buscarCEP = async () => {
    const cepLimpo = form.cep.replace(/\D/g, '');
    if (!cepLimpo || cepLimpo.length < 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          endereco: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
        }));
        setErrors((prev) => ({ ...prev, cep: "" }));
      } else {
        setErrors((prev) => ({
          ...prev,
          cep: "CEP não encontrado",
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        cep: "Erro ao buscar CEP",
      }));
    }
  };

  // ----------------------------------------
  // Validação dos campos obrigatórios e CPF/CNPJ
  // ----------------------------------------
  const validarCampos = () => {
    const e = {};

    if (!form.nome_loja) e.nome_loja = "Campo obrigatório";
    if (!form.email) e.email = "Campo obrigatório";
    if (!form.whatsapp) e.whatsapp = "Campo obrigatório";
    
    // Validação de CPF/CNPJ
    const cpfCnpjLimpo = form.cpf_cnpj.replace(/\D/g, '');
    if (!form.cpf_cnpj) {
      e.cpf_cnpj = "Campo obrigatório";
    } else if (cpfCnpjLimpo.length === 11) {
      if (!validarCPF(cpfCnpjLimpo)) e.cpf_cnpj = "CPF inválido";
    } else if (cpfCnpjLimpo.length === 14) {
      if (!validarCNPJ(cpfCnpjLimpo)) e.cpf_cnpj = "CNPJ inválido";
    } else {
      e.cpf_cnpj = "CPF ou CNPJ inválido";
    }
    
    if (!form.cep) e.cep = "Campo obrigatório";
    if (!form.imposto_percentual) e.imposto_percentual = "Campo obrigatório";

    if (!form.senha) e.senha = "Campo obrigatório";
    if (form.senha.length < 6) e.senha = "Mínimo 6 caracteres";
    if (form.senha !== form.senha2)
      e.senha2 = "As senhas não coincidem";

    if (!form.termos)
      e.termos = "Você deve aceitar os termos";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

 // ----------------------------------------
// Google Login (com criação automática de profile)
// ----------------------------------------
const handleGoogleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
  });

  if (error) {
    console.error(error);
    setAlertData({
    type: "error",
     message: "Não foi possível conectar ao Google.\nPor favor, tente novamente."
  });
    return;
  }

  // Pequeno delay para esperar o Google retornar o usuário
  setTimeout(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Verifica se esse profile já existe
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile) return; // já existe → não cria de novo

    // Criar o profile inicial
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      primeiro_login: true, // FLAG IMPORTANTE
      created_at: new Date(),
      last_login: new Date(),
    });

  }, 800);
};


  // ----------------------------------------
  // Enviar cadastro para Supabase
  // ----------------------------------------
 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validarCampos()) {
    const btn = document.querySelector(".signup-btn");
    btn.classList.add("shake");
    setTimeout(() => btn.classList.remove("shake"), 500);
    return;
  }

  setLoading(true);

  // 1) Criar conta na AUTH
  const { data, error } = await supabase.auth.signUp({
    email: form.email,
    password: form.senha,
  });

  if (error) {
   setAlertData({
  title: "Conta já existente",
  message:
    "O e-mail informado já está cadastrado no Suse7.\n" +
    "Se você já possui uma conta, faça login para continuar.\n" +
    "Caso precise recuperar o acesso, clique em “Esqueci minha senha”."
});

    setLoading(false);
    return;
  }

  const user = data.user;

  if (!user) {
    setAlertData({
  title: "Conta já existente",
  message:
    "O e-mail informado já está cadastrado no Suse7.\n" +
    "Se você já possui uma conta, faça login para continuar.\n" +
    "Caso precise recuperar o acesso, clique em “Esqueci minha senha”."
});
    setLoading(false);
    return;
  }

  // 2) Criar profile COMPLETO já com primeiro_login = false
  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    nome: form.nome,
    nome_loja: form.nome_loja,
    email: form.email,
    whatsapp: form.whatsapp.replace(/\D/g, ''),
    telefone: form.telefone.replace(/\D/g, ''),
    cpf_cnpj: form.cpf_cnpj.replace(/\D/g, ''),
    cep: form.cep.replace(/\D/g, ''),
    endereco: form.endereco,
    numero: form.numero.replace(/\D/g, ''),
    complemento: form.complemento,
    bairro: form.bairro,
    cidade: form.cidade,
    estado: form.estado,
    imposto_percentual: Number(form.imposto_percentual.replace("%", "")),

    primeiro_login: false,   // 👈 AGORA SIM! CADASTRO COMPLETO
    created_at: new Date(),
    last_login: new Date(),
    photo_url: "",
  });

  if (profileError) {
    console.error("Erro ao criar perfil:", profileError);
  }

  // 3) Redirecionar
  navigate("/login");
};

  return (
    <div className="signup-container">

      {/* COLUNA ESQUERDA (MARKETING) */}
      <div className="signup-left">
        <Link to="/login" className="signup-back-top">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Voltar
        </Link>
    
        <h1 className="signup-main-title">Comece agora o seu <span style={{color: '#0077ff'}}>Teste Grátis</span></h1>
        <p className="signup-main-description">O Suse7 Precifica automatiza toda a gestão de preços dos seus produtos, garantindo agilidade, precisão e segurança, tudo integrado e automatizado.</p>
         <br />
          <ul className="signup-benefits">
          <li>
            <span className="icon-star">🛒</span>
            <div>
              <h3>Tudo em um só lugar</h3>
              <p>Faça a gestão completa da precificação para Mercado Livre!</p>
            </div>
          </li>
          <li>
            <span className="icon-headset">💰</span>
            <div>
              <h3>Aumente sua margem de lucro com precificação inteligente</h3>
              <p>O Suse7 automatiza regras, comissões, taxas e frete dos marketplaces para você precificar rápido, com precisão e sem erros.</p>
            </div>
          </li>
          <li>
            <span className="icon-at">🚀</span>
            <div>
              <h3>Escale suas vendas com precificação segura e contínua</h3>
              <p>Monitore seus preços e ajuste com inteligência, mantendo sua operação lucrativa e competitiva o tempo todo.</p>
            </div>
          </li>
          <li>
            <span className="icon-no-fee">💸</span>
            <div>
              <h3>Sem cobranças surpresa!</h3>
              <p>Comece seu teste grátis sem cadastrar cartão de crédito, escolha seu plano e troque quando quiser.</p>
            </div>
          </li>
        </ul>
       </div>

      {/* COLUNA DIREITA (FORMULÁRIO) */}
      <div className="signup-right">
        
        {/* Google Login */}
        <button className="google-btn" onClick={handleGoogleLogin}>
          <img src={GoogleIcon} alt="Google" />
          <span>Entrar com Google</span>
        </button>

        <div className="divider">ou preencha seus dados abaixo</div>

        <form onSubmit={handleSubmit}>

          {/* NOME / NOME DA LOJA */}
          <div className="row">
            <div className="field">
              <label>Seu nome</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => update("nome", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Nome da loja *</label>
              <input
                type="text"
                className={errors.nome_loja ? "error" : ""}
                value={form.nome_loja}
                onChange={(e) => update("nome_loja", e.target.value)}
              />
              {errors.nome_loja && <p className="err">{errors.nome_loja}</p>}
            </div>
          </div>

          {/* EMAIL / WHATSAPP */}
          <div className="row">
            <div className="field">
              <label>E-mail *</label>
              <input
                type="email"
                className={errors.email ? "error" : ""}
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              {errors.email && <p className="err">{errors.email}</p>}
            </div>

            <div className="field">
              <label>WhatsApp *</label>
              <input
                type="tel"
                className={errors.whatsapp ? "error" : ""}
                value={form.whatsapp}
                onChange={(e) => update("whatsapp", e.target.value)}
                maxLength={15}
              />
              {errors.whatsapp && <p className="err">{errors.whatsapp}</p>}
            </div>
          </div>

          {/* CPF/CNPJ / TELEFONE */}
          <div className="row">
            <div className="field">
              <label>CPF/CNPJ *</label>
              <input
                type="text"
                className={errors.cpf_cnpj ? "error" : ""}
                value={form.cpf_cnpj}
                onChange={(e) => update("cpf_cnpj", e.target.value)}
                maxLength={18}
              />
              {errors.cpf_cnpj && <p className="err">{errors.cpf_cnpj}</p>}
            </div>

            <div className="field">
              <label>Telefone</label>
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => update("telefone", e.target.value)}
                maxLength={14}
              />
            </div>
          </div>

{() => {
  if (!validarCNPJ(cnpj)) {
    setErroCNPJ("CNPJ inválido");
  } else {
    setErroCNPJ("");
  }
}}

          {/* CEP / ENDEREÇO */}
          <div className="row">
            <div className="field">
              <label>CEP *</label>
              <input
                type="text"
                className={errors.cep ? "error" : ""}
                value={form.cep}
                onChange={(e) => update("cep", e.target.value)}
                onBlur={buscarCEP}
                maxLength={9}
              />
              {errors.cep && <p className="err">{errors.cep}</p>}
            </div>

            <div className="field">
              <label>Endereço</label>
              <input
                type="text"
                value={form.endereco}
                onChange={(e) => update("endereco", e.target.value)}
              />
            </div>
          </div>

          {/* NUMERO / COMPLEMENTO */}
          <div className="row">
            <div className="field">
              <label>Número</label>
              <input
                type="text"
                value={form.numero}
                onChange={(e) => update("numero", e.target.value)}
                maxLength={10}
              />
            </div>

            <div className="field">
              <label>Complemento</label>
              <input
                type="text"
                value={form.complemento}
                onChange={(e) => update("complemento", e.target.value)}
              />
            </div>
          </div>

          {/* BAIRRO / CIDADE / ESTADO */}
          <div className="row">
            <div className="field">
              <label>Bairro</label>
              <input
                type="text"
                value={form.bairro}
                onChange={(e) => update("bairro", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Cidade</label>
              <input
                type="text"
                value={form.cidade}
                onChange={(e) => update("cidade", e.target.value)}
              />
            </div>

            <div className="field small">
              <label>UF</label>
              <input
                type="text"
                maxLength={2}
                value={form.estado}
                onChange={(e) => update("estado", e.target.value)}
              />
            </div>
          </div>

          {/* IMPOSTO */}
          <div className="row">
            <div className="field imposto-small">
              <label>Imposto (%) *</label>
              <input
                type="text"
                className={errors.imposto_percentual ? "error" : ""}
                value={form.imposto_percentual}
                onChange={(e) => update("imposto_percentual", e.target.value)}
                maxLength={3}
              />
              {errors.imposto_percentual && <p className="err">{errors.imposto_percentual}</p>}
            </div>
          </div>

          {/* SENHA */}
          <div className="row">
            <div className="field">
              <label>Senha *</label>
              <div className="password-wrapper">
                                <input
  type={showPassword ? "text" : "password"}
  className={errors.senha ? "error" : ""}
  value={form.senha}
  onChange={(e) => update("senha", e.target.value)}
/>

                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "✖" : "✔"}
                </button>
              </div>
              {errors.senha && <p className="err">{errors.senha}</p>}
            </div>

            <div className="field">
              <label>Confirmar senha *</label>
              <div className="password-wrapper">
                <input
  type={showPassword2 ? "text" : "password"}
  className={errors.senha2 ? "error" : ""}
  value={form.senha2}
  onChange={(e) => update("senha2", e.target.value)}
/>

                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword2(!showPassword2)}
                >
                  {showPassword2 ? "✖" : "✔"}
                </button>
              </div>
              {errors.senha2 && <p className="err">{errors.senha2}</p>}
            </div>
          </div>

          {/* TERMOS */}
          <div className="termos-box">
            <input
              type="checkbox"
              checked={form.termos}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setForm((prev) => ({ ...prev, termos: isChecked }));
                setErrors((prev) => ({ ...prev, termos: "" }));
              }}
            />
            <label>Eu li e aceito os termos de uso *</label>
          </div>
          {errors.termos && <p className="err">{errors.termos}</p>}

          {/* BOTÃO CRIAR CONTA */}
          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </button>

        </form>
      </div>

      {/* Estilos adicionais */}
      <style>{`
        .signup-left {
          overflow-y: auto; 
          padding-right: 20px;
        }
        
        .signup-left .signup-main-title {
          font-size: 2em;
          font-weight: 700;
          color: #333;
          margin-bottom: 15px;
          line-height: 1.2;
        }
        .signup-left .signup-main-description {
          font-size: 1em;
          color: #666;
          margin-bottom: 25px;
          line-height: 1.4;
        }

        .signup-left .signup-benefits li {
          margin-bottom: 15px;
          gap: 10px;
        }
        
        .signup-left .signup-small-print {
          margin-top: 20px;
        }
        
        /* ---------------------------------------------------------------------------------------
         Alinhamento do Ícone de Senha (Mantido o CSS correto)
        --------------------------------------------------------------------------------------- */
        .password-wrapper {
            position: relative;
            margin-bottom: 0; 
        }

        .password-wrapper .login-input {
            width: 100%;
            padding: 12px 16px;
            border-radius: 10px;
            border: 1px solid #cfd7e3;
            background: #f1f5ff;
            font-size: 14px;
            box-sizing: border-box; 
            
            padding-right: 48px !important; 
            margin-bottom: 0; 
        }

        .password-toggle-btn {
            position: absolute;
            right: 15px; 
            top: 50%;
            transform: translateY(-50%);
            
            background: none;
            border: none;
            cursor: pointer;
            color: #4a4a4a;
            font-size: 18px;
            padding: 0;
            line-height: 1; 
            outline: none;
            z-index: 10;
        }
      `}</style>

{alertData && (
  <Suse7Alert
    title={alertData.title}
    message={alertData.message}
    onClose={() => setAlertData(null)}
  />
)}


    </div>
  );
}
