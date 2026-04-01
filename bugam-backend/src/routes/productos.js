module.exports = (pool) => {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    try {
      const { categoria_id } = req.query;
      let query = 'SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.disponible = true';
      const params = [];
      
      if (categoria_id) {
        params.push(categoria_id);
        query += ` AND p.categoria_id = $${params.length}`;
      }
      
      query += ' ORDER BY c.orden, p.nombre';
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/inventario', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT p.*, c.nombre as categoria_nombre 
         FROM productos p 
         LEFT JOIN categorias c ON p.categoria_id = c.id 
         ORDER BY p.stock <= p.stock_minimo DESC, p.nombre`
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/stock-bajo', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT p.*, c.nombre as categoria_nombre 
         FROM productos p 
         LEFT JOIN categorias c ON p.categoria_id = c.id 
         WHERE p.stock <= p.stock_minimo AND p.disponible = true
         ORDER BY p.stock ASC`
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/bajo-stock-count', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM productos WHERE stock <= stock_minimo AND disponible = true`
      );
      res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { nombre, descripcion, precio, categoria_id, imagen, tiempo_preparacion, stock, stock_minimo } = req.body;
      const result = await pool.query(
        'INSERT INTO productos (nombre, descripcion, precio, categoria_id, imagen, tiempo_preparacion, stock, stock_minimo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [nombre, descripcion, precio, categoria_id, imagen, tiempo_preparacion || 15, stock || 0, stock_minimo || 5]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const { nombre, descripcion, precio, categoria_id, imagen, disponible, tiempo_preparacion, stock, stock_minimo } = req.body;
      const result = await pool.query(
        'UPDATE productos SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), precio = COALESCE($3, precio), categoria_id = COALESCE($4, categoria_id), imagen = COALESCE($5, imagen), disponible = COALESCE($6, disponible), tiempo_preparacion = COALESCE($7, tiempo_preparacion), stock = COALESCE($8, stock), stock_minimo = COALESCE($9, stock_minimo), updated_at = CURRENT_TIMESTAMP WHERE id = $10 RETURNING *',
        [nombre, descripcion, precio, categoria_id, imagen, disponible, tiempo_preparacion, stock, stock_minimo, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await pool.query('UPDATE productos SET disponible = false WHERE id = $1', [req.params.id]);
      res.json({ message: 'Producto desactivado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
