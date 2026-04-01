module.exports = (pool) => {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM configuracion ORDER BY clave');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/', async (req, res) => {
    try {
      const { clave, valor } = req.body;
      const result = await pool.query(
        'UPDATE configuracion SET valor = $1, updated_at = CURRENT_TIMESTAMP WHERE clave = $2 RETURNING *',
        [valor, clave]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
