/**
 * Tipos genéricos relacionados à camada de comunicação com a API.
 * Centraliza formatos de erro e wrappers de resposta usados em todos os serviços.
 */

/** Formato padrão de erro retornado pelo backend Express. */
export interface BackendErrorResponse {
  message?: string;
  [key: string]: unknown;
}

/** Wrapper genérico para respostas paginadas (quando o backend implementar). */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
