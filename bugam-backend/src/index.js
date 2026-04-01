require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: '*', 
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(cors());
app.use(helmet());
app.use(express.json());

app.set('io', io);
app.set('db', pool);

app.use('/api/auth', require('./routes/auth')(pool));
app.use('/api/ubicaciones', require('./routes/ubicaciones')(pool));
app.use('/api/categorias', require('./routes/categorias')(pool));
app.use('/api/productos', require('./routes/productos')(pool));
app.use('/api/cuentas', require('./routes/cuentas')(pool));
app.use('/api/pedidos', require('./routes/pedidos')(pool));
app.use('/api/pagos', require('./routes/pagos')(pool));
app.use('/api/config', require('./routes/config')(pool));
app.use('/api/reportes', require('./routes/reportes')(pool));
app.use('/api/usuarios', require('./routes/usuarios')(pool));
app.use('/api/roles', require('./routes/roles')(pool));
app.use('/api/bitacora', require('./routes/bitacora')(pool));
app.use('/api/reservaciones', require('./routes/reservaciones')(pool));

app.use(express.static(path.join(__dirname, '../../bugam-frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../bugam-frontend/dist/index.html'));
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-kitchen', () => {
    socket.join('kitchen');
    console.log('Client joined kitchen room:', socket.id);
  });
  socket.on('join-cashier', () => {
    socket.join('cashier');
    console.log('Client joined cashier room:', socket.id);
  });
  socket.on('join-waiter', () => {
    socket.join('waiter');
    console.log('Client joined waiter room:', socket.id);
  });
  
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
