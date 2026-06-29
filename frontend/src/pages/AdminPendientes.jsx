import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { ToastContainer } from "react-toastify"
import axios from "axios"
import storeAuth from "../context/storeAuth"
import storeProfile from "../context/storeProfile"
import Badge from "../components/ui/Badge"
import Paginacion from "../components/ui/Paginacion"
import ModalMotivo from "../components/ui/ModalMotivo"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import useFetch from "../hooks/useFetch"

const diasDesde = (fecha) => {
    const dias = Math.floor((new Date() - new Date(fecha)) / (1000 * 60 * 60 * 24))
    if (dias === 0) return "Hoy"
    if (dias === 1) return "Ayer"
    return `Hace ${dias} días`
}

const formatearFechaHora = (fecha) => {
    if (!fecha) return "—"
    return new Date(fecha).toLocaleString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const colorAntiguedad = (fecha) => {
    const dias = Math.floor((new Date() - new Date(fecha)) / (1000 * 60 * 60 * 24))
    if (dias >= 7) return "text-red-600 font-bold"
    if (dias >= 3) return "text-amber-600 font-semibold"
    return "text-green-600"
}

const AdminPendientes = () => {
    const navigate = useNavigate()
    const { token } = storeAuth()
    const { user } = storeProfile()
    const { fetchDataBackend } = useFetch()

    const [reportes, setReportes] = useState([])
    const [busqueda, setBusqueda] = useState("")
    const [cargando, setCargando] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [total, setTotal] = useState(0)

    // Modales
    const [modalDevolver, setModalDevolver] = useState(null)   // reporte a devolver
    const [modalEliminar, setModalEliminar] = useState(null)   // reporte ajeno (con motivo)
    const [modalEliminarPropio, setModalEliminarPropio] = useState(null) // reporte propio (solo confirmar)

    const cargar = useCallback(async (pag = 1, busq = "") => {
        setCargando(true)
        try {
            const params = new URLSearchParams({ pagina: pag })
            if (busq) params.append("busqueda", busq)
            const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/reportes/pendientes?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            const ordenados = (res.data.reportes || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            setReportes(ordenados)
            setTotalPaginas(res.data.paginas || 1)
            setTotal(res.data.total || 0)
        } catch (error) { console.error(error); setReportes([]) }
        setCargando(false)
    }, [token])

    useEffect(() => { cargar() }, [])

    useEffect(() => {
        const t = setTimeout(() => { setPagina(1); cargar(1, busqueda) }, 400)
        return () => clearTimeout(t)
    }, [busqueda])

    const cambiarPagina = (p) => { setPagina(p); cargar(p, busqueda) }

    const handleValidar = async (id) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/reportes/${id}/validar`
        const headers = { Authorization: `Bearer ${token}` }
        const res = await fetchDataBackend(url, undefined, "PATCH", headers)
        if (res) cargar(pagina, busqueda)
    }

    // Devolver reporte al usuario con observación
    const handleDevolver = async (observacion) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/reportes/${modalDevolver._id}/devolver`
        const headers = { Authorization: `Bearer ${token}` }
        const res = await fetchDataBackend(url, { observacion }, "PATCH", headers)
        if (res) { setModalDevolver(null); cargar(pagina, busqueda) }
    }

    // Eliminar reporte ajeno (con motivo → manda correo)
    const handleEliminarAjeno = async (motivo) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/reportes/${modalEliminar._id}`
        const headers = { Authorization: `Bearer ${token}` }
        const res = await fetchDataBackend(url, { motivo }, "DELETE", headers)
        if (res) { setModalEliminar(null); cargar(pagina, busqueda) }
    }

    // Eliminar reporte propio (solo confirmación, sin correo)
    const handleEliminarPropio = async () => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/reportes/${modalEliminarPropio._id}`
        const headers = { Authorization: `Bearer ${token}` }
        const res = await fetchDataBackend(url, undefined, "DELETE", headers)
        if (res) { setModalEliminarPropio(null); cargar(pagina, busqueda) }
    }

    // Decide qué modal abrir al eliminar
    const handleClickEliminar = (r) => {
        const esPropio = r.usuario?._id === user?._id || r.usuario?.email === user?.email
        if (esPropio) setModalEliminarPropio(r)
        else setModalEliminar(r)
    }

    return (
        <div>
            <ToastContainer />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Validar reportes</h1>
            <p className="text-slate-500 mb-2">{total} reporte(s) pendientes, ordenados del más antiguo al más reciente.</p>

            <div className="flex gap-4 text-xs mb-4 flex-wrap">
                <span className="text-green-600">● Reciente (menos de 3 días)</span>
                <span className="text-amber-600">● Moderado (3-6 días)</span>
                <span className="text-red-600">● Urgente (7+ días)</span>
            </div>

            <div className="flex gap-3 mb-6">
                <input type="text" placeholder="Buscar por marca, modelo o falla..."
                    className="flex-1 rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                    value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                {busqueda && <button type="button" onClick={() => setBusqueda("")} className="px-3 py-2 text-sm text-slate-500 hover:underline">Limpiar</button>}
            </div>

            {cargando ? <p className="text-slate-400">Cargando...</p>
            : reportes.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center text-green-700">
                    No hay reportes pendientes. ¡Todo al día!
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                        <table className="w-full">
                            <thead className="bg-slate-800 text-slate-200">
                                <tr>
                                    <th className="p-3 text-center">Vehículo</th>
                                    <th className="p-3 text-center">Falla</th>
                                    <th className="p-3 text-center">Gravedad</th>
                                    <th className="p-3 text-center">Usuario</th>
                                    <th className="p-3 text-center">Fecha subida</th>
                                    <th className="p-3 text-center">Antigüedad</th>
                                    <th className="p-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportes.map((r, i) => (
                                    <tr key={r._id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                        <td className="p-3 text-sm">
                                            <div className="font-semibold">{r.vehiculo?.marca} {r.vehiculo?.modelo}</div>
                                            <div className="text-slate-400">{r.vehiculo?.anio}</div>
                                        </td>
                                        <td className="p-3">{r.falla?.nombre}</td>
                                        <td className="p-3"><Badge tipo={r.gravedad} /></td>
                                        <td className="p-3 text-sm">
                                            <div className="font-semibold text-slate-700">{r.usuario?.nombre} {r.usuario?.apellido}</div>
                                            <div className="text-slate-400 text-xs">{r.usuario?.email}</div>
                                        </td>
                                        <td className="p-3 text-sm text-slate-500">{formatearFechaHora(r.createdAt)}</td>
                                        <td className={`p-3 text-sm ${colorAntiguedad(r.createdAt)}`}>{diasDesde(r.createdAt)}</td>
                                        <td className="p-3 text-center">
                                            <div className="flex flex-col gap-1.5 items-center">
                                                <button type="button" onClick={() => navigate(`/dashboard/reporte/${r._id}`)}
                                                    className="w-full bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                                    👁 Revisar
                                                </button>
                                                <button type="button" onClick={() => handleClickEliminar(r)}
                                                    className="w-full bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                                    🗑 Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
                </>
            )}

            {/* Modal devolver con observación */}
            {modalDevolver && (
                <ModalMotivo
                    titulo="↩️ Devolver reporte al usuario"
                    descripcion={`Escribe qué debe corregir ${modalDevolver.usuario?.nombre} ${modalDevolver.usuario?.apellido}. El usuario recibirá esta observación por correo y podrá editar su reporte.`}
                    colorBoton="bg-blue-900 hover:bg-blue-800"
                    onConfirmar={handleDevolver}
                    onCancelar={() => setModalDevolver(null)}
                />
            )}

            {/* Modal eliminar reporte ajeno (con motivo → correo) */}
            {modalEliminar && (
                <ModalMotivo
                    titulo="Eliminar reporte"
                    descripcion={`Vas a eliminar el reporte de ${modalEliminar.usuario?.nombre} ${modalEliminar.usuario?.apellido}. El usuario recibirá un correo con el motivo.`}
                    onConfirmar={handleEliminarAjeno}
                    onCancelar={() => setModalEliminar(null)}
                />
            )}

            {/* Modal eliminar reporte propio (solo confirmación) */}
            {modalEliminarPropio && (
                <ModalConfirmar
                    titulo="¿Eliminar este reporte?"
                    descripcion="¿Estás seguro de que deseas eliminar este reporte? Se moverá a la papelera."
                    textoConfirmar="Sí, eliminar"
                    onConfirmar={handleEliminarPropio}
                    onCancelar={() => setModalEliminarPropio(null)}
                />
            )}
        </div>
    )
}

export default AdminPendientes