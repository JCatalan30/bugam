module.exports = (pool) => {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    try {
      const { estado } = req.query;
      let query = `SELECT c.*, u.nombre as mesero_nombre, ub.nombre as ubicacion_nombre, ub.tipo 
                   FROM cuentas c 
                   LEFT JOIN usuarios u ON c.mesero_id = u.id 
                   LEFT JOIN ubicaciones ub ON c.ubicacion_id = ub.id`;
      const params = [];
      
      if (estado) {
        params.push(estado);
        query += ` WHERE c.estado = $${params.length}`;
      }
      
      query += ' ORDER BY c.fecha_apertura DESC';
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const cuentaResult = await pool.query(
        `SELECT c.*, u.nombre as mesero_nombre, ub.nombre as ubicacion_nombre, ub.tipo 
         FROM cuentas c 
         LEFT JOIN usuarios u ON c.mesero_id = u.id 
         LEFT JOIN ubicaciones ub ON c.ubicacion_id = ub.id 
         WHERE c.id = $1`,
        [id]
      );
      
      if (cuentaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Cuenta no encontrada' });
      }
      
      const pedidosResult = await pool.query(
        `SELECT p.*, u.nombre as mesero_nombre, 
         dp.id as detalle_id, dp.producto_id, dp.cantidad, dp.precio_unitario, dp.subtotal, dp.notas as detalle_notas, dp.estado as detalle_estado,
         prod.nombre as producto_nombre
         FROM pedidos p
         LEFT JOIN usuarios u ON p.mesero_id = u.id
         LEFT JOIN detalles_pedido dp ON p.id = dp.pedido_id
         LEFT JOIN productos prod ON dp.producto_id = prod.id
         WHERE p.cuenta_id = $1
         ORDER BY p.created_at DESC`,
        [id]
      );
      
      const cuenta = cuentaResult.rows[0];
      const pedidos = {};
      
      pedidosResult.rows.forEach(row => {
        if (!pedidos[row.id]) {
          pedidos[row.id] = {
            id: row.id,
            estado: row.estado,
            tipo: row.tipo,
            notas: row.notas,
            mesero_nombre: row.mesero_nombre,
            created_at: row.created_at,
            detalles: []
          };
        }
        if (row.detalle_id) {
          pedidos[row.id].detalles.push({
            id: row.detalle_id,
            producto_id: row.producto_id,
            producto_nombre: row.producto_nombre,
            cantidad: row.cantidad,
            precio_unitario: row.precio_unitario,
            subtotal: row.subtotal,
            notas: row.detalle_notas,
            estado: row.detalle_estado
          });
        }
      });
      
      res.json({ ...cuenta, pedidos: Object.values(pedidos) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    const io = req.app.get('io');
    try {
      const { ubicacion_id, mesero_id, cliente_nombre, notas } = req.body;
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        await client.query(
          'UPDATE ubicaciones SET estado = $1 WHERE id = $2',
          ['OCUPADA', ubicacion_id]
        );
        
        const cuentaResult = await client.query(
          'INSERT INTO cuentas (ubicacion_id, mesero_id, cliente_nombre, notas) VALUES ($1, $2, $3, $4) RETURNING *',
          [ubicacion_id, mesero_id, cliente_nombre, notas]
        );
        
        await client.query('COMMIT');
        
        const cuenta = cuentaResult.rows[0];
        io.emit('cuenta-created', cuenta);
        
        res.json(cuenta);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const { notas, cliente_nombre, estado } = req.body;
      const result = await pool.query(
        'UPDATE cuentas SET notas = COALESCE($1, notas), cliente_nombre = COALESCE($2, cliente_nombre), estado = COALESCE($3, estado) WHERE id = $4 RETURNING *',
        [notas, cliente_nombre, estado, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
