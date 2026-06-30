import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import { getReporteDetalle, validarReporte, invalidarReporte, devolverReporte } from "../services/reporteService"
import { exportarReportePDF } from "../services/exportService"
import { getYoutubeEmbedUrl } from "../helpers/youtube"
import Badge from "../components/ui/Badge"
import ModalMotivo from "../components/ui/ModalMotivo"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import LogoMarca from "../components/ui/LogoMarca"
import storeProfile from "../context/storeProfile"
import storeAuth from "../context/storeAuth"

const formatearFechaHora = (fecha) => {
    if (!fecha) return "—"
    return new Date(fecha).toLocaleString("es-EC", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    })
}

const DetalleReporte = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [reporte, setReporte] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [modalInvalidar, setModalInvalidar] = useState(false)
    const [modalInvalidarPropio, setModalInvalidarPropio] = useState(false)
    const [modalValidar, setModalValidar] = useState(false)
    const [modalDevolver, setModalDevolver] = useState(false)
    const { rol, token } = storeAuth()
    const { user } = storeProfile()
    const [exportandoPDF, setExportandoPDF] = useState(false)

    const cargar = async () => {
        try {
            const res = await getReporteDetalle(id)
            setReporte(res.data)
        } catch (error) {
            console.error(error)
        }
        setCargando(false)
    }

    useEffect(() => { cargar() }, [id])

    const esReportePropio = reporte?.usuario?._id === user?._id

    const handleValidar = async () => {
        try {
            await validarReporte(id)
            toast.success("Reporte validado")
            setModalValidar(false)
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al validar")
        }
    }

    const handleDevolver = async (observacion) => {
        try {
            await devolverReporte(id, observacion)
            toast.success("Reporte devuelto al usuario con observación")
            setModalDevolver(false)
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error")
        }
    }

    const handleInvalidar = async (motivo) => {
        try {
            await invalidarReporte(id, motivo)
            toast.success("Validación retirada")
            setModalInvalidar(false)
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error")
        }
    }

    // Retirar validación de un reporte propio del admin: sin motivo escrito,
    // sin correo (no tiene sentido notificarse a uno mismo).
    const handleInvalidarPropio = async () => {
        try {
            await invalidarReporte(id)
            toast.success("Validación retirada")
            setModalInvalidarPropio(false)
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error")
        }
    }

    const handleExportarPDF = async () => {
        setExportandoPDF(true)
        try {
            await exportarReportePDF(token, id)
        } catch (error) {
            toast.error("Error al generar el PDF")
        }
        setExportandoPDF(false)
    }

    if (cargando) return <p className="text-slate-400">Cargando...</p>
    if (!reporte) return <p className="text-slate-500">Reporte no encontrado.</p>

    const enlacesYoutube = reporte.enlaces?.filter((e) => e.tipo === "youtube") || []
    const enlacesExternos = reporte.enlaces?.filter((e) => e.tipo === "externo") || []

    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={() => navigate(-1)} className="text-blue-700 hover:underline mb-4 text-sm">
                ← Volver
            </button>

            {/* Datos principales */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">

                <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <LogoMarca marca={reporte.vehiculo?.marca} size={70} />
                            <h1 className="text-3xl font-bold text-slate-800">
                                {reporte.vehiculo?.marca} {reporte.vehiculo?.modelo}
                            </h1>
                        </div>
                        <p className="text-slate-500">Año {reporte.vehiculo?.anio}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {reporte.vehiculo?.tipo && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                                    {reporte.vehiculo.tipo}
                                </span>
                            )}
                            {reporte.vehiculo?.combustible && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
                                    {reporte.vehiculo.combustible}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Badge tipo={reporte.gravedad} />
                        <Badge tipo={reporte.validado ? "validado" : "pendiente"} />
                    </div>
                </div>

                <div className="mt-4 border-t pt-4">
                    <p className="text-sm text-slate-400 mb-1">Tipo de falla</p>
                    <p className="text-slate-700 font-semibold mb-4">{reporte.falla?.nombre}</p>

                    {reporte.descripcion && (
                        <>
                            <p className="text-sm text-slate-400 mb-1">Descripción</p>
                            <p className="text-slate-700">{reporte.descripcion}</p>
                        </>
                    )}

                    {reporte.usuario && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
                            <p className="text-xs text-slate-400">
                                <span className="font-semibold">Reportado por:</span> {reporte.usuario.nombre} ({reporte.usuario.email})
                            </p>
                            {(reporte.usuario.region || reporte.usuario.provincia) && (
                                <p className="text-xs text-slate-400">
                                    <span className="font-semibold">Ubicación:</span>{" "}
                                    {[reporte.usuario.region, reporte.usuario.provincia].filter(Boolean).join(", ")}
                                </p>
                            )}
                            <p className="text-xs text-slate-400">
                                <span className="font-semibold">Fecha de reporte:</span> {formatearFechaHora(reporte.createdAt)}
                            </p>
                            {reporte.validado && reporte.validadoEn && (
                                <p className="text-xs text-green-600">
                                    <span className="font-semibold">Validado el:</span> {formatearFechaHora(reporte.validadoEn)}
                                    {reporte.validadoPor && ` por ${reporte.validadoPor.nombre}`}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Acciones del admin */}
                    {/* Botón PDF — cualquier usuario logueado en reportes validados */}
                    {reporte.validado && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <button type="button" onClick={handleExportarPDF} disabled={exportandoPDF}
                                className="w-full mb-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                {exportandoPDF ? "Generando PDF..." : "📄 Descargar constancia en PDF"}
                            </button>
                        </div>
                    )}

                    {rol === "admin" && (
                        <div className={`${!reporte.validado ? "mt-4 pt-4 border-t border-slate-100" : ""}`}>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Acciones de administrador</p>
                            {!reporte.validado ? (
                                <div className="flex flex-col gap-2">
                                    <button type="button" onClick={() => setModalValidar(true)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                                        ✅ Validar reporte
                                    </button>
                                    <button type="button" onClick={() => setModalDevolver(true)}
                                        className="w-full bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                                        ↩️ Devolver con observación
                                    </button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => esReportePropio ? setModalInvalidarPropio(true) : setModalInvalidar(true)}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                                    ⚠️ Retirar validación
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Imágenes */}
            {reporte.imagenes?.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Fotos de la falla</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {reporte.imagenes.map((img) => (
                            <a key={img._id} href={img.url} target="_blank" rel="noreferrer">
                                <img src={img.url} alt={img.nombre} className="w-full h-40 object-cover rounded-lg hover:opacity-90 transition-opacity" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Documentos */}
            {reporte.documentos?.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Documentos de respaldo</h2>
                    <ul className="space-y-2">
                        {reporte.documentos.map((doc) => (
                            <li key={doc._id}>
                                <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline flex items-center gap-2">
                                    📄 {doc.nombre || "Ver documento"}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Videos de YouTube */}
            {enlacesYoutube.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Videos de referencia</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {enlacesYoutube.map((e) => {
                            const embed = getYoutubeEmbedUrl(e.url)
                            return embed ? (
                                <div key={e._id}>
                                    <div className="aspect-video">
                                        <iframe src={embed} title={e.titulo || "Video"}
                                            className="w-full h-full rounded-lg" allowFullScreen />
                                    </div>
                                    {e.titulo && <p className="text-sm text-slate-500 mt-2">{e.titulo}</p>}
                                </div>
                            ) : null
                        })}
                    </div>
                </div>
            )}

            {/* Enlaces externos */}
            {enlacesExternos.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Fuentes externas</h2>
                    <ul className="space-y-2">
                        {enlacesExternos.map((e) => (
                            <li key={e._id}>
                                <a href={e.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline flex items-center gap-2">
                                    🔗 {e.titulo || e.url}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {modalValidar && (
                <ModalConfirmar
                    titulo="¿Validar este reporte?"
                    descripcion="Se marcará como verificado y será visible para todos los usuarios."
                    textoConfirmar="Continuar"
                    colorBoton="bg-green-600 hover:bg-green-700"
                    onConfirmar={handleValidar}
                    onCancelar={() => setModalValidar(false)}
                />
            )}
            {modalInvalidarPropio && (
                <ModalConfirmar
                    titulo="¿Retirar la validación?"
                    descripcion="Es tu propio reporte, así que no se enviará ningún correo ni se pedirá un motivo."
                    textoConfirmar="Continuar"
                    colorBoton="bg-amber-500 hover:bg-amber-600"
                    onConfirmar={handleInvalidarPropio}
                    onCancelar={() => setModalInvalidarPropio(false)}
                />
            )}
            {modalDevolver && (
                <ModalMotivo
                    titulo="↩️ Devolver reporte al usuario"
                    descripcion="Escribe qué debe corregir el usuario. Recibirá esta observación por correo y podrá editar su reporte."
                    colorBoton="bg-blue-900 hover:bg-blue-800"
                    onConfirmar={handleDevolver}
                    onCancelar={() => setModalDevolver(false)}
                />
            )}
            {modalInvalidar && (
                <ModalMotivo
                    titulo="Retirar validación"
                    descripcion="El usuario recibirá un correo explicando el motivo."
                    colorBoton="bg-amber-500 hover:bg-amber-600"
                    onConfirmar={handleInvalidar}
                    onCancelar={() => setModalInvalidar(false)}
                />
            )}
            <ToastContainer />
        </div>
    )
}

export default DetalleReporte