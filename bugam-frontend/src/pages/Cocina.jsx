import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const API_URL = '/api'

export default function Cocina({ user, onLogout }) {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const socketRef = useRef(null)

  useEffect(() => {
    fetchPedidos()
    
    const setupSocket = () => {
      if (socketRef.current) socketRef.current.disconnect()
      
      socketRef.current = io({
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling']
      })
      
      socketRef.current.on('connect', () => {
        console.log('Kitchen socket connected')
        socketRef.current.emit('join-kitchen')
      })
      socketRef.current.on('new-order', (pedido) => {
        console.log('New order received:', pedido)
        fetchPedidos()
      })
      socketRef.current.on('order-cancelled', () => {
        fetchPedidos()
      })
    }
    
    setupSocket()
    
    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [])

  const fetchPedidos = async () => {
    try {
      const res = await fetch(`${API_URL}/pedidos?estado=PENDIENTE,CONFIRMADO,EN_PREPARACION&notas=alimentos`)
      const data = await res.json()
      
      const pedidosConDetalles = await Promise.all(data.map(async (pedido) => {
        const cuentaRes = await fetch(`${API_URL}/cuentas/${pedido.cuenta_id}`)
        const cuentaData = await cuentaRes.json()
        const pedidoData = cuentaData.pedidos?.find(p => p.id === pedido.id)
        return pedidoData || pedido
      }))
      
      setPedidos(pedidosConDetalles)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const actualizarEstado = async (pedidoId, nuevoEstado) => {
    try {
      await fetch(`${API_URL}/pedidos/${pedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      })
      fetchPedidos()
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusBadge = (estado) => {
    const styles = {
      'PENDIENTE': 'badge-warning',
      'CONFIRMADO': 'badge-info',
      'EN_PREPARACION': 'badge-warning',
      'LISTO': 'badge-success'
    }
    return styles[estado] || 'badge-info'
  }

  if (loading) return <div className="text-center">Cargando...</div>

  return (
    <div className="app">
      <nav className="navbar">
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <img src="/logo.png" alt="Logo" style={{height: 40}} />
          <h1>Cocina</h1>
        </div>
        <div className="user">
          <span>{user.nombre}</span>
          <button className="btn btn-secondary" onClick={onLogout}>Salir</button>
        </div>
      </nav>

      <div className="main-content">
        <h2 className="mb-4">Pedidos</h2>
        
        {pedidos.length === 0 ? (
          <p className="text-gray text-center">No hay pedidos pendientes</p>
        ) : (
          <div className="grid grid-3">
            {pedidos.map(pedido => (
              <div key={pedido.id} className="card">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">Pedido #{pedido.id}</span>
                  <span className={`badge ${getStatusBadge(pedido.estado)}`}>{pedido.estado}</span>
                </div>
                <p className="text-sm text-gray mb-2">{pedido.ubicacion_nombre}</p>
                <p className="text-sm mb-2">Mesero: {pedido.mesero_nombre}</p>
                
                <div className="mb-4">
                  {pedido.detalles?.map((det, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{det.cantidad}x {det.producto_nombre}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  {pedido.estado === 'PENDIENTE' && (
                    <button className="btn btn-primary" onClick={() => actualizarEstado(pedido.id, 'EN_PREPARACION')}>
                      Confirmar
                    </button>
                  )}
                  {pedido.estado === 'EN_PREPARACION' && (
                    <button className="btn btn-success" onClick={() => actualizarEstado(pedido.id, 'LISTO')}>
                      Listo
                    </button>
                  )}
                  {pedido.estado === 'LISTO' && (
                    <button className="btn btn-secondary" onClick={() => actualizarEstado(pedido.id, 'ENTREGADO')}>
                      Entregado
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
