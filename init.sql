-- Sistema de Gestión para Balneario con Restaurante
-- PostgreSQL Schema

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol_id INTEGER REFERENCES roles(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ubicaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('MESA', 'HAMACA', 'CABANA')) NOT NULL,
    capacidad INTEGER DEFAULT 1,
    estado VARCHAR(20) CHECK (estado IN ('DISPONIBLE', 'OCUPADA', 'MANTENIMIENTO')) DEFAULT 'DISPONIBLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id),
    imagen VARCHAR(500),
    disponible BOOLEAN DEFAULT TRUE,
    tiempo_preparacion INTEGER DEFAULT 15,
    stock INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cuentas (
    id SERIAL PRIMARY KEY,
    ubicacion_id INTEGER REFERENCES ubicaciones(id),
    mesero_id INTEGER REFERENCES usuarios(id),
    estado VARCHAR(20) CHECK (estado IN ('ABIERTA', 'PENDIENTE_PAGO', 'CERRADA', 'CANCELADA')) DEFAULT 'ABIERTA',
    cliente_nombre VARCHAR(100),
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    subtotal DECIMAL(10,2) DEFAULT 0,
    impuestos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    notas TEXT
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cuenta_id INTEGER REFERENCES cuentas(id) ON DELETE CASCADE,
    mesero_id INTEGER REFERENCES usuarios(id),
    estado VARCHAR(20) CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO')) DEFAULT 'PENDIENTE',
    tipo VARCHAR(20) CHECK (tipo IN ('PRESENCIAL', 'PARA_LLEVAR')) DEFAULT 'PRESENCIAL',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalles_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    notas TEXT,
    estado VARCHAR(20) CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'CANCELADO')) DEFAULT 'PENDIENTE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE metodos_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    cuenta_id INTEGER REFERENCES cuentas(id),
    metodo_pago_id INTEGER REFERENCES metodos_pago(id),
    monto DECIMAL(10,2) NOT NULL,
    referencia VARCHAR(100),
    notas TEXT,
    estado VARCHAR(20) CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'CANCELADO')) DEFAULT 'CONFIRMADO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE configuracion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bitacora (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(50),
    entidad_id INTEGER,
    detalles JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales
INSERT INTO roles (nombre, descripcion) VALUES 
    ('ADMIN', 'Administrador del sistema'),
    ('CAJERO', 'Cajero del establecimiento'),
    ('MESERO', 'Mesero de mesón/restaurant'),
    ('COCINA', 'Personal de cocina');

INSERT INTO metodos_pago (nombre) VALUES 
    ('EFECTIVO'), 
    ('TARJETA_CREDITO'), 
    ('TARJETA_DEBITO'), 
    ('TRANSFERENCIA');

INSERT INTO ubicaciones (nombre, tipo, capacidad) VALUES 
    ('Mesa 1', 'MESA', 4),
    ('Mesa 2', 'MESA', 4),
    ('Mesa 3', 'MESA', 6),
    ('Hamaca 1', 'HAMACA', 2),
    ('Hamaca 2', 'HAMACA', 2),
    ('Hamaca 3', 'HAMACA', 2);

INSERT INTO categorias (nombre, descripcion, orden) VALUES 
    ('Bebidas', 'Bebidas frías y calientes', 1),
    ('Comidas', 'Platos principales', 2),
    ('Postres', 'Postres y dulces', 3),
    ('Snacks', 'Botanas y aperitivos', 4);

INSERT INTO configuracion (clave, valor, descripcion) VALUES 
    ('impuesto_porcentaje', '16', 'Porcentaje de impuesto'),
    ('nombre_establecimiento', 'Balneario Bugambilias', 'Nombre del establecimiento'),
    ('direccion', 'Av. Principal s/n', 'Dirección del establecimiento'),
    ('telefono', '555-123-4567', 'Teléfono de contacto');

-- Usuario admin: admin / admin123
INSERT INTO usuarios (username, password_hash, nombre, rol_id) VALUES 
    ('admin', '$2b$10$EpRU3MohHuyG83UvEHEvceZCswk8QKFnlPA3jGl6vVu/XF1iPLTDi', 'Administrador', 1);

-- Usuario cajero: cajero / cajero123
INSERT INTO usuarios (username, password_hash, nombre, rol_id) VALUES 
    ('cajero', '$2a$10$9hpUHD8jEzTMIS7M0acJfOBM5YBYmLi6HUuQur3y15lbl8Y/2BUde', 'Cajero', 2);

-- Usuario mesero: mesero / mesero123
INSERT INTO usuarios (username, password_hash, nombre, rol_id) VALUES 
    ('mesero', '$2a$10$jDSuyyhKImeqV9RUoezSJ.39kwN76HX748aGp/FxpOi97DNBwV08O', 'Mesero', 3);

-- Usuario cocina: cocina / cocina123
INSERT INTO usuarios (username, password_hash, nombre, rol_id) VALUES 
    ('cocina', '$2a$10$EyYE9qZP3oOKhYK8d9EVWOHWalg6oOZqRlPlSQkLC7gg8hzSUWHm.', 'Cocinero', 4);
