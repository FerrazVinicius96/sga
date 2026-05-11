/**
 * Script de importação da planilha de tablets para o banco SGA.
 *
 * Abas processadas:
 *   1. "tablets na base"    → assets (tabela de ativos)
 *   2. "estudantes unicos"  → tablet_eligible_students
 *   3. "tablets entregues"  → delivery_batches + delivery_batch_items
 *
 * Uso:
 *   node import-planilha.js [caminho_da_planilha]
 */

const { Pool } = require('pg');
const XLSX = require('xlsx');

const PLANILHA_PATH =
  process.argv[2] ||
  '/root/.claude/uploads/cd2bfea8-41c3-4e80-bacd-5face3d2e68c/d45c3819-Base_cadastrada_e_entrega_de_tablets__atualiza__o_16_abril_2026.xlsx';

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@localhost:5432/sga_db',
});

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

function excelDateToISO(serial) {
  if (!serial) return null;
  if (serial instanceof Date) return serial.toISOString().split('T')[0];
  if (typeof serial === 'number') {
    const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
    if (!isNaN(d)) return d.toISOString().split('T')[0];
  }
  return null;
}

/**
 * Extrai brand e model a partir do campo NOME da aba "tablets na base".
 * Padrão: "TABLET MULTILASER M10 4G PRO"
 */
function parseBrandModel(nome) {
  if (!nome) return { brand: 'DESCONHECIDO', model: 'DESCONHECIDO' };
  const cleaned = String(nome).replace(/^TABLET\s+/i, '').trim();
  const knownBrands = ['MULTILASER', 'POSITIVO', 'SAMSUNG', 'LENOVO', 'APPLE'];
  for (const b of knownBrands) {
    if (cleaned.toUpperCase().startsWith(b)) {
      return { brand: b, model: cleaned.slice(b.length).trim() || b };
    }
  }
  const parts = cleaned.split(/\s+/);
  return { brand: parts[0], model: parts.slice(1).join(' ') || parts[0] };
}

/**
 * Retorna o nome da escola a partir de uma linha da aba "tablets entregues",
 * selecionando a coluna correta de acordo com TIPO UNIDADE.
 */
function getSchoolName(row) {
  const tipo = String(row['TIPO UNIDADE'] || '').toUpperCase().trim();
  const maps = {
    'ESCOLA MUNICIPAL': 'UNIDADE DE ENSINO ESCOLA MUNICIPAL',
    CMEI: 'UNIDADE DE ENSINO CMEI',
    'CRECHE ESC.RECIFE': 'UNIDADE DE ENSINO CRECHE ESC.RECIFE',
    'CRECHE MUNICIPAL': 'UNIDADE DE ENSINO CRECHE MUNICIPAL',
  };
  const col = maps[tipo];
  if (col && row[col]) return String(row[col]).trim().toUpperCase();
  // fallback: primeiro campo não-vazio
  return (
    String(
      row['UNIDADE DE ENSINO ESCOLA MUNICIPAL'] ||
        row['UNIDADE DE ENSINO CMEI'] ||
        row['UNIDADE DE ENSINO CRECHE ESC.RECIFE'] ||
        row['UNIDADE DE ENSINO CRECHE MUNICIPAL'] ||
        '',
    )
      .trim()
      .toUpperCase() || null
  );
}

// ---------------------------------------------------------------------------
// Helpers de banco
// ---------------------------------------------------------------------------

/** Retorna ou cria uma unit por nome. Usa cache para evitar round-trips. */
async function getOrCreateUnit(client, name, typeHint, cache) {
  const key = name.toUpperCase();
  if (cache[key]) return cache[key];

  const res = await client.query(
    'SELECT id FROM units WHERE UPPER(name) = $1',
    [key],
  );
  if (res.rows.length > 0) {
    cache[key] = res.rows[0].id;
    return cache[key];
  }

  const ins = await client.query(
    `INSERT INTO units (name, type, status) VALUES ($1, $2, 'active') RETURNING id`,
    [name, typeHint || 'Escola'],
  );
  cache[key] = ins.rows[0].id;
  return cache[key];
}

/** Retorna ou cria um item_type por nome. */
async function getOrCreateItemType(client, name, skuCode, typeCache) {
  const key = name.toUpperCase();
  if (typeCache[key]) return typeCache[key];

  const res = await client.query(
    'SELECT id, sku_code FROM item_types WHERE UPPER(name) = $1',
    [key],
  );
  if (res.rows.length > 0) {
    typeCache[key] = res.rows[0];
    return typeCache[key];
  }

  // Garante sku_code único (3 letras)
  let code = skuCode.toUpperCase().slice(0, 3).padEnd(3, 'X');
  const existing = await client.query(
    'SELECT id FROM item_types WHERE sku_code = $1',
    [code],
  );
  if (existing.rows.length > 0) code = code.slice(0, 2) + '1';

  const ins = await client.query(
    `INSERT INTO item_types (code, name, sku_code) VALUES ($1, $2, $3) RETURNING id, sku_code`,
    [code, name, code],
  );
  typeCache[key] = ins.rows[0];
  return typeCache[key];
}

/** Gera o próximo SKU para um tipo (padrão: PREFIX-000001). */
async function nextSku(client, skuCode) {
  const res = await client.query(
    `SELECT sku FROM assets WHERE sku LIKE $1 ORDER BY sku DESC LIMIT 1`,
    [`${skuCode}-%`],
  );
  if (res.rows.length === 0) return `${skuCode}-000001`;
  const parts = res.rows[0].sku.split('-');
  const next = parseInt(parts[1], 10) + 1;
  return `${skuCode}-${String(next).padStart(6, '0')}`;
}

// ---------------------------------------------------------------------------
// Fases de importação
// ---------------------------------------------------------------------------

async function fase1_importarTablets(wb, unitCache, itemTypeCache) {
  console.log('\n=== FASE 1: Importando tablets ("tablets na base") ===');
  const ws = wb.Sheets['tablets na base'];
  if (!ws) { console.log('Aba não encontrada. Pulando.'); return; }

  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  console.log(`Total de linhas na planilha: ${rows.length}`);

  let importados = 0, ignorados = 0, erros = [];
  const client = await pool.connect();

  try {
    for (const [i, row] of rows.entries()) {
      const imei = row['IMEI'] ? String(row['IMEI']).trim() : null;
      const tombamento = row['TOMBAMENTO'] ? String(row['TOMBAMENTO']).trim() : null;
      const nomePlanilha = String(row['NOME'] || '').trim();
      const unidadeNome = String(row['UNIDADE_DE_ENSINO'] || '').trim().toUpperCase();

      if (!imei && !tombamento) {
        erros.push(`Linha ${i + 2}: sem IMEI nem TOMBAMENTO. Ignorada.`);
        ignorados++;
        continue;
      }

      try {
        await client.query('BEGIN');

        // Verifica duplicidade por IMEI ou patrimônio
        const dup = await client.query(
          `SELECT id FROM assets WHERE imei = $1 OR patrimonio_number = $2`,
          [imei, tombamento],
        );
        if (dup.rows.length > 0) {
          await client.query('ROLLBACK');
          ignorados++;
          continue;
        }

        const { brand, model } = parseBrandModel(nomePlanilha);
        const itemType = await getOrCreateItemType(client, 'Tablet', 'TAB', itemTypeCache);
        const unitId = unidadeNome
          ? await getOrCreateUnit(client, unidadeNome, 'Escola', unitCache)
          : null;
        const sku = await nextSku(client, itemType.sku_code);

        await client.query(
          `INSERT INTO assets
            (sku, item_type_id, brand, model, imei, patrimonio_number, status, current_unit_id)
           VALUES ($1, $2, $3, $4, $5, $6, 'available', $7)`,
          [sku, itemType.id, brand, model, imei, tombamento, unitId],
        );

        await client.query('COMMIT');
        importados++;
        if (importados % 1000 === 0) process.stdout.write(`  ${importados} tablets importados...\r`);
      } catch (e) {
        await client.query('ROLLBACK');
        erros.push(`Linha ${i + 2}: ${e.message}`);
        ignorados++;
      }
    }
  } finally {
    client.release();
  }

  console.log(`  Importados: ${importados} | Ignorados/duplicados: ${ignorados}`);
  if (erros.length > 0) {
    console.log(`  Primeiros erros (${erros.length} total):`);
    erros.slice(0, 5).forEach(e => console.log('   -', e));
  }
}

async function fase2_importarEstudantes(wb, unitCache) {
  console.log('\n=== FASE 2: Importando estudantes ("estudantes unicos") ===');
  const ws = wb.Sheets['estudantes unicos'];
  if (!ws) { console.log('Aba não encontrada. Pulando.'); return; }

  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  console.log(`Total de linhas na planilha: ${rows.length}`);

  let importados = 0, atualizados = 0, ignorados = 0, erros = [];
  const client = await pool.connect();

  try {
    for (const [i, row] of rows.entries()) {
      const matricula = row['MATRICULA'] ? String(row['MATRICULA']).trim() : null;
      const nome = String(row['NOME_DO_ALUNO'] || '').trim().toUpperCase();
      const unidadeNome = String(row['UNIDADE_DE_ENSINO'] || '').trim().toUpperCase();

      if (!matricula || !nome) {
        erros.push(`Linha ${i + 2}: matrícula ou nome ausente. Ignorada.`);
        ignorados++;
        continue;
      }

      try {
        await client.query('BEGIN');

        const unitId = unidadeNome
          ? await getOrCreateUnit(client, unidadeNome, 'Escola', unitCache)
          : null;

        if (!unitId) {
          await client.query('ROLLBACK');
          erros.push(`Linha ${i + 2}: unidade "${unidadeNome}" não pôde ser resolvida.`);
          ignorados++;
          continue;
        }

        const res = await client.query(
          `INSERT INTO tablet_eligible_students
             (year, student_registration, student_name, school_unit_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (student_registration) DO UPDATE SET
             student_name = EXCLUDED.student_name,
             school_unit_id = EXCLUDED.school_unit_id
           RETURNING xmax`,
          [new Date().getFullYear(), matricula, nome, unitId],
        );

        await client.query('COMMIT');
        if (res.rows[0].xmax === '0') importados++;
        else atualizados++;

        if ((importados + atualizados) % 2000 === 0)
          process.stdout.write(`  ${importados + atualizados} estudantes processados...\r`);
      } catch (e) {
        await client.query('ROLLBACK');
        erros.push(`Linha ${i + 2}: ${e.message}`);
        ignorados++;
      }
    }
  } finally {
    client.release();
  }

  console.log(`  Novos: ${importados} | Atualizados: ${atualizados} | Ignorados: ${ignorados}`);
  if (erros.length > 0) {
    console.log(`  Primeiros erros (${erros.length} total):`);
    erros.slice(0, 5).forEach(e => console.log('   -', e));
  }
}

async function fase3_processarEntregas(wb, unitCache, adminUserId) {
  console.log('\n=== FASE 3: Processando entregas ("tablets entregues") ===');
  const ws = wb.Sheets['tablets entregues'];
  if (!ws) { console.log('Aba não encontrada. Pulando.'); return; }

  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  console.log(`Total de linhas na planilha: ${rows.length}`);

  let criados = 0, ignorados = 0, erros = [];
  // Cache de batches por escola
  const batchCache = {}; // schoolId -> batchId

  const client = await pool.connect();

  try {
    for (const [i, row] of rows.entries()) {
      const escolaNome = getSchoolName(row);
      const matricula = row['MATRÍCULA DO ESTUDANTE']
        ? String(row['MATRÍCULA DO ESTUDANTE']).trim()
        : null;
      const imei = row['IMEI'] ? String(row['IMEI']).trim() : null;
      const tombo = row['TOMBO DO EQUIPAMENTO']
        ? String(row['TOMBO DO EQUIPAMENTO']).trim()
        : null;
      const dataEntrega = excelDateToISO(row['DATA DE ENTREGA']);

      if (!escolaNome || !matricula) {
        erros.push(`Linha ${i + 2}: escola ou matrícula ausente. Ignorada.`);
        ignorados++;
        continue;
      }

      try {
        await client.query('BEGIN');

        // 1. Resolver escola
        const schoolId = await getOrCreateUnit(client, escolaNome, 'Escola', unitCache);

        // 2. Encontrar ou criar estudante elegível
        let studentRes = await client.query(
          `SELECT id FROM tablet_eligible_students WHERE student_registration = $1`,
          [matricula],
        );
        let studentId;
        if (studentRes.rows.length === 0) {
          const nomeEstudante = String(row['NOME DO ESTUDANTE'] || '').trim().toUpperCase() || 'DESCONHECIDO';
          const ins = await client.query(
            `INSERT INTO tablet_eligible_students
               (year, student_registration, student_name, school_unit_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (student_registration) DO UPDATE SET student_name = EXCLUDED.student_name
             RETURNING id`,
            [new Date().getFullYear(), matricula, nomeEstudante, schoolId],
          );
          studentId = ins.rows[0].id;
        } else {
          studentId = studentRes.rows[0].id;
        }

        // 3. Encontrar ativo (tablet) pelo IMEI ou TOMBO
        let assetRes = null;
        if (imei) {
          assetRes = await client.query(
            `SELECT id FROM assets WHERE imei = $1`,
            [imei],
          );
        }
        if ((!assetRes || assetRes.rows.length === 0) && tombo) {
          assetRes = await client.query(
            `SELECT id FROM assets WHERE patrimonio_number = $1`,
            [tombo],
          );
        }
        if (!assetRes || assetRes.rows.length === 0) {
          await client.query('ROLLBACK');
          erros.push(`Linha ${i + 2}: tablet não encontrado (IMEI=${imei}, TOMBO=${tombo}). Ignorada.`);
          ignorados++;
          continue;
        }
        const assetId = assetRes.rows[0].id;

        // 4. Verificar se já existe item de entrega para este estudante e ativo
        const dupDbi = await client.query(
          `SELECT id FROM delivery_batch_items
           WHERE eligible_student_id = $1 AND asset_id = $2`,
          [studentId, assetId],
        );
        if (dupDbi.rows.length > 0) {
          await client.query('ROLLBACK');
          ignorados++;
          continue;
        }

        // 5. Obter ou criar delivery_batch para esta escola
        if (!batchCache[schoolId]) {
          const existingBatch = await client.query(
            `SELECT id FROM delivery_batches
             WHERE school_unit_id = $1 AND name = 'Importação - Planilha Abril 2026'`,
            [schoolId],
          );
          if (existingBatch.rows.length > 0) {
            batchCache[schoolId] = existingBatch.rows[0].id;
          } else {
            const newBatch = await client.query(
              `INSERT INTO delivery_batches
                 (school_unit_id, created_by_user_id, status, name, scheduled_delivery_date)
               VALUES ($1, $2, 'Concluído', 'Importação - Planilha Abril 2026', $3)
               RETURNING id`,
              [schoolId, adminUserId, dataEntrega || new Date().toISOString().split('T')[0]],
            );
            batchCache[schoolId] = newBatch.rows[0].id;
          }
        }
        const batchId = batchCache[schoolId];

        // 6. Criar item de entrega
        await client.query(
          `INSERT INTO delivery_batch_items
             (batch_id, eligible_student_id, asset_id, delivery_status, delivery_date, term_received)
           VALUES ($1, $2, $3, 'realizada', $4, true)`,
          [batchId, studentId, assetId, dataEntrega],
        );

        // 7. Atualizar status do ativo para 'in_use' e unidade para a escola
        await client.query(
          `UPDATE assets SET status = 'in_use', current_unit_id = $1, updated_at = NOW()
           WHERE id = $2`,
          [schoolId, assetId],
        );

        await client.query('COMMIT');
        criados++;
        if (criados % 500 === 0) process.stdout.write(`  ${criados} entregas processadas...\r`);
      } catch (e) {
        await client.query('ROLLBACK');
        erros.push(`Linha ${i + 2}: ${e.message}`);
        ignorados++;
      }
    }
  } finally {
    client.release();
  }

  console.log(`  Entregas criadas: ${criados} | Ignoradas/duplicadas: ${ignorados}`);
  if (erros.length > 0) {
    console.log(`  Primeiros erros (${erros.length} total):`);
    erros.slice(0, 10).forEach(e => console.log('   -', e));
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(60));
  console.log('  SGA - Importação da Planilha de Tablets');
  console.log('  Arquivo:', PLANILHA_PATH);
  console.log('='.repeat(60));

  // Verifica conexão com o banco
  try {
    await pool.query('SELECT 1');
    console.log('\nConexão com o banco: OK');
  } catch (e) {
    console.error('Erro ao conectar ao banco:', e.message);
    process.exit(1);
  }

  // Precisa de um usuário admin para criar os delivery_batches
  const adminRes = await pool.query(
    `SELECT id, full_name FROM users WHERE role = 'admin' LIMIT 1`,
  );
  if (adminRes.rows.length === 0) {
    console.error('\nNenhum usuário admin encontrado no banco.');
    console.error('A Fase 3 (entregas) requer um usuário existente.');
    console.error('Crie um usuário admin antes de executar, ou execute as fases 1 e 2 separadamente.');
    process.exit(1);
  }
  const adminUserId = adminRes.rows[0].id;
  console.log(`Usuário responsável pelas importações: ${adminRes.rows[0].full_name} (id=${adminUserId})`);

  // Lê a planilha
  console.log('\nLendo planilha...');
  const wb = XLSX.readFile(PLANILHA_PATH);
  console.log('Abas encontradas:', wb.SheetNames.join(', '));

  // Caches compartilhados entre as fases
  const unitCache = {};
  const itemTypeCache = {};

  const inicio = Date.now();

  await fase1_importarTablets(wb, unitCache, itemTypeCache);
  await fase2_importarEstudantes(wb, unitCache);
  await fase3_processarEntregas(wb, unitCache, adminUserId);

  const duracaoSeg = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Importação concluída em ${duracaoSeg}s`);
  console.log('='.repeat(60));

  await pool.end();
}

main().catch(err => {
  console.error('\nErro fatal:', err.message);
  pool.end();
  process.exit(1);
});
