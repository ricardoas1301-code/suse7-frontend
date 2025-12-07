// src/components/Profile.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [userId, setUserId] = useState(null);

  const [form, setForm] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    telefone: '',
    nome_loja: '',
    cpf_cnpj: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    imposto_percentual: ''
  });

  // Buscar sessão e dados do profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session?.user) {
          setErrorMsg('Usuário não autenticado.');
          setLoading(false);
          return;
        }

        setUserId(session.user.id);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) throw error;
        if (!profile) {
          setErrorMsg('Perfil não encontrado.');
          setLoading(false);
          return;
        }

        setForm({
          nome: profile.nome || '',
          email: profile.email || session.user.email || '',
          whatsapp: profile.whatsapp || '',
          telefone: profile.telefone || '',
          nome_loja: profile.nome_loja || '',
          cpf_cnpj: profile.cpf_cnpj || '',
          cep: profile.cep || '',
          endereco: profile.endereco || '',
          numero: profile.numero || '',
          complemento: profile.complemento || '',
          bairro: profile.bairro || '',
          cidade: profile.cidade || '',
          estado: profile.estado || '',
          imposto_percentual:
            profile.imposto_percentual !== null &&
            profile.imposto_percentual !== undefined
              ? String(profile.imposto_percentual)
              : '',
        });
      } catch (err) {
        console.error(err);
        setErrorMsg('Erro ao carregar perfil.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Buscar endereço pelo CEP (ViaCEP)
  const handleBuscarCep = async () => {
    try {
      setErrorMsg(null);
      const cepLimpo = form.cep.replace(/\D/g, '');
      if (cepLimpo.length !== 8) {
        setErrorMsg('CEP inválido. Use 8 dígitos.');
        return;
      }

      const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await resp.json();

      if (data.erro) {
        setErrorMsg('CEP não encontrado.');
        return;
      }

      setForm((prev) => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao buscar o CEP.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;

    try {
      setSaving(true);
      setMessage(null);
      setErrorMsg(null);

      const payload = {
        nome: form.nome || null,
        whatsapp: form.whatsapp || null,
        telefone: form.telefone || null,
        nome_loja: form.nome_loja || null,
        cpf_cnpj: form.cpf_cnpj || null,
        cep: form.cep || null,
        endereco: form.endereco || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        imposto_percentual:
          form.imposto_percentual !== ''
            ? Number(form.imposto_percentual)
            : null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);

      if (error) throw error;

      setMessage('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="content-wrapper">
        <h2>Carregando perfil...</h2>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="content-wrapper">
        <h2>Perfil</h2>
        <p style={{ color: 'red' }}>{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <h1>Meu Perfil</h1>
      <p>Atualize seus dados pessoais e da loja. Eles serão usados na precificação.</p>

      <form className="profile-form" onSubmit={handleSave}>
        <div className="profile-section">
          <h3>Dados pessoais</h3>
          <label>
            Nome completo
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
            />
          </label>

          <label>
            E-mail
            <input type="email" name="email" value={form.email} readOnly />
          </label>

          <label>
            WhatsApp
            <input
              type="text"
              name="whatsapp"
              placeholder="(17) 99999-9999"
              value={form.whatsapp}
              onChange={handleChange}
            />
          </label>

          <label>
            Telefone
            <input
              type="text"
              name="telefone"
              placeholder="(17) 3222-2222"
              value={form.telefone}
              onChange={handleChange}
            />
          </label>
        </div>

        <div className="profile-section">
          <h3>Dados da loja</h3>

          <label>
            Nome da loja
            <input
              type="text"
              name="nome_loja"
              value={form.nome_loja}
              onChange={handleChange}
            />
          </label>

          <label>
            CPF/CNPJ
            <input
              type="text"
              name="cpf_cnpj"
              value={form.cpf_cnpj}
              onChange={handleChange}
            />
          </label>

          <div className="profile-row">
            <label style={{ flex: 1 }}>
              CEP
              <input
                type="text"
                name="cep"
                placeholder="15025-060"
                value={form.cep}
                onChange={handleChange}
              />
            </label>
            <button
              type="button"
              className="btn-secondary"
              style={{ marginLeft: '8px', marginTop: '22px' }}
              onClick={handleBuscarCep}
            >
              Buscar CEP
            </button>
          </div>

          <label>
            Endereço
            <input
              type="text"
              name="endereco"
              value={form.endereco}
              onChange={handleChange}
            />
          </label>

          <div className="profile-row">
            <label style={{ flex: 1 }}>
              Número
              <input
                type="text"
                name="numero"
                value={form.numero}
                onChange={handleChange}
              />
            </label>

            <label style={{ flex: 2, marginLeft: '8px' }}>
              Complemento
              <input
                type="text"
                name="complemento"
                value={form.complemento}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="profile-row">
            <label style={{ flex: 1 }}>
              Bairro
              <input
                type="text"
                name="bairro"
                value={form.bairro}
                onChange={handleChange}
              />
            </label>

            <label style={{ flex: 1, marginLeft: '8px' }}>
              Cidade
              <input
                type="text"
                name="cidade"
                value={form.cidade}
                onChange={handleChange}
              />
            </label>

            <label style={{ flex: 0.5, marginLeft: '8px' }}>
              UF
              <input
                type="text"
                name="estado"
                value={form.estado}
                maxLength={2}
                onChange={handleChange}
              />
            </label>
          </div>
        </div>

        <div className="profile-section">
          <h3>Imposto</h3>
          <label>
            Percentual de imposto (%)
            <input
              type="number"
              name="imposto_percentual"
              step="0.01"
              placeholder="Ex: 8"
              value={form.imposto_percentual}
              onChange={handleChange}
            />
          </label>
          <small>
            Esse valor será usado nos cálculos de precificação do Suse7.
          </small>
        </div>

        {errorMsg && <p style={{ color: 'red', marginTop: '8px' }}>{errorMsg}</p>}
        {message && <p style={{ color: 'green', marginTop: '8px' }}>{message}</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
