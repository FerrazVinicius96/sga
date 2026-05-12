/**
 * Ponto único de acesso às variáveis de ambiente do frontend.
 * Evita strings mágicas espalhadas pelo código e facilita troca de ambiente.
 */

export const config = {
  /** URL base da API sem trailing slash. Ex: http://localhost:5000/api */
  apiUrl: `${process.env.REACT_APP_API_URL ?? 'http://localhost:5000'}/api`,
} as const;
