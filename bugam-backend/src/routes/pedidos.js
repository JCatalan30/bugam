module.exports = (pool) => {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    try {
      const { cuenta_id, estado, tipo_pedido, notas } = req.query;
      let query = `SELECT p.*, c.id as cuenta_id, u.nombre as mesero_nombre, ub.nombre as ubicacion_nombre
                   FROM pedidos p
                   JOIN cuentas c ON p.cuenta_id = c.id
                   LEFT JOIN usuarios u ON p.mesero_id = u.id
                   LEFT JOIN ubicaciones ub ON c.ubicacion_id = ub.id
                   WHERE 1=1`;
      const params = [];
      
      if (cuenta_id) {
        params.push(cuenta_id);
        query += ` AND p.cuenta_id = $${params.length}`;
      }
      if (estado) {
        const estados = estado.split(',');
        if (estados.length > 1) {
          query += ` AND p.estado IN (${estados.map((_, i) => `$${params.length + i + 1}`).join(',')})`;
          params.push(...estados);
        } else {
          params.push(estado);
          query += ` AND p.estado = $${params.length}`;
        }
      }
      if (tipo_pedido) {
        params.push(tipo_pedido);
        query += ` AND p.tipo = $${params.length}`;
      }
      if (notas) {
        params.push(notas);
        query += ` AND p.notas = $${params.length}`;
      }
      
      query += ' ORDER BY p.created_at DESC';
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  const registrarBitacora = async (usuario_id, accion, entidad, entidad_id, detalles) => {
    try {
      await pool.query(
        'INSERT INTO bitacora (usuario_id, accion, entidad, entidad_id, detalles) VALUES ($1, $2, $3, $4, $5)',
        [usuario_id, accion, entidad, entidad_id, detalles ? JSON.stringify(detalles) : null]
      );
    } catch (err) {
      console.error('Error bitácora:', err.message);
    }
  };

  router.post('/', async (req, res) => {
    const io = req.app.get('io');
    try {
      const { cuenta_id, mesero_id, tipo, notas, detalles } = req.body;
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        const pedidoResult = await client.query(
          'INSERT INTO pedidos (cuenta_id, mesero_id, tipo, notas) VALUES ($1, $2, $3, $4) RETURNING *',
          [cuenta_id, mesero_id, tipo || 'PRESENCIAL', notas]
        );
        const pedido = pedidoResult.rows[0];
        
        for (const det of detalles || []) {
          await client.query(
            'INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal, notas) VALUES ($1, $2, $3, $4, $5, $6)',
            [pedido.id, det.producto_id, det.cantidad, det.precio_unitario, det.subtotal, det.notas]
          );
        }
        
        await client.query(
          `UPDATE cuentas c SET subtotal = sub.total, impuestos = 0, total = sub.total
           FROM (SELECT SUM(dp.subtotal) as total FROM detalles_pedido dp JOIN pedidos p ON dp.pedido_id = p.id WHERE p.cuenta_id = $1) sub
           WHERE c.id = $1`,
          [cuenta_id]
        );
        
        await client.query('COMMIT');
        
        await registrarBitacora(mesero_id, 'CREAR', 'PEDIDO', pedido.id, { cuenta_id, tipo, notas, num_detalles: detalles?.length || 0 });
        
        io.to('kitchen').emit('new-order', pedido);
        io.to('waiter').emit('order-created', pedido);
        
        res.json(pedido);
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
    const io = req.app.get('io');
    try {
      const { estado, usuario_id } = req.body;
      const result = await pool.query(
        'UPDATE pedidos SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [estado, req.params.id]
      );
      
      await registrarBitacora(usuario_id, 'ACTUALIZAR', 'PEDIDO', req.params.id, { estado_anterior: result.rows[0].estado, estado_nuevo: estado });
      
      const pedidoActualizado = { ...result.rows[0], cuenta_id: result.rows[0].cuenta_id };
      io.to('waiter').emit('order-updated', pedidoActualizado);
      io.to('cashier').emit('order-updated', pedidoActualizado);
      
      if (estado === 'LISTO') {
        io.to('waiter').emit('kitchen-ready', result.rows[0]);
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    const io = req.app.get('io');
    try {
      await pool.query('UPDATE pedidos SET estado = $1 WHERE id = $2', ['CANCELADO', req.params.id]);
      io.to('kitchen').emit('order-cancelled', { id: req.params.id });
      res.json({ message: 'Pedido cancelado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/detalle/:id', async (req, res) => {
    const io = req.app.get('io');
    try {
      const { estado } = req.body;
      console.log('Updating detail:', req.params.id, 'to estado:', estado);
      
      const result = await pool.query(
        'UPDATE detalles_pedido SET estado = $1 WHERE id = $2 RETURNING *',
        [estado, req.params.id]
      );
      
      if (result.rows[0]) {
        const pedidoRes = await pool.query('SELECT * FROM pedidos WHERE id = (SELECT pedido_id FROM detalles_pedido WHERE id = $1)', [req.params.id]);
        if (pedidoRes.rows[0]) {
          const pedidoConCuenta = { ...pedidoRes.rows[0], cuenta_id: pedidoRes.rows[0].cuenta_id };
          io.to('waiter').emit('order-updated', pedidoConCuenta);
        }
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating detail:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
