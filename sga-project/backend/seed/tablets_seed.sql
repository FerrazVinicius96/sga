-- =============================================================
-- SEED DE TABLETS PARA TESTE
-- Pré-requisito: item_types_seed.sql executado antes
-- Execução: psql -U postgres -d sga_db -f item_types_seed.sql
--           psql -U postgres -d sga_db -f tablets_seed.sql
-- =============================================================

SET SESSION AUTHORIZATION postgres;

DO $$
DECLARE
  v_type_id INTEGER;
BEGIN
  SELECT id INTO v_type_id FROM item_types WHERE name = 'Tablet';

  IF v_type_id IS NULL THEN
    RAISE EXCEPTION 'item_type "Tablet" não encontrado. Execute o setup primeiro.';
  END IF;

  -- -------------------------------------------------------
  -- 10 tablets COM Livox (has_livox = TRUE)
  -- -------------------------------------------------------
  INSERT INTO assets (sku, item_type_id, patrimonio_number, serial_number, brand, model, status, has_livox, allow_automation)
  VALUES
    ('TAB-LVX-0001', v_type_id, 'TAB2024-0001', 'SN-LVX-001', 'Multilaser', 'M7S GO', 'available', TRUE, TRUE),
    ('TAB-LVX-0002', v_type_id, 'TAB2024-0002', 'SN-LVX-002', 'Multilaser', 'M7S GO', 'available', TRUE, TRUE),
    ('TAB-LVX-0003', v_type_id, 'TAB2024-0003', 'SN-LVX-003', 'Multilaser', 'M7S GO', 'available', TRUE, TRUE),
    ('TAB-LVX-0004', v_type_id, 'TAB2024-0004', 'SN-LVX-004', 'Multilaser', 'M7S GO', 'available', TRUE, TRUE),
    ('TAB-LVX-0005', v_type_id, 'TAB2024-0005', 'SN-LVX-005', 'Multilaser', 'M7S GO', 'available', TRUE, TRUE),
    ('TAB-LVX-0006', v_type_id, 'TAB2024-0006', 'SN-LVX-006', 'Multilaser', 'M7S GO', 'available', TRUE, TRUE),
    ('TAB-LVX-0007', v_type_id, 'TAB2024-0007', 'SN-LVX-007', 'Multilaser', 'M7S GO', 'available', TRUE, TRUE),
    ('TAB-LVX-0008', v_type_id, 'TAB2024-0008', 'SN-LVX-008', 'Multilaser', 'M7S GO', 'available', TRUE, TRUE),
    ('TAB-LVX-0009', v_type_id, 'TAB2024-0009', 'SN-LVX-009', 'Multilaser', 'M7S GO', 'available', TRUE, TRUE),
    ('TAB-LVX-0010', v_type_id, 'TAB2024-0010', 'SN-LVX-010', 'Multilaser', 'M7S GO', 'available', TRUE, TRUE)
  ON CONFLICT (sku) DO NOTHING;

  -- -------------------------------------------------------
  -- 15 tablets SEM Livox (has_livox = FALSE)
  -- -------------------------------------------------------
  INSERT INTO assets (sku, item_type_id, patrimonio_number, serial_number, brand, model, status, has_livox, allow_automation)
  VALUES
    ('TAB-STD-0001', v_type_id, 'TAB2024-0011', 'SN-STD-001', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0002', v_type_id, 'TAB2024-0012', 'SN-STD-002', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0003', v_type_id, 'TAB2024-0013', 'SN-STD-003', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0004', v_type_id, 'TAB2024-0014', 'SN-STD-004', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0005', v_type_id, 'TAB2024-0015', 'SN-STD-005', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0006', v_type_id, 'TAB2024-0016', 'SN-STD-006', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0007', v_type_id, 'TAB2024-0017', 'SN-STD-007', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0008', v_type_id, 'TAB2024-0018', 'SN-STD-008', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0009', v_type_id, 'TAB2024-0019', 'SN-STD-009', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0010', v_type_id, 'TAB2024-0020', 'SN-STD-010', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0011', v_type_id, 'TAB2024-0021', 'SN-STD-011', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0012', v_type_id, 'TAB2024-0022', 'SN-STD-012', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0013', v_type_id, 'TAB2024-0023', 'SN-STD-013', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0014', v_type_id, 'TAB2024-0024', 'SN-STD-014', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE),
    ('TAB-STD-0015', v_type_id, 'TAB2024-0025', 'SN-STD-015', 'Multilaser', 'M7S GO', 'available', FALSE, TRUE)
  ON CONFLICT (sku) DO NOTHING;

  RAISE NOTICE 'Seed concluído: 10 tablets Livox + 15 tablets padrão inseridos.';
END $$;
