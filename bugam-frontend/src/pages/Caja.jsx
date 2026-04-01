import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import Swal from 'sweetalert2'

const API_URL = '/api'

export default function Caja({ user, onLogout }) {
  const [cuentas, setCuentas] = useState([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null)
  const [metodosPago, setMetodosPago] = useState([])
  const [pagosPendientes, setPagosPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTransferencia, setShowTransferencia] = useState(false)
  const [referencia, setReferencia] = useState('')
  const socketRef = useRef(null)

  useEffect(() => {
    fetchData()
    setupSocket()
    return () => { if (socketRef.current) socketRef.current.disconnect() }
  }, [])

  const setupSocket = () => {
    socketRef.current = io({ transports: ['websocket', 'polling'] })
    socketRef.current.on('connect', () => { socketRef.current.emit('join-cashier') })
    socketRef.current.on('transferencia-pendiente', () => { fetchData() })
    socketRef.current.on('order-updated', () => { fetchData() })
    socketRef.current.on('cuenta-updated', () => { fetchData() })
  }

  const fetchData = async () => {
    try {
      const [cuentasRes, metodosRes, pendientesRes] = await Promise.all([
        fetch(`${API_URL}/cuentas?estado=ABIERTA,PENDIENTE_PAGO`),
        fetch(`${API_URL}/pagos/metodos`),
        fetch(`${API_URL}/pagos/pendientes`)
      ])
      const cuentasData = await cuentasRes.json()
      console.log('Cuentas:', cuentasData)
      setCuentas(cuentasData)
      setMetodosPago(await metodosRes.json())
      setPagosPendientes(await pendientesRes.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const seleccionarCuenta = async (cuentaId) => {
    try {
      const res = await fetch(`${API_URL}/cuentas/${cuentaId}`)
      setCuentaSeleccionada(await res.json())
      setShowTransferencia(false)
      setReferencia('')
    } catch (err) { console.error(err) }
  }

  const procesarPago = async (cuentaId, monto, metodoPagoId, esTransferencia = false) => {
    try {
      const metodo = metodosPago.find(m => m.id === metodoPagoId)
      const payload = {
        cuenta_id: cuentaId,
        metodo_pago_id: metodoPagoId,
        monto: monto,
        referencia: esTransferencia ? referencia : null,
        notas: esTransferencia ? `Transferencia ${metodo?.nombre || ''}` : null
      }
      const res = await fetch(`${API_URL}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      setCuentaSeleccionada(null)
      setShowTransferencia(false)
      setReferencia('')
      fetchData()
      if (data.necesitaVerificacion) {
        Swal.fire({ icon: 'info', title: 'Pago pendiente', text: 'La transferencia está pendiente de verificación', timer: 3000 })
      } else {
        Swal.fire({ icon: 'success', title: 'Pago registrado', timer: 2000 })
      }
    } catch (err) { console.error(err) }
  }

  const confirmarPago = async (pagoId) => {
    const result = await Swal.fire({ icon: 'question', title: 'Confirmar pago', text: '¿Confirmar que se recibió el pago?', showCancelButton: true, confirmButtonText: 'Sí, confirmar', cancelButtonText: 'Cancelar' })
    if (!result.isConfirmed) return
    try {
      await fetch(`${API_URL}/pagos/${pagoId}/confirmar`, { method: 'PUT' })
      fetchData()
      Swal.fire({ icon: 'success', title: 'Pago confirmado', timer: 2000 })
    } catch (err) { console.error(err) }
  }

  if (loading) return <div className="text-center">Cargando...</div>

  return (
    <div className="app">
      <nav className="navbar">
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <img src="/logo.png" alt="Logo" style={{height: 40}} />
          <h1>Caja</h1>
        </div>
        <div className="user">
          <span>{user.nombre}</span>
          <button className="btn btn-secondary" onClick={onLogout}>Salir</button>
        </div>
      </nav>

      <div className="main-content">
        {pagosPendientes.length > 0 && (
          <div className="card mb-4" style={{border: '2px solid var(--warning)'}}>
            <h3 className="mb-2" style={{color: 'var(--warning)'}}>⚠️ Transferencias pendientes de verificación</h3>
            {pagosPendientes.map(p => (
              <div key={p.id} className="flex justify-between items-center" style={{padding: '0.5rem 0', borderBottom: '1px solid var(--border)'}}>
                <div>
                  <p className="font-bold">Cuenta #{p.cuenta_id} - {p.ubicacion_nombre}</p>
                  <p className="text-sm text-gray">Método: {p.metodo_nombre} | Referencia: {p.referencia || 'Sin referencia'} | Monto: ${p.monto}</p>
                </div>
                <button className="btn btn-warning" onClick={() => confirmarPago(p.id)}>Confirmar</button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-2">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2>Cuentas Abiertas</h2>
              <button className="btn btn-secondary" onClick={fetchData}>🔄 Actualizar</button>
            </div>
            {cuentas.length === 0 ? (
              <p className="text-gray">No hay cuentas abiertas</p>
            ) : (
              cuentas.map(cuenta => (
                <div key={cuenta.id} className="pedido-card" style={{cursor: 'pointer', border: cuentaSeleccionada?.id === cuenta.id ? '2px solid var(--primary)' : 'none'}} onClick={() => seleccionarCuenta(cuenta.id)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">Cuenta #{cuenta.id}</p>
                      <p className="text-sm text-gray">{cuenta.ubicacion_nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${cuenta.total}</p>
                      <span className={`badge ${cuenta.estado === 'ABIERTA' ? 'badge-success' : 'badge-warning'}`}>{cuenta.estado}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            {cuentaSeleccionada ? (
              <div className="card">
                <h3 className="mb-4">Cuenta #{cuentaSeleccionada.id}</h3>
                <p className="text-sm text-gray mb-4">Ubicación: {cuentaSeleccionada.ubicacion_nombre}<br />Mesero: {cuentaSeleccionada.mesero_nombre}</p>
                
                <h4 className="mb-2">Pedidos</h4>
                {cuentaSeleccionada.pedidos?.map(pedido => (
                  <div key={pedido.id} className="mb-2">
                    <p className="text-sm font-bold">Pedido #{pedido.id} - {pedido.estado}</p>
                    {pedido.detalles?.map((det, i) => (<p key={i} className="text-sm text-gray">{det.cantidad}x {det.producto_nombre} - ${det.subtotal}</p>))}
                  </div>
                ))}
                
                <hr style={{margin: '1rem 0'}} />
                <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>${cuentaSeleccionada.total}</span></div>
                <p className="text-sm text-gray mt-2">* Precios incluyen impuestos</p>
                
                {!showTransferencia ? (
                  <>
                    <h4 className="mt-4 mb-2">Pagar</h4>
                    <div className="grid grid-2">
                      {metodosPago.map(metodo => (
                        <button key={metodo.id} className="btn btn-success" onClick={() => metodo.nombre === 'TRANSFERENCIA' ? setShowTransferencia(true) : procesarPago(cuentaSeleccionada.id, cuentaSeleccionada.total, metodo.id)}>
                          {metodo.nombre === 'TRANSFERENCIA' ? '💸 Transferencia' : metodo.nombre}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-4">
                    <h4 className="mb-2">Pago por Transferencia</h4>
                    <div className="form-group">
                      <label className="label">Número de referencia</label>
                      <input className="input" value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ingrese el número de transferencia" />
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-warning" onClick={() => procesarPago(cuentaSeleccionada.id, cuentaSeleccionada.total, metodosPago.find(m => m.nombre === 'TRANSFERENCIA')?.id, true)} disabled={!referencia}>Confirmar Transferencia</button>
                      <button className="btn btn-secondary" onClick={() => setShowTransferencia(false)}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray text-center">Selecciona una cuenta para procesar el pago</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}