import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import Paginacion from "../components/ui/Paginacion"
import Badge from "../components/ui/Badge"
import { regionesEcuador, provinciasPorRegion } from "../config/ecuador"
import {
    getUsuarios, getUsuariosEliminados, getReportesDeUsuario, getValoracionesDeUsuario,
    banearUsuario, desbanearUsuario, eliminarUsuario, restaurarUsuario, ascenderAAdmin
} from "../services/usuarioService"

const AdminUsuarios = () => {
    const navigate = useNavigate()
    const [pestana, setPestana] = useState("activos")
    const [modoGestion, setModoGestion] = useState(false)
    const [usuarioDetalle, setUsuarioDetalle] = useState(null)

    // Activos
    const [usuarios, setUsuarios] = useState([])
    const [cargandoActivos, setCargandoActivos] = useState(true)
    const [busqueda, setBusqueda] = useState("")
    const [filtroRegion, setFiltroRegion] = useState("")
    const [filtroProvincia, setFiltroProvincia] = useState("")
    const [filtroMinReportes, setFiltroMinReportes] = useState("")
    const [filtroMaxReportes, setFiltroMaxReportes] = useState("")
    const [paginaActivos, setPaginaActivos] = useState(1)
    const [totalPaginasActivos, setTotalPaginasActivos] = useState(1)
    const [totalActivos, setTotalActivos] = useState(0)
    const [stats, setStats] = useState({ baneados: 0 })

    // Eliminados
    const [usuariosEliminados, setUsuariosEliminados] = useState([])
    const [cargandoEliminados, setCargandoEliminados] = useState(false)
    const [busquedaEliminados, setBusquedaEliminados] = useState("")
    const [paginaEliminados, setPaginaEliminados] = useState(1)
    const [totalPaginasEliminados, setTotalPaginasEliminados] = useState(1)
    const [totalEliminados, setTotalEliminados] = useState(0)

    const [modalAccion, setModalAccion] = useState(null)

    // Modal reportes del usuario
    const [modalReportes, setModalReportes] = useState(null)
    const [reportesUsuario, setReportesUsuario] = useState([])
    const [cargandoReportes, setCargandoReportes] = useState(false)
    const [busquedaReportes, setBusquedaReportes] = useState("")
    const [paginaReportes, setPaginaReportes] = useState(1)
    const [totalPaginasReportes, setTotalPaginasReportes] = useState(1)
    const [totalReportes, setTotalReportes] = useState(0)

    // Modal detalle usuario
    const [modalDetalle, setModalDetalle] = useState(null)

    // Pestaña del modal reportes/valoraciones
    const [pestanaModal, setPestanaModal] = useState("reportes")
    const [valoracionesUsuario, setValoracionesUsuario] = useState([])
    const [cargandoValoraciones, setCargandoValoraciones] = useState(false)
    const [paginaValoraciones, setPaginaValoraciones] = useState(1)
    const [totalPaginasValoraciones, setTotalPaginasValoraciones] = useState(1)
    const [totalValoraciones, setTotalValoraciones] = useState(0)

    const cargarActivos = useCallback(async (pag = 1, busq = "", region = "", provincia = "", minR = "", maxR = "") => {
        setCargandoActivos(true)
        try {
            const res = await getUsuarios({ pagina: pag, busqueda: busq, region, provincia, minReportes: minR, maxReportes: maxR })
            setUsuarios(res.data.usuarios || [])
            setTotalPaginasActivos(res.data.paginas || 1)
            setTotalActivos(res.data.total || 0)
            setStats({ baneados: (res.data.usuarios || []).filter(u => u.baneado).length })
        } catch (error) { console.error(error); setUsuarios([]) }
        setCargandoActivos(false)
    }, [])

    const cargarEliminados = useCallback(async (pag = 1, busq = "") => {
        setCargandoEliminados(true)
        try {
            const res = await getUsuariosEliminados({ pagina: pag, busqueda: busq })
            setUsuariosEliminados(res.data.usuarios || [])
            setTotalPaginasEliminados(res.data.paginas || 1)
            setTotalEliminados(res.data.total || 0)
        } catch (error) { console.error(error); setUsuariosEliminados([]) }
        setCargandoEliminados(false)
    }, [])

    const cargarReportesUsuario = useCallback(async (usuarioId, pag = 1, busq = "") => {
        setCargandoReportes(true)
        try {
            const res = await getReportesDeUsuario(usuarioId, { pagina: pag, busqueda: busq })
            setReportesUsuario(res.data.reportes || [])
            setTotalPaginasReportes(res.data.paginas || 1)
            setTotalReportes(res.data.total || 0)
        } catch (error) { console.error(error); setReportesUsuario([]) }
        setCargandoReportes(false)
    }, [])

    useEffect(() => { cargarActivos() }, [])
    useEffect(() => { if (pestana === "eliminados") cargarEliminados() }, [pestana])

    useEffect(() => {
        const t = setTimeout(() => {
            setPaginaActivos(1)
            cargarActivos(1, busqueda, filtroRegion, filtroProvincia, filtroMinReportes, filtroMaxReportes)
        }, 400)
        return () => clearTimeout(t)
    }, [busqueda, filtroRegion, filtroProvincia, filtroMinReportes, filtroMaxReportes])

    useEffect(() => {
        const t = setTimeout(() => { setPaginaEliminados(1); cargarEliminados(1, busquedaEliminados) }, 400)
        return () => clearTimeout(t)
    }, [busquedaEliminados])

    useEffect(() => {
        if (!modalReportes) return
        const t = setTimeout(() => {
            setPaginaReportes(1)
            cargarReportesUsuario(modalReportes._id, 1, busquedaReportes)
        }, 400)
        return () => clearTimeout(t)
    }, [busquedaReportes])

    const cargarValoracionesUsuario = useCallback(async (usuarioId, pag = 1) => {
        setCargandoValoraciones(true)
        try {
            const res = await getValoracionesDeUsuario(usuarioId, pag)
            setValoracionesUsuario(res.data.valoraciones || [])
            setTotalPaginasValoraciones(res.data.paginas || 1)
            setTotalValoraciones(res.data.total || 0)
        } catch (error) { console.error(error); setValoracionesUsuario([]) }
        setCargandoValoraciones(false)
    }, [])

    const abrirModalReportes = (usuario) => {
        setModalReportes(usuario)
        setPestanaModal("reportes")
        setBusquedaReportes("")
        setPaginaReportes(1)
        setPaginaValoraciones(1)
        cargarReportesUsuario(usuario._id, 1, "")
        cargarValoracionesUsuario(usuario._id, 1)
    }

    const limpiarFiltros = () => {
        setBusqueda(""); setFiltroRegion(""); setFiltroProvincia("")
        setFiltroMinReportes(""); setFiltroMaxReportes("")
    }

    const hayFiltros = busqueda || filtroRegion || filtroProvincia || filtroMinReportes || filtroMaxReportes

    const ejecutarAccion = async () => {
        const { usuario, accion } = modalAccion
        try {
            let res
            if (accion === "banear")    res = await banearUsuario(usuario._id)
            else if (accion === "desbanear") res = await desbanearUsuario(usuario._id)
            else if (accion === "eliminar")  res = await eliminarUsuario(usuario._id)
            else if (accion === "restaurar") res = await restaurarUsuario(usuario._id)
            else if (accion === "ascender")  res = await ascenderAAdmin(usuario._id)

            toast.success(res.data.msg)
            setModalAccion(null)
            if (accion === "restaurar") cargarEliminados(paginaEliminados, busquedaEliminados)
            else cargarActivos(paginaActivos, busqueda, filtroRegion, filtroProvincia, filtroMinReportes, filtroMaxReportes)
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al procesar la acción")
        }
    }

    const configModal = {
        banear: { titulo: "¿Suspender usuario?", descripcion: `¿Suspender a ${modalAccion?.usuario?.nombre} ${modalAccion?.usuario?.apellido}?`, textoConfirmar: "Sí, suspender", color: "bg-amber-500 hover:bg-amber-600" },
        desbanear: { titulo: "¿Reactivar usuario?", descripcion: `¿Reactivar a ${modalAccion?.usuario?.nombre} ${modalAccion?.usuario?.apellido}?`, textoConfirmar: "Sí, reactivar", color: "bg-green-600 hover:bg-green-700" },
        eliminar: { titulo: "¿Eliminar usuario?", descripcion: `¿Eliminar a ${modalAccion?.usuario?.nombre} ${modalAccion?.usuario?.apellido}? Sus reportes no serán eliminados.`, textoConfirmar: "Sí, eliminar", color: "bg-red-600 hover:bg-red-700" },
        restaurar: { titulo: "¿Restaurar usuario?", descripcion: `¿Restaurar la cuenta de ${modalAccion?.usuario?.nombre} ${modalAccion?.usuario?.apellido}?`, textoConfirmar: "Sí, restaurar", color: "bg-blue-900 hover:bg-blue-800" },
        ascender: { titulo: "¿Ascender a administrador?", descripcion: `Esto le dará a ${modalAccion?.usuario?.nombre} ${modalAccion?.usuario?.apellido} acceso completo de administrador. Esta acción no se puede deshacer desde el sistema.`, textoConfirmar: "Sí, ascender a admin", color: "bg-blue-900 hover:bg-blue-800" }
    }

    const estadoReporte = (r) => {
        if (!r.activo) return { label: "Eliminado", clase: "bg-red-100 text-red-700" }
        if (r.validado) return { label: "Validado", clase: "bg-green-100 text-green-700" }
        return { label: "Pendiente", clase: "bg-amber-100 text-amber-800" }
    }

    const formatearFecha = (f) => f ? new Date(f).toLocaleDateString("es-EC") : "—"
    const inputClass = "rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm"

    return (
        <div>
            <ToastContainer />
            <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-1">Gestión de usuarios</h1>
                    <p className="text-slate-500 text-sm">Administra las cuentas de usuarios de la plataforma.</p>
                </div>
                {pestana === "activos" && (
                    <button type="button" onClick={() => setModoGestion(!modoGestion)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${modoGestion ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-600"}`}>
                        {modoGestion ? "⚙️ Gestión activa" : "Gestionar usuarios"}
                    </button>
                )}
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow p-4 text-center">
                    <p className="text-3xl font-black text-blue-900">{totalActivos}</p>
                    <p className="text-slate-500 text-sm mt-1">Total activos</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4 text-center">
                    <p className="text-3xl font-black text-amber-600">{stats.baneados}</p>
                    <p className="text-slate-500 text-sm mt-1">Suspendidos</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4 text-center">
                    <p className="text-3xl font-black text-red-600">{totalEliminados}</p>
                    <p className="text-slate-500 text-sm mt-1">Eliminados</p>
                </div>
            </div>

            {/* Pestañas */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
                <button type="button" onClick={() => setPestana("activos")}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${pestana === "activos" ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                    Usuarios activos
                </button>
                <button type="button" onClick={() => setPestana("eliminados")}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${pestana === "eliminados" ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                    Eliminados {totalEliminados > 0 && <span className="ml-1 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{totalEliminados}</span>}
                </button>
            </div>

            {/* PESTAÑA ACTIVOS */}
            {pestana === "activos" && (
                <>
                    {modoGestion && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800">
                            Modo gestión activo. Puedes suspender, reactivar o eliminar usuarios fila por fila.
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow p-4 mb-4">
                        <p className="text-sm font-semibold text-slate-600 mb-3">Filtros de búsqueda</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <input type="text" placeholder="Nombre o correo..." className={`${inputClass} col-span-2 md:col-span-1`}
                                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                            <select className={inputClass} value={filtroRegion}
                                onChange={(e) => { setFiltroRegion(e.target.value); setFiltroProvincia("") }}>
                                <option value="">Todas las regiones</option>
                                {regionesEcuador.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <select className={inputClass} value={filtroProvincia} disabled={!filtroRegion}
                                onChange={(e) => setFiltroProvincia(e.target.value)}>
                                <option value="">Todas las provincias</option>
                                {(provinciasPorRegion[filtroRegion] || []).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <input type="number" placeholder="Mín. reportes" className={inputClass} min="0"
                                value={filtroMinReportes} onChange={(e) => setFiltroMinReportes(e.target.value)} />
                            <input type="number" placeholder="Máx. reportes" className={inputClass} min="0"
                                value={filtroMaxReportes} onChange={(e) => setFiltroMaxReportes(e.target.value)} />
                        </div>
                        {hayFiltros && (
                            <button type="button" onClick={limpiarFiltros} className="mt-3 text-sm text-slate-500 hover:underline">
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    {cargandoActivos ? <p className="text-slate-400">Cargando...</p>
                    : usuarios.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">No hay usuarios que coincidan.</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                                <table className="w-full">
                                    <thead className="bg-slate-800 text-slate-200">
                                        <tr>
                                            <th className="p-3 text-center">Nombre</th>
                                            <th className="p-3 text-center">Correo</th>
                                            <th className="p-3 text-center">Región / Provincia</th>
                                            <th className="p-3 text-center">Reportes</th>
                                            <th className="p-3 text-center">Estado</th>
                                            <th className="p-3 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usuarios.map((u, i) => (
                                            <tr key={u._id} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50"} ${u.baneado ? "opacity-60" : ""}`}>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                                                        <span className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center overflow-hidden shrink-0">
                                                            {u.foto?.url ? (
                                                                <img src={u.foto.url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-white text-xs font-bold">{u.nombre?.charAt(0)?.toUpperCase() || "U"}</span>
                                                            )}
                                                        </span>
                                                        {u.nombre} {u.apellido}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-sm text-slate-500 text-center">{u.email}</td>
                                                <td className="p-3 text-sm text-center">
                                                    {u.region ? (
                                                        <div>
                                                            <div className="text-slate-700">{u.region}</div>
                                                            {u.provincia && <div className="text-slate-400 text-xs">{u.provincia}</div>}
                                                        </div>
                                                    ) : <span className="text-slate-300 italic text-xs">No registrada</span>}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button type="button" onClick={() => abrirModalReportes(u)}
                                                        className="font-bold text-blue-900 hover:underline">
                                                        {u.totalReportes}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${u.baneado ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                                                        {u.baneado ? "Suspendido" : "Activo"}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    {modoGestion ? (
                                                        <div className="flex gap-2 flex-wrap justify-center">
                                                            {u.baneado ? (
                                                                <button type="button" onClick={() => setModalAccion({ usuario: u, accion: "desbanear" })}
                                                                    className="bg-green-100 hover:bg-green-200 text-green-800 text-xs font-semibold px-3 py-1 rounded-lg">Reactivar</button>
                                                            ) : (
                                                                <button type="button" onClick={() => setModalAccion({ usuario: u, accion: "banear" })}
                                                                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold px-3 py-1 rounded-lg">Suspender</button>
                                                            )}
                                                            <button type="button" onClick={() => setModalAccion({ usuario: u, accion: "ascender" })}
                                                                className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold px-3 py-1 rounded-lg">
                                                                ⬆ Admin
                                                            </button>
                                                            <button type="button" onClick={() => setModalAccion({ usuario: u, accion: "eliminar" })}
                                                                className="bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold px-3 py-1 rounded-lg">Eliminar</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2 justify-center">
                                                            <button type="button" onClick={() => setModalDetalle(u)}
                                                                className="text-blue-700 hover:underline text-xs">
                                                                Ver datos
                                                            </button>
                                                            <button type="button" onClick={() => abrirModalReportes(u)}
                                                                className="text-slate-500 hover:underline text-xs">
                                                                Ver reportes
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Paginacion paginaActual={paginaActivos} totalPaginas={totalPaginasActivos}
                                onCambiar={(p) => { setPaginaActivos(p); cargarActivos(p, busqueda, filtroRegion, filtroProvincia, filtroMinReportes, filtroMaxReportes) }} />
                        </>
                    )}
                </>
            )}

            {/* PESTAÑA ELIMINADOS */}
            {pestana === "eliminados" && (
                <>
                    <div className="flex gap-3 mb-4">
                        <input type="text" placeholder="Buscar por nombre o correo..."
                            className={`flex-1 ${inputClass}`}
                            value={busquedaEliminados} onChange={(e) => setBusquedaEliminados(e.target.value)} />
                        {busquedaEliminados && <button type="button" onClick={() => setBusquedaEliminados("")} className="px-3 py-2 text-sm text-slate-500 hover:underline">Limpiar</button>}
                    </div>

                    {cargandoEliminados ? <p className="text-slate-400">Cargando...</p>
                    : usuariosEliminados.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">No hay usuarios eliminados.</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                                <table className="w-full">
                                    <thead className="bg-slate-800 text-slate-200">
                                        <tr>
                                            <th className="p-3 text-center">Nombre</th>
                                            <th className="p-3 text-center">Correo</th>
                                            <th className="p-3 text-center">Eliminado el</th>
                                            <th className="p-3 text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usuariosEliminados.map((u, i) => (
                                            <tr key={u._id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                                <td className="p-3 font-semibold text-slate-700 text-center">{u.nombre} {u.apellido}</td>
                                                <td className="p-3 text-sm text-slate-500 text-center">{u.email}</td>
                                                <td className="p-3 text-sm text-slate-400 text-center">{formatearFecha(u.eliminadoEn)}</td>
                                                <td className="p-3 text-center">
                                                    <button type="button" onClick={() => setModalAccion({ usuario: u, accion: "restaurar" })}
                                                        className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs font-semibold px-3 py-1 rounded-lg">
                                                        Restaurar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Paginacion paginaActual={paginaEliminados} totalPaginas={totalPaginasEliminados}
                                onCambiar={(p) => { setPaginaEliminados(p); cargarEliminados(p, busquedaEliminados) }} />
                        </>
                    )}
                </>
            )}

            {/* MODAL REPORTES Y VALORACIONES DEL USUARIO */}
            {modalReportes && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{modalReportes.nombre} {modalReportes.apellido}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{modalReportes.email}</p>
                            </div>
                            <button type="button" onClick={() => setModalReportes(null)}
                                className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
                        </div>

                        {/* Pestañas */}
                        <div className="flex border-b border-slate-200 shrink-0 px-5">
                            <button type="button"
                                onClick={() => setPestanaModal("reportes")}
                                className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-colors ${pestanaModal === "reportes" ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                                Reportes <span className="ml-1 text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">{totalReportes}</span>
                            </button>
                            <button type="button"
                                onClick={() => setPestanaModal("valoraciones")}
                                className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-colors ${pestanaModal === "valoraciones" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                                Valoraciones <span className="ml-1 text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">{totalValoraciones}</span>
                            </button>
                        </div>

                        {/* Contenido según pestaña */}
                        {pestanaModal === "reportes" ? (
                            <>
                                <div className="px-5 pt-4 shrink-0">
                                    <input type="text" placeholder="Buscar por marca, modelo o falla..."
                                        className="w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm"
                                        value={busquedaReportes} onChange={(e) => setBusquedaReportes(e.target.value)} />
                                </div>
                                <div className="flex-1 overflow-y-auto p-5 space-y-2">
                                    {cargandoReportes ? (
                                        <p className="text-slate-400 text-sm text-center py-8">Cargando reportes...</p>
                                    ) : reportesUsuario.length === 0 ? (
                                        <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-400 text-sm">
                                            {busquedaReportes ? "No hay reportes que coincidan." : "Este usuario no tiene reportes."}
                                        </div>
                                    ) : (
                                        reportesUsuario.map(r => {
                                            const estado = estadoReporte(r)
                                            return (
                                                <div key={r._id} className="bg-slate-50 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <span className="font-semibold text-slate-800 text-sm">
                                                                {r.vehiculo?.marca} {r.vehiculo?.modelo} {r.vehiculo?.anio}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estado.clase}`}>
                                                                {estado.label}
                                                            </span>
                                                            <Badge tipo={r.gravedad} />
                                                        </div>
                                                        <p className="text-xs text-slate-500">{r.falla?.nombre}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {new Date(r.createdAt).toLocaleString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                        </p>
                                                    </div>
                                                    <button type="button"
                                                        onClick={() => { setModalReportes(null); navigate(`/dashboard/reporte/${r._id}`) }}
                                                        className="shrink-0 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                                        Ver
                                                    </button>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                                {totalPaginasReportes > 1 && (
                                    <div className="shrink-0 border-t border-slate-200 px-5 py-3">
                                        <Paginacion paginaActual={paginaReportes} totalPaginas={totalPaginasReportes}
                                            onCambiar={(p) => { setPaginaReportes(p); cargarReportesUsuario(modalReportes._id, p, busquedaReportes) }} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto p-5 space-y-2">
                                    {cargandoValoraciones ? (
                                        <p className="text-slate-400 text-sm text-center py-8">Cargando valoraciones...</p>
                                    ) : valoracionesUsuario.length === 0 ? (
                                        <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-400 text-sm">
                                            Este usuario no ha hecho valoraciones.
                                        </div>
                                    ) : (
                                        valoracionesUsuario.map(v => {
                                            const prom = v.aspectos ? Math.round((Object.values(v.aspectos).reduce((a, b) => a + b, 0) / 7) * 10) / 10 : 0
                                            return (
                                                <div key={v._id} className="bg-slate-50 rounded-lg px-4 py-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-800 text-sm">
                                                                {v.vehiculo?.marca} {v.vehiculo?.modelo} {v.vehiculo?.anio}
                                                                {v.vehiculo?.version && <span className="text-xs text-slate-400 ml-1">({v.vehiculo.version})</span>}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="flex gap-0.5">
                                                                    {[1,2,3,4,5].map(i => {
                                                                        const pct = Math.max(0, Math.min(100, (prom - (i - 1)) * 100))
                                                                        return (
                                                                            <span key={i} className="relative inline-block leading-none text-sm">
                                                                                <span className="text-slate-200">★</span>
                                                                                <span className="absolute inset-0 overflow-hidden text-amber-400" style={{ width: `${pct}%` }}>★</span>
                                                                            </span>
                                                                        )
                                                                    })}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-600">{prom}/5</span>
                                                            </div>
                                                            {v.comentario && (
                                                                <p className="text-xs text-slate-500 mt-1 italic">"{v.comentario}"</p>
                                                            )}
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-xs text-slate-400">
                                                                Creada: {new Date(v.createdAt).toLocaleString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                            </p>
                                                            {v.updatedAt !== v.createdAt && (
                                                                <p className="text-xs text-amber-500 mt-0.5">
                                                                    Editada: {new Date(v.updatedAt).toLocaleString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                                </p>
                                                            )}
                                                            {v.edicionesEnVentana > 0 && (
                                                                <p className="text-xs text-slate-300 mt-0.5">
                                                                    {v.edicionesEnVentana} edición(es) en ventana de 48h
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Desglose de aspectos */}
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {v.aspectos && Object.entries(v.aspectos).map(([key, val]) => (
                                                            <span key={key} className={`text-xs px-2 py-0.5 rounded-full border ${val >= 4 ? "bg-green-50 border-green-200 text-green-700" : val >= 3 ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-red-50 border-red-200 text-red-600"}`}>
                                                                {key}: {val}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                                {totalPaginasValoraciones > 1 && (
                                    <div className="shrink-0 border-t border-slate-200 px-5 py-3">
                                        <Paginacion paginaActual={paginaValoraciones} totalPaginas={totalPaginasValoraciones}
                                            onCambiar={(p) => { setPaginaValoraciones(p); cargarValoracionesUsuario(modalReportes._id, p) }} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {modalAccion && configModal[modalAccion.accion] && (
                <ModalConfirmar
                    titulo={configModal[modalAccion.accion].titulo}
                    descripcion={configModal[modalAccion.accion].descripcion}
                    textoConfirmar={configModal[modalAccion.accion].textoConfirmar}
                    colorBoton={configModal[modalAccion.accion].color}
                    onConfirmar={ejecutarAccion}
                    onCancelar={() => setModalAccion(null)}
                />
            )}

            {/* Modal detalle usuario */}
            {modalDetalle && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <span className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center overflow-hidden shrink-0">
                                    {modalDetalle.foto?.url ? (
                                        <img src={modalDetalle.foto.url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white text-lg font-bold">{modalDetalle.nombre?.charAt(0)?.toUpperCase() || "U"}</span>
                                    )}
                                </span>
                                <h3 className="font-bold text-slate-800 text-lg">Datos del usuario</h3>
                            </div>
                            <button type="button" onClick={() => setModalDetalle(null)}
                                className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div className="col-span-2"><p className="text-xs text-slate-400">Nombre</p><p className="font-semibold text-slate-700">{modalDetalle.nombre} {modalDetalle.apellido}</p></div>
                                <div className="col-span-2"><p className="text-xs text-slate-400">Correo</p><p className="font-semibold text-slate-700">{modalDetalle.email}</p></div>
                                <div><p className="text-xs text-slate-400">Teléfono</p><p className="font-semibold text-slate-700">{modalDetalle.telefono || <span className="text-slate-400 italic font-normal text-xs">No registrado</span>}</p></div>
                                <div><p className="text-xs text-slate-400">Registro</p><p className="font-semibold text-slate-700">{formatearFecha(modalDetalle.createdAt)}</p></div>
                                <div><p className="text-xs text-slate-400">Región</p><p className="font-semibold text-slate-700">{modalDetalle.region || <span className="text-slate-400 italic font-normal text-xs">No registrada</span>}</p></div>
                                <div><p className="text-xs text-slate-400">Provincia</p><p className="font-semibold text-slate-700">{modalDetalle.provincia || <span className="text-slate-400 italic font-normal text-xs">No registrada</span>}</p></div>
                                <div><p className="text-xs text-slate-400">Total reportes</p><p className="font-bold text-blue-900 text-2xl">{modalDetalle.totalReportes}</p></div>
                                <div><p className="text-xs text-slate-400">Validados</p><p className="font-bold text-green-600 text-2xl">{modalDetalle.reportesVerificados}</p></div>
                                <div><p className="text-xs text-slate-400">Estado</p>
                                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${modalDetalle.baneado ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                                        {modalDetalle.baneado ? "Suspendido" : "Activo"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button type="button"
                                    onClick={() => { setModalDetalle(null); abrirModalReportes(modalDetalle) }}
                                    className="flex-1 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                                    📋 Ver reportes
                                </button>
                                {modalDetalle.baneado ? (
                                    <button type="button"
                                        onClick={() => { setModalDetalle(null); setModalAccion({ usuario: modalDetalle, accion: "desbanear" }) }}
                                        className="flex-1 bg-green-100 hover:bg-green-200 text-green-800 text-sm font-semibold py-2 rounded-lg transition-colors">
                                        Reactivar
                                    </button>
                                ) : (
                                    <button type="button"
                                        onClick={() => { setModalDetalle(null); setModalAccion({ usuario: modalDetalle, accion: "banear" }) }}
                                        className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-semibold py-2 rounded-lg transition-colors">
                                        Suspender
                                    </button>
                                )}
                                <button type="button" onClick={() => setModalDetalle(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold py-2 rounded-lg transition-colors">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminUsuarios