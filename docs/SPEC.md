# Sistema de Gestión para Balneario con Restaurante

## 1. Descripción del Sistema

Sistema integral para gestionar pedidos y cuentas de clientes en un balneario que incluye servicio de restaurante. Permite llevar control de pedidos desde que el cliente llega hasta el cierre de cuenta.

## 2. URLs del Proyecto

| Entorno | URL | Base de datos |
|---------|-----|---------------|
| **Producción (Render)** | https://bugam.onrender.com | PostgreSQL en Render |
| **Local** | http://localhost:3001 | PostgreSQL en Docker |

## 3. Flujo de Usuario

### 3.1 Flujo Principal

```
RECEPCIÓN → MESERO → COCINA → CAJA → ADMIN
```

1. **Recepción**: Asignar mesa/hamaca al cliente
2. **Restaurant - Mesero**: Tomar pedidos, enviar a cocina
3. **Cocina**: Preparar pedidos, notificar cuando estén listos
4. **Caja**: Cerrar cuentas, procesar pagos
5. **Admin**: Gestión de menú, usuarios y reportes

### 3.2 Escenarios

- **Cuenta única**: Cliente usa hamaca + restaurant, todo se carga a una cuenta
- **Cuenta parcial**: Cliente puede pedir la cuenta en cualquier momento
- **Split de pago**: Varios métodos de pago para una misma cuenta

## 4. Tecnologías

- **Backend**: Node.js + Express
- **Frontend**: React (Vite)
- **Base de datos**: PostgreSQL
- **Tiempo real**: Socket.io
- **Contenedores**: Docker + Docker Compose
- **Despliegue**: Render (Web Service)

## 5. Setup Local

```bash
# Clonar y entrar al directorio
cd bugam2026

# Iniciar con Docker Compose (puerto 3001)
docker-compose up --build

# Acceder a http://localhost:3001
```

### Variables de entorno local
- `DATABASE_URL`: `postgres://bugam:bugam2026@postgres:5432/bugam`
- `PORT`: 3000 (interno del contenedor)

## 6. Despliegue en Render

### Configuración del Web Service
1. Crear Web Service desde GitHub (repositorio: JCatalan30/bugam)
2. Dockerfile multi-etapa incluido en el proyecto
3. Variables de entorno necesarias:
   - `DATABASE_URL`: postgresql://bugam_db_user:890QkV9yrveOLxpNsJKe853pHcV8NY5x@dpg-d76b4rruibrs73bhq0lg-a.oregon-postgres.render.com:5432/bugam_db?sslmode=require
   - `PORT`: 10000 (asignado por Render)

### PostgreSQL en Render
- Host: `dpg-d76b4rruibrs73bhq0lg-a.oregon-postgres.render.com`
- Puerto: `5432`
- Base de datos: `bugam_db`
- Usuario: `bugam_db_user`

## 7. Schema de Base de Datos

### 7.1 Tablas Principales

- `usuarios` - Empleados del sistema
- `roles` - Roles de usuario
- `ubicaciones` - Mesas, hamacas, cabañas del establecimiento
- `categorias` - Categorías del menú
- `productos` - Menú disponible
- `cuentas` - Cuentas abiertas por mesa/cliente
- `pedidos` - Pedidos realizados
- `detalles_pedido` - Productos del pedido
- `pagos` - Registros de pago
- `metodos_pago` - Métodos de pago disponibles
- `configuracion` - Configuración del sistema
- `bitacora` - Bitácora de acciones

## 8. Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| ADMIN | Gestión total del sistema |
| CAJERO | Cierre de cuentas, reportes |
| MESERO | Tomar pedidos, ver cuentas |
| COCINA | Ver pedidos, cambiar estado |

## 9. Estados de Pedido

| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Esperando confirmación |
| CONFIRMADO | Enviado a cocina |
| EN_PREPARACION | Siendo preparado |
| LISTO | Listo para servir |
| ENTREGADO | Entregado al cliente |
| CANCELADO | Cancelado |

## 10. Estados de Cuenta

| Estado | Descripción |
|--------|-------------|
| ABIERTA | Cuenta activa |
| PENDIENTE_PAGO | Esperando pago |
| CERRADA | Pagada |
| CANCELADA | Cancelada |

---

## 11. Estructura del Proyecto

```
bugam2026/
├── Dockerfile              # Contenedor único (frontend + backend + nginx)
├── docker-compose.yml     # Desarrollo local con PostgreSQL
├── init.sql              # Schema de base de datos
├── package.json          # Workspaces (backend + frontend)
├── docs/
│   └── SPEC.md          # Este documento
├── bugam-backend/
│   ├── src/
│   │   ├── index.js      # Entry point + Express + Socket.io + archivos estáticos
│   │   └── routes/       # API routes
│   └── package.json
└── bugam-frontend/
    ├── src/
    │   ├── pages/        # Login, Mesero, Cocina, Caja, Admin
    │   ├── components/
    │   └── App.jsx
    └── package.json
```

## 12. API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify` - Verificar token

### Ubicaciones
- `GET /api/ubicaciones` - Listar todas
- `POST /api/ubicaciones` - Crear
- `PUT /api/ubicaciones/:id` - Actualizar
- `DELETE /api/ubicaciones/:id` - Eliminar

### Menú
- `GET /api/categorias` - Listar categorías
- `GET /api/productos` - Listar productos
- `POST/PUT/DELETE` - CRUD completo

### Cuentas
- `GET /api/cuentas` - Listar cuentas
- `GET /api/cuentas/:id` - Ver cuenta con pedidos
- `POST /api/cuentas` - Abrir cuenta
- `PUT /api/cuentas/:id` - Actualizar cuenta

### Pedidos
- `GET /api/pedidos` - Listar pedidos
- `POST /api/pedidos` - Crear pedido
- `PUT /api/pedidos/:id` - Actualizar estado
- `DELETE /api/pedidos/:id` - Cancelar pedido

### Pagos
- `POST /api/pagos` - Registrar pago
- `GET /api/pagos/metodos` - Listar métodos de pago

### Reportes
- `GET /api/reportes/ventas` - Reporte de ventas
- `GET /api/reportes/productos` - Productos más vendidos
- `GET /api/reportes/resumen-dia` - Resumen del día

## 13. Detalle de Implementación

### 13.1 Arquitectura

El backend Express sirve tanto la API como los archivos estáticos del frontend:
- Archivos estáticos: `../../bugam-frontend/dist`
- Rutas API: `/api/*` (definidas antes del catch-all)
- SPA routing: `*` → `index.html`

### 13.2 Backend (`bugam-backend/src/`)

```
index.js              # Express + Socket.io + archivos estáticos
routes/
├── auth.js           # Login con JWT
├── ubicaciones.js    # CRUD ubicaciones
├── categorias.js     # CRUD categorías
├── productos.js      # CRUD productos + inventario
├── cuentas.js       # Gestión de cuentas
├── pedidos.js       # Crear/actualizar pedidos
├── pagos.js         # Registro de pagos
├── config.js        # Configuración empresa
├── reportes.js      # Reportes varios
├── usuarios.js      # CRUD usuarios
├── roles.js         # CRUD roles
└── bitacora.js      # Bitácora del sistema
```

### 13.3 Frontend (`bugam-frontend/src/pages/`)

```
Login.jsx        # Login con redirección por rol
Mesero.jsx       # Abrir cuenta, tomar pedidos, imprimir, cerrar
Cocina.jsx       # Ver pedidos cocina, cambiar estados
Caja.jsx         # Listar cuentas, procesar pagos
Admin.jsx        # CRUD completo + reportes
```

### 13.4 Socket.io - Rooms y Eventos
| Room | Eventos emite | Eventos escucha |
|------|---------------|-----------------|
| `kitchen` | `new-order`, `order-cancelled` | - |
| `waiter` | `order-created`, `order-updated`, `kitchen-ready`, `payment-received`, `cuenta-created` | - |
| `cashier` | `order-updated` | - |

### 13.5 Estados de Ubicación
- `DISPONIBLE` - Libre para usar
- `OCUPADA` - Tiene cuenta activa
- `MANTENIMIENTO` - No disponible

### 13.6 Campos de Pedido
- `tipo`: PRESENCIAL o PARA_LLEVAR
- `notas`: "bebidas" o "alimentos" (para filtrar qué va a cocina)

### 13.7 Rutas Frontend
| Ruta | Rol acceso |
|------|------------|
| `/login` | Público |
| `/mesero` | MESERO |
| `/cocina` | COCINA |
| `/caja` | CAJERO, ADMIN |
| `/admin` | ADMIN |

## 14. Lógica de Pedidos

- El mesero selecciona productos y los separa en **bebidas** y **alimentos**
- Las bebidas se envían alobar (no van a cocina)
- Los alimentos se envían a cocina (tipo=PRESENCIAL, notas=alimentos)
- El dashboard de Cocina filtra pedidos donde `notas=alimentos`
- Los cambios de estado en cocina se transmiten en tiempo real al mesero via Socket.io

## 15. Flujo de Cierre de Cuenta

1. Mesero cierra la cuenta → estado cambia a `PENDIENTE_PAGO`
2. Mesero puede imprimir ticket con detalle de pedidos
3. Cliente va a Caja para pagar
4. Cajero procesa pago → estado cambia a `CERRADA`
5. La ubicación queda disponible automáticamente

## 16. Configuración del Sistema

- Los precios de los productos **ya incluyen impuestos** (no se calcula adicional)
- La tabla `configuracion` contiene: nombre_establecimiento, direccion, telefono

## 17. Credenciales

### Sistema
| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | ADMIN |
| cajero | cajero123 | CAJERO |
| mesero | mesero123 | MESERO |
| cocina | cocina123 | COCINA |

### PostgreSQL Local
- Usuario: `bugam`
- Contraseña: `bugam2026`

---

*Documento vivo - Actualizado: 2026-04-01*
