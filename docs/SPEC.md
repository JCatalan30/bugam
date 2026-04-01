# Sistema de Gestión para Balneario con Restaurante

## 1. Descripción del Sistema

Sistema integral para gestionar pedidos y cuentas de clientes en un balneario que incluye servicio de restaurante. Permite llevar control de pedidos desde que el cliente llega hasta el cierre de cuenta.

## 2. Flujo de Usuario

### 2.1 Flujo Principal

```
RECEPCIÓN → MESERO → COCINA → CAJA → ADMIN
```

1. **Recepción**: Asignar mesa/hamaca al cliente
2. **Restaurant - Mesero**: Tomar pedidos, enviar a cocina
3. **Cocina**: Preparar pedidos, notificar cuando estén listos
4. **Caja**: Cerrar cuentas, procesar pagos
5. **Admin**: Gestión de menú, usuarios y reportes

### 2.2 Escenarios

- **Cuenta única**: Cliente usa hamaca + restaurant, todo se carga a una cuenta
- **Cuenta parcial**: Cliente puede pedir la cuenta en cualquier momento
- **Split de pago**: Varios métodos de pago para una misma cuenta

## 3. Tecnologías

- **Backend**: Node.js + Express
- **Frontend**: React
- **Base de datos**: PostgreSQL
- **Tiempo real**: Socket.io
- **Contenedores**: Docker + Docker Compose

## 4. Schema de Base de Datos

### 4.1 Tablas Principales

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

## 5. Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| ADMIN | Gestión total del sistema |
| CAJERO | Cierre de cuentas, reportes |
| MESERO | Tomar pedidos, ver cuentas |
| COCINA | Ver pedidos, cambiar estado |

## 6. Estados de Pedido

| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Esperando confirmación |
| CONFIRMADO | Enviado a cocina |
| EN_PREPARACION | Siendo preparado |
| LISTO | Listo para servir |
| ENTREGADO | Entregado al cliente |
| CANCELADO | Cancelado |

## 7. Estados de Cuenta

| Estado | Descripción |
|--------|-------------|
| ABIERTA | Cuenta activa |
| PENDIENTE_PAGO | Esperando pago |
| CERRADA | Pagada |
| CANCELADA | Cancelada |

---

## 8. Estructura del Proyecto

```
bugam2026/
├── docker-compose.yml      # Orquestación de servicios
├── init.sql               # Schema de base de datos
├── docs/
│   └── SPEC.md           # Este documento
├── bugam-backend/
│   ├── src/
│   │   ├── index.js      # Entry point + Socket.io
│   │   └── routes/       # API routes
│   ├── package.json
│   └── Dockerfile
└── bugam-frontend/
    ├── src/
    │   ├── pages/        # Vistas: Login, Mesero, Cocina, Caja, Admin
    │   ├── components/
    │   └── App.jsx
    ├── package.json
    └── Dockerfile
```

## 9. API Endpoints

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

## 10. Detalle de Implementación

### 10.1 Estructura de Archivos

#### Backend (`bugam-backend/`)
```
src/
├── index.js              # Servidor Express + Socket.io + PostgreSQL
└── routes/
    ├── auth.js           # Login con JWT y verificación de tokens
    ├── ubicaciones.js    # CRUD de mesas/hamacas/cabañas
    ├── categorias.js     # CRUD de categorías del menú
    ├── productos.js      # CRUD de productos (con filtro por categoría)
    ├── cuentas.js        # Apertura de cuentas, cerrar cuenta, vista con pedidos
    ├── pedidos.js       # Crear pedidos (bebidas/alimentos), cambiar estados, detalles
    ├── pagos.js         # Registro de pagos, métodos de pago, cierre automático de cuenta
    ├── config.js        # Configuración del sistema (impuesto, nombre)
    └── reportes.js      # Ventas, productos, resumen del día
```

#### Frontend (`bugam-frontend/`)
```
src/
├── main.jsx              # Entry point React
├── App.jsx              # Router + gestión de sesión
├── index.css            # Estilos globales (responsive, modal, etc.)
└── pages/
    ├── Login.jsx        # Login con redirección por rol
    ├── Mesero.jsx       # Abrir cuenta, tomar pedidos, imprimir ticket, cerrar cuenta
    ├── Cocina.jsx       # Ver pedidos de cocina (filtro notas=alimentos), cambiar estados
    ├── Caja.jsx         # Listar cuentas, procesar pagos
    └── Admin.jsx        # CRUD ubicaciones, menú, usuarios, empresa, reportes
```

### 10.2 Socket.io - Rooms y Eventos
| Room | Eventos emite | Eventos escucha |
|------|---------------|-----------------|
| `kitchen` | `new-order`, `order-cancelled` | - |
| `waiter` | `order-created`, `order-updated`, `kitchen-ready`, `payment-received`, `cuenta-created` | - |
| `cashier` | `order-updated` | - |

**Flujo de eventos:**
- Mesero crea pedido → emite `new-order` a cocina, `order-created` a meseros
- Cocina cambia estado → emite `order-updated` a meseros/caja, `kitchen-ready` cuando está LISTO
- Cajero recibe pago → emite `payment-received` a meseros

### 10.3 Estados de Ubicación
- `DISPONIBLE` - Libre para usar
- `OCUPADA` - Tiene cuenta activa
- `MANTENIMIENTO` - No disponible

### 10.4 Campos de Pedido
- `tipo`: PRESENCIAL o PARA_LLEVAR (para distinguir tipo de servicio)
- `notas`: "bebidas" o "alimentos" (para filtrar qué va a cocina)

### 10.5 Rutas Frontend
| Ruta | Rol acceso |
|------|------------|
| `/login` | Público |
| `/mesero` | MESERO |
| `/cocina` | COCINA |
| `/caja` | CAJERO, ADMIN |
| `/admin` | ADMIN |

## 11. Lógica de Pedidos

- El mesero selecciona productos y los separa en **bebidas** y **alimentos**
- Las bebidas se envían alobar (no van a cocina)
- Los alimentos se envían a cocina (tipo=PRESENCIAL, notas=alimentos)
- El dashboard de Cocina filtra pedidos donde `notas=alimentos`
- Los cambios de estado en cocina se transmiten en tiempo real al mesero via Socket.io

## 12. Flujo de Cierre de Cuenta

1. Mesero cierra la cuenta → estado cambia a `PENDIENTE_PAGO`
2. Mesero puede imprimir ticket con detalle de pedidos
3. Cliente va a Caja para pagar
4. Cajero procesa pago → estado cambia a `CERRADA`
5. La ubicación queda disponible automáticamente

## 13. Configuración del Sistema

- Los precios de los productos **ya incluyen impuestos** (no se calcula adicional)
- La tabla `configuracion` contiene: nombre_establecimiento, direccion, telefono, impuesto_porcentaje (no usado actualmente)

## 14. Credenciales por Defecto

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | ADMIN |
| cajero | cajero123 | CAJERO |
| mesero | mesero123 | MESERO |
| cocina | cocina123 | COCINA |

---

*Documento vivo - Actualizado: 2026-03-31*
