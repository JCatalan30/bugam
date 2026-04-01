import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

const API_URL = '/api'

export default function Admin({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('ubicaciones')
  const [ubicaciones, setUbicaciones] = useState([])
  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [inventario, setInventario] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [config, setConfig] = useState({})
  const [reportes, setReportes] = useState(null)
  const [historico, setHistorico] = useState({ cuentas: [], reportes: [] })
  const [corteCaja, setCorteCaja] = useState(null)
  const [bitacora, setBitacora] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState(null)
  const [filtros, setFiltros] = useState({ fecha_inicio: '', fecha_fin: '' })
  const [busqueda, setBusqueda] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [stockAlerts, setStockAlerts] = useState([])

  useEffect(() => { setBusqueda('') }, [activeTab])

  useEffect(() => {
    verificarStockBajo()
  }, [])

  useEffect(() => {
    if (activeTab === 'inventario') {
      verificarStockBajo()
    }
  }, [activeTab])

  const verificarStockBajo = async () => {
    try {
      const res = await fetch(`${API_URL}/productos/stock-bajo`)
      const data = await res.json()
      setStockAlerts(data)
      if (data.length > 0) {
        const productosList = data.map(p => `${p.nombre}: ${p.stock}/${p.stock_minimo}`).join('\n')
        Swal.fire({
          icon: 'warning',
          title: `⚠️ ${data.length} producto(s) con stock bajo`,
          html: `<pre style="text-align: left; font-size: 12px;">${productosList}</pre>`,
          confirmButtonText: 'Ver Inventario',
          cancelButtonText: 'Cerrar'
        }).then((result) => {
          if (result.isConfirmed) {
            setActiveTab('inventario')
          }
        })
      }
    } catch (err) {
      console.error('Error verificando stock:', err)
    }
  }

  useEffect(() => { fetchData() }, [activeTab, filtros])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'ubicaciones') {
        const res = await fetch(`${API_URL}/ubicaciones`)
        setUbicaciones(await res.json())
      } else if (activeTab === 'menu') {
        const [catRes, prodRes] = await Promise.all([
          fetch(`${API_URL}/categorias`),
          fetch(`${API_URL}/productos`)
        ])
        setCategorias(await catRes.json())
        setProductos(await prodRes.json())
      } else if (activeTab === 'inventario') {
        const res = await fetch(`${API_URL}/productos/inventario`)
        setInventario(await res.json())
      } else if (activeTab === 'usuarios') {
        const [usrRes, rolRes] = await Promise.all([
          fetch(`${API_URL}/usuarios`),
          fetch(`${API_URL}/roles`)
        ])
        setUsuarios(await usrRes.json())
        setRoles(await rolRes.json())
      } else if (activeTab === 'empresa') {
        const res = await fetch(`${API_URL}/config`)
        const configs = await res.json()
        const configObj = configs.reduce((acc, c) => ({ ...acc, [c.clave]: c.valor }), {})
        setConfig(configObj)
      } else if (activeTab === 'reportes') {
        const [resumenRes, productosRes] = await Promise.all([
          fetch(`${API_URL}/reportes/resumen-dia`),
          fetch(`${API_URL}/reportes/productos?fecha_inicio=${filtros.fecha_inicio || ''}&fecha_fin=${filtros.fecha_fin || ''}`)
        ])
        setReportes({ resumen: await resumenRes.json(), productos: await productosRes.json() })
      } else if (activeTab === 'historico') {
        const [cuentasRes, ventasRes] = await Promise.all([
          fetch(`${API_URL}/cuentas?estado=CERRADA`),
          fetch(`${API_URL}/reportes/ventas?fecha_inicio=${filtros.fecha_inicio || ''}&fecha_fin=${filtros.fecha_fin || ''}`)
        ])
        setHistorico({ cuentas: await cuentasRes.json(), reportes: await ventasRes.json() })
      } else if (activeTab === 'corte') {
        const res = await fetch(`${API_URL}/reportes/corte-caja?fecha=${new Date().toISOString().split('T')[0]}`)
        setCorteCaja(await res.json())
      } else if (activeTab === 'bitacora') {
        const res = await fetch(`${API_URL}/reportes/bitacora?limit=50`)
        setBitacora(await res.json())
      } else if (activeTab === 'clientes') {
        const res = await fetch(`${API_URL}/reportes/clientes-frecuentes`)
        setClientes(await res.json())
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const saveUbicacion = async (data) => {
    try {
      const method = data.id ? 'PUT' : 'POST'
      const url = data.id ? `${API_URL}/ubicaciones/${data.id}` : `${API_URL}/ubicaciones`
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      setEditItem(null)
      fetchData()
      Swal.fire({ icon: 'success', title: 'Guardado', timer: 2000 })
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error' }) }
  }

  const deleteUbicacion = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar ubicación?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (result.isConfirmed) {
      try {
        await fetch(`${API_URL}/ubicaciones/${id}`, { method: 'DELETE' })
        fetchData()
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 2000 })
      } catch (err) { Swal.fire({ icon: 'error', title: 'Error al eliminar' }) }
    }
  }

  const saveCategoria = async (data) => {
    try {
      const method = data.id ? 'PUT' : 'POST'
      const url = data.id ? `${API_URL}/categorias/${data.id}` : `${API_URL}/categorias`
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      setEditItem(null)
      fetchData()
      Swal.fire({ icon: 'success', title: 'Guardado', timer: 2000 })
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error' }) }
  }

  const saveProducto = async (data) => {
    try {
      const method = data.id ? 'PUT' : 'POST'
      const url = data.id ? `${API_URL}/productos/${data.id}` : `${API_URL}/productos`
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      setEditItem(null)
      fetchData()
      Swal.fire({ icon: 'success', title: 'Guardado', timer: 2000 })
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error' }) }
  }

  const saveUsuario = async (data) => {
    try {
      const method = data.id ? 'PUT' : 'POST'
      const url = data.id ? `${API_URL}/usuarios/${data.id}` : `${API_URL}/usuarios`
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      setEditItem(null)
      fetchData()
      Swal.fire({ icon: 'success', title: 'Guardado', timer: 2000 })
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error' }) }
  }

  const saveConfig = async () => {
    try {
      for (const [clave, valor] of Object.entries(config)) {
        await fetch(`${API_URL}/config`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clave, valor }) })
      }
      Swal.fire({ icon: 'success', title: 'Guardado', timer: 2000 })
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error' }) }
  }

  const filtrar = (lista) => {
    if (!busqueda) return lista
    const lower = busqueda.toLowerCase()
    return lista.filter(item => 
      Object.values(item).some(v => 
        v && String(v).toLowerCase().includes(lower)
      )
    )
  }

  const uploadImage = async (file) => {
    if (!file) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('https://api.imgbb.com/1/upload?key=50b033ebfd2dba43bf1aeb1c28678394', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setEditItem({ ...editItem, imagen: data.data.url })
        Swal.fire({ icon: 'success', title: 'Imagen subida', timer: 1500 })
      } else {
        Swal.fire({ icon: 'error', title: 'Error al subir imagen' })
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error al subir imagen' })
    }
    setUploadingImage(false)
  }

  const generarReportePDF = () => {
    if (!reportes) return
    const printContent = `
      <html><head><title>Reporte de Ventas</title>
      <style>body{font-family:Arial;padding:20px}h2{color:#2563eb}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#2563eb;color:white}</style>
      </head><body>
      <h2>Reporte de Ventas - ${new Date().toLocaleDateString()}</h2>
      <h3>Resumen del Día</h3>
      <p>Cuentas: ${reportes.resumen?.cuentas?.total_cuentas || 0}</p>
      <p>Pedidos: ${reportes.resumen?.pedidos?.total_pedidos || 0}</p>
      <p>Ventas: $${reportes.resumen?.cuentas?.ventas || 0}</p>
      <h3>Productos Más Vendidos</h3>
      <table><tr><th>Producto</th><th>Cantidad</th><th>Total</th></tr>
      ${reportes.productos?.map(p => `<tr><td>${p.nombre}</td><td>${p.cantidad}</td><td>$${Number(p.total).toFixed(2)}</td></tr>`).join('')}
      </table></body></html>`
    const win = window.open('', '_blank')
    win.document.write(printContent)
    win.document.close()
    win.print()
  }

  const tabs = [
    { id: 'ubicaciones', label: 'Ubicaciones' },
    { id: 'menu', label: 'Menú' },
    { id: 'inventario', label: 'Inventario' + (stockAlerts.length > 0 ? ` (${stockAlerts.length} ⚠️)` : '') },
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'empresa', label: 'Empresa' },
    { id: 'reportes', label: 'Reportes' },
    { id: 'corte', label: 'Corte' },
    { id: 'historico', label: 'Histórico' },
    { id: 'bitacora', label: 'Bitácora' },
    { id: 'clientes', label: 'Clientes' }
  ]

  return (
    <div className="app">
      <nav className="navbar">
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <img src="/logo.png" alt="Logo" style={{height: 40}} />
          <h1>Admin</h1>
        </div>
        <div className="user">
          <span>{user.nombre}</span>
          <button className="btn btn-secondary" onClick={onLogout}>Salir</button>
        </div>
      </nav>

      <div className="main-content">
        <div className="tabs-container">
          <div className="tabs">{tabs.map(t => (<button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>))}</div>
        </div>

        {(activeTab === 'reportes' || activeTab === 'historico') && (
          <div className="card mb-4" style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center'}}>
            <label>Desde: <input type="date" className="input" style={{width: 'auto'}} value={filtros.fecha_inicio} onChange={e => setFiltros({...filtros, fecha_inicio: e.target.value})} /></label>
            <label>Hasta: <input type="date" className="input" style={{width: 'auto'}} value={filtros.fecha_fin} onChange={e => setFiltros({...filtros, fecha_fin: e.target.value})} /></label>
            <button className="btn btn-secondary" onClick={() => setFiltros({ fecha_inicio: '', fecha_fin: '' })}>Limpiar</button>
          </div>
        )}

        {loading ? <div className="text-center">Cargando...</div> : (
          <>
            {activeTab === 'ubicaciones' && (<div><div className="flex justify-between items-center mb-4"><h2>Ubicaciones</h2><button className="btn btn-primary" onClick={() => setEditItem({})}>+ Nueva</button></div><div className="mb-4"><input type="text" className="input" placeholder="Buscar ubicación..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{maxWidth: 300}} /></div><div className="table-responsive"><table className="table"><thead><tr><th>Nombre</th><th>Tipo</th><th>Capacidad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filtrar(ubicaciones).map(u => (<tr key={u.id}><td>{u.nombre}</td><td>{u.tipo}</td><td>{u.capacidad}</td><td><span className={`badge ${u.estado === 'DISPONIBLE' ? 'badge-success' : u.estado === 'OCUPADA' ? 'badge-warning' : 'badge-danger'}`}>{u.estado}</span></td><td><button className="btn btn-primary btn-sm" onClick={() => setEditItem(u)}>Editar</button> <button className="btn btn-danger btn-sm" onClick={() => deleteUbicacion(u.id)}>Eliminar</button></td></tr>))}</tbody></table>{filtrar(ubicaciones).length === 0 && <p className="text-center text-gray">No se encontraron resultados</p>}</div></div>)}

            {activeTab === 'menu' && (<div className="grid grid-1 md:grid-2 gap-4"><div><div className="flex justify-between mb-4"><h2>Categorías</h2><button className="btn btn-primary" onClick={() => setEditItem({ type: 'categoria' })}>+ Nueva</button></div><div className="table-responsive"><table className="table"><thead><tr><th>Nombre</th><th>Orden</th><th>Acciones</th></tr></thead><tbody>{categorias.map(c => (<tr key={c.id}><td>{c.nombre}</td><td>{c.orden}</td><td><button className="btn btn-primary btn-sm" onClick={() => setEditItem({...c, type: 'categoria'})}>Editar</button></td></tr>))}</tbody></table></div></div><div><div className="flex justify-between mb-4"><h2>Productos</h2><button className="btn btn-primary" onClick={() => setEditItem({ type: 'producto' })}>+ Nuevo</button></div><div className="mb-4"><input type="text" className="input" placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{maxWidth: 300}} /></div><div className="table-responsive"><table className="table"><thead><tr><th>Nombre</th><th>Precio</th><th>Categoría</th><th>Acciones</th></tr></thead><tbody>{filtrar(productos).map(p => (<tr key={p.id}><td>{p.nombre}</td><td>${p.precio}</td><td>{p.categoria_nombre}</td><td><button className="btn btn-primary btn-sm" onClick={() => setEditItem({...p, type: 'producto'})}>Editar</button></td></tr>))}</tbody></table>{filtrar(productos).length === 0 && <p className="text-center text-gray">No se encontraron resultados</p>}</div></div></div>)}

            {activeTab === 'inventario' && (<div><div className="flex justify-between mb-4"><h2>Inventario</h2><button className="btn btn-primary" onClick={() => setEditItem({ type: 'producto' })}>+ Nuevo</button></div><div className="mb-4"><input type="text" className="input" placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{maxWidth: 300}} /></div><div className="table-responsive"><table className="table"><thead><tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Stock Mín</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filtrar(inventario).map(p => (<tr key={p.id}><td>{p.nombre}</td><td>{p.categoria_nombre}</td><td>{p.stock}</td><td>{p.stock_minimo}</td><td><span className={`badge ${p.stock <= p.stock_minimo ? 'badge-danger' : 'badge-success'}`}>{p.stock <= p.stock_minimo ? 'Bajo' : 'OK'}</span></td><td><button className="btn btn-primary btn-sm" onClick={() => setEditItem({...p, type: 'producto'})}>Editar</button></td></tr>))}</tbody></table>{filtrar(inventario).length === 0 && <p className="text-center text-gray">No se encontraron resultados</p>}</div></div>)}

            {activeTab === 'usuarios' && (<div><div className="flex justify-between mb-4"><h2>Usuarios</h2><button className="btn btn-primary" onClick={() => setEditItem({ type: 'usuario' })}>+ Nuevo</button></div><div className="mb-4"><input type="text" className="input" placeholder="Buscar usuario..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{maxWidth: 300}} /></div><div className="table-responsive"><table className="table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filtrar(usuarios).map(u => (<tr key={u.id}><td>{u.username}</td><td>{u.nombre}</td><td>{u.rol_nombre}</td><td><span className={`badge ${u.activo ? 'badge-success' : 'badge-danger'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td><td><button className="btn btn-primary btn-sm" onClick={() => setEditItem({...u, type: 'usuario'})}>Editar</button></td></tr>))}</tbody></table>{filtrar(usuarios).length === 0 && <p className="text-center text-gray">No se encontraron resultados</p>}</div></div>)}

            {activeTab === 'empresa' && (<div><h2 className="mb-4">Datos de la Empresa</h2><div className="card" style={{maxWidth: 500}}><div className="form-group"><label className="label">Nombre</label><input className="input" value={config.nombre_establecimiento || ''} onChange={e => setConfig({...config, nombre_establecimiento: e.target.value})} /></div><div className="form-group"><label className="label">Dirección</label><input className="input" value={config.direccion || ''} onChange={e => setConfig({...config, direccion: e.target.value})} /></div><div className="form-group"><label className="label">Teléfono</label><input className="input" value={config.telefono || ''} onChange={e => setConfig({...config, telefono: e.target.value})} /></div><button className="btn btn-primary" onClick={saveConfig}>Guardar</button></div></div>)}

            {activeTab === 'reportes' && reportes && (<div><div className="flex justify-between items-center mb-4"><h2>Reportes</h2><button className="btn btn-info" onClick={generarReportePDF}>📄 Exportar PDF</button></div><div className="grid grid-1 md:grid-3 gap-4 mb-4"><div className="card text-center"><p className="text-gray">Cuentas</p><p className="text-xl font-bold">{reportes.resumen?.cuentas?.total_cuentas || 0}</p></div><div className="card text-center"><p className="text-gray">Pedidos</p><p className="text-xl font-bold">{reportes.resumen?.pedidos?.total_pedidos || 0}</p></div><div className="card text-center"><p className="text-gray">Ventas</p><p className="text-xl font-bold">${reportes.resumen?.cuentas?.ventas || 0}</p></div></div><div className="card"><h3 className="mb-2">Productos Más Vendidos</h3><table className="table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Total</th></tr></thead><tbody>{reportes.productos?.map((p, i) => (<tr key={i}><td>{p.nombre}</td><td>{p.cantidad}</td><td>${Number(p.total).toFixed(2)}</td></tr>))}</tbody></table></div></div>)}

            {activeTab === 'corte' && corteCaja && (<div><h2 className="mb-4">Corte de Caja</h2><div className="grid grid-1 md:grid-2 gap-4"><div className="card"><h3>Resumen</h3><p>Cuentas cerradass: {corteCaja.resumen?.total_cuentas || 0}</p><p className="text-xl font-bold">Total: ${Number(corteCaja.resumen?.total_ventas || 0).toFixed(2)}</p></div><div className="card"><h3>Por Método de Pago</h3>{corteCaja.metodos_pago?.map((m, i) => (<p key={i}>{m.metodo}: ${Number(m.total).toFixed(2)}</p>))}</div></div><div className="card mt-4"><h3>Top 5 Productos</h3>{corteCaja.productos_top?.map((p, i) => (<p key={i}>{p.nombre}: {p.cantidad} unidades</p>))}</div></div>)}

            {activeTab === 'historico' && (<div><h2 className="mb-4">Histórico</h2><div className="card mb-4"><h3>Ventas por Fecha</h3><table className="table"><thead><tr><th>Fecha</th><th>Cuentas</th><th>Ventas</th></tr></thead><tbody>{historico.reportes?.map((r, i) => (<tr key={i}><td>{r.fecha}</td><td>{r.pedidos}</td><td>${Number(r.ventas || 0).toFixed(2)}</td></tr>))}</tbody></table></div><div className="card"><h3>Cuentas Cerradas</h3><table className="table"><thead><tr><th>ID</th><th>Ubicación</th><th>Total</th><th>Fecha</th></tr></thead><tbody>{historico.cuentas?.slice(0, 20).map(c => (<tr key={c.id}><td>#{c.id}</td><td>{c.ubicacion_nombre}</td><td>${c.total}</td><td>{c.fecha_cierre ? new Date(c.fecha_cierre).toLocaleDateString() : '-'}</td></tr>))}</tbody></table></div></div>)}

            {activeTab === 'bitacora' && (<div><h2 className="mb-4">Bitácora</h2><div className="table-responsive"><table className="table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th></tr></thead><tbody>{bitacora.map((b, i) => (<tr key={i}><td>{new Date(b.created_at).toLocaleString()}</td><td>{b.usuario_nombre}</td><td>{b.accion}</td><td>{b.entidad}</td></tr>))}</tbody></table></div></div>)}

            {activeTab === 'clientes' && (<div><h2 className="mb-4">Clientes Frecuentes</h2><div className="table-responsive"><table className="table"><thead><tr><th>Cliente</th><th>Visitas</th><th>Gasto Total</th></tr></thead><tbody>{clientes.map((c, i) => (<tr key={i}><td>{c.cliente_nombre}</td><td>{c.visitas}</td><td>${Number(c.gasto_total).toFixed(2)}</td></tr>))}</tbody></table></div></div>)}
          </>
        )}

        {editItem && (
          <div className="modal-overlay" onClick={() => setEditItem(null)}>
            <div className="card modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="mb-4">{editItem.type === 'categoria' ? (editItem.id ? 'Editar' : 'Nueva') : editItem.type === 'producto' ? (editItem.id ? 'Editar' : 'Nuevo') : editItem.type === 'usuario' ? (editItem.id ? 'Editar' : 'Nuevo') : (editItem.id ? 'Editar' : 'Nueva')} {editItem.type === 'categoria' ? 'Categoría' : editItem.type === 'producto' ? 'Producto' : editItem.type === 'usuario' ? 'Usuario' : 'Ubicación'}</h3>
              
              {(!editItem.type || editItem.type === 'ubicacion') && (<form onSubmit={e => { e.preventDefault(); saveUbicacion(editItem); setEditItem(null) }}><div className="form-group"><label className="label">Nombre</label><input className="input" value={editItem.nombre || ''} onChange={e => setEditItem({...editItem, nombre: e.target.value})} /></div><div className="form-group"><label className="label">Tipo</label><select className="input" value={editItem.tipo || 'MESA'} onChange={e => setEditItem({...editItem, tipo: e.target.value})}><option value="MESA">Mesa</option><option value="HAMACA">Hamaca</option><option value="CABANA">Cabaña</option></select></div><div className="form-group"><label className="label">Capacidad</label><input type="number" className="input" value={editItem.capacidad || 1} onChange={e => setEditItem({...editItem, capacidad: parseInt(e.target.value)})} /></div><div className="flex gap-2"><button type="submit" className="btn btn-primary">Guardar</button><button type="button" className="btn btn-secondary" onClick={() => setEditItem(null)}>Cancelar</button></div></form>)}
              
              {editItem.type === 'categoria' && (<form onSubmit={e => { e.preventDefault(); saveCategoria(editItem); setEditItem(null) }}><div className="form-group"><label className="label">Nombre</label><input className="input" value={editItem.nombre || ''} onChange={e => setEditItem({...editItem, nombre: e.target.value})} /></div><div className="form-group"><label className="label">Orden</label><input type="number" className="input" value={editItem.orden || 0} onChange={e => setEditItem({...editItem, orden: parseInt(e.target.value)})} /></div><div className="flex gap-2"><button type="submit" className="btn btn-primary">Guardar</button><button type="button" className="btn btn-secondary" onClick={() => setEditItem(null)}>Cancelar</button></div></form>)}
              
              {editItem.type === 'producto' && (<form onSubmit={e => { e.preventDefault(); saveProducto(editItem); setEditItem(null) }}><div className="form-group"><label className="label">Nombre</label><input className="input" value={editItem.nombre || ''} onChange={e => setEditItem({...editItem, nombre: e.target.value})} /></div><div className="form-group"><label className="label">Precio</label><input type="number" step="0.01" className="input" value={editItem.precio || ''} onChange={e => setEditItem({...editItem, precio: parseFloat(e.target.value)})} /></div><div className="form-group"><label className="label">Categoría</label><select className="input" value={editItem.categoria_id || ''} onChange={e => setEditItem({...editItem, categoria_id: parseInt(e.target.value)})}><option value="">Seleccionar</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div><div className="form-group"><label className="label">Stock</label><input type="number" className="input" value={editItem.stock || 0} onChange={e => setEditItem({...editItem, stock: parseInt(e.target.value)})} /></div><div className="form-group"><label className="label">Stock Mínimo</label><input type="number" className="input" value={editItem.stock_minimo || 5} onChange={e => setEditItem({...editItem, stock_minimo: parseInt(e.target.value)})} /></div><div className="form-group"><label className="label">Imagen del Producto</label><input type="file" accept="image/*" className="input" onChange={e => uploadImage(e.target.files[0])} disabled={uploadingImage} />{uploadingImage && <p>Subiendo imagen...</p>}<div style={{marginTop: 10}}><input className="input" placeholder="O pega una URL..." value={editItem.imagen || ''} onChange={e => setEditItem({...editItem, imagen: e.target.value})} /></div>{editItem.imagen && <img src={editItem.imagen} alt="Preview" style={{marginTop: 10, maxWidth: 150, maxHeight: 150, borderRadius: 8, objectFit: 'cover'}} onError={e => e.target.style.display = 'none'} />}</div><div className="form-group"><label className="label">Tiempo (min)</label><input type="number" className="input" value={editItem.tiempo_preparacion || 15} onChange={e => setEditItem({...editItem, tiempo_preparacion: parseInt(e.target.value)})} /></div><div className="form-group"><label className="label">Descripción</label><textarea className="input" value={editItem.descripcion || ''} onChange={e => setEditItem({...editItem, descripcion: e.target.value})} /></div><div className="flex gap-2"><button type="submit" className="btn btn-primary">Guardar</button><button type="button" className="btn btn-secondary" onClick={() => setEditItem(null)}>Cancelar</button></div></form>)}
              
              {editItem.type === 'usuario' && (<form onSubmit={e => { e.preventDefault(); saveUsuario(editItem); setEditItem(null) }}><div className="form-group"><label className="label">Usuario</label><input className="input" value={editItem.username || ''} onChange={e => setEditItem({...editItem, username: e.target.value})} disabled={!!editItem.id} /></div>{!editItem.id && <div className="form-group"><label className="label">Contraseña</label><input type="password" className="input" value={editItem.password || ''} onChange={e => setEditItem({...editItem, password: e.target.value})} />{editItem.id && <small>Dejar vacío para mantener</small>}</div>}{editItem.id && <div className="form-group"><label className="label">Nueva contraseña</label><input type="password" className="input" value={editItem.password || ''} onChange={e => setEditItem({...editItem, password: e.target.value})} /></div>}<div className="form-group"><label className="label">Nombre</label><input className="input" value={editItem.nombre || ''} onChange={e => setEditItem({...editItem, nombre: e.target.value})} /></div><div className="form-group"><label className="label">Rol</label><select className="input" value={editItem.rol_id || ''} onChange={e => setEditItem({...editItem, rol_id: parseInt(e.target.value)})}><option value="">Seleccionar</option>{roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}</select></div>{editItem.id && <div className="form-group"><label className="label">Estado</label><select className="input" value={editItem.activo ? 'true' : 'false'} onChange={e => setEditItem({...editItem, activo: e.target.value === 'true'})}><option value="true">Activo</option><option value="false">Inactivo</option></select></div>}<div className="flex gap-2"><button type="submit" className="btn btn-primary">Guardar</button><button type="button" className="btn btn-secondary" onClick={() => setEditItem(null)}>Cancelar</button></div></form>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}