# Balneario Bugambilias - Sistema de Gestión

Sistema integral para gestionar pedidos y cuentas en un balneario con restaurante.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Base de datos**: PostgreSQL
- **Tiempo real**: Socket.io
- **Contenedores**: Docker

## Desarrollo Local

```bash
# Clonar el proyecto
cd bugam2026

# Iniciar contenedores
docker-compose up --build

# Acceso:
# Frontend: http://localhost:3000
# API: http://localhost:3000/api
```

## Credenciales

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | ADMIN |
| cajero | cajero123 | CAJERO |
| mesero | mesero123 | MESERO |
| cocina | cocina123 | COCINA |

## Despliegue en Render (Gratis)

1. **Subir a GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/bugam2026.git
   git push -u origin main
   ```

2. **Crear database en Render**:
   - Ir a https://dashboard.render.com
   - New → PostgreSQL
   - Name: `bugam-db`
   - Guardar la conexión

3. **Crear Web Service**:
   - New → Web Service
   - Conectar repositorio de GitHub
   - Name: `bugam`
   - Build Command: (vacío)
   - Start Command: (vacío)
   - Environment Variables:
     - `DATABASE_URL`: postgresql://user:pass@host:5432/bugam
     - `PORT`: 3001

4. **Ejecutar SQL inicial**:
   - Ir a la database en Render
   - Click en "Shell"
   - Copiar contenido de `init.sql` y ejecutar

## Características

- 👤 **Autenticación** con JWT por roles
- 🍽️ **Mesero**: Abrir cuenta, tomar pedidos, imprimir ticket, cerrar cuenta
- 👨‍🍳 **Cocina**: Ver pedidos de cocina, cambiar estados
- 💰 **Caja**: Procesar pagos (efectivo, tarjeta, transferencia)
- ⚙️ **Admin**: CRUD ubicaciones, menú, usuarios, empresa, reportes
- 📊 **Reportes**: Resumen del día, ventas por fecha, productos más vendidos
- 💳 **Transferencias**: Pagos por transferencia con verificación
- 📦 **Inventario**: Control de stock con alertas

## Estructura

```
bugam2026/
├── Dockerfile           # Un solo contenedor con todo
├── docker-compose.yml  # Desarrollo local
├── vercel.json         # Config Vercel (opcional)
├── init.sql            # Schema PostgreSQL
├── bugam-backend/      # API Express
└── bugam-frontend/     # App React
```