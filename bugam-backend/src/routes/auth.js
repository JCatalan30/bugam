const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sanitizeString, validateLength, validateRequiredFields } = require('../utils/validacion');

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000;

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record) {
    return { allowed: true, attempts: 0 };
  }
  
  if (record.blockedUntil && now < record.blockedUntil) {
    const remainingTime = Math.ceil((record.blockedUntil - now) / 60000);
    return { allowed: false, blocked: true, remainingTime };
  }
  
  if (record.blockedUntil && now >= record.blockedUntil) {
    rateLimitStore.delete(ip);
    return { allowed: true, attempts: 0 };
  }
  
  const timeSinceFirstAttempt = now - record.firstAttemptTime;
  if (timeSinceFirstAttempt > RATE_LIMIT_WINDOW) {
    rateLimitStore.delete(ip);
    return { allowed: true, attempts: 0 };
  }
  
  return { allowed: record.attempts < MAX_ATTEMPTS, attempts: record.attempts };
}

function recordFailedAttempt(ip, username) {
  const now = Date.now();
  let record = rateLimitStore.get(ip);
  
  if (!record || (record.blockedUntil && now >= record.blockedUntil)) {
    record = { attempts: 0, firstAttemptTime: now, failedLogins: [] };
  }
  
  record.attempts += 1;
  record.failedLogins.push({ username, time: now });
  record.lastAttempt = now;
  
  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION;
  }
  
  rateLimitStore.set(ip, record);
}

function resetRateLimit(ip) {
  rateLimitStore.delete(ip);
}

module.exports = (pool) => {
  const router = require('express').Router();

  router.post('/login', async (req, res) => {
    try {
      const clientIp = getClientIp(req);
      const rateLimit = checkRateLimit(clientIp);
      
      if (!rateLimit.allowed) {
        if (rateLimit.blocked) {
          return res.status(429).json({ 
            error: `Demasiados intentos. Intenta de nuevo en ${rateLimit.remainingTime} minutos` 
          });
        }
      }
      
      const { username, password } = req.body;
      
      try {
        validateRequiredFields({ username, password }, ['username', 'password']);
        sanitizeString(username);
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }
      
      const result = await pool.query(
        'SELECT u.*, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.username = $1 AND u.activo = true',
        [username]
      );
      
      if (result.rows.length === 0) {
        recordFailedAttempt(clientIp, username);
        await pool.query(
          'INSERT INTO bitacora_login (ip, username, resultado, timestamp) VALUES ($1, $2, $3, NOW())',
          [clientIp, username, 'FALLIDO_USUARIO_NO_ENCONTRADO']
        );
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }
      
      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!validPassword) {
        recordFailedAttempt(clientIp, username);
        await pool.query(
          'INSERT INTO bitacora_login (ip, username, resultado, timestamp) VALUES ($1, $2, $3, NOW())',
          [clientIp, username, 'FALLIDO_PASSWORD_INCORRECTO']
        );
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }
      
      resetRateLimit(clientIp);
      await pool.query(
        'INSERT INTO bitacora_login (ip, username, resultado, timestamp) VALUES ($1, $2, $3, NOW())',
        [clientIp, username, 'EXITOSO']
      );
      
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