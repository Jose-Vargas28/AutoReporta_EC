import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useParams, useNavigate } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import {
    getReporteDetalle,
    subirImagenes,
    subirDocumentos,
    agregarEnlace,
    eliminarImagen,
    eliminarDocumento,
    eliminarEnlace,
} from "../services/reporteService"
import useFetch from "../hooks/useFetch"
import { esYoutube } from "../helpers/youtube"
import SeccionEvidencia from "../components/ui/SeccionEvidencia"
import storeAuth from "../context/storeAuth"

const EditarReporte = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { register, handleSubmit, reset } = useForm()
    const { fetchDataBackend } = useFetch()
    const { rol } = storeAuth()
    const [cargando, setCargando] = useState(true)
    const [reporte, setReporte] = useState(null)

    // Estados para nuevas evidencias
    const [imagenes, setImagenes] = useState([])
    const [documentos, setDocumentos] = useState([])
    const [enlaceUrl, setEnlaceUrl] = useState("")
    const [enlaceTitulo, setEnlaceTitulo] = useState("")
    const [subiendoImagenes, setSubiendoImagenes] = useState(false)
    const [subiendoDocumentos, setSubiendoDocumentos] = useState(false)

    const cargar = async () => {
        try {
            const res = await getReporteDetalle(id)
            setReporte(res.data)
            reset({
                gravedad: res.data.gravedad,
                descripcion: res.data.descripcion,
            })
        } catch (error) {
            console.error(error)
        }
        setCargando(false)
    }

    useEffect(() => {
        cargar()
    }, [id])

    // ---- Guardar datos de texto ----
    const onSubmit = async (data) => {
        const payload = { descripcion: data.descripcion, gravedad: data.gravedad }
        const storedUser = JSON.parse(localStorage.getItem("auth-token"))
        const url = `${import.meta.env.VITE_BACKEND_URL}/reportes/${id}`
        const headers = { Authorization: `Bearer ${storedUser?.state?.token}` }
        const res = await fetchDataBackend(url, payload, "PUT", headers)
        if (res) {
            if (reporte?.observacion) {
                toast.info("Reporte actualizado. La observación fue eliminada y tu reporte vuelve a estado pendiente de revisión.", { autoClose: 4000 })
            }
            setTimeout(() => navigate("/dashboard/mis-reportes"), reporte?.observacion ? 4500 : 1500)
        }
    }

    // ---- Subir imágenes ----
    const handleSubirImagenes = async () => {
        if (imagenes.length === 0) return toast.error("Selecciona al menos una imagen")
        setSubiendoImagenes(true)
        const formData = new FormData()
        imagenes.forEach((img) => formData.append("imagenes", img))
        try {
            await subirImagenes(id, formData)
            toast.success("Imágenes subidas")
            setImagenes([])
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al subir imágenes")
        }
        setSubiendoImagenes(false)
    }

    // ---- Subir documentos ----
    const handleSubirDocumentos = async () => {
        if (documentos.length === 0) return toast.error("Selecciona al menos un documento")
        setSubiendoDocumentos(true)
        const formData = new FormData()
        documentos.forEach((doc) => formData.append("documentos", doc))
        try {
            await subirDocumentos(id, formData)
            toast.success("Documentos subidos")
            setDocumentos([])
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al subir documentos")
        }
        setSubiendoDocumentos(false)
    }

    // ---- Agregar enlace ----
    const handleAgregarEnlace = async () => {
        if (!enlaceUrl) return toast.error("Ingresa una URL")
        const tipo = esYoutube(enlaceUrl) ? "youtube" : "externo"
        try {
            await agregarEnlace(id, { url: enlaceUrl, tipo, titulo: enlaceTitulo })
            toast.success("Enlace agregado")
            setEnlaceUrl("")
            setEnlaceTitulo("")
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al agregar enlace")
        }
    }

    // ---- Eliminar evidencias ----
    const handleEliminarImagen = async (imagenId) => {
        if (!confirm("¿Eliminar esta imagen?")) return
        try {
            await eliminarImagen(id, imagenId)
            toast.success("Imagen eliminada")
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error")
        }
    }

    const handleEliminarDocumento = async (docId) => {
        if (!confirm("¿Eliminar este documento?")) return
        try {
            await eliminarDocumento(id, docId)
            toast.success("Documento eliminado")
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error")
        }
    }

    const handleEliminarEnlace = async (enlaceId) => {
        if (!confirm("¿Eliminar este enlace?")) return
        try {
            await eliminarEnlace(id, enlaceId)
            toast.success("Enlace eliminado")
            cargar()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error")
        }
    }

    const inputClass = "block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
    const labelClass = "mb-2 block text-sm font-semibold text-slate-700"

    if (cargando) return <p className="text-slate-400">Cargando...</p>

    if (reporte?.validado && rol !== "admin") return (
        <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate(-1)} className="text-blue-700 hover:underline mb-4 text-sm">
                ← Volver
            </button>
            <div className="bg-green-50 border border-green-300 rounded-xl p-6 text-center">
                <p className="text-2xl mb-2">✅</p>
                <h2 className="text-lg font-bold text-green-800 mb-1">Este reporte ya fue validado</h2>
                <p className="text-sm text-green-700">Los reportes validados no se pueden editar. Si necesitas hacer una corrección, contacta al administrador.</p>
            </div>
        </div>
    )

    return (
        <div className="max-w-3xl mx-auto">
            <ToastContainer />
            <button onClick={() => navigate(-1)} className="text-blue-700 hover:underline mb-4 text-sm">
                ← Volver
            </button>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Editar reporte</h1>

            {/* Banner de observación del admin */}
            {reporte?.observacion && (
                <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 mb-6">
                    <p className="text-sm font-bold text-blue-800 mb-1">↩️ El administrador devolvió este reporte con una observación</p>
                    <p className="text-sm text-blue-700 mb-2">{reporte.observacion}</p>
                    <p className="text-xs text-blue-500">Corrige lo indicado y guarda los cambios. Al guardar, el reporte volverá a estado <span className="font-semibold">pendiente de revisión</span>.</p>
                </div>
            )}

            {/* ---- Datos del reporte ---- */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-bold text-slate-700 mb-4">Datos del reporte</h2>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-500">Vehículo y falla (no editables)</p>
                    <p className="font-semibold text-slate-700">
                        {reporte?.vehiculo?.marca} {reporte?.vehiculo?.modelo} {reporte?.vehiculo?.anio} — {reporte?.falla?.nombre}
                    </p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mt-4">
                        <label className={labelClass}>Nivel de gravedad</label>
                        <select className={inputClass} {...register("gravedad")}>
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                        </select>
                    </div>

                    <div className="mt-4">
                        <label className={labelClass}>Descripción</label>
                        <textarea className={`${inputClass} h-28 resize-none`} {...register("descripcion")} />
                    </div>

                    <button type="submit" className="mt-6 w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors">
                        Guardar cambios
                    </button>
                </form>
            </div>

            {/* ---- Imágenes ---- */}
            <SeccionEvidencia
                titulo="Fotos de la falla"
                descripcion="Sube fotos que muestren claramente el problema."
                limite={5}
                actual={reporte?.imagenes?.length || 0}
                icono="📷"
                accept="image/*"
                archivosSeleccionados={imagenes}
                onAgregar={(nuevos) => setImagenes(prev => [...prev, ...nuevos])}
                onQuitarArchivo={(i) => setImagenes(prev => prev.filter((_, idx) => idx !== i))}
                onSubir={handleSubirImagenes}
                subiendo={subiendoImagenes}
                textoBoton="Subir fotos"
            >
                {reporte?.imagenes?.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {reporte.imagenes.map((img) => (
                            <div key={img._id} className="relative">
                                <img src={img.url} alt={img.nombre} className="w-full h-32 object-cover rounded-lg" />
                                <button type="button" onClick={() => handleEliminarImagen(img._id)}
                                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded-lg">
                                    Quitar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </SeccionEvidencia>

            {/* ---- Documentos ---- */}
            <SeccionEvidencia
                titulo="Documentos"
                descripcion="Facturas, recibos u otros comprobantes (imágenes o PDF)."
                limite={3}
                actual={reporte?.documentos?.length || 0}
                icono="📄"
                accept="image/*,application/pdf"
                archivosSeleccionados={documentos}
                onAgregar={(nuevos) => setDocumentos(prev => [...prev, ...nuevos])}
                onQuitarArchivo={(i) => setDocumentos(prev => prev.filter((_, idx) => idx !== i))}
                onSubir={handleSubirDocumentos}
                subiendo={subiendoDocumentos}
                textoBoton="Subir documentos"
            >
                {reporte?.documentos?.length > 0 && (
                    <ul className="space-y-2 mb-4">
                        {reporte.documentos.map((doc) => (
                            <li key={doc._id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                                <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline text-sm flex items-center gap-2">
                                    📄 {doc.nombre || "Documento"}
                                </a>
                                <button type="button" onClick={() => handleEliminarDocumento(doc._id)}
                                    className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-2 py-1 rounded-lg">
                                    Quitar
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </SeccionEvidencia>

            {/* ---- Enlaces ---- */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">🔗 Enlaces de referencia</h2>
                        <p className="text-slate-400 text-sm mt-1">Videos de YouTube, Consumer Reports, Latin NCAP, etc.</p>
                    </div>
                    <div className={`text-xs font-semibold px-3 py-1.5 rounded-full ${(reporte?.enlaces?.length || 0) >= 5 ? "bg-red-100 text-red-700" : (reporte?.enlaces?.length || 0) > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                        {reporte?.enlaces?.length || 0}/5
                    </div>
                </div>

                {reporte?.enlaces?.length > 0 && (
                    <ul className="space-y-2 mb-4">
                        {reporte.enlaces.map((e) => (
                            <li key={e._id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                                <span className="flex items-center gap-2 text-sm min-w-0">
                                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${e.tipo === "youtube" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                                        {e.tipo === "youtube" ? "YouTube" : "Externo"}
                                    </span>
                                    <a href={e.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline truncate">
                                        {e.titulo || e.url}
                                    </a>
                                </span>
                                <button type="button" onClick={() => handleEliminarEnlace(e._id)}
                                    className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-2 py-1 rounded-lg shrink-0 ml-2">
                                    Quitar
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {(reporte?.enlaces?.length || 0) < 5 && (
                    <div className="space-y-3">
                        <input className={inputClass} placeholder="Pega la URL aquí (YouTube, Consumer Reports, Latin NCAP...)"
                            value={enlaceUrl} onChange={(e) => setEnlaceUrl(e.target.value)} />
                        <input className={inputClass} placeholder="Título o descripción (ej: Latin NCAP — Aveo 2017)"
                            value={enlaceTitulo} onChange={(e) => setEnlaceTitulo(e.target.value)} />
                        <button type="button" onClick={handleAgregarEnlace}
                            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors">
                            🔗 Agregar enlace
                        </button>
                    </div>
                )}

                {(reporte?.enlaces?.length || 0) >= 5 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                        Has alcanzado el límite de 5 enlaces. Quita uno para agregar otro.
                    </div>
                )}
            </div>
        </div>
    )
}

export default EditarReporte