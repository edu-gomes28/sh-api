// src/routes/auth.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../database/db');
const auth    = require('../middlewares/auth');

const router = express.Router();

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const result = await db.query(
      `SELECT u.id, u.nome, u.email, u.senha_hash, u.avatar, u.ativo,
              p.nome AS perfil
       FROM usuarios u
       JOIN perfis p ON p.id = u.perfil_id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    if (!usuario.ativo) {
      return res.status(403).json({ error: 'Usuário inativo. Contate o administrador.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      usuario: {
        id:     usuario.id,
        nome:   usuario.nome,
        email:  usuario.email,
        avatar: usuario.avatar,
        perfil: usuario.perfil,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── POST /auth/register (somente admin) ─────────────────────────────────────
router.post('/register', auth, async (req, res) => {
  if (req.user.perfil !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem criar usuários.' });
  }

  const { nome, email, senha, perfil, avatar } = req.body;

  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({ error: 'nome, email, senha e perfil são obrigatórios.' });
  }

  try {
    const perfilResult = await db.query(
      'SELECT id FROM perfis WHERE nome = $1', [perfil]
    );
    if (!perfilResult.rows[0]) {
      return res.status(400).json({ error: `Perfil "${perfil}" não encontrado.` });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const result = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, avatar, perfil_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, avatar`,
      [nome, email.toLowerCase().trim(), senhaHash, avatar || '', perfilResult.rows[0].id]
    );

    return res.status(201).json({ usuario: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'E-mail já cadastrado.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.nome, u.email, u.avatar, p.nome AS perfil
       FROM usuarios u
       JOIN perfis p ON p.id = u.perfil_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    return res.json({ usuario: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

module.exports = router;
