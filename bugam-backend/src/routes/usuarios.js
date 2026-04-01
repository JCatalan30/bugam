const bcrypt = require('bcryptjs');
const { sanitizeString, validateNumber, validateLength, validateRequiredFields } = require('../utils/validacion');

module.exports = (pool) => {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT u.id, u.username, u.nombre, u.activo, u.created_at, r.nombre as rol_nombre, r.id as rol_id FROM usuarios u LEFT JOIN roles r ON u.rol_id = r.id ORDER BY u.nombre'
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { username, password, nombre, rol_id } = req.body;
      
      try {
        validateRequiredFields({ username, password, nombre }, ['username', 'password', 'nombre']);
        validateLength(username, 'username', 3, 50);
        validateLength(password, 'password', 6, 100);
        sanitizeString(nombre);
        if (rol_id) validateNumber(rol_id, 'rol_id');
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }
      
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO usuarios (username, password_hash, nombre, rol_id) VALUES ($1, $2, $3, $4) RETURNING id, username, nombre, rol_id',
        [username, passwordHash, nombre, rol_id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const { nombre, rol_id, activo, password } = req.body;
      
      try {
        if (nombre) sanitizeString(nombre);
        if (rol_id !== undefined) validateNumber(rol_id, 'rol_id');
        if (activo !== undefined && typeof activo !== 'boolean') {
          throw new Error('activo debe ser un valor booleano');
        }
        if (password) validateLength(password, 'password', 6, 100);
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }
      
      let query = 'UPDATE usuarios SET nombre = COALESCE($1, nombre), rol_id = COALESCE($2, rol_id), activo = COALESCE($3, activo), updated_at = CURRENT_TIMESTAMP';
      const params = [nombre, rol_id, activo];
      
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        query += ', password_hash = $4';
        params.push(passwordHash);
      }
      
      query += ' WHERE id = $' + (params.length + 1) + ' RETURNING id, username, nombre, rol_id';
      params.push(req.params.id);
      
      const result = await pool.query(query, params);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await pool.query('UPDATE usuarios SET activo = false WHERE id = $1', [req.params.id]);
      res.json({ message: 'Usuario desactivado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};