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
RECEPCIÓN → MESERO → COCINA/BAR → CAJA → ADMIN
```

1. **Recepción/Mesero**: Asignar mesa/hamaca al cliente
2. **Mesero**: Tomar pedidos, separar bebidas/alimentos
3. **Cocina**: Preparar alimentos (confirmar, listo)
4. **Bar**: Preparar bebidas (marcar entregado)
5. **Caja**: Cerrar cuentas, procesar pagos (efectivo/tarjeta/transferencia)
6. **Admin**: Gestión de menú, usuarios, reportes

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
- **Imágenes**: imgBB API (key configurada)

## 5. Setup Local

```bash
# Entrar al directorio
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
- `productos` - Menú disponible (con imagen, stock, tiempo preparación)
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

## 9. Estados

### 9.1 Estados de Pedido

| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Esperando confirmación |
| CONFIRMADO | Enviado a cocina |
| EN_PREPARACION | Siendo preparado |
| LISTO | Listo para servir |
| ENTREGADO | Entregado al cliente |
| CANCELADO | Cancelado |

### 9.2 Estados de Cuenta

| Estado | Descripción |
|--------|-------------|
| ABIERTA | Cuenta activa |
| PENDIENTE_PAGO | Esperando pago |
| CERRADA | Pagada |
| CANCELADA | Cancelada |

### 9.3 Estados de Ubicación

| Estado | Descripción |
|--------|-------------|
| DISPONIBLE | Libre para usar |
| OCUPADA | Tiene cuenta activa |
| MANTENIMIENTO | No disponible |

---

## 10. Estructura del Proyecto

```
bugam2026/
├── Dockerfile              # Contenedor único (frontend + backend)
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
    │   ├── index.css
    │   └── App.jsx
    └── package.json
```

## 11. API Endpoints

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
- `GET /api/productos/inventario` - Ver inventario con stock
- `POST/PUT/DELETE` - CRUD completo

### Cuentas
- `GET /api/cuentas` - Listar cuentas (filtro por estado)
- `GET /api/cuentas/:id` - Ver cuenta con pedidos
- `POST /api/cuentas` - Abrir cuenta
- `PUT /api/cuentas/:id` - Actualizar cuenta/cerrar

### Pedidos
- `GET /api/pedidos` - Listar pedidos (filtro por estado, notas)
- `POST /api/pedidos` - Crear pedido con detalles
- `PUT /api/pedidos/:id` - Actualizar estado
- `PUT /api/pedidos/detalle/:id` - Actualizar detalle
- `DELETE /api/pedidos/:id` - Cancelar pedido

### Pagos
- `POST /api/pagos` - Registrar pago
- `GET /api/pagos/metodos` - Listar métodos de pago
- `GET /api/pagos/pendientes` - Transferencias pendientes
- `PUT /api/pagos/:id/confirmar` - Confirmar pago

### Reportes
- `GET /api/reportes/ventas` - Reporte de ventas
- `GET /api/reportes/productos` - Productos más vendidos
- `GET /api/reportes/resumen-dia` - Resumen del día
- `GET /api/reportes/corte-caja` - Corte de caja
- `GET /api/reportes/bitacora` - Bitácora reciente
- `GET /api/reportes/clientes-frecuentes` - Clientes frecuentes

## 12. Funcionalidades Implementadas

### 12.1 Módulo Mesero
- Seleccionar ubicación (mesa/hamaca/cabaña)
- Abrir cuenta
- Agregar productos del menú (con imágenes)
- Separar automáticamente: bebidas → Bar, alimentos → Cocina
- Ver historial de pedidos de la cuenta
- Marcar productos como entregados
- Cerrar cuenta → genera ticket
- Regresar a seleccionar ubicación

### 12.2 Módulo Cocina/Bar
- Vista dividida: **Cocina** y **Bar**
- Ver pedidos pendientes en tiempo real (Socket.io)
- Cocina: Confirmar → En Preparación → Listo
- Bar: Marcar Bebidas como Entregadas
- Actualización automática al recibir nuevos pedidos

### 12.3 Módulo Caja
- Listar cuentas ABIERTAS y PENDIENTE_PAGO
- Ver detalle de cuenta con pedidos
- Métodos de pago:
  - **Efectivo**: Captura monto recibido, calcula cambio
  - **Tarjeta**: Proceso directo
  - **Transferencia**: Con referencia, pendiente de verificación
- Imprimir ticket con estado PAGADO y cambio
- Transferencias pendientes de verificación
- **Enviar ticket por WhatsApp**: Después de cobrar, mostrar opción para enviar ticket con datos del establecimiento, cuenta, productos, total y fecha

### 12.4 Módulo Admin
- **Ubicaciones**: CRUD completo (crear, editar, eliminar)
- **Menú**: 
  - Categorías: CRUD
  - Productos: CRUD con imagen (subida a imgBB), stock, tiempo preparación
- **Inventario**: Ver stock, productos bajo mínimo
- **Usuarios**: CRUD con roles
- **Empresa**: Configuración (nombre, dirección, teléfono)
- **Reportes**: Ventas, productos, resumen del día
- **Corte de caja**: Resumen por método de pago
- **Histórico**: Ventas por fecha, cuentas cerradas
- **Bitácora**: Registro de acciones del sistema
- **Clientes frecuentes**: Análisis de clientes
- **Búsqueda**: Filtrar productos, ubicaciones, usuarios

### 12.5 Tickets
- Ticket preliminar al cerrar cuenta (sin PAGADO)
- Ticket final al cobrar (con ✓ PAGADO y cambio)
- Incluye: logo, datos empresa, detalle de pedidos, total

### 12.6 Bitácora
Registra automáticamente:
- Crear cuenta
- Cerrar cuenta
- Crear pedido
- Actualizar estado de pedido

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
├── cuentas.js       # Gestión de cuentas + bitácora
├── pedidos.js       # Crear/actualizar pedidos + bitácora
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
Cocina.jsx       # Ver pedidos cocina/bar, cambiar estados
Caja.jsx         # Listar cuentas, procesar pagos, imprimir ticket
Admin.jsx        # CRUD completo + reportes + búsqueda
```

### 13.4 Socket.io - Rooms y Eventos
| Room | Eventos emite | Eventos escucha |
|------|---------------|-----------------|
| `kitchen` | `new-order`, `order-cancelled` | - |
| `waiter` | `order-created`, `order-updated`, `kitchen-ready`, `payment-received`, `cuenta-created` | - |
| `cashier` | `order-updated`, `cuenta-updated` | - |

### 13.5 Detección de Bebidas
El sistema detecta automáticamente si un producto es bebida buscando en el nombre de la categoría:
- bebidas, bebida, refresco, agua, jugo, café, cafe, vino, cerveza

### 13.6 Rutas Frontend (Protegidas por Rol)
| Ruta | Rol acceso |
|------|------------|
| `/login` | Público |
| `/mesero` | MESERO |
| `/cocina` | COCINA |
| `/caja` | CAJERO, ADMIN |
| `/admin` | ADMIN |

## 14. Flujo de Cierre de Cuenta

1. Mesero cierra la cuenta → estado cambia a `PENDIENTE_PAGO`
2. Se genera ticket preliminar automáticamente
3. Ubicación se mantiene OCUPADA
4. Cliente va a Caja
5. Cajero selecciona cuenta
6. Cliente elige método de pago:
   - **Efectivo**: Ingresa monto → calcula cambio → cobrar
   - **Tarjeta**: Cobrar directo
   - **Transferencia**: Ingresa referencia → pendiente verificación
7. Al cobrar → imprime ticket con ✓ PAGADO y cambio
8. Ubicación queda DISPONIBLE automáticamente

## 15. Configuración del Sistema

- Los precios de los productos **ya incluyen impuestos** (no se calcula adicional)
- La tabla `configuracion` contiene: nombre_establecimiento, direccion, telefono
- Imágenes de productos se suben a imgBB y se guarda la URL

## 16. Credenciales

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

## 17. Mejoras Pendientes

- Alertas de stock bajo (notificaciones)
- Ver cuenta en tiempo real en módulo Mesero
- Reservaciones con fecha y hora
- Resumen de ventas por usuario

---

*Documento vivo - Actualizado: 2026-04-01*
