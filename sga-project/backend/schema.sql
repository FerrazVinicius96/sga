-- =============================================================
-- SGA - Sistema de Gerenciamento de Ativos
-- Schema inferido a partir do código-fonte (server.js)
-- Para uso em ambiente local de estudo
-- =============================================================

-- Extensão para UUID (caso necessário futuramente)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- 1. UNITS (auto-referencial)
-- ========================
CREATE TABLE IF NOT EXISTS units (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  type             VARCHAR(100) NOT NULL,
  code             VARCHAR(50) UNIQUE,
  parent_id        INTEGER REFERENCES units(id) ON DELETE SET NULL,
  address          VARCHAR(500),
  contact_phone    VARCHAR(50),
  contact_email    VARCHAR(255),
  notes            TEXT,
  rpa              VARCHAR(100),
  status           VARCHAR(50) DEFAULT 'active',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 2. USERS
-- ========================
CREATE TABLE IF NOT EXISTS users (
  id                    SERIAL PRIMARY KEY,
  username              VARCHAR(100) UNIQUE NOT NULL,
  email                 VARCHAR(255) UNIQUE NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,
  full_name             VARCHAR(255) NOT NULL,
  role                  VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'advisor')),
  is_active             BOOLEAN DEFAULT TRUE,
  must_change_password  BOOLEAN DEFAULT FALSE,
  job_title             VARCHAR(255),
  registration_number   VARCHAR(100),
  cpf                   VARCHAR(20),
  unit_id               INTEGER REFERENCES units(id) ON DELETE SET NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 3. ITEM_TYPES
-- ========================
CREATE TABLE IF NOT EXISTS item_types (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(50) NOT NULL,
  name        VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  sku_code    VARCHAR(10) UNIQUE NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 4. ASSETS
-- ========================
CREATE TABLE IF NOT EXISTS assets (
  id                  SERIAL PRIMARY KEY,
  sku                 VARCHAR(100) UNIQUE NOT NULL,
  item_type_id        INTEGER NOT NULL REFERENCES item_types(id),
  patrimonio_number   VARCHAR(100) UNIQUE,
  serial_number       VARCHAR(100) UNIQUE,
  brand               VARCHAR(100),
  model               VARCHAR(100),
  description         TEXT,
  status              VARCHAR(50) NOT NULL DEFAULT 'available'
                      CHECK (status IN ('available','in_use','loaned','maintenance','retired','disposed','pending_retirement')),
  current_unit_id     INTEGER REFERENCES units(id) ON DELETE SET NULL,
  acquisition_date    DATE,
  warranty_end_date   DATE,
  unit_of_measure     VARCHAR(50),
  imei                VARCHAR(50),
  sim_card_number     VARCHAR(50),
  box_number          INTEGER,
  has_livox           BOOLEAN DEFAULT FALSE,
  allow_automation    BOOLEAN DEFAULT FALSE,
  notes               TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 5. PEOPLE
-- ========================
CREATE TABLE IF NOT EXISTS people (
  id                  SERIAL PRIMARY KEY,
  full_name           VARCHAR(255) NOT NULL,
  cpf                 VARCHAR(20) NOT NULL,
  email               VARCHAR(255) UNIQUE NOT NULL,
  registration_number VARCHAR(100),
  unit_id             INTEGER REFERENCES units(id) ON DELETE SET NULL,
  contact_phone       VARCHAR(50),
  job_title           VARCHAR(255),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cpf)
);

-- ========================
-- 6. ASSET_MOVEMENTS
-- ========================
CREATE TABLE IF NOT EXISTS asset_movements (
  id                      SERIAL PRIMARY KEY,
  movement_type           VARCHAR(50) NOT NULL
                          CHECK (movement_type IN ('entry','exit','loan','return','maintenance','disposal')),
  movement_date           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responsible_user_id     INTEGER NOT NULL REFERENCES users(id),
  recipient_person_id     INTEGER REFERENCES people(id) ON DELETE SET NULL,
  recipient_name          VARCHAR(255),
  recipient_document      VARCHAR(50),
  purpose                 TEXT,
  destination_unit_id     INTEGER REFERENCES units(id) ON DELETE SET NULL,
  expected_return_date    DATE,
  actual_delivery_date    TIMESTAMP,
  delivery_status         VARCHAR(50) DEFAULT 'pending'
                          CHECK (delivery_status IN ('pending','pending_confirmation','confirmed','realizada','devolvido')),
  request_channel_type    VARCHAR(50)
                          CHECK (request_channel_type IN ('Email','SEI','Ordem Direta')),
  request_channel_details VARCHAR(255),
  receipt_path            VARCHAR(500),
  notes                   TEXT,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 7. MOVEMENT_ASSETS
-- ========================
CREATE TABLE IF NOT EXISTS movement_assets (
  id          SERIAL PRIMARY KEY,
  movement_id INTEGER NOT NULL REFERENCES asset_movements(id) ON DELETE CASCADE,
  asset_id    INTEGER NOT NULL REFERENCES assets(id),
  UNIQUE (movement_id, asset_id)
);

-- ========================
-- 8. MOVEMENT_PERIPHERALS
-- ========================
CREATE TABLE IF NOT EXISTS movement_peripherals (
  id               SERIAL PRIMARY KEY,
  movement_id      INTEGER NOT NULL REFERENCES asset_movements(id) ON DELETE CASCADE,
  peripheral_type  VARCHAR(100),
  quantity         INTEGER DEFAULT 1,
  status           VARCHAR(20) CHECK (status IN ('in','out'))
);

-- ========================
-- 9. AUDIT_LOGS
-- ========================
CREATE TABLE IF NOT EXISTS audit_logs (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action_type    VARCHAR(100) NOT NULL,
  target_entity  VARCHAR(100),
  target_id      INTEGER,
  details        JSONB,
  ip_address     VARCHAR(45),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 10. TABLET_ELIGIBLE_STUDENTS
-- ========================
CREATE TABLE IF NOT EXISTS tablet_eligible_students (
  id                   SERIAL PRIMARY KEY,
  year                 INTEGER,
  student_registration VARCHAR(100) UNIQUE NOT NULL,
  student_name         VARCHAR(255) NOT NULL,
  school_unit_id       INTEGER NOT NULL REFERENCES units(id),
  education_year       VARCHAR(50),
  class_name           VARCHAR(100),
  shift                VARCHAR(50),
  pcd_type             VARCHAR(100),
  requires_livox       BOOLEAN DEFAULT FALSE,
  rpa                  VARCHAR(100),
  delivery_movement_id INTEGER REFERENCES asset_movements(id) ON DELETE SET NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 11. DELIVERY_BATCHES
-- ========================
CREATE TABLE IF NOT EXISTS delivery_batches (
  id                          SERIAL PRIMARY KEY,
  school_unit_id              INTEGER NOT NULL REFERENCES units(id),
  created_by_user_id          INTEGER NOT NULL REFERENCES users(id),
  status                      VARCHAR(50) NOT NULL DEFAULT 'Em Planejamento'
                              CHECK (status IN ('Em Planejamento','Concluído')),
  name                        VARCHAR(255),
  creation_date               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  scheduled_delivery_date     DATE,
  delivery_confirmation_date  TIMESTAMP,
  collective_receipt_path     VARCHAR(500),
  contact_notes               TEXT,
  last_contact_date           TIMESTAMP,
  created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 12. DELIVERY_BATCH_ITEMS
-- ========================
CREATE TABLE IF NOT EXISTS delivery_batch_items (
  id                   SERIAL PRIMARY KEY,
  batch_id             INTEGER NOT NULL REFERENCES delivery_batches(id) ON DELETE CASCADE,
  eligible_student_id  INTEGER NOT NULL REFERENCES tablet_eligible_students(id),
  asset_id             INTEGER NOT NULL REFERENCES assets(id),
  delivery_status      VARCHAR(50) NOT NULL DEFAULT 'planejada'
                       CHECK (delivery_status IN ('planejada','realizada','confirmed','devolvido','substituida')),
  delivery_date        DATE,
  term_received        BOOLEAN DEFAULT FALSE,
  notes                TEXT,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 13. DELIVERY_BATCH_CONTACTS
-- ========================
CREATE TABLE IF NOT EXISTS delivery_batch_contacts (
  id            SERIAL PRIMARY KEY,
  batch_id      INTEGER NOT NULL REFERENCES delivery_batches(id) ON DELETE CASCADE,
  contact_notes TEXT,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 14. RETIREMENT_REQUESTS
-- ========================
CREATE TABLE IF NOT EXISTS retirement_requests (
  id                SERIAL PRIMARY KEY,
  asset_id          INTEGER NOT NULL REFERENCES assets(id),
  requester_user_id INTEGER NOT NULL REFERENCES users(id),
  reason            TEXT NOT NULL,
  details           TEXT,
  evidence_path     VARCHAR(500),
  retirement_type   VARCHAR(100),
  document_number   VARCHAR(100),
  event_date        DATE,
  status            VARCHAR(50) DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
  approver_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approval_date     TIMESTAMP,
  rejection_reason  TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 15. PENDING_SUBSTITUTIONS
-- ========================
CREATE TABLE IF NOT EXISTS pending_substitutions (
  id                    SERIAL PRIMARY KEY,
  old_asset_id          INTEGER NOT NULL REFERENCES assets(id),
  new_asset_id          INTEGER NOT NULL REFERENCES assets(id),
  old_monitor_id        INTEGER REFERENCES assets(id) ON DELETE SET NULL,
  new_monitor_id        INTEGER REFERENCES assets(id) ON DELETE SET NULL,
  peripherals           JSONB,
  recipient_person_id   INTEGER NOT NULL REFERENCES people(id),
  destination_unit_id   INTEGER REFERENCES units(id) ON DELETE SET NULL,
  reason                TEXT,
  created_by_user_id    INTEGER NOT NULL REFERENCES users(id),
  status                VARCHAR(50) DEFAULT 'pending'
                        CHECK (status IN ('pending','completed')),
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 16. TABLET_SUBSTITUTIONS_LOG
-- ========================
CREATE TABLE IF NOT EXISTS tablet_substitutions_log (
  id                      SERIAL PRIMARY KEY,
  student_registration    VARCHAR(100),
  old_asset_patrimonio    VARCHAR(100),
  new_asset_patrimonio    VARCHAR(100),
  reason                  TEXT,
  created_by_user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- 17. COLLECTION_ORDERS
-- ========================
CREATE TABLE IF NOT EXISTS collection_orders (
  id                  SERIAL PRIMARY KEY,
  code                VARCHAR(100) UNIQUE NOT NULL,
  school_unit_id      INTEGER NOT NULL REFERENCES units(id),
  technician_name     VARCHAR(255),
  reason              TEXT,
  estimated_quantity  INTEGER DEFAULT 20,
  status              VARCHAR(50) DEFAULT 'pending'
                      CHECK (status IN ('pending','completed')),
  completed_at        TIMESTAMP,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- ÍNDICES úteis para performance
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_assets_status         ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_current_unit   ON assets(current_unit_id);
CREATE INDEX IF NOT EXISTS idx_assets_item_type      ON assets(item_type_id);
CREATE INDEX IF NOT EXISTS idx_movements_type        ON asset_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_user        ON asset_movements(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_movements_unit        ON asset_movements(destination_unit_id);
CREATE INDEX IF NOT EXISTS idx_audit_user            ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action          ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_students_school       ON tablet_eligible_students(school_unit_id);
CREATE INDEX IF NOT EXISTS idx_students_registration ON tablet_eligible_students(student_registration);
CREATE INDEX IF NOT EXISTS idx_batch_items_batch     ON delivery_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_retirement_status     ON retirement_requests(status);

-- =============================================================
-- SEED - Dados iniciais para estudo local
-- =============================================================

-- Unidade raiz (Secretaria/Almoxarifado central)
INSERT INTO units (name, type, code, rpa, status)
VALUES ('SEDUC - Almoxarifado Central', 'ALMOXARIFADO', 'SEDUC-CENTRAL', 'Central', 'active')
ON CONFLICT (code) DO NOTHING;

-- Unidade escolar de exemplo
INSERT INTO units (name, type, code, parent_id, rpa, status)
VALUES ('E.E. Exemplo de Escola', 'ESCOLAR', 'EEE-001',
        (SELECT id FROM units WHERE code = 'SEDUC-CENTRAL'),
        'RPA-1', 'active')
ON CONFLICT (code) DO NOTHING;

-- Tipos de item de exemplo
INSERT INTO item_types (code, name, description, sku_code)
VALUES
  ('SEDUC001', 'Notebook', 'Notebook para uso educacional', 'NTB'),
  ('SEDUC002', 'Tablet', 'Tablet para alunos', 'TAB'),
  ('SEDUC003', 'Monitor', 'Monitor LCD/LED', 'MON')
ON CONFLICT (name) DO NOTHING;

-- Usuário admin padrão (senha: Admin@123)
-- Hash gerado com bcryptjs rounds=10 para "Admin@123"
INSERT INTO users (username, email, password_hash, full_name, role, is_active, unit_id)
VALUES (
  'admin',
  'admin@sga.local',
  '$2b$10$/MMi9aRxVbnppWDs4cNaduJZ1AImtdN84KrQnJSwhIcWfc6vtl9lC',
  'Administrador do Sistema',
  'admin',
  TRUE,
  (SELECT id FROM units WHERE code = 'SEDUC-CENTRAL')
)
ON CONFLICT (username) DO NOTHING;
