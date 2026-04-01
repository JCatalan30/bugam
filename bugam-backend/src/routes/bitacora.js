module.exports = (pool) => {
  const router = require('express').Router();

  router.post('/', async (req, res) => {
    try {
      const { usuario_id, accion, entidad, entidad_id, detalles } = req.body;
      const result = await pool.query(
        'INSERT INTO bitacora (usuario_id, accion, entidad, entidad_id, detalles) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [usuario_id, accion, entidad, entidad_id, detalles ? JSON.stringify(detalles) : null]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};