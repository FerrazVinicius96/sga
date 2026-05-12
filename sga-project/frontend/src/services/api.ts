/**
 * Instância axios singleton para toda a aplicação.
 *
 * Por que singleton?
 *   Registrar interceptors dentro de componentes React significa re-registrá-los
 *   a cada re-render, acumulando handlers duplicados. Um módulo ES importado uma
 *   única vez garante exatamente um par de interceptors durante toda a sessão.
 *
 * Fluxo de autenticação:
 *   - Request interceptor: injeta Bearer token de localStorage em toda requisição.
 *   - Response interceptor: em caso de 401, dispara o evento 'auth:unauthorized'
 *     para que o AuthContext faça logout sem criar dependência circular.
 */

import axios from 'axios';
import { config } from '../config/env';

const api = axios.create({
  baseURL: config.apiUrl,
});

// ── Request: injeta token em todas as chamadas ────────────────────────────────
api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error),
);

// ── Response: tratamento global de 401 ───────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Evento escutado pelo AuthContext para acionar logout sem importar o contexto aqui.
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export default api;
