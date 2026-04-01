const { sanitizeString, validateNumber, validateLength, validateRequiredFields } = require('../utils/validacion');

module.exports = (pool) => {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM ubicaciones ORDER BY tipo, nombre');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { nombre, tipo, capacidad } = req.body;
      
      try {
        validateRequiredFields({ nombre, tipo }, ['nombre', 'tipo']);
        validateLength(nombre, 'nombre', 1, 50);
        validateLength(tipo, 'tipo', 1, 20);
        if (capacidad !== undefined) validateNumber(capacidad, 'capacidad');
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }
      
      const result = await pool.query(
        'INSERT INTO ubicaciones (nombre, tipo, capacidad) VALUES ($1, $2, $3) RETURNING *',
        [nombre, tipo, capacidad || 1]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const { nombre, tipo, capacidad, estado } = req.body;
      
      try {
        if (nombre) validateLength(nombre, 'nombre', 1, 50);
        if (tipo) validateLength(tipo, 'tipo', 1, 20);
        if (capacidad !== undefined) validateNumber(capacidad, 'capacidad');
        if (estado) validateLength(estado, 'estado', 1, 20);
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }
      
      const result = await pool.query(
        'UPDATE ubicaciones SET nombre = COALESCE($1, nombre), tipo = COALESCE($2, tipo), capacidad = COALESCE($3, capacidad), estado = COALESCE($4, estado) WHERE id = $5 RETURNING *',
        [nombre, tipo, capacidad, estado, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM ubicaciones WHERE id = $1', [req.params.id]);
      res.json({ message: 'Ubicación eliminada' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
