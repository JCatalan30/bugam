import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import Swal from 'sweetalert2'

const API_URL = '/api'

export default function Mesero({ user, onLogout }) {
  const [ubicaciones, setUbicaciones] = useState([])
  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [cuentaActual, setCuentaActual] = useState(null)
  const [pedidoActual, setPedidoActual] = useState([])
  const [pedidosCuenta, setPedidosCuenta] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    console.log('Mesero component mounted, user:', user)
    fetchData()
    
    const setupSocket = () => {
      if (socketRef.current) socketRef.current.disconnect()
      
      socketRef.current = io({
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling']
      })
      
      socketRef.current.on('connect', () => {
        console.log('Socket connected')
        socketRef.current.emit('join-waiter')
      })
      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected')
      })
      socketRef.current.on('connect_error', (err) => {
        console.log('Socket connection error:', err)
      })
      socketRef.current.on('order-updated', (pedido) => {
        console.log('Order updated:', pedido)
        if (cuentaActual) {
          cargarCuenta(cuentaActual.id)
        }
      })
      socketRef.current.on('kitchen-ready', (pedido) => {
        console.log('Kitchen ready:', pedido)
        if (cuentaActual && pedido.cuenta_id === cuentaActual.id) {
          Swal.fire({ icon: 'success', title: 'Pedido listo', text: `El pedido #${pedido.id} está listo`, timer: 3000 })
          cargarCuenta(cuentaActual.id)
        }
      })
    }
    
    setupSocket()
    
    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [user?.id, cuentaActual?.id])

  const cargarCuenta = async (cuentaId) => {
    try {
      const res = await fetch(`${API_URL}/cuentas/${cuentaId}`)
      const data = await res.json()
      setCuentaActual(data)
      setPedidosCuenta(data.pedidos || [])
    } catch (err) {
      console.error(err)
    }
  }

  const marcarEntregado = async (detalleId, estadoActual) => {
    if (estadoActual === 'ENTREGADO') return
    try {
      await fetch(`${API_URL}/pedidos/detalle/${detalleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'ENTREGADO' })
      })
      cargarCuenta(cuentaActual.id)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchData = async () => {
    console.log('Fetching data...')
    try {
      const ubicRes = await fetch(`${API_URL}/ubicaciones`)
      console.log('ubicRes status:', ubicRes.status)
      if (!ubicRes.ok) throw new Error(`API error: ${ubicRes.status}`)
      
      const ubicData = await ubicRes.json()
      
      const catRes = await fetch(`${API_URL}/categorias`)
      const catData = await catRes.json()
      
      const prodRes = await fetch(`${API_URL}/productos`)
      const prodResData = await prodRes.json()
      
      setUbicaciones(ubicData.filter(u => u.estado !== 'MANTENIMIENTO'))
      setCategorias(catData)
      setProductos(prodResData)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const abrirCuenta = async (ubicacionId) => {
    try {
      const res = await fetch(`${API_URL}/cuentas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ubicacion_id: ubicacionId,
          mesero_id: user.id
        })
      })
      const cuenta = await res.json()
      setCuentaActual(cuenta)
      setPedidoActual([])
      setPedidosCuenta([])
    } catch (err) {
      console.error(err)
    }
  }

  const agregarProducto = (producto) => {
    const esBebida = producto.categoria_id === 1
    const existente = pedidoActual.find(p => p.producto_id === producto.id)
    if (existente) {
      setPedidoActual(pedidoActual.map(p => 
        p.producto_id === producto.id 
          ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * p.precio_unitario }
          : p
      ))
    } else {
      setPedidoActual([...pedidoActual, {
        producto_id: producto.id,
        producto_nombre: producto.nombre,
        cantidad: 1,
        precio_unitario: producto.precio,
        subtotal: producto.precio,
        es_bebida: esBebida
      }])
    }
  }

  const quitarProducto = (productoId) => {
    setPedidoActual(pedidoActual.map(p => {
      if (p.producto_id === productoId) {
        if (p.cantidad > 1) {
          return { ...p, cantidad: p.cantidad - 1, subtotal: (p.cantidad - 1) * p.precio_unitario }
        }
        return null
      }
      return p
    }).filter(Boolean))
  }

  const getTotal = () => Number(pedidoActual.reduce((sum, p) => sum + Number(p.subtotal), 0))

  const getBebidas = () => pedidoActual.filter(p => p.es_bebida)
  const getAlimentos = () => pedidoActual.filter(p => !p.es_bebida)

  const enviarAPreparacion = async (tipo) => {
    const items = tipo === 'bebidas' ? getBebidas() : getAlimentos()
    if (!cuentaActual || items.length === 0) return

    try {
      await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuenta_id: cuentaActual.id,
          mesero_id: user.id,
          tipo: 'PRESENCIAL',
          notas: tipo
        })
      })
      setPedidoActual(pedidoActual.filter(p => tipo === 'bebidas' ? !p.es_bebida : p.es_bebida))
      const cuentaRes = await fetch(`${API_URL}/cuentas/${cuentaActual.id}`)
      const data = await cuentaRes.json()
      setPedidosCuenta(data.pedidos || [])
      Swal.fire({ icon: 'success', title: 'Enviado', text: tipo === 'bebidas' ? 'Bebidas enviadas alobar' : 'Pedido enviado a cocina', timer: 2000 })
    } catch (err) {
      console.error(err)
    }
  }

  const cerrarCuenta = async () => {
    if (!cuentaActual) return
    const result = await Swal.fire({ icon: 'question', title: 'Cerrar cuenta', text: '¿Confirmar cierre de cuenta?', showCancelButton: true, confirmButtonText: 'Sí, cerrar', cancelButtonText: 'Cancelar' })
    if (!result.isConfirmed) return

    try {
      await fetch(`${API_URL}/cuentas/${cuentaActual.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'PENDIENTE_PAGO' })
      })
      setCuentaActual(null)
      setPedidoActual([])
      setPedidosCuenta([])
      Swal.fire({ icon: 'success', title: 'Cuenta cerrada', text: 'Diríjase a Caja para procesar el pago', timer: 3000 })
    } catch (err) {
      console.error(err)
    }
  }

  const imprimirTicket = async () => {
    if (!cuentaActual) return
    
    try {
      const [cuentaRes, configRes] = await Promise.all([
        fetch(`${API_URL}/cuentas/${cuentaActual.id}`),
        fetch(`${API_URL}/config`)
      ])
      const cuenta = await cuentaRes.json()
      const configs = await configRes.json()
      const configObj = configs.reduce((acc, c) => ({ ...acc, [c.clave]: c.valor }), {})
      
      const nombreEstablecimiento = configObj.nombre_establecimiento || 'Balneario Bugambilias'
      const direccion = configObj.direccion || 'Av. Principal s/n'
      const telefono = configObj.telefono || 'Sin teléfono'

      const fecha = new Date().toLocaleString('es-MX', { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit' 
      })

      const contenido = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket - ${nombreEstablecimiento}</title>
  <style>
    body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
    .header { text-align: center; margin-bottom: 10px; }
    .logo { width: 80px; height: auto; margin-bottom: 5px; }
    h2 { margin: 5px 0; font-size: 14px; }
    .info { font-size: 10px; color: #666; }
    .divider { border-top: 1px dashed #333; margin: 8px 0; }
    .total { font-weight: bold; font-size: 14px; }
    .gracias { text-align: center; margin-top: 10px; font-style: italic; }
    @media print { body { width: auto; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="/logo.png" alt="Logo" class="logo" />
    <h2>${nombreEstablecimiento}</h2>
    <div class="info">${direccion}</div>
    <div class="info">Tel: ${telefono}</div>
  </div>
  <div class="divider"></div>
  <div><strong>Fecha:</strong> ${fecha}</div>
  <div><strong>Cuenta:</strong> #${cuenta.id}</div>
  <div><strong>Mesa/Hamaca:</strong> ${cuenta.ubicacion_nombre || 'N/A'}</div>
  <div><strong>Mesero:</strong> ${cuenta.mesero_nombre || 'N/A'}</div>
  <div class="divider"></div>
  <div><strong>Pedidos:</strong></div>
  ${cuenta.pedidos?.map(p => `
  <div style="margin-top: 5px;">Pedido #${p.id} - ${p.estado}</div>
  ${p.detalles?.map(d => `<div>  ${d.cantidad} x ${d.producto_nombre}......$${d.subtotal.toFixed(2)}</div>`).join('')}
  `).join('')}
  <div class="divider"></div>
  <div class="total" style="display: flex; justify-content: space-between;"><span>TOTAL:</span><span>$${Number(cuenta.total || 0).toFixed(2)}</span></div>
  <div style="font-size: 10px; color: #666; text-align: center;">* Precios incluyen impuestos</div>
  <div class="divider"></div>
  <div class="gracias">Gracias por su visita!</div>
  <div class="gracias" style="font-size: 10px;">Vuelva pronto</div>
</body>
</html>`

      const ventana = window.open('', '_blank', 'width=320,height=600')
      ventana.document.write(contenido)
      ventana.document.close()
      ventana.print()
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusBadge = (estado) => {
    const styles = {
      'PENDIENTE': 'badge-warning',
      'CONFIRMADO': 'badge-info',
      'EN_PREPARACION': 'badge-warning',
      'LISTO': 'badge-success',
      'ENTREGADO': 'badge-success'
    }
    return styles[estado] || 'badge-info'
  }

  const seleccionarUbicacion = async (ubi) => {
    if (ubi.estado === 'OCUPADA') {
      try {
        const res = await fetch(`${API_URL}/cuentas?ubicacion_id=${ubi.id}&estado=ABIERTA`)
        const cuentas = await res.json()
        if (cuentas.length > 0) {
          cargarCuenta(cuentas[0].id)
          return
        }
      } catch (err) {
        console.error(err)
      }
    }
    abrirCuenta(ubi.id)
  }

  if (loading) return <div className="text-center">Cargando...</div>
  if (error) return <div className="text-center" style={{color: 'red', padding: 20}}>Error: {error}</div>
  if (!user) return <div className="text-center">No autorizado</div>

  return (
    <div className="app">
      <nav className="navbar">
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <img src="/logo.png" alt="Logo" style={{height: 40}} />
          <h1>Mesero</h1>
        </div>
        <div className="user">
          <span>{user.nombre}</span>
          <button className="btn btn-secondary" onClick={onLogout}>Salir</button>
        </div>
      </nav>

      <div className="main-content">
        {!cuentaActual ? (
          <div>
            <h2 className="mb-4">Seleccionar Ubicación</h2>
            <div className="grid grid-3">
              {ubicaciones.map(ubi => (
                <div key={ubi.id} className="card" style={{cursor: 'pointer'}} onClick={() => seleccionarUbicacion(ubi)}>
                  <h3>{ubi.nombre}</h3>
                  <p className="text-gray text-sm">{ubi.tipo} - Capacidad: {ubi.capacidad}</p>
                  <span className={`badge ${ubi.estado === 'DISPONIBLE' ? 'badge-success' : 'badge-warning'}`}>
                    {ubi.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-2">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2>Cuenta #{cuentaActual.id} - {cuentaActual.ubicacion_nombre}</h2>
                <div className="flex gap-2">
                  <button className="btn btn-info" onClick={imprimirTicket}>Imprimir Ticket</button>
                  <button className="btn btn-warning" onClick={cerrarCuenta}>Cerrar Cuenta</button>
                  <button className="btn btn-danger" onClick={() => setCuentaActual(null)}>Volver</button>
                </div>
              </div>
              
              <h3 className="mb-2">Menú</h3>
              {categorias.map(cat => (
                <div key={cat.id} className="mb-4">
                  <h4 className="text-gray mb-2">{cat.nombre}</h4>
                  <div className="menu-grid">
                    {productos.filter(p => p.categoria_id === cat.id).map(prod => (
                      <div key={prod.id} className="menu-item" onClick={() => agregarProducto(prod)}>
                        {prod.imagen && <img src={prod.imagen} alt={prod.nombre} style={{width: '100%', height: 80, objectFit: 'cover', borderRadius: 4, marginBottom: 8}} />}
                        <p className="font-bold">{prod.nombre}</p>
                        <p className="text-sm text-gray">${prod.precio}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="card mb-4">
                <h3 className="mb-4">Pedido Actual</h3>
                {pedidoActual.length === 0 ? (
                  <p className="text-gray">Sin productos - Toca los productos del menú para agregar</p>
                ) : (
                  <div>
                    {getBebidas().length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm text-gray mb-2">🥤 Bebidas (Refri/Bar)</h4>
                        {getBebidas().map((p, i) => (
                          <div key={i} className="flex justify-between items-center mb-2">
                            <div>
                              <button className="btn btn-secondary" style={{padding: '2px 8px', marginRight: 8}} onClick={() => quitarProducto(p.producto_id)}>-</button>
                              <span>{p.cantidad}x {p.producto_nombre}</span>
                            </div>
                            <span>${p.subtotal}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {getAlimentos().length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm text-gray mb-2">🍽️ Cocina</h4>
                        {getAlimentos().map((p, i) => (
                          <div key={i} className="flex justify-between items-center mb-2">
                            <div>
                              <button className="btn btn-secondary" style={{padding: '2px 8px', marginRight: 8}} onClick={() => quitarProducto(p.producto_id)}>-</button>
                              <span>{p.cantidad}x {p.producto_nombre}</span>
                            </div>
                            <span>${p.subtotal}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <hr style={{margin: '1rem 0'}} />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>${getTotal().toFixed(2)}</span>
                    </div>
                    <div className="grid grid-2 gap-2 mt-4">
                      <button 
                        className="btn btn-primary"
                        onClick={() => enviarAPreparacion('bebidas')}
                        disabled={getBebidas().length === 0}
                      >
                        Enviar Bebidas
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={() => enviarAPreparacion('alimentos')}
                        disabled={getAlimentos().length === 0}
                      >
                        Enviar a Cocina
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="card">
                <h3 className="mb-4">Historial de Pedidos</h3>
                {pedidosCuenta.length === 0 ? (
                  <p className="text-gray">No hay pedidos</p>
                ) : (
                  <div>
                    {pedidosCuenta.map(pedido => (
                      <div key={pedido.id} className="mb-4" style={{borderBottom: '1px solid var(--border)', paddingBottom: '1rem'}}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold">Pedido #{pedido.id}</span>
                          <span className={`badge ${getStatusBadge(pedido.estado)}`}>{pedido.estado}</span>
                        </div>
                        <div className="grid grid-2 gap-2">
                          <div>
                            <p className="text-sm text-gray">Pendiente/En preparación:</p>
                            {pedido.detalles?.filter(d => !['ENTREGADO', 'CANCELADO'].includes(d.estado)).map((det, i) => (
                              <div key={i} className="flex justify-between items-center mb-1">
                                <p key={i} className="text-sm">• {det.cantidad}x {det.producto_nombre}</p>
                                <button className="btn btn-success" style={{padding: '2px 6px', fontSize: 10}} onClick={() => marcarEntregado(det.id, det.estado)}>
                                  ✓ Entregar
                                </button>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="text-sm text-gray">Entregado:</p>
                            {pedido.detalles?.filter(d => d.estado === 'ENTREGADO').map((det, i) => (
                              <p key={i} className="text-sm" style={{color: 'var(--success)'}}>✓ {det.cantidad}x {det.producto_nombre}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
