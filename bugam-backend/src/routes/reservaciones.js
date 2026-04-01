module.exports = (pool) => {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT r.*, u.nombre as ubicacion_nombre 
        FROM reservaciones r 
        LEFT JOIN ubicaciones u ON r.ubicacion_id = u.id 
        ORDER BY r.fecha_reserva, r.hora_reserva
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { ubicacion_id, cliente_nombre, telefono, fecha_reserva, hora_reserva, num_personas, notas } = req.body;
      const result = await pool.query(
        `INSERT INTO reservaciones (ubicacion_id, cliente_nombre, telefono, fecha_reserva, hora_reserva, num_personas, notas) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [ubicacion_id, cliente_nombre, telefono, fecha_reserva, hora_reserva, num_personas || 1, notas]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { estado, ubicacion_id, cliente_nombre, telefono, fecha_reserva, hora_reserva, num_personas, notas } = req.body;
      const result = await pool.query(
        `UPDATE reservaciones SET 
          estado = COALESCE($1, estado),
          ubicacion_id = COALESCE($2, ubicacion_id),
          cliente_nombre = COALESCE($3, cliente_nombre),
          telefono = COALESCE($4, telefono),
          fecha_reserva = COALESCE($5, fecha_reserva),
          hora_reserva = COALESCE($6, hora_reserva),
          num_personas = COALESCE($7, num_personas),
          notas = COALESCE($8, notas)
         WHERE id = $9 RETURNING *`,
        [estado, ubicacion_id, cliente_nombre, telefono, fecha_reserva, hora_reserva, num_personas, notas, id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query("UPDATE reservaciones SET estado = 'CANCELADA' WHERE id = $1", [id]);
      res.json({ message: 'Reservación cancelada' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};