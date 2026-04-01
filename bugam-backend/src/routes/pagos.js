const { sanitizeString, validateNumber, validatePositiveNumber } = require('../utils/validacion');

module.exports = (pool) => {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    try {
      const { cuenta_id } = req.query;
      let query = `SELECT pg.*, mp.nombre as metodo_nombre 
                   FROM pagos pg 
                   LEFT JOIN metodos_pago mp ON pg.metodo_pago_id = mp.id`;
      const params = [];
      
      if (cuenta_id) {
        params.push(cuenta_id);
        query += ` WHERE pg.cuenta_id = $${params.length}`;
      }
      
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/pendientes', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT pg.*, mp.nombre as metodo_nombre, c.id as cuenta_id, c.total as total_cuenta, ub.nombre as ubicacion_nombre
         FROM pagos pg
         LEFT JOIN metodos_pago mp ON pg.metodo_pago_id = mp.id
         LEFT JOIN cuentas c ON pg.cuenta_id = c.id
         LEFT JOIN ubicaciones ub ON c.ubicacion_id = ub.id
         WHERE pg.estado = 'PENDIENTE' OR pg.estado IS NULL
         ORDER BY pg.created_at DESC`
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    const io = req.app.get('io');
    try {
      const { cuenta_id, metodo_pago_id, monto, referencia, notas } = req.body;
      
      try {
        validateNumber(cuenta_id, 'cuenta_id');
        validateNumber(metodo_pago_id, 'metodo_pago_id');
        validatePositiveNumber(monto, 'monto');
        if (referencia) sanitizeString(referencia);
        if (notas) sanitizeString(notas);
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        const metodoResult = await client.query('SELECT nombre FROM metodos_pago WHERE id = $1', [metodo_pago_id]);
        const esTransferencia = metodoResult.rows[0]?.nombre === 'TRANSFERENCIA';
        
        const estadoPago = esTransferencia ? 'PENDIENTE' : 'CONFIRMADO';
        
        await client.query(
          'INSERT INTO pagos (cuenta_id, metodo_pago_id, monto, referencia, notas, estado) VALUES ($1, $2, $3, $4, $5, $6)',
          [cuenta_id, metodo_pago_id, monto, referencia, notas, estadoPago]
        );
        
        const cuentaResult = await client.query(
          'SELECT total FROM cuentas WHERE id = $1',
          [cuenta_id]
        );
        const total = parseFloat(cuentaResult.rows[0].total);
        
        const pagosResult = await client.query(
          'SELECT COALESCE(SUM(monto), 0) as total_pagado FROM pagos WHERE cuenta_id = $1 AND (estado = \'CONFIRMADO\' OR estado IS NULL)',
          [cuenta_id]
        );
        const totalPagado = parseFloat(pagosResult.rows[0].total_pagado);
        
        let nuevoEstado = 'PENDIENTE_PAGO';
        if (totalPagado >= total) {
          nuevoEstado = 'CERRADA';
          
          await client.query(
            `UPDATE ubicaciones ub 
             SET estado = 'DISPONIBLE' 
             FROM cuentas c 
             WHERE c.ubicacion_id = ub.id AND c.id = $1`,
            [cuenta_id]
          );
          
          await client.query(
            'UPDATE cuentas SET fecha_cierre = CURRENT_TIMESTAMP, estado = $1 WHERE id = $2',
            [nuevoEstado, cuenta_id]
          );
        }
        
        await client.query('COMMIT');
        
        if (!esTransferencia) {
          io.to('waiter').emit('payment-received', { cuenta_id });
        } else {
          io.to('cashier').emit('transferencia-pendiente', { cuenta_id, monto, referencia });
        }
        
        res.json({ message: esTransferencia ? 'Pago por transferencia registrado - Pendiente de verificación' : 'Pago registrado', estado: nuevoEstado, necesitaVerificacion: esTransferencia });
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

  router.put('/:id/confirmar', async (req, res) => {
    const io = req.app.get('io');
    try {
      const { id } = req.params;
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        await client.query('UPDATE pagos SET estado = \'CONFIRMADO\' WHERE id = $1', [id]);
        
        const pagoResult = await client.query('SELECT cuenta_id FROM pagos WHERE id = $1', [id]);
        const cuenta_id = pagoResult.rows[0].cuenta_id;
        
        const cuentaResult = await client.query('SELECT total FROM cuentas WHERE id = $1', [cuenta_id]);
        const total = parseFloat(cuentaResult.rows[0].total);
        
        const pagosResult = await client.query(
          'SELECT COALESCE(SUM(monto), 0) as total_pagado FROM pagos WHERE cuenta_id = $1 AND (estado = \'CONFIRMADO\' OR estado IS NULL)',
          [cuenta_id]
        );
        const totalPagado = parseFloat(pagosResult.rows[0].total_pagado);
        
        let nuevoEstado = 'PENDIENTE_PAGO';
        if (totalPagado >= total) {
          nuevoEstado = 'CERRADA';
          
          await client.query(
            `UPDATE ubicaciones ub SET estado = 'DISPONIBLE' FROM cuentas c WHERE c.ubicacion_id = ub.id AND c.id = $1`,
            [cuenta_id]
          );
          
          await client.query('UPDATE cuentas SET fecha_cierre = CURRENT_TIMESTAMP, estado = $1 WHERE id = $2', [nuevoEstado, cuenta_id]);
        }
        
        await client.query('COMMIT');
        
        io.to('waiter').emit('payment-received', { cuenta_id });
        
        res.json({ message: 'Pago confirmado', estado: nuevoEstado });
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

  router.get('/metodos', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM metodos_pago WHERE activo = true');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
