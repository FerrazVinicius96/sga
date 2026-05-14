/**
 * Utilitários GEPRO — regras de negócio que precisam ser aplicadas na UI.
 * Espelham as validações do backend (demandasService.js / modalidadeService.js).
 */

export type ModalidadeLicitacao = 'pregao' | 'concorrencia' | 'ata_registro_precos';

export const MODALIDADE_LABELS: Record<ModalidadeLicitacao, string> = {
  pregao:               'Pregão',
  concorrencia:         'Concorrência',
  ata_registro_precos:  'Ata de Registro de Preços (ARP)',
};

export const MODALIDADE_OPTIONS = (
  Object.entries(MODALIDADE_LABELS) as [ModalidadeLicitacao, string][]
).map(([value, label]) => ({ value, label }));

/**
 * RN004 — TR não é permitido para Ata de Registro de Preços.
 * Usar para ocultar/desabilitar a aba TR na Fase 2 antes de qualquer chamada ao backend.
 */
export function isTRAllowed(modalidade: ModalidadeLicitacao | string | undefined): boolean {
  return modalidade !== 'ata_registro_precos';
}

export type DemandaStatus =
  | 'necessidade'
  | 'instrucao'
  | 'encaminhamento'
  | 'nota_empenho_emitida'
  | 'agendamento_pendente'
  | 'agendamento_confirmado'
  | 'entregue'
  | 'recebimento_provisorio'
  | 'testes'
  | 'atestado_gerado'
  | 'atestado_enviado_email'
  | 'encerrado';

export const STATUS_LABELS: Record<DemandaStatus, string> = {
  necessidade:             'Necessidade',
  instrucao:               'Instrução Técnica',
  encaminhamento:          'Encaminhamento',
  nota_empenho_emitida:    'NE Emitida',
  agendamento_pendente:    'Agendamento Pendente',
  agendamento_confirmado:  'Agendamento Confirmado',
  entregue:                'Entregue',
  recebimento_provisorio:  'Recebimento Provisório',
  testes:                  'Testes Técnicos',
  atestado_gerado:         'Atestado Gerado',
  atestado_enviado_email:  'Atestado Enviado',
  encerrado:               'Encerrado',
};

/** Mapeia status para a fase numérica exibida na barra de progresso (1–5). */
export function statusToFase(status: DemandaStatus): 1 | 2 | 3 | 4 | 5 {
  const map: Record<DemandaStatus, 1 | 2 | 3 | 4 | 5> = {
    necessidade:            1,
    instrucao:              2,
    encaminhamento:         3,
    nota_empenho_emitida:   3,
    agendamento_pendente:   4,
    agendamento_confirmado: 4,
    entregue:               4,
    recebimento_provisorio: 4,
    testes:                 4,
    atestado_gerado:        4,
    atestado_enviado_email: 4,
    encerrado:              5,
  };
  return map[status];
}

export type LocalidadeEntrega = 'CETEC' | 'ALMOXARIFADO';

export const LOCALIDADE_OPTIONS: { value: LocalidadeEntrega; label: string }[] = [
  { value: 'CETEC',        label: 'CETEC' },
  { value: 'ALMOXARIFADO', label: 'Almoxarifado' },
];
