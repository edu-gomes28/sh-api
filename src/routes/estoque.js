// src/routes/estoque.js
const express = require('express');
const db      = require('../database/db');
const auth    = require('../middlewares/auth');

const router = express.Router();
router.use(auth);

// ─── GET /estoque/materiais — listar materiais ────────────────────────────────
router.get('/materiais', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT m.*, c.nome AS categoria_nome
       FROM materiais m
       LEFT JOIN categorias_material c ON c.id = m.categoria_id
       ORDER BY m.nome`
    );
    return res.json({ materiais: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── POST /estoque/materiais — criar material (admin/almoxarife) ──────────────
router.post('/materiais', async (req, res) => {
  const { perfil } = req.user;
  if (!['admin', 'almoxarife'].includes(perfil)) {
    return res.status(403).json({ error: 'Sem permissão.' });
  }

  const { nome, descricao, unidade, categoria_id, estoque_minimo } = req.body;
  if (!nome || !unidade) {
    return res.status(400).json({ error: 'nome e unidade são obrigatórios.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO materiais (nome, descricao, unidade, categoria_id, estoque_minimo)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [nome, descricao || null, unidade, categoria_id || null, estoque_minimo || 0]
    );
    return res.status(201).json({ material: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── GET /estoque/movimentacoes — listar movimentações ───────────────────────
router.get('/movimentacoes', async (req, res) => {
  const { material_id, obra_id, status } = req.query;

  try {
    let query = `
      SELECT mv.*, m.nome AS material_nome, m.unidade,
             u.nome AS usuario_nome, o.nome AS obra_nome
      FROM movimentacoes_estoque mv
      JOIN materiais m ON m.id = mv.material_id
      JOIN usuarios u  ON u.id = mv.usuario_id
      LEFT JOIN obras o ON o.id = mv.obra_id
      WHERE 1=1
    `;
    const params = [];

    if (material_id) { params.push(material_id); query += ` AND mv.material_id = $${params.length}`; }
    if (obra_id)     { params.push(obra_id);     query += ` AND mv.obra_id = $${params.length}`; }
    if (status)      { params.push(status);       query += ` AND mv.status = $${params.length}`; }

    query += ' ORDER BY mv.criado_em DESC';

    const result = await db.query(query, params);
    return res.json({ movimentacoes: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── POST /estoque/movimentacoes — registrar movimentação ────────────────────
router.post('/movimentacoes', async (req, res) => {
  const { material_id, obra_id, tipo, quantidade, motivo } = req.body;
  const usuario_id = req.user.id;

  if (!material_id || !tipo || !quantidade) {
    return res.status(400).json({ error: 'material_id, tipo e quantidade são obrigatórios.' });
  }

  if (!['entrada', 'saida', 'ajuste'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo deve ser: entrada, saida ou ajuste.' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Busca estoque atual
    const mat = await client.query(
      'SELECT estoque_atual FROM materiais WHERE id = $1 FOR UPDATE', [material_id]
    );
    if (!mat.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Material não encontrado.' });
    }

    const estoqueAnterior = parseFloat(mat.rows[0].estoque_atual);
    let novoEstoque = estoqueAnterior;

    if (tipo === 'entrada') novoEstoque += parseFloat(quantidade);
    if (tipo === 'saida')   novoEstoque -= parseFloat(quantidade);
    if (tipo === 'ajuste')  novoEstoque  = parseFloat(quantidade);

    if (novoEstoque < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Estoque insuficiente para esta saída.' });
    }

    // Atualiza estoque
    await client.query(
      'UPDATE materiais SET estoque_atual = $1, atualizado_em = NOW() WHERE id = $2',
      [novoEstoque, material_id]
    );

    // Registra movimentação
    const result = await client.query(
      `INSERT INTO movimentacoes_estoque
         (material_id, obra_id, usuario_id, tipo, quantidade, quantidade_anterior, motivo)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [material_id, obra_id || null, usuario_id, tipo, quantidade, estoqueAnterior, motivo || null]
    );

    await client.query('COMMIT');
    return res.status(201).json({ movimentacao: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  } finally {
    client.release();
  }
});

// ─── PATCH /estoque/movimentacoes/:id/confirmar ───────────────────────────────
router.patch('/movimentacoes/:id/confirmar', async (req, res) => {
  const { perfil, id: confirmado_por } = req.user;
  if (!['admin', 'almoxarife'].includes(perfil)) {
    return res.status(403).json({ error: 'Sem permissão para confirmar.' });
  }

  try {
    const result = await db.query(
      `UPDATE movimentacoes_estoque
       SET status = 'confirmado', confirmado_por = $1, confirmado_em = NOW()
       WHERE id = $2 RETURNING *`,
      [confirmado_por, req.params.id]
    );
    return res.json({ movimentacao: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

module.exports = router;
