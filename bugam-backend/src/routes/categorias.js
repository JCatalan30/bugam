const { sanitizeString, validateNumber, validateLength, validateRequiredFields } = require('../utils/validacion');

module.exports = (pool) => {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM categorias WHERE activa = true ORDER BY orden');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { nombre, descripcion, orden } = req.body;
      
      try {
        validateRequiredFields({ nombre }, ['nombre']);
        validateLength(nombre, 'nombre', 1, 50);
        if (descripcion) sanitizeString(descripcion);
        if (orden !== undefined) validateNumber(orden, 'orden');
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }
      
      const result = await pool.query(
        'INSERT INTO categorias (nombre, descripcion, orden) VALUES ($1, $2, $3) RETURNING *',
        [nombre, descripcion, orden || 0]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const { nombre, descripcion, orden, activa } = req.body;
      
      try {
        if (nombre) validateLength(nombre, 'nombre', 1, 50);
        if (descripcion) sanitizeString(descripcion);
        if (orden !== undefined) validateNumber(orden, 'orden');
        if (activa !== undefined && typeof activa !== 'boolean') {
          throw new Error('activa debe ser un valor booleano');
        }
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }
      
      const result = await pool.query(
        'UPDATE categorias SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), orden = COALESCE($3, orden), activa = COALESCE($4, activa) WHERE id = $5 RETURNING *',
        [nombre, descripcion, orden, activa, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await pool.query('UPDATE categorias SET activa = false WHERE id = $1', [req.params.id]);
      res.json({ message: 'Categoría desactivada' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
