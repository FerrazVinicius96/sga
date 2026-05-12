/**
 * Interfaces das entidades de domínio do SGA.
 * Centraliza todos os modelos de dados usados por componentes e serviços.
 */

// --------------------------------------------------------------------------
// Cadastros
// --------------------------------------------------------------------------

export interface ItemType {
  id: number;
  code: string;
  name: string;
  description?: string;
  sku_code?: string;
}

export interface Unit {
  id: number;
  type: 'ADMINISTRATIVA' | 'ESCOLAR' | 'EXTERNA';
  name: string;
  code?: string;
  parent_id?: number | null;
  status: string;
  address?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
  current_assets_count?: number;
}

/** Payload usado nos formulários de criação/edição de unidade. */
export interface UnitData {
  type: 'ADMINISTRATIVA' | 'ESCOLAR' | 'EXTERNA' | '';
  name: string;
  code?: string;
  parent_id?: number | null;
  status: string;
  address?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
}

export interface Person {
  id: number;
  full_name: string;
  unit_id?: number;
  registration_number?: string;
  cpf: string;
  email: string;
  contact_phone?: string;
  unit_name?: string;
  current_assets_count?: number;
  job_title?: string;
}

// --------------------------------------------------------------------------
// Ativos
// --------------------------------------------------------------------------

export interface Asset {
  id: number;
  sku: string;
  item_type_id: number;
  brand: string;
  model: string;
  description?: string;
  serial_number?: string;
  patrimonio_number?: string;
  unit_of_measure?: string;
  status: string;
  current_unit_id?: number;
  acquisition_date?: string;
  warranty_end_date?: string;
  notes?: string;
  item_type_name: string;
  current_unit_name?: string;
}

// --------------------------------------------------------------------------
// Movimentações
// --------------------------------------------------------------------------

export interface Peripheral {
  peripheral_type: string;
  quantity: number;
  status: 'out' | 'returned' | 'in';
}

export interface Movement {
  id: number;
  movement_id?: number;
  asset_ids?: number[];
  assets?: Asset[];
  movement_type: 'entry' | 'exit' | 'loan' | 'return' | 'maintenance';
  movement_date: string;
  responsible_user_id: number;
  recipient_person_id?: number;
  recipient_name?: string;
  recipient_document?: string;
  purpose?: string;
  expected_return_date?: string;
  actual_return_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  sku?: string;
  brand?: string;
  model?: string;
  responsible_username: string;
  responsible_full_name?: string;
  recipient_person_full_name?: string;
  recipient_person_cpf?: string;
  recipient_person_registration?: string;
  destination_unit_id?: number;
  destination_unit_name?: string;
  request_channel_type?: 'Email' | 'SEI' | 'Ordem Direta';
  request_channel_details?: string;
  total_assets_moved?: number;
  recipient_display_name?: string;
  delivery_status?: 'pending_confirmation' | 'confirmed';
  peripherals?: Peripheral[];
}

// --------------------------------------------------------------------------
// Dashboard
// --------------------------------------------------------------------------

export interface DashboardData {
  totalAssets: number;
  availableAssets: number;
  inUseAssets: number;
  loanedAssets: number;
  maintenanceAssets: number;
  retiredAssets: number;
  disposedAssets: number;
  pendingDeliveriesCount: number;
  pendingSubstitutionsCount: number;
  assetsByCategory: { name: string; value: number }[];
  recentMovements: { id: number | string; asset: string; type: string; date: string; user: string }[];
  pendingAlerts: { id: string; message: string; asset: string; dueDate: string }[];
  expiringWarranties: { count: number; description: string; endDate: string; daysRemaining: number }[];
}

// --------------------------------------------------------------------------
// Auditoria
// --------------------------------------------------------------------------

export interface AuditLog {
  id: number;
  action_type: string;
  target_entity: string;
  details: unknown;
  ip_address: string;
  created_at: string;
  user_name: string;
  username: string;
}
