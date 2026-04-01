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
- `reservaciones` - Reservaciones de mesas/hamacas
- `bitacora_login` - Logs de intentos de login

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

### 9.4 Estados de Reservación

| Estado | Descripción |
|--------|-------------|
| CONFIRMADA | Reservación activa |
| COMPLETADA | Cliente usó la reservación |
| CANCELADA | Cancelada por el cliente |

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
- `GET /api/reportes/ventas-usuario` - Ventas por usuario (mesero/cajero)

### Reservaciones
- `GET /api/reservaciones` - Listar reservaciones
- `POST /api/reservaciones` - Crear reservación
- `PUT /api/reservaciones/:id` - Actualizar reservación/estado
- `DELETE /api/reservaciones/:id` - Cancelar reservación

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

El módulo Admin es el panel de control completo del sistema. Solo accesible para usuarios con rol ADMIN.

#### 12.4.1 Ubicaciones
Gestión de espacios físicos del establecimiento.
- **Crear**: Nombre, tipo (MESA/HAMACA/CABANA), capacidad
- **Editar**: Modificar datos existentes
- **Eliminar**: Quitar ubicaciones
- **Estados**: DISPONIBLE, OCUPADA, MANTENIMIENTO
- **Búsqueda**: Filtrar por nombre

#### 12.4.2 Menú
Gestión de categorías y productos del restaurante.
- **Categorías**: Crear, editar, ordenar menús
- **Productos**: 
  - Nombre, descripción, precio
  - Imagen (subida a imgBB)
  - Categoría asignada
  - Stock y stock mínimo
  - Tiempo de preparación (minutos)
- **Búsqueda**: Filtrar productos por nombre

#### 12.4.3 Inventario
Control de stock de productos.
- Lista todos los productos con stock actual
- Indicador visual: OK (verde) / Bajo (rojo)
- Productos ordenados: primero los que están bajo stock
- **Alertas**: Notificación al cargar cuando hay productos bajo mínimo
- Botón "Ver Inventario" desde la alerta
- **Búsqueda**: Filtrar por nombre

#### 12.4.4 Usuarios
Gestión de empleados del sistema.
- Crear usuario: username, password, nombre, rol
- Editar: modificar datos, cambiar contraseña
- Activar/Desactivar usuarios
- Roles disponibles: ADMIN, CAJERO, MESERO, COCINA
- **Búsqueda**: Filtrar por username o nombre

#### 12.4.5 Empresa
Configuración general del establecimiento.
- Nombre del negocio
- Dirección
- Teléfono
- Estos datos aparecen en los tickets

#### 12.4.6 Reportes
Análisis de ventas y operaciones.
- **Resumen del día**: Cuentas, pedidos, ventas totales
- **Productos más vendidos**: Cantidad y total por producto
- Filtros por rango de fechas
- Exportar a PDF

#### 12.4.7 Corte de Caja
Resumen de ventas del día.
- Total de cuentas cerradas
- Total de ventas
- Desglose por método de pago (efectivo, tarjeta, transferencia)
- Top 5 productos vendidos

#### 12.4.8 Histórico
Historial de operaciones pasadas.
- **Ventas por fecha**: Lista de días con pedidos y totales
- **Cuentas cerradas**: Últimas 20 cuentas pagadas
- Filtros por rango de fechas

#### 12.4.9 Bitácora
Registro de acciones en el sistema.
- Todas las operaciones registradas:
  - Crear cuenta
  - Cerrar cuenta
  - Crear pedido
  - Actualizar pedido
- Muestra: fecha, usuario, acción, entidad
- Últimas 50 entradas

#### 12.4.10 Clientes Frecuentes
Análisis de clientes recurrentes.
- Lista de clientes ordenados por gasto
- Muestra: nombre, visitas, gasto total

#### 12.4.11 Ventas por Usuario
Desempeño de empleados.
- Ventas agrupadas por mesero/cajero
- Muestra: usuario, cuentas atendidas, total ventas, pedidos
- Filtros por rango de fechas
- Totales generales

#### 12.4.12 Reservaciones
Gestión de reservas anticipadas.
- **Campos**: cliente, teléfono, ubicación, fecha, hora, número de personas, notas
- **Estados**: CONFIRMADA, COMPLETADA, CANCELADA
- Crear, editar, cancelar reservaciones
- **Búsqueda**: Filtrar por cliente

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

### 12.7 Reservaciones
- Crear reservaciones con fecha, hora, número de personas
- Asignar ubicación (mesa/hamaca/cabaña)
- Estados: CONFIRMADA, COMPLETADA, CANCELADA
- Lista de reservaciones con búsqueda
- Editar/cancelar reservaciones existentes

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

## 17. Funcionalidades Completas

Todas las funcionalidades planificadas han sido implementadas:

✅ Gestión de ubicaciones (mesas, hamacas, cabañas)
✅ Menú con imágenes (subida a imgBB)
✅ Inventario con control de stock
✅ Alertas de stock bajo
✅ Módulo Mesero con separación bebidas/alimentos
✅ Módulo Cocina/Bar con tiempo real (Socket.io)
✅ Módulo Caja con múltiples métodos de pago
✅ Efectivo con cálculo de cambio
✅ Transferencias con verificación
✅ Tickets impresos (preliminar y final)
✅ Envío de ticket por WhatsApp
✅ Reservaciones con fecha y hora
✅ Reportes: ventas, productos, corte caja, clientes
✅ Reporte de ventas por usuario
✅ Bitácora del sistema
✅ Búsqueda en Admin
✅ Tiempo real: Mesero ve actualizaciones sin recargar

---

## 18. Seguridad

### 18.1 Rate Limiting
- **Login**: Máximo 5 intentos por IP en 15 minutos
- Bloqueo de 15 minutos después de 5 intentos fallidos
- Retorna error 429 cuando está bloqueado

### 18.2 Headers de Seguridad
- **Helmet.js** integrado en Express
- CSP, XSS Protection, Clickjacking protection
- Hide X-Powered-By header

### 18.3 Validación de Inputs
- Sanitización de strings (trim, evitar HTML/JS injection)
- Validación de tipos de datos
- Validación de longitud de campos
- Validación de rangos (precios positivos, stock >= 0)
- Errores 400 con mensajes claros

### 18.4 Logs de Seguridad
- **bitacora_login**: Registro de intentos de login
  - IP del cliente
  - Username intentado
  - Resultado (éxito/fallido)
  - Timestamp

### 18.5 Recomendaciones Adicionales
- Cambiar contraseña de admin periódicamente
- Usar HTTPS (ya configurado en Render)
- No exponer DATABASE_URL públicamente

---

## 20. Despliegue

### Actualizar Base de Datos en Producción

Al agregar nuevas tablas, ejecutar en la base de datos de Render:

```sql
-- Reservaciones
CREATE TABLE reservaciones (
    id SERIAL PRIMARY KEY,
    ubicacion_id INTEGER REFERENCES ubicaciones(id),
    cliente_nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    fecha_reserva DATE NOT NULL,
    hora_reserva TIME NOT NULL,
    num_personas INTEGER DEFAULT 1,
    estado VARCHAR(20) DEFAULT 'CONFIRMADA',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bitácora de Login
CREATE TABLE bitacora_login (
    id SERIAL PRIMARY KEY,
    ip VARCHAR(45),
    username VARCHAR(100),
    resultado VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

*Documento vivo - Actualizado: 2026-04-01*
*Última actualización: Módulo Admin documentado*
