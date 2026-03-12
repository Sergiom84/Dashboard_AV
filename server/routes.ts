import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { client } from './db.js';
import { parseRenoveWorkbook } from './parseRenove.js';
import { parseTendenciasWorkbook } from './parseTendencias.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ─── SOPORTES ────────────────────────────────────────────────

router.get('/api/soportes', async (_req, res) => {
  try {
    const result = await client.execute(
      'SELECT fecha, año, mes, mes_num, tipo, soportes FROM soportes'
    );

    if (result.rows.length === 0) {
      return res.json({ data: [], tipos: [], años: [], meses: [] });
    }

    const data = result.rows.map((r) => ({
      fecha: r.fecha as string,
      año: r.año as number,
      mes: r.mes as string,
      mesNum: r.mes_num as number,
      tipo: r.tipo as string,
      soportes: r.soportes as number,
    }));

    const tipos = Array.from(new Set(data.map((d) => d.tipo))).sort();
    const años = Array.from(new Set(data.map((d) => d.año))).sort((a, b) => a - b);
    const meses = Array.from(new Set(data.map((d) => d.mes)));

    res.json({ data, tipos, años, meses });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener datos';
    res.status(500).json({ error: message });
  }
});

router.post('/api/soportes/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets['Datos_PBI'];

    if (!worksheet) {
      return res.status(400).json({ error: 'No se encontró la hoja "Datos_PBI" en el archivo' });
    }

    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

    const rows = jsonData
      .map((row) => ({
        fecha: row.Fecha ?? '',
        año: row.Año,
        mes: row.Mes,
        mesNum: row.Mes_Num,
        tipo: row.Tipo,
        soportes: row.Soportes || 0,
      }))
      .filter((item) => item.soportes > 0);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No se encontraron datos válidos en el archivo' });
    }

    // Transaction: DELETE all + INSERT new
    await client.batch(
      [
        { sql: 'DELETE FROM soportes', args: [] },
        ...rows.map((r) => ({
          sql: 'INSERT INTO soportes (fecha, año, mes, mes_num, tipo, soportes) VALUES (?, ?, ?, ?, ?, ?)',
          args: [r.fecha, r.año, r.mes, r.mesNum, r.tipo, r.soportes],
        })),
      ],
      'write'
    );

    res.json({ success: true, count: rows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al procesar el archivo';
    res.status(500).json({ error: message });
  }
});

// ─── TENDENCIAS ──────────────────────────────────────────────

router.get('/api/tendencias', async (_req, res) => {
  try {
    const result = await client.execute('SELECT data FROM tendencias WHERE id = 1');

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(JSON.parse(result.rows[0].data as string));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener tendencias';
    res.status(500).json({ error: message });
  }
});

router.post('/api/tendencias/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = parseTendenciasWorkbook(workbook);

    await client.execute({
      sql: `INSERT INTO tendencias (id, data, uploaded_at) VALUES (1, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET data = excluded.data, uploaded_at = excluded.uploaded_at`,
      args: [JSON.stringify(data)],
    });

    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al procesar el archivo';
    res.status(500).json({ error: message });
  }
});

// ─── RENOVE ──────────────────────────────────────────────────

router.get('/api/renove', async (_req, res) => {
  try {
    const result = await client.execute('SELECT data, uploaded_at FROM renove WHERE id = 1');

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json({
      ...JSON.parse(result.rows[0].data as string),
      uploadedAt: result.rows[0].uploaded_at as string,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener renove';
    res.status(500).json({ error: message });
  }
});

router.post('/api/renove/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = parseRenoveWorkbook(workbook);

    await client.execute({
      sql: `INSERT INTO renove (id, data, uploaded_at) VALUES (1, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET data = excluded.data, uploaded_at = excluded.uploaded_at`,
      args: [JSON.stringify(data)],
    });

    res.json({ success: true, count: data.records.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al procesar el archivo';
    res.status(500).json({ error: message });
  }
});

export default router;
