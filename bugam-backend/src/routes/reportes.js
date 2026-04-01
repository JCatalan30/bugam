module.exports = (pool) => {
  const router = require('express').Router();

  router.get('/ventas', async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      let query = `SELECT DATE(fecha_cierre) as fecha, COUNT(*) as pedidos, SUM(total) as ventas
                   FROM cuentas
                   WHERE estado = 'CERRADA'`;
      const params = [];
      
      if (fecha_inicio) {
        params.push(fecha_inicio);
        query += ` AND fecha_cierre >= $${params.length}`;
      }
      if (fecha_fin) {
        params.push(fecha_fin);
        query += ` AND fecha_cierre <= $${params.length}`;
      }
      
      query += ' GROUP BY DATE(fecha_cierre) ORDER BY fecha DESC';
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/productos', async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      let query = `SELECT p.nombre, SUM(dp.cantidad) as cantidad, SUM(dp.subtotal) as total
                   FROM detalles_pedido dp
                   JOIN productos p ON dp.producto_id = p.id
                   JOIN pedidos ped ON dp.pedido_id = ped.id
                   WHERE 1=1`;
      const params = [];
      
      if (fecha_inicio) {
        params.push(fecha_inicio);
        query += ` AND ped.created_at >= $${params.length}`;
      }
      if (fecha_fin) {
        params.push(fecha_fin);
        query += ` AND ped.created_at <= $${params.length}`;
      }
      
      query += ' GROUP BY p.nombre ORDER BY total DESC LIMIT 10';
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/resumen-dia', async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const cuentasResult = await pool.query(
        `SELECT COUNT(*) as total_cuentas, 
         SUM(CASE WHEN estado = 'CERRADA' THEN total ELSE 0 END) as ventas
         FROM cuentas WHERE DATE(fecha_apertura) = $1`,
        [today]
      );
      
      const pedidosResult = await pool.query(
        `SELECT COUNT(*) as total_pedidos FROM pedidos WHERE DATE(created_at) = $1`,
        [today]
      );
      
      res.json({
        cuentas: cuentasResult.rows[0],
        pedidos: pedidosResult.rows[0]
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/corte-caja', async (req, res) => {
    try {
      const { fecha } = req.query;
      const fechaBusqueda = fecha || new Date().toISOString().split('T')[0];
      
      const cuentasResult = await pool.query(
        `SELECT COUNT(*) as total_cuentas, SUM(total) as total_ventas
         FROM cuentas WHERE estado = 'CERRADA' AND DATE(fecha_cierre) = $1`,
        [fechaBusqueda]
      );

      const pagosResult = await pool.query(
        `SELECT mp.nombre as metodo, SUM(pg.monto) as total
         FROM pagos pg
         JOIN metodos_pago mp ON pg.metodo_pago_id = mp.id
         WHERE DATE(pg.created_at) = $1
         GROUP BY mp.nombre`,
        [fechaBusqueda]
      );

      const productosResult = await pool.query(
        `SELECT p.nombre, SUM(dp.cantidad) as cantidad
         FROM detalles_pedido dp
         JOIN productos p ON dp.producto_id = p.id
         JOIN pedidos ped ON dp.pedido_id = ped.id
         WHERE DATE(ped.created_at) = $1
         GROUP BY p.nombre ORDER BY cantidad DESC LIMIT 5`,
        [fechaBusqueda]
      );

      res.json({
        resumen: cuentasResult.rows[0],
        metodos_pago: pagosResult.rows,
        productos_top: productosResult.rows
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/bitacora', async (req, res) => {
    try {
      const { limit } = req.query;
      const result = await pool.query(
        `SELECT b.*, u.nombre as usuario_nombre 
         FROM bitacora b 
         LEFT JOIN usuarios u ON b.usuario_id = u.id 
         ORDER BY b.created_at DESC 
         LIMIT $1`,
        [limit || 50]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/clientes-frecuentes', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT cliente_nombre, COUNT(*) as visitas, SUM(total) as gasto_total
         FROM cuentas 
         WHERE cliente_nombre IS NOT NULL AND cliente_nombre != ''
         GROUP BY cliente_nombre 
         ORDER BY visitas DESC 
         LIMIT 10`
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/ventas-usuario', async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      let query = `SELECT u.id as usuario_id, u.nombre as usuario_nombre, 
                   COUNT(DISTINCT c.id) as total_cuentas,
                   COALESCE(SUM(c.total), 0) as total_ventas,
                   COUNT(p.id) as total_pedidos
                   FROM usuarios u
                   LEFT JOIN cuentas c ON c.mesero_id = u.id AND c.estado = 'CERRADA'
                   LEFT JOIN pedidos p ON p.cuenta_id = c.id
                   WHERE u.rol_id IN (2, 3)`;
      const params = [];

      if (fecha_inicio) {
        params.push(fecha_inicio);
        query += ` AND c.fecha_cierre >= $${params.length}`;
      }
      if (fecha_fin) {
        params.push(fecha_fin);
        query += ` AND c.fecha_cierre <= $${params.length}`;
      }

      query += ' GROUP BY u.id, u.nombre ORDER BY total_ventas DESC';
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
