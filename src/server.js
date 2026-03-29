// src/server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes     = require('./routes/auth');
const pontoRoutes    = require('./routes/ponto');
const estoqueRoutes  = require('./routes/estoque');
const fotosRoutes    = require('./routes/fotos');
const usuariosRoutes = require('./routes/usuarios');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares globais ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Rotas ───────────────────────────────────────────────────────────────────
app.use('/auth',     authRoutes);
app.use('/ponto',    pontoRoutes);
app.use('/estoque',  estoqueRoutes);
app.use('/fotos',    fotosRoutes);
app.use('/usuarios', usuariosRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada.` });
});

// ─── Inicia servidor ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 API SH Engenharia rodando em http://localhost:${PORT}`);
});
