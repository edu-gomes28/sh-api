// src/routes/ponto.js
const express = require('express');
const db      = require('../database/db');
const auth    = require('../middlewares/auth');

const router = express.Router();
router.use(auth);

// ─── GET /ponto — listar registros ───────────────────────────────────────────
router.get('/', async (req, res) => {
  const { mes, usuario_id } = req.query;
  const { perfil, id } = req.user;

  try {
    let query = `
      SELECT r.*, u.nome AS usuario_nome, u.avatar
      FROM registros_ponto r
      JOIN usuarios u ON u.id = r.usuario_id
      WHERE 1=1
    `;
    const params = [];

    // Campo e almoxarife veem apenas os próprios registros
    if (perfil === 'campo' || perfil === 'almoxarife') {
      params.push(id);
      query += ` AND r.usuario_id = $${params.length}`;
    } else if (usuario_id) {
      params.push(usuario_id);
      query += ` AND r.usuario_id = $${params.length}`;
    }

    if (mes) {
      params.push(mes); // formato: YYYY-MM
      query += ` AND TO_CHAR(r.data, 'YYYY-MM') = $${params.length}`;
    }

    query += ' ORDER BY r.data DESC';

    const result = await db.query(query, params);
    return res.json({ registros: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── POST /ponto — criar/atualizar registro do dia ───────────────────────────
router.post('/', async (req, res) => {
  const { obra_id, data, entrada, saida_almoco, entrada_almoco, saida, observacao } = req.body;
  const usuario_id = req.user.id;

  if (!data) {
    return res.status(400).json({ error: 'Data é obrigatória.' });
  }

  // Calcula total de horas
  let total_horas = null;
  if (entrada && saida) {
    const toMin = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    let total = toMin(saida) - toMin(entrada);
    if (saida_almoco && entrada_almoco) {
      total -= toMin(entrada_almoco) - toMin(saida_almoco);
    }
    total_horas = (total / 60).toFixed(2);
  }

  try {
    const result = await db.query(
      `INSERT INTO registros_ponto
         (usuario_id, obra_id, data, entrada, saida_almoco, entrada_almoco, saida, total_horas, observacao)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (usuario_id, data) DO UPDATE SET
         obra_id        = EXCLUDED.obra_id,
         entrada        = EXCLUDED.entrada,
         saida_almoco   = EXCLUDED.saida_almoco,
         entrada_almoco = EXCLUDED.entrada_almoco,
         saida          = EXCLUDED.saida,
         total_horas    = EXCLUDED.total_horas,
         observacao     = EXCLUDED.observacao,
         atualizado_em  = NOW()
       RETURNING *`,
      [usuario_id, obra_id || null, data, entrada || null, saida_almoco || null,
       entrada_almoco || null, saida || null, total_horas, observacao || null]
    );

    return res.status(201).json({ registro: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── DELETE /ponto/:id — remover registro (admin) ────────────────────────────
router.delete('/:id', async (req, res) => {
  if (req.user.perfil !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem excluir registros.' });
  }

  try {
    await db.query('DELETE FROM registros_ponto WHERE id = $1', [req.params.id]);
    return res.json({ mensagem: 'Registro excluído.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

module.exports = router;
