const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
  const router = require('express').Router();

  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const result = await pool.query(
        'SELECT u.*, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.username = $1 AND u.activo = true',
        [username]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }
      
      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }
      
      const token = jwt.sign({ id: user.id, rol: user.rol }, process.env.JWT_SECRET || 'bugam2026');
      
      res.json({
        token,
        user: { id: user.id, nombre: user.nombre, rol: user.rol }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/verify', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ valid: false });
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bugam2026');
      res.json({ valid: true, user: decoded });
    } catch {
      res.status(401).json({ valid: false });
    }
  });

  return router;
};
