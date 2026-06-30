import { useEffect, useState, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import axios from "axios"
import storeAuth from "../context/storeAuth"
import Badge from "../components/ui/Badge"
import Paginacion from "../components/ui/Paginacion"
import ModalMotivo from "../components/ui/ModalMotivo"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import storeProfile from "../context/storeProfile"
import useFetch from "../hooks/useFetch"
import LogoMarca from "../components/ui/LogoMarca"
import { exportarReportesExcel } from "../services/exportService"

const VerReportes = () => {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { rol, token } = storeAuth()
    const { user } = storeProfile()
    const { fetchDataBackend } = useFetch()

    const vehiculoFiltroId = searchParams.get("vehiculo") || ""

    const [reportes, setReportes] = useState([])
    const [vehiculoNombre, setVehiculoNombre] = useState("")
    const [busqueda, setBusqueda] = useState("")
    const [gravedad, setGravedad] = useState("")
    const [marcaFiltro, setMarcaFiltro] = useState("")
    const [anioFiltro, setAnioFiltro] = useState("")
    const [orden, setOrden] = useState("reciente")
    const [marcasDisponibles, setMarcasDisponibles] = useState([])
    const [aniosDisponibles, setAniosDisponibles] = useState([])
    const [cargando, setCargando] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [total, setTotal] = useState(0)
    const [modoEdicion, setModoEdicion] = useState(false)
    const [modalEliminar, setModalEliminar] = useState(null)
    const [modalEliminarPropio, setModalEliminarPropio] = useState(null)
    const [exportando, setExportando] = useState(false)

    const cargar = useCallback(async (pag = 1, busq = "", grav = "", vehId = "", marc = "", an = "", ord = "reciente") => {
        setCargando(true)
        try {
            const params = new URLSearchParams({ pagina: pag })
            if (busq) params.append("busqueda", busq)
            if (grav) params.append("gravedad", grav)
            if (vehId) params.append("vehiculo", vehId)
            if (marc) params.append("marca", marc)
            if (an) params.append("anio", an)
            if (ord && ord !== "reciente") params.append("orden", ord)
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/reportes?${params}`)
            setReportes(res.data.reportes || [])
            setTotalPaginas(res.data.paginas || 1)
            setTotal(res.data.total || 0)
            if (vehId && res.data.reportes?.length > 0) {
                const v = res.data.reportes[0].vehiculo
                if (v) setVehiculoNombre(`${v.marca} ${v.modelo} ${v.anio}`)
            }
        } catch (error) {
            console.error(error)
            setReportes([])
        }
        setCargando(false)
    }, [])

    // Cargar marcas y años disponibles para los selectores (una sola vez)
    useEffect(() => {
        const cargarFiltros = async () => {
            try {
                const headers = token ? { Authorization: `Bearer ${token}` } : {}
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/vehiculos/selector`, { headers })
                const vehiculos = res.data.vehiculos || []
                setMarcasDisponibles([...new Set(vehiculos.map(v => v.marca))].sort())
                setAniosDisponibles([...new Set(vehiculos.map(v => v.anio))].sort((a, b) => b - a))
            } catch { /* silencioso */ }
        }
        cargarFiltros()
    }, [])

    useEffect(() => {
        cargar(1, busqueda, gravedad, vehiculoFiltroId, marcaFiltro, anioFiltro, orden)
    }, [vehiculoFiltroId])

    useEffect(() => {
        if (vehiculoFiltroId) return
        const timer = setTimeout(() => {
            setPagina(1)
            cargar(1, busqueda, gravedad, "", marcaFiltro, anioFiltro, orden)
        }, 400)
        return () => clearTimeout(timer)
    }, [busqueda, gravedad, marcaFiltro, anioFiltro, orden])

    const cambiarPagina = (nuevaPagina) => {
        setPagina(nuevaPagina)
        cargar(nuevaPagina, busqueda, gravedad, vehiculoFiltroId, marcaFiltro, anioFiltro, orden)
    }

    const limpiarFiltroVehiculo = () => {
        setSearchParams({})
        setVehiculoNombre("")
        setPagina(1)
        cargar(1, "", "", "", marcaFiltro, anioFiltro, orden)
    }

    const limpiarTodosFiltros = () => {
        setBusqueda("")
        setGravedad("")
        setMarcaFiltro("")
        setAnioFiltro("")
        setOrden("reciente")
        setPagina(1)
        cargar(1, "", "", vehiculoFiltroId, "", "", "reciente")
    }

    const handleEliminarPropio = async () => {
        const headers = { Authorization: `Bearer ${token}` }
        const url = `${import.meta.env.VITE_BACKEND_URL}/reportes/${modalEliminarPropio._id}`
        const res = await fetchDataBackend(url, undefined, "DELETE", headers)
        if (res) { setModalEliminarPropio(null); cargar(pagina, busqueda, gravedad, vehiculoFiltroId, marcaFiltro, anioFiltro, orden) }
    }

    const handleEliminar = async (motivo) => {
        const headers = { Authorization: `Bearer ${token}` }
        const url = `${import.meta.env.VITE_BACKEND_URL}/reportes/${modalEliminar._id}`
        const res = await fetchDataBackend(url, { motivo }, "DELETE", headers)
        if (res) { setModalEliminar(null); cargar(pagina, busqueda, gravedad, vehiculoFiltroId, marcaFiltro, anioFiltro, orden) }
    }

    const handleExportarExcel = async () => {
        setExportando(true)
        try {
            await exportarReportesExcel(token, { busqueda, gravedad, marca: marcaFiltro, anio: anioFiltro })
        } catch (error) {
            toast.error("Error al exportar a Excel")
        }
        setExportando(false)
    }

    return (
        <div>
            <ToastContainer />
            <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-1">Reportes validados</h1>
                    <p className="text-slate-500 text-sm">{total} reporte(s) encontrado(s)</p>
                </div>
                {rol === "admin" && (
                    <div className="flex gap-2 flex-wrap">
                        <button type="button" onClick={handleExportarExcel} disabled={exportando}
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-green-700 hover:bg-green-800 text-white disabled:opacity-50 flex items-center gap-1.5">
                            {exportando ? "Generando..." : "📊 Exportar a Excel"}
                        </button>
                        <button type="button" onClick={() => setModoEdicion(!modoEdicion)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${modoEdicion ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-600"}`}>
                            {modoEdicion ? "✏️ Modo edición activo" : "Gestionar reportes"}
                        </button>
                    </div>
                )}
            </div>

            {vehiculoFiltroId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button type="button" onClick={() => navigate("/dashboard/vehiculos")}
                            className="text-blue-700 hover:underline text-sm font-semibold shrink-0">
                            ← Vehículos
                        </button>
                        <span className="text-slate-300 shrink-0">|</span>
                        <p className="text-sm text-blue-800 truncate">
                            <strong>{vehiculoNombre || "Vehículo seleccionado"}</strong>
                        </p>
                    </div>
                    <button type="button" onClick={limpiarFiltroVehiculo}
                        className="text-xs text-blue-600 hover:underline font-semibold shrink-0">
                        Ver todos
                    </button>
                </div>
            )}

            {modoEdicion && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800">
                    Modo edición activo. Úsalo solo cuando sea necesario.
                </div>
            )}

            {!vehiculoFiltroId && (
                <div className="flex flex-wrap gap-3 mb-6">
                    <input type="text" placeholder="Buscar por marca, modelo o falla..."
                        className="flex-1 min-w-48 rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                        value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

                    <select className="rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none py-2 px-3 text-slate-700"
                        value={marcaFiltro} onChange={(e) => setMarcaFiltro(e.target.value)}>
                        <option value="">Todas las marcas</option>
                        {marcasDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    <select className="rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none py-2 px-3 text-slate-700"
                        value={anioFiltro} onChange={(e) => setAnioFiltro(e.target.value)}>
                        <option value="">Todos los años</option>
                        {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>

                    <select className="rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none py-2 px-3 text-slate-700"
                        value={gravedad} onChange={(e) => setGravedad(e.target.value)}>
                        <option value="">Todas las gravedades</option>
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                    </select>

                    <select className="rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none py-2 px-3 text-slate-700"
                        value={orden} onChange={(e) => setOrden(e.target.value)}>
                        <option value="reciente">Más reciente</option>
                        <option value="antiguo">Más antiguo</option>
                    </select>

                    {(busqueda || gravedad || marcaFiltro || anioFiltro || orden !== "reciente") && (
                        <button type="button" onClick={limpiarTodosFiltros}
                            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:underline">
                            Limpiar filtros
                        </button>
                    )}
                </div>
            )}

            {cargando ? (
                <p className="text-slate-400">Cargando reportes...</p>
            ) : reportes.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">
                    {vehiculoFiltroId
                        ? "Este vehículo no tiene reportes validados aún."
                        : "No hay reportes validados que coincidan."}
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                        <table className="w-full">
                            <thead className="bg-slate-800 text-slate-200">
                                <tr>
                                    <th className="p-3 text-center">Marca</th>
                                    <th className="p-3 text-center">Modelo</th>
                                    <th className="p-3 text-center">Año</th>
                                    <th className="p-3 text-center">Falla</th>
                                    <th className="p-3 text-center">Tipo</th>
                                    <th className="p-3 text-center">Combustible</th>
                                    <th className="p-3 text-center">Gravedad</th>
                                    <th className="p-3 text-center">Reportado por</th>
                                    <th className="p-3 text-center">Región / Provincia</th>
                                    <th className="p-3 text-center">{modoEdicion ? "Acciones" : "Detalle"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportes.map((r, i) => (
                                    <tr key={r._id} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50"} ${modoEdicion ? "border-l-4 border-amber-400" : ""}`}>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <LogoMarca marca={r.vehiculo?.marca} size={32} />
                                                <span>{r.vehiculo?.marca}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">{r.vehiculo?.modelo}</td>
                                        <td className="p-3">{r.vehiculo?.anio}</td>
                                        <td className="p-3">{r.falla?.nombre}</td>
                                        <td className="p-3 text-sm text-slate-600 capitalize">{r.vehiculo?.tipo || "—"}</td>
                                        <td className="p-3 text-sm text-slate-600 capitalize">{r.vehiculo?.combustible || "—"}</td>
                                        <td className="p-3"><Badge tipo={r.gravedad} /></td>
                                        <td className="p-3 text-sm">
                                            <div className="font-semibold text-slate-700">{r.usuario?.nombre} {r.usuario?.apellido}</div>
                                            <div className="text-slate-400 text-xs">{r.usuario?.email}</div>
                                        </td>
                                        <td className="p-3 text-sm">
                                            {r.usuario?.region ? (
                                                <div>
                                                    <div className="text-slate-700">{r.usuario.region}</div>
                                                    {r.usuario.provincia && <div className="text-slate-400 text-xs">{r.usuario.provincia}</div>}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 italic text-xs">No registrada</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {modoEdicion ? (
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex gap-1.5">
                                                        <button type="button" onClick={() => navigate(`/dashboard/reporte/${r._id}`)}
                                                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors text-center">
                                                            👁 Ver
                                                        </button>
                                                        <button type="button" onClick={() => navigate(`/dashboard/editar/${r._id}`)}
                                                            className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors text-center">
                                                            ✏️ Editar
                                                        </button>
                                                    </div>
                                                    <button type="button"
                                                        onClick={() => {
                                                            if (r.usuario?._id === user?._id || r.usuario?.email === user?.email) {
                                                                setModalEliminarPropio(r)
                                                            } else {
                                                                setModalEliminar(r)
                                                            }
                                                        }}
                                                        className="w-full bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors text-center">
                                                        🗑 Eliminar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button type="button" onClick={() => navigate(`/dashboard/reporte/${r._id}`)}
                                                    className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                                    👁 Ver detalle
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
                </>
            )}

            {modalEliminarPropio && (
                <ModalConfirmar
                    titulo="¿Eliminar este reporte?"
                    descripcion="¿Estás seguro de que deseas eliminar este reporte? Se moverá a la papelera."
                    textoConfirmar="Sí, eliminar"
                    onConfirmar={handleEliminarPropio}
                    onCancelar={() => setModalEliminarPropio(null)}
                />
            )}
            {modalEliminar && (
                <ModalMotivo
                    titulo="Eliminar reporte"
                    descripcion={`Vas a eliminar el reporte de ${modalEliminar.usuario?.nombre} ${modalEliminar.usuario?.apellido}. El usuario recibirá un correo con el motivo.`}
                    onConfirmar={handleEliminar}
                    onCancelar={() => setModalEliminar(null)}
                />
            )}
        </div>
    )
}

export default VerReportes