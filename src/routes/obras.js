// src/routes/obras.js
const express = require('express');
const db      = require('../database/db');
const auth    = require('../middlewares/auth');

const router = express.Router();
router.use(auth);

// ─── GET /obras ───────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, u.nome AS responsavel_nome
       FROM obras o
       LEFT JOIN usuarios u ON u.id = o.responsavel_id
       ORDER BY o.criado_em DESC`
    );
    return res.json({ obras: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── POST /obras — criar obra (admin/engenheiro) ──────────────────────────────
router.post('/', async (req, res) => {
  const { perfil } = req.user;
  if (!['admin', 'engenheiro'].includes(perfil)) {
    return res.status(403).json({ error: 'Sem permissão.' });
  }

  const { nome, endereco, responsavel_id, iniciada_em, prevista_em, latitude, longitude, raio_metros } = req.body;

  if (!nome) return res.status(400).json({ error: 'Nome da obra é obrigatório.' });

  try {
    const result = await db.query(
      `INSERT INTO obras
         (nome, endereco, responsavel_id, iniciada_em, prevista_em,
          latitude, longitude, raio_metros)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        nome, endereco || null, responsavel_id || null,
        iniciada_em || null, prevista_em || null,
        latitude || null, longitude || null, raio_metros || 100,
      ]
    );
    return res.status(201).json({ obra: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── PATCH /obras/:id — editar obra ──────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  const { perfil } = req.user;
  if (!['admin', 'engenheiro'].includes(perfil)) {
    return res.status(403).json({ error: 'Sem permissão.' });
  }

  const { nome, endereco, status, latitude, longitude, raio_metros } = req.body;
  const fields = [];
  const params = [];

  if (nome)        { params.push(nome);        fields.push(`nome = $${params.length}`); }
  if (endereco)    { params.push(endereco);    fields.push(`endereco = $${params.length}`); }
  if (status)      { params.push(status);      fields.push(`status = $${params.length}`); }
  if (latitude)    { params.push(latitude);    fields.push(`latitude = $${params.length}`); }
  if (longitude)   { params.push(longitude);   fields.push(`longitude = $${params.length}`); }
  if (raio_metros) { params.push(raio_metros); fields.push(`raio_metros = $${params.length}`); }

  if (fields.length === 0) return res.status(400).json({ error: 'Nada para atualizar.' });

  fields.push(`atualizado_em = NOW()`);
  params.push(req.params.id);

  try {
    const result = await db.query(
      `UPDATE obras SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return res.json({ obra: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

module.exports = router;
