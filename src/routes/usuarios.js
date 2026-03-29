// src/routes/usuarios.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../database/db');
const auth    = require('../middlewares/auth');

const router = express.Router();
router.use(auth);

// ─── GET /usuarios — listar (admin) ──────────────────────────────────────────
router.get('/', async (req, res) => {
  if (req.user.perfil !== 'admin') {
    return res.status(403).json({ error: 'Sem permissão.' });
  }

  try {
    const result = await db.query(
      `SELECT u.id, u.nome, u.email, u.avatar, u.ativo, u.criado_em,
              p.nome AS perfil
       FROM usuarios u
       JOIN perfis p ON p.id = u.perfil_id
       ORDER BY u.nome`
    );
    return res.json({ usuarios: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── PATCH /usuarios/:id — editar usuário (admin) ────────────────────────────
router.patch('/:id', async (req, res) => {
  if (req.user.perfil !== 'admin') {
    return res.status(403).json({ error: 'Sem permissão.' });
  }

  const { nome, email, perfil, avatar, ativo, senha } = req.body;

  try {
    const fields = [];
    const params = [];

    if (nome)   { params.push(nome);   fields.push(`nome = $${params.length}`); }
    if (email)  { params.push(email.toLowerCase().trim()); fields.push(`email = $${params.length}`); }
    if (avatar) { params.push(avatar); fields.push(`avatar = $${params.length}`); }
    if (ativo !== undefined) { params.push(ativo); fields.push(`ativo = $${params.length}`); }

    if (perfil) {
      const p = await db.query('SELECT id FROM perfis WHERE nome = $1', [perfil]);
      if (!p.rows[0]) return res.status(400).json({ error: 'Perfil inválido.' });
      params.push(p.rows[0].id);
      fields.push(`perfil_id = $${params.length}`);
    }

    if (senha) {
      const hash = await bcrypt.hash(senha, 10);
      params.push(hash);
      fields.push(`senha_hash = $${params.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    fields.push(`atualizado_em = NOW()`);
    params.push(req.params.id);

    const result = await db.query(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id, nome, email, avatar, ativo`,
      params
    );

    return res.json({ usuario: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'E-mail já cadastrado.' });
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── DELETE /usuarios/:id — desativar usuário (admin) ────────────────────────
router.delete('/:id', async (req, res) => {
  if (req.user.perfil !== 'admin') {
    return res.status(403).json({ error: 'Sem permissão.' });
  }

  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Você não pode desativar sua própria conta.' });
  }

  try {
    await db.query(
      'UPDATE usuarios SET ativo = false, atualizado_em = NOW() WHERE id = $1',
      [req.params.id]
    );
    return res.json({ mensagem: 'Usuário desativado.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

module.exports = router;
