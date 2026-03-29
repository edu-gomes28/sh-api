// src/routes/fotos.js
const express = require('express');
const db      = require('../database/db');
const auth    = require('../middlewares/auth');

const router = express.Router();
router.use(auth);

// ─── GET /fotos ───────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { obra_id, status, usuario_id } = req.query;
  const { perfil, id } = req.user;

  try {
    let query = `
      SELECT f.*, u.nome AS usuario_nome, u.avatar,
             o.nome AS obra_nome, c.nome AS categoria_nome
      FROM fotos f
      JOIN usuarios u ON u.id = f.usuario_id
      LEFT JOIN obras o ON o.id = f.obra_id
      LEFT JOIN categorias_foto c ON c.id = f.categoria_id
      WHERE 1=1
    `;
    const params = [];

    // Campo só vê as próprias fotos
    if (perfil === 'campo') {
      params.push(id);
      query += ` AND f.usuario_id = $${params.length}`;
    } else if (usuario_id) {
      params.push(usuario_id);
      query += ` AND f.usuario_id = $${params.length}`;
    }

    if (obra_id) { params.push(obra_id); query += ` AND f.obra_id = $${params.length}`; }
    if (status)  { params.push(status);  query += ` AND f.status = $${params.length}`; }

    query += ' ORDER BY f.criado_em DESC';

    const result = await db.query(query, params);
    return res.json({ fotos: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── POST /fotos — registrar foto ────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { obra_id, categoria_id, descricao, uri_remota, latitude, longitude } = req.body;
  const usuario_id = req.user.id;

  try {
    const result = await db.query(
      `INSERT INTO fotos
         (obra_id, usuario_id, categoria_id, descricao, uri_remota, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [obra_id || null, usuario_id, categoria_id || null, descricao || null,
       uri_remota || null, latitude || null, longitude || null]
    );
    return res.status(201).json({ foto: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── PATCH /fotos/:id/avaliar — aprovar ou reprovar ──────────────────────────
router.patch('/:id/avaliar', async (req, res) => {
  const { perfil, id: avaliado_por } = req.user;
  if (!['admin', 'engenheiro'].includes(perfil)) {
    return res.status(403).json({ error: 'Sem permissão para avaliar fotos.' });
  }

  const { status } = req.body;
  if (!['aprovada', 'reprovada'].includes(status)) {
    return res.status(400).json({ error: 'status deve ser: aprovada ou reprovada.' });
  }

  try {
    const result = await db.query(
      `UPDATE fotos
       SET status = $1, avaliado_por = $2, avaliado_em = NOW(), atualizado_em = NOW()
       WHERE id = $3 RETURNING *`,
      [status, avaliado_por, req.params.id]
    );
    return res.json({ foto: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── DELETE /fotos/:id ────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { perfil, id } = req.user;

  try {
    const foto = await db.query('SELECT usuario_id FROM fotos WHERE id = $1', [req.params.id]);
    if (!foto.rows[0]) return res.status(404).json({ error: 'Foto não encontrada.' });

    // Só admin ou dono podem excluir
    if (perfil !== 'admin' && foto.rows[0].usuario_id !== id) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    await db.query('DELETE FROM fotos WHERE id = $1', [req.params.id]);
    return res.json({ mensagem: 'Foto excluída.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

module.exports = router;
