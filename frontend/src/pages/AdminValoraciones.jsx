import { useEffect, useState, useCallback } from "react"
import { ToastContainer, toast } from "react-toastify"
import {
    getValoracionesModeracion,
    eliminarValoracionAdmin,
    restaurarValoracionAdmin
} from "../services/valoracionService"
import Paginacion from "../components/ui/Paginacion"
import ModalConfirmar from "../components/ui/ModalConfirmar"

const formatearFechaHora = (fecha) => {
    if (!fecha) return "—"
    return new Date(fecha).toLocaleString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const Estrellas = ({ valor }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => {
            const pct = Math.max(0, Math.min(100, (valor - (i - 1)) * 100))
            return (
                <span key={i} className="relative inline-block leading-none text-sm">
                    <span className="text-slate-200">★</span>
                    <span className="absolute inset-0 overflow-hidden text-amber-400" style={{ width: `${pct}%` }}>★</span>
                </span>
            )
        })}
    </div>
)

const AdminValoraciones = () => {
    const [valoraciones, setValoraciones] = useState([])
    const [cargando, setCargando] = useState(true)
    const [busqueda, setBusqueda] = useState("")
    const [filtroEstado, setFiltroEstado] = useState("activo") // activo | eliminado | ""
    const [soloConComentario, setSoloConComentario] = useState(false)
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [total, setTotal] = useState(0)

    const [modalEliminar, setModalEliminar] = useState(null)
    const [modalRestaurar, setModalRestaurar] = useState(null)

    const cargar = useCallback(async (pag = 1, busq = "", estado = "activo", soloComentario = false) => {
        setCargando(true)
        try {
            const res = await getValoracionesModeracion({ pagina: pag, busqueda: busq, estado, soloConComentario: soloComentario })
            setValoraciones(res.data.valoraciones || [])
            setTotalPaginas(res.data.paginas || 1)
            setTotal(res.data.total || 0)
        } catch (error) {
            console.error(error)
            setValoraciones([])
        }
        setCargando(false)
    }, [])

    useEffect(() => { cargar(1, "", filtroEstado, soloConComentario) }, [])

    useEffect(() => {
        const t = setTimeout(() => { setPagina(1); cargar(1, busqueda, filtroEstado, soloConComentario) }, 400)
        return () => clearTimeout(t)
    }, [busqueda])

    useEffect(() => { setPagina(1); cargar(1, busqueda, filtroEstado, soloConComentario) }, [filtroEstado, soloConComentario])

    const handleEliminar = async () => {
        try {
            await eliminarValoracionAdmin(modalEliminar._id)
            toast.success("Valoración eliminada por moderación")
            setModalEliminar(null)
            cargar(pagina, busqueda, filtroEstado, soloConComentario)
        } catch { toast.error("Error al eliminar la valoración") }
    }

    const handleRestaurar = async () => {
        try {
            await restaurarValoracionAdmin(modalRestaurar._id)
            toast.success("Valoración restaurada")
            setModalRestaurar(null)
            cargar(pagina, busqueda, filtroEstado, soloConComentario)
        } catch { toast.error("Error al restaurar la valoración") }
    }

    return (
        <div>
            <ToastContainer />
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Moderar valoraciones</h1>
            <p className="text-slate-500 mb-6 text-sm">
                Revisa comentarios de usuarios y elimina contenido ofensivo o inapropiado · {total} valoración(es)
            </p>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow p-4 mb-6 space-y-3">
                <div className="flex flex-wrap gap-3">
                    <input type="text" placeholder="Buscar por usuario, correo, vehículo o comentario..."
                        className="flex-1 min-w-64 rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm"
                        value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                    <select className="rounded-md border border-slate-300 py-2 px-3 text-slate-700 text-sm"
                        value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                        <option value="activo">Activas</option>
                        <option value="eliminado">Eliminadas (papelera)</option>
                        <option value="">Todas</option>
                    </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer w-fit">
                    <input type="checkbox" checked={soloConComentario} onChange={e => setSoloConComentario(e.target.checked)}
                        className="rounded border-slate-300" />
                    Solo valoraciones con comentario escrito
                </label>
            </div>

            {/* Lista */}
            {cargando ? (
                <p className="text-slate-400 text-center py-10">Cargando valoraciones...</p>
            ) : valoraciones.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-10 text-center text-slate-400">
                    No hay valoraciones que coincidan con los filtros.
                </div>
            ) : (
                <div className="space-y-3">
                    {valoraciones.map(v => {
                        const prom = v.aspectos ? Math.round((Object.values(v.aspectos).reduce((a, b) => a + b, 0) / 7) * 10) / 10 : 0
                        return (
                            <div key={v._id} className={`bg-white rounded-xl shadow p-4 ${!v.activo ? "opacity-60" : ""}`}>
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="font-semibold text-slate-800 text-sm">
                                                {v.vehiculo?.marca} {v.vehiculo?.modelo} {v.vehiculo?.anio}
                                                {v.vehiculo?.version && <span className="text-xs text-slate-400 ml-1">({v.vehiculo.version})</span>}
                                            </span>
                                            {!v.activo && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                                                    Eliminada
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            👤 {v.usuario?.nombre} {v.usuario?.apellido} · {v.usuario?.email}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Estrellas valor={prom} />
                                            <span className="text-xs font-bold text-slate-600">{prom}/5</span>
                                        </div>
                                        {v.comentario && (
                                            <p className="text-sm text-slate-600 italic mt-2 bg-slate-50 rounded-lg px-3 py-2">
                                                "{v.comentario}"
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {v.aspectos && Object.entries(v.aspectos).map(([key, val]) => (
                                                <span key={key} className={`text-xs px-2 py-0.5 rounded-full border ${val >= 4 ? "bg-green-50 border-green-200 text-green-700" : val >= 3 ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-red-50 border-red-200 text-red-600"}`}>
                                                    {key}: {val}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-slate-400">Creada: {formatearFechaHora(v.createdAt)}</p>
                                        {v.updatedAt !== v.createdAt && (
                                            <p className="text-xs text-amber-500 mt-0.5">Editada: {formatearFechaHora(v.updatedAt)}</p>
                                        )}
                                        {v.edicionesEnVentana > 0 && (
                                            <p className="text-xs text-slate-300 mt-0.5">{v.edicionesEnVentana} edición(es) en ventana 48h</p>
                                        )}
                                        <div className="mt-2">
                                            {v.activo ? (
                                                <button type="button" onClick={() => setModalEliminar(v)}
                                                    className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                                    🗑 Eliminar
                                                </button>
                                            ) : (
                                                <button type="button" onClick={() => setModalRestaurar(v)}
                                                    className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                                    ↺ Restaurar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {totalPaginas > 1 && (
                <div className="mt-6">
                    <Paginacion paginaActual={pagina} totalPaginas={totalPaginas}
                        onCambiar={(p) => { setPagina(p); cargar(p, busqueda, filtroEstado, soloConComentario) }} />
                </div>
            )}

            {modalEliminar && (
                <ModalConfirmar
                    titulo="¿Eliminar esta valoración?"
                    descripcion={`Se eliminará la valoración de ${modalEliminar.usuario?.nombre} ${modalEliminar.usuario?.apellido} para ${modalEliminar.vehiculo?.marca} ${modalEliminar.vehiculo?.modelo}. Podrás restaurarla después desde la papelera.`}
                    textoConfirmar="Sí, eliminar"
                    colorBoton="bg-red-600 hover:bg-red-700"
                    onConfirmar={handleEliminar}
                    onCancelar={() => setModalEliminar(null)}
                />
            )}

            {modalRestaurar && (
                <ModalConfirmar
                    titulo="¿Restaurar esta valoración?"
                    descripcion="La valoración volverá a contar en el promedio y será visible públicamente."
                    textoConfirmar="Sí, restaurar"
                    colorBoton="bg-green-600 hover:bg-green-700"
                    onConfirmar={handleRestaurar}
                    onCancelar={() => setModalRestaurar(null)}
                />
            )}
        </div>
    )
}

export default AdminValoraciones