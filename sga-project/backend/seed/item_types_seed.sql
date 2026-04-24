-- =============================================================
-- SEED DE TIPOS DE ITEM
-- Deve ser executado antes de tablets_seed.sql
-- Execução: psql -U postgres -d sga_db -f item_types_seed.sql
-- =============================================================

SET SESSION AUTHORIZATION postgres;

INSERT INTO item_types (code, name, description, sku_code)
VALUES
  ('SEDUC001', 'Notebook',  'Notebook para uso educacional', 'NTB'),
  ('SEDUC002', 'Tablet',    'Tablet para alunos',            'TAB'),
  ('SEDUC003', 'Monitor',   'Monitor LCD/LED',               'MON'),
  ('SEDUC004', 'Impressora','Impressora laser/jato de tinta', 'IMP'),
  ('SEDUC005', 'Projetor',  'Projetor multimídia',           'PRJ')
ON CONFLICT (sku_code) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      updated_at  = CURRENT_TIMESTAMP;
