// src/routes/ponto.js
const express = require('express');
const db      = require('../database/db');
const auth    = require('../middlewares/auth');

const router = express.Router();
router.use(auth);

// ─── Calcula distância entre dois pontos em metros (Haversine) ────────────────
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371000; // raio da Terra em metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── GET /ponto ───────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { mes, usuario_id } = req.query;
  const { perfil, id } = req.user;

  try {
    let query = `
      SELECT r.*, u.nome AS usuario_nome, u.avatar,
             o.nome AS obra_nome
      FROM registros_ponto r
      JOIN usuarios u ON u.id = r.usuario_id
      LEFT JOIN obras o ON o.id = r.obra_id
      WHERE 1=1
    `;
    const params = [];

    if (perfil === 'campo' || perfil === 'almoxarife') {
      params.push(id);
      query += ` AND r.usuario_id = $${params.length}`;
    } else if (usuario_id) {
      params.push(usuario_id);
      query += ` AND r.usuario_id = $${params.length}`;
    }

    if (mes) {
      params.push(mes);
      query += ` AND TO_CHAR(r.data, 'YYYY-MM') = $${params.length}`;
    }

    query += ' ORDER BY r.data DESC, r.criado_em DESC';

    const result = await db.query(query, params);
    return res.json({ registros: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── POST /ponto ──────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    obra_id, data, entrada, saida_almoco, entrada_almoco, saida,
    observacao, latitude, longitude,
  } = req.body;
  const usuario_id = req.user.id;

  if (!data) return res.status(400).json({ error: 'Data é obrigatória.' });

  try {
    // ── Validação de geolocalização ──────────────────────────────────────────
    let dentro_raio = null;

    if (latitude && longitude && obra_id) {
      const obra = await db.query(
        'SELECT latitude, longitude, raio_metros FROM obras WHERE id = $1',
        [obra_id]
      );

      if (obra.rows[0]?.latitude && obra.rows[0]?.longitude) {
        const distancia = calcularDistancia(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(obra.rows[0].latitude),
          parseFloat(obra.rows[0].longitude)
        );
        const raio = obra.rows[0].raio_metros || 100;
        dentro_raio = distancia <= raio;

        if (!dentro_raio) {
          return res.status(403).json({
            error: `Você está fora do raio permitido da obra. Distância atual: ${Math.round(distancia)}m. Raio permitido: ${raio}m.`,
            distancia: Math.round(distancia),
            raio,
          });
        }
      }
    }

    // ── Calcula total de horas ───────────────────────────────────────────────
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

    const result = await db.query(
      `INSERT INTO registros_ponto
         (usuario_id, obra_id, data, entrada, saida_almoco, entrada_almoco,
          saida, total_horas, observacao, latitude, longitude, dentro_raio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (usuario_id, data) DO UPDATE SET
         obra_id        = EXCLUDED.obra_id,
         entrada        = EXCLUDED.entrada,
         saida_almoco   = EXCLUDED.saida_almoco,
         entrada_almoco = EXCLUDED.entrada_almoco,
         saida          = EXCLUDED.saida,
         total_horas    = EXCLUDED.total_horas,
         observacao     = EXCLUDED.observacao,
         latitude       = EXCLUDED.latitude,
         longitude      = EXCLUDED.longitude,
         dentro_raio    = EXCLUDED.dentro_raio,
         atualizado_em  = NOW()
       RETURNING *`,
      [
        usuario_id, obra_id || null, data,
        entrada || null, saida_almoco || null,
        entrada_almoco || null, saida || null,
        total_horas, observacao || null,
        latitude || null, longitude || null, dentro_raio,
      ]
    );

    return res.status(201).json({ registro: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── GET /ponto/mapa — localizações para o mapa ───────────────────────────────
router.get('/mapa', async (req, res) => {
  const { perfil } = req.user;
  if (!['admin', 'engenheiro'].includes(perfil)) {
    return res.status(403).json({ error: 'Sem permissão.' });
  }

  const { data } = req.query;
  const filtroData = data || new Date().toISOString().split('T')[0];

  try {
    const result = await db.query(
      `SELECT r.id, r.data, r.entrada, r.saida, r.latitude, r.longitude,
              r.dentro_raio, r.total_horas,
              u.nome AS usuario_nome, u.avatar,
              o.nome AS obra_nome
       FROM registros_ponto r
       JOIN usuarios u ON u.id = r.usuario_id
       LEFT JOIN obras o ON o.id = r.obra_id
       WHERE r.data = $1
         AND r.latitude IS NOT NULL
         AND r.longitude IS NOT NULL
       ORDER BY r.entrada DESC`,
      [filtroData]
    );
    return res.json({ pontos: result.rows, data: filtroData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ─── DELETE /ponto/:id ────────────────────────────────────────────────────────
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
