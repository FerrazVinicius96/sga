import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const geproHeaders = { 'X-Sistema': 'gepro' };

function TemplateCard({ tipo }: { tipo: 'etp' | 'tr' }) {
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/gepro/templates/${tipo}/ativo`, { headers: geproHeaders })
      .then(r => setTemplate(r.data.data ?? r.data))
      .catch(() => setTemplate(null))
      .finally(() => setLoading(false));
  }, [tipo]);

  const label = tipo === 'etp' ? 'Template ETP' : 'Template TR';
  const sub = tipo === 'etp' ? 'Estudo Técnico Preliminar' : 'Termo de Referência';

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{label}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{sub}</div>
        </div>
        {!loading && (
          <span style={{ padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: template ? '#d1fae5' : '#f3f4f6', color: template ? '#065f46' : '#6b7280' }}>
            {template ? 'Ativo' : 'Não publicado'}
          </span>
        )}
      </div>
      {loading ? (
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Verificando…</p>
      ) : template ? (
        <div style={{ fontSize: 12, color: '#374151' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><span style={{ color: '#9ca3af' }}>Versão:</span> {template.versao ?? '—'}</div>
            <div><span style={{ color: '#9ca3af' }}>Publicado em:</span> {template.data_criacao ? new Date(template.data_criacao).toLocaleDateString('pt-BR') : '—'}</div>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
          Nenhum template ativo. Publique uma versão para habilitar o preenchimento do {tipo.toUpperCase()}.
        </p>
      )}
    </div>
  );
}

export default function ConfiguracoesPage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Configurações</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Administração do módulo GEPRO · Acesso restrito a administradores</p>
      </div>

      {/* Templates */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: 12 }}>Templates de Instrução Técnica</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <TemplateCard tipo="etp" />
          <TemplateCard tipo="tr" />
        </div>
      </div>

      {/* Informações do sistema */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: 12 }}>Informações do Sistema</h2>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { label: 'Versão do Sistema', value: '1.0.0' },
              { label: 'Módulo GEPRO', value: 'v2 — Lei 14.133/2021' },
              { label: 'Ambiente', value: 'Produção' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.4px', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Parâmetros de negócio */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: 12 }}>Parâmetros de Negócio</h2>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
          {[
            { param: 'Número mínimo de cotações', valor: '3', base: 'Lei 14.133/2021, Art. 5º §3º' },
            { param: 'Validade padrão da cotação', valor: '90 dias', base: 'Portaria interna' },
            { param: 'Modalidade ARP requer TR?', valor: 'Não', base: 'Regra de negócio RN004' },
            { param: 'Prazo máximo para instrução técnica', valor: '30 dias', base: 'Portaria interna' },
          ].map(({ param, valor, base }, i) => (
            <div key={param} style={{ padding: '14px 24px', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{param}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{base}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', background: '#eff6ff', padding: '4px 12px', borderRadius: 4 }}>{valor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
