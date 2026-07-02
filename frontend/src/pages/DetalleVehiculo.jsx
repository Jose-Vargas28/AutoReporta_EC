import { useEffect, useState } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import { getValoracionesVehiculo, crearValoracion, eliminarValoracion } from "../services/valoracionService"
import { agregarEnlaceVehiculo, eliminarEnlaceVehiculo } from "../services/catalogoService"
import storeAuth from "../context/storeAuth"
import LogoMarca from "../components/ui/LogoMarca"
import Paginacion from "../components/ui/Paginacion"
import ModalConfirmar from "../components/ui/ModalConfirmar"

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY

const ASPECTOS = [
    { key: "confiabilidad", label: "Confiabilidad", emoji: "🔧" },
    { key: "seguridad",     label: "Seguridad",     emoji: "🛡️" },
    { key: "consumo",       label: "Consumo de combustible", emoji: "⛽" },
    { key: "precio",        label: "Precio del vehículo",    emoji: "💰" },
    { key: "comodidad",     label: "Comodidad",     emoji: "🛋️" },
    { key: "mantenimiento", label: "Mantenimiento", emoji: "🔩" },
    { key: "repuestos",     label: "Precio de repuestos",    emoji: "🏪" },
]

// Estrellas interactivas
const EstrellasInput = ({ valor, onChange }) => (
    <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
            <button key={i} type="button" onClick={() => onChange(i)}
                className={`text-2xl transition-transform hover:scale-110 ${i <= valor ? "text-amber-400" : "text-slate-200"}`}>
                ★
            </button>
        ))}
    </div>
)

// Estrellas solo lectura
// Estrellas con relleno parcial (ej: 4.3 = 4 llenas + la 5ta al 30%)
const Estrellas = ({ valor, size = "sm" }) => {
    const sz = size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-base"
    return (
        <div className={`flex gap-0.5 ${sz}`}>
            {[1, 2, 3, 4, 5].map(i => {
                const pct = Math.max(0, Math.min(100, (valor - (i - 1)) * 100))
                return (
                    <span key={i} className="relative inline-block leading-none">
                        <span className="text-slate-200">★</span>
                        <span className="absolute inset-0 overflow-hidden text-amber-400" style={{ width: `${pct}%` }}>★</span>
                    </span>
                )
            })}
        </div>
    )
}

const BarraAspecto = ({ label, emoji, valor }) => {
    const pct = (valor / 5) * 100
    const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : pct >= 40 ? "bg-orange-400" : "bg-red-500"
    return (
        <div className="flex items-center gap-3">
            <span className="text-base w-6 text-center">{emoji}</span>
            <span className="text-sm text-slate-600 w-44 shrink-0">{label}</span>
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-700 w-8 text-right">{valor}/5</span>
        </div>
    )
}

const formatearFecha = (f) => new Date(f).toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" })

const DetalleVehiculo = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const confirmado = searchParams.get("confirmado") === "true"
    const { token, _id: userId, rol } = storeAuth()

    const [datos, setDatos] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [modalAdvertenciaValorar, setModalAdvertenciaValorar] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [modalEliminar, setModalEliminar] = useState(false)
    const [fotoSrc, setFotoSrc] = useState(null)

    const [form, setForm] = useState({
        confiabilidad: 0, seguridad: 0, consumo: 0,
        precio: 0, comodidad: 0, mantenimiento: 0, repuestos: 0,
        comentario: ""
    })

    const [mostrarFormEnlace, setMostrarFormEnlace] = useState(false)
    const [formEnlace, setFormEnlace] = useState({ url: "", titulo: "", descripcion: "" })
    const [enviandoEnlace, setEnviandoEnlace] = useState(false)
    const [modalEliminarEnlace, setModalEliminarEnlace] = useState(null)
    const [enlaces, setEnlaces] = useState([])

    const handleClickValorar = () => {
        // Se salta la advertencia si ya viene confirmado desde otro flujo
        // (reportó la falla, vio el aviso en el catálogo de vehículos) o si
        // ya tiene una valoración previa (ya pasó por la advertencia antes).
        if (confirmado || datos?.miValoracion) {
            setMostrarFormulario(true)
        } else {
            setModalAdvertenciaValorar(true)
        }
    }

    const confirmarYAbrirFormulario = () => {
        setModalAdvertenciaValorar(false)
        setMostrarFormulario(true)
    }

    const cargar = async (pag = 1) => {
        setCargando(true)
        try {
            const res = await getValoracionesVehiculo(id, pag)
            setDatos(res.data)
            setEnlaces(res.data.vehiculo?.enlaces || [])
            // Si tiene mi valoración, pre-llenar el formulario
            if (res.data.miValoracion) {
                const asp = res.data.miValoracion.aspectos
                setForm({ ...asp, comentario: res.data.miValoracion.comentario || "" })
            }
        } catch (e) { console.error(e) }
        setCargando(false)
    }

    const handleAgregarEnlace = async () => {
        if (!formEnlace.url || !formEnlace.titulo) return toast.error("URL y título son obligatorios")
        setEnviandoEnlace(true)
        try {
            const res = await agregarEnlaceVehiculo(id, formEnlace)
            toast.success("Enlace agregado correctamente")
            setEnlaces(res.data.enlaces)
            setFormEnlace({ url: "", titulo: "", descripcion: "" })
            setMostrarFormEnlace(false)
        } catch (e) { toast.error(e?.response?.data?.msg || "Error al agregar enlace") }
        setEnviandoEnlace(false)
    }

    const handleEliminarEnlace = async () => {
        try {
            const res = await eliminarEnlaceVehiculo(id, modalEliminarEnlace._id)
            toast.success("Enlace eliminado")
            setEnlaces(res.data.enlaces)
            setModalEliminarEnlace(null)
        } catch (e) { toast.error("Error al eliminar enlace") }
    }

    useEffect(() => { cargar() }, [id])

    // Cargar foto del vehículo
    useEffect(() => {
        if (!datos?.vehiculo) return
        const v = datos.vehiculo
        const fotoPrincipal = v.fotos?.find(f => f.principal) || v.fotos?.[0]
        if (fotoPrincipal) { setFotoSrc(fotoPrincipal.url); return }
        if (v.ocultarFotoAuto) return
        fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(`${v.marca} ${v.modelo} car`)}&per_page=1&orientation=landscape`,
            { headers: { Authorization: PEXELS_API_KEY } })
            .then(r => r.json())
            .then(d => setFotoSrc(d.photos?.[0]?.src?.large || null))
            .catch(() => {})
    }, [datos?.vehiculo?._id])

    const handleEnviar = async () => {
        // Validar que todos los aspectos tengan valor
        const aspectosFaltantes = ASPECTOS.filter(a => !form[a.key] || form[a.key] < 1)
        if (aspectosFaltantes.length > 0) {
            return toast.error(`Faltan valorar: ${aspectosFaltantes.map(a => a.label).join(", ")}`)
        }
        setEnviando(true)
        try {
            const { comentario, ...aspectos } = form
            await crearValoracion(id, { aspectos, comentario })
            toast.success(datos.miValoracion ? "Valoración actualizada" : "Valoración registrada")
            setMostrarFormulario(false)
            cargar(pagina)
        } catch (e) {
            toast.error(e?.response?.data?.msg || "Error al guardar")
        }
        setEnviando(false)
    }

    const handleEliminar = async () => {
        try {
            await eliminarValoracion(datos.miValoracion._id)
            toast.success("Valoración eliminada")
            setModalEliminar(false)
            setMostrarFormulario(false)
            setForm({ confiabilidad: 0, seguridad: 0, consumo: 0, precio: 0, comodidad: 0, mantenimiento: 0, repuestos: 0, comentario: "" })
            cargar(1)
        } catch (e) {
            toast.error("Error al eliminar")
        }
    }

    if (cargando) return <p className="text-slate-400">Cargando...</p>
    if (!datos) return <p className="text-slate-500">Vehículo no encontrado.</p>

    const { vehiculo, resumen, valoraciones, total, paginas, miValoracion, puedoValorar, enVentanaCorreccion, horasRestantesVentana, diasRestantesCooldown } = datos
    const puntajeGeneral = resumen?.puntajeGeneral || 0

    return (
        <div className="max-w-4xl mx-auto">
            <ToastContainer />
            <button onClick={() => navigate(-1)} className="text-blue-700 hover:underline mb-4 text-sm">← Volver</button>

            {/* Header del vehículo */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                {fotoSrc && <img src={fotoSrc} alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                    className="w-full h-52 object-cover" onError={() => setFotoSrc(null)} />}
                <div className="p-6">
                    <div className="flex justify-between items-start flex-wrap gap-3">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <LogoMarca marca={vehiculo.marca} size={36} />
                                <h1 className="text-2xl font-bold text-slate-800">
                                    {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}
                                </h1>
                            </div>
                            {/* Ficha técnica — siempre visible */}
                            <div className="mt-4 pt-3 border-t border-slate-100">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ficha técnica</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                                    {/* Fila 1: básicos */}
                                    <div>
                                        <p className="text-xs text-slate-400">Tipo</p>
                                        <p className="text-sm font-semibold text-slate-700 capitalize">{vehiculo.tipo}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Combustible</p>
                                        <p className="text-sm font-semibold text-slate-700 capitalize">{vehiculo.combustible}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Versión</p>
                                        {vehiculo.version
                                            ? <p className="text-sm font-semibold text-slate-700">{vehiculo.version}</p>
                                            : <p className="text-sm text-slate-300 font-medium">S/D</p>}
                                    </div>
                                    {/* Fila 2: transmisión, tracción, cilindraje */}
                                    <div>
                                        <p className="text-xs text-slate-400">Transmisión</p>
                                        {vehiculo.transmision
                                            ? <p className="text-sm font-semibold text-slate-700 capitalize">{vehiculo.transmision}</p>
                                            : <p className="text-sm text-slate-300 font-medium">S/D</p>}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Tracción</p>
                                        {vehiculo.traccion
                                            ? <p className="text-sm font-semibold text-slate-700">{vehiculo.traccion}</p>
                                            : <p className="text-sm text-slate-300 font-medium">S/D</p>}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Cilindraje</p>
                                        {vehiculo.cilindraje
                                            ? <p className="text-sm font-semibold text-slate-700">{vehiculo.cilindraje} cc</p>
                                            : <p className="text-sm text-slate-300 font-medium">S/D</p>}
                                    </div>
                                    {/* Fila 3: cilindros, potencia, torque */}
                                    <div>
                                        <p className="text-xs text-slate-400">Cilindros</p>
                                        {vehiculo.cilindros
                                            ? <p className="text-sm font-semibold text-slate-700">{vehiculo.cilindros}</p>
                                            : <p className="text-sm text-slate-300 font-medium">S/D</p>}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Potencia</p>
                                        {vehiculo.potencia
                                            ? <p className="text-sm font-semibold text-slate-700">{vehiculo.potencia} HP</p>
                                            : <p className="text-sm text-slate-300 font-medium">S/D</p>}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Torque</p>
                                        {vehiculo.torque
                                            ? <p className="text-sm font-semibold text-slate-700">{vehiculo.torque} Nm</p>
                                            : <p className="text-sm text-slate-300 font-medium">S/D</p>}
                                    </div>
                                    {/* Fila 4: turbo, peso, airbags */}
                                    <div>
                                        <p className="text-xs text-slate-400">Turbo</p>
                                        {vehiculo.turbo === true
                                            ? <p className="text-sm font-semibold text-green-600">✓ Sí</p>
                                            : vehiculo.turbo === false
                                                ? <p className="text-sm font-semibold text-slate-700">No</p>
                                                : <p className="text-sm text-slate-300 font-medium">S/D</p>}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Peso</p>
                                        {vehiculo.peso
                                            ? <p className="text-sm font-semibold text-slate-700">{vehiculo.peso} kg</p>
                                            : <p className="text-sm text-slate-300 font-medium">S/D</p>}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Airbags</p>
                                        {vehiculo.airbags != null && vehiculo.airbags !== ""
                                            ? <p className="text-sm font-semibold text-slate-700">{vehiculo.airbags}</p>
                                            : <p className="text-sm text-slate-300 font-medium">S/D</p>}
                                    </div>
                                </div>
                                {(!vehiculo.transmision && !vehiculo.traccion && !vehiculo.potencia && !vehiculo.torque && vehiculo.airbags == null && !vehiculo.peso && vehiculo.turbo == null && !vehiculo.cilindraje && !vehiculo.cilindros) && (
                                    <p className="text-xs text-slate-400 italic mt-3">
                                        Los datos técnicos serán completados por la administración.
                                    </p>
                                )}
                            </div>
                        </div>
                        {resumen && (
                            <div className="text-center">
                                <div className="text-5xl font-black text-blue-900">{puntajeGeneral}</div>
                                <Estrellas valor={puntajeGeneral} size="md" />
                                <p className="text-xs text-slate-400 mt-1">{total} valoración(es)</p>
                            </div>
                        )}
                    </div>

                    {/* Barras por aspecto */}
                    {resumen && (
                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                            <p className="text-sm font-semibold text-slate-600 mb-3">Promedio por aspecto</p>
                            {ASPECTOS.map(a => (
                                <BarraAspecto key={a.key} label={a.label} emoji={a.emoji} valor={resumen.promedios[a.key]} />
                            ))}
                        </div>
                    )}

                    {!resumen && (
                        <div className="mt-4 bg-slate-50 rounded-lg p-4 text-center text-slate-400 text-sm">
                            Este vehículo aún no tiene valoraciones. ¡Sé el primero en valorarlo!
                        </div>
                    )}
                </div>
            </div>

            {/* Formulario de valoración */}
            {token && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    {!mostrarFormulario ? (
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <p className="font-semibold text-slate-700">
                                    {miValoracion ? "Tu valoración" : "¿Tienes o tuviste este vehículo?"}
                                </p>
                                {miValoracion ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Estrellas valor={resumen?.puntajeGeneral || 0} />
                                        <span className="text-xs text-slate-400">Valorado el {formatearFecha(miValoracion.updatedAt)}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400">Comparte tu experiencia con otros usuarios</p>
                                )}
                            </div>
                            <div className="flex gap-2 items-center">
                                {miValoracion && enVentanaCorreccion && (
                                    <p className="text-xs text-green-600 italic">
                                        Puedes corregir libremente ({horasRestantesVentana}h restantes)
                                    </p>
                                )}
                                {miValoracion && !puedoValorar && !enVentanaCorreccion && (
                                    <p className="text-xs text-slate-400 italic">
                                        Podrás actualizar tu valoración en {diasRestantesCooldown} día(s)
                                    </p>
                                )}
                                {miValoracion && puedoValorar && !enVentanaCorreccion && (
                                    <p className="text-xs text-blue-500 italic">
                                        Ya puedes actualizar tu valoración
                                    </p>
                                )}
                                {(puedoValorar || !miValoracion) && (
                                    <button type="button" onClick={handleClickValorar}
                                        className="bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                                        {miValoracion ? "✏️ Actualizar" : "⭐ Valorar"}
                                    </button>
                                )}
                                {miValoracion && (
                                    <button type="button" onClick={() => setModalEliminar(true)}
                                        className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                                        🗑
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-bold text-slate-700 text-lg">
                                    {miValoracion ? "Actualizar valoración" : "Nueva valoración"}
                                </h3>
                                <button type="button" onClick={() => setMostrarFormulario(false)}
                                    className="text-slate-400 hover:text-slate-600 text-xl">×</button>
                            </div>

                            <div className="space-y-4 mb-5">
                                {ASPECTOS.map(a => (
                                    <div key={a.key} className="flex items-center gap-4 flex-wrap">
                                        <span className="text-base w-6">{a.emoji}</span>
                                        <span className="text-sm text-slate-600 w-48 shrink-0">{a.label}</span>
                                        <EstrellasInput valor={form[a.key]} onChange={v => setForm(prev => ({ ...prev, [a.key]: v }))} />
                                        <span className="text-xs text-slate-400 ml-1">
                                            {form[a.key] === 1 ? "Muy malo" : form[a.key] === 2 ? "Malo" : form[a.key] === 3 ? "Regular" : form[a.key] === 4 ? "Bueno" : form[a.key] === 5 ? "Excelente" : "Sin valorar"}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Comentario <span className="text-slate-400 font-normal">(opcional, máx. 500 caracteres)</span>
                                </label>
                                <textarea
                                    className="w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm resize-none"
                                    rows={3}
                                    maxLength={500}
                                    placeholder="Cuéntanos tu experiencia con este vehículo..."
                                    value={form.comentario}
                                    onChange={e => setForm(prev => ({ ...prev, comentario: e.target.value }))}
                                />
                                <p className="text-xs text-slate-400 text-right mt-1">{form.comentario.length}/500</p>
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={handleEnviar} disabled={enviando}
                                    className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
                                    {enviando ? "Guardando..." : miValoracion ? "Actualizar valoración" : "Publicar valoración"}
                                </button>
                                <button type="button" onClick={() => setMostrarFormulario(false)}
                                    className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 rounded-lg transition-colors">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Fuentes de seguridad */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-700">Fuentes de seguridad</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Enlaces a reportes externos de seguridad (Latin NCAP, Euro NCAP, NHTSA, etc.)
                        </p>
                    </div>
                    {token && enlaces.length < 10 && (
                        <button type="button" onClick={() => setMostrarFormEnlace(!mostrarFormEnlace)}
                            className="text-sm text-blue-700 hover:underline font-semibold shrink-0">
                            {mostrarFormEnlace ? "Cancelar" : "+ Agregar enlace"}
                        </button>
                    )}
                </div>

                {/* Formulario agregar enlace */}
                {mostrarFormEnlace && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 space-y-3">
                        <div>
                            <input
                                className="w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm"
                                placeholder="URL (Ej: https://www.latinncap.com/...)"
                                value={formEnlace.url}
                                onChange={e => setFormEnlace(prev => ({ ...prev, url: e.target.value }))} />
                        </div>
                        <div>
                            <input
                                className="w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm"
                                placeholder="Título (Ej: Latin NCAP 2022 — 5 estrellas)"
                                maxLength={100}
                                value={formEnlace.titulo}
                                onChange={e => setFormEnlace(prev => ({ ...prev, titulo: e.target.value }))} />
                        </div>
                        <div>
                            <input
                                className="w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm"
                                placeholder="Descripción breve (opcional, máx. 200 caracteres)"
                                maxLength={200}
                                value={formEnlace.descripcion}
                                onChange={e => setFormEnlace(prev => ({ ...prev, descripcion: e.target.value }))} />
                        </div>
                        <button type="button" onClick={handleAgregarEnlace} disabled={enviandoEnlace}
                            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50">
                            {enviandoEnlace ? "Guardando..." : "Guardar enlace"}
                        </button>
                    </div>
                )}

                {/* Lista de enlaces */}
                {enlaces.length === 0 ? (
                    <div className="bg-slate-50 rounded-lg p-6 text-center text-slate-400 text-sm">
                        No hay fuentes externas registradas aún.
                        {token && <span className="block mt-1">¡Sé el primero en agregar un enlace de seguridad!</span>}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {enlaces.map(enlace => {
                            let dominio = ""
                            try { dominio = new URL(enlace.url).hostname } catch {}
                            const favicon = dominio ? `https://www.google.com/s2/favicons?domain=${dominio}&sz=32` : null
                            const esMio = enlace.creadoPor?.toString() === userId
                            const esAdminUser = rol === "admin"
                            const puedeEliminar = esMio || esAdminUser

                            return (
                                <div key={enlace._id} className="flex items-start gap-3 bg-slate-50 rounded-lg px-4 py-3 group">
                                    {favicon && (
                                        <img src={favicon} alt={dominio} className="w-6 h-6 mt-0.5 shrink-0 rounded"
                                            onError={e => e.target.style.display = "none"} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <a href={enlace.url} target="_blank" rel="noreferrer"
                                            className="text-sm font-semibold text-blue-700 hover:underline block truncate">
                                            {enlace.titulo}
                                        </a>
                                        {enlace.descripcion && (
                                            <p className="text-xs text-slate-500 mt-0.5">{enlace.descripcion}</p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-0.5 truncate">{dominio}</p>
                                    </div>
                                    {token && puedeEliminar && (
                                        <button type="button"
                                            onClick={() => setModalEliminarEnlace(enlace)}
                                            className={`shrink-0 transition-colors text-lg leading-none ${
                                                esAdminUser
                                                    ? "text-red-400 hover:text-red-600"
                                                    : "text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                            }`}
                                            title="Eliminar enlace">
                                            ×
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                        <p className="text-xs text-slate-400 text-right">{enlaces.length}/10 enlaces</p>
                    </div>
                )}
            </div>

            {/* Lista de reseñas */}
            {total > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-slate-700 mb-4">Reseñas de usuarios ({total})</h2>
                    <div className="max-h-[480px] overflow-y-auto pr-1 space-y-4">
                        {valoraciones.map(v => (
                            <div key={v._id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">{v.usuario?.nombre} {v.usuario?.apellido}</p>
                                        {(v.usuario?.region || v.usuario?.provincia) && (
                                            <p className="text-xs text-slate-400">
                                                {[v.usuario.provincia, v.usuario.region].filter(Boolean).join(", ")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <Estrellas valor={
                                            Math.round((Object.values(v.aspectos).reduce((a, b) => a + b, 0) / 7) * 10) / 10
                                        } />
                                        <p className="text-xs text-slate-400 mt-0.5">{formatearFecha(v.createdAt)}</p>
                                        {v.updatedAt !== v.createdAt && (
                                            <span className="text-xs text-slate-300 italic">Editada</span>
                                        )}
                                    </div>
                                </div>
                                {v.comentario && (
                                    <p className="text-sm text-slate-600 italic">"{v.comentario}"</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {ASPECTOS.map(a => (
                                        <span key={a.key} className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-500">
                                            {a.emoji} {a.label}: <strong>{v.aspectos[a.key]}</strong>/5
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {paginas > 1 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <Paginacion paginaActual={pagina} totalPaginas={paginas}
                                onCambiar={p => { setPagina(p); cargar(p) }} />
                        </div>
                    )}
                </div>
            )}

            {modalEliminar && (
                <ModalConfirmar
                    titulo="¿Eliminar tu valoración?"
                    descripcion="Se eliminará tu valoración de este vehículo permanentemente."
                    textoConfirmar="Sí, eliminar"
                    colorBoton="bg-red-600 hover:bg-red-700"
                    onConfirmar={handleEliminar}
                    onCancelar={() => setModalEliminar(false)}
                />
            )}
            {modalEliminarEnlace && (
                <ModalConfirmar
                    titulo="¿Eliminar este enlace?"
                    descripcion={`Se eliminará "${modalEliminarEnlace.titulo}" permanentemente.`}
                    textoConfirmar="Sí, eliminar"
                    colorBoton="bg-red-600 hover:bg-red-700"
                    onConfirmar={handleEliminarEnlace}
                    onCancelar={() => setModalEliminarEnlace(null)}
                />
            )}

            {/* Modal advertencia antes de valorar */}
            {modalAdvertenciaValorar && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">⭐</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg text-center mb-2">Antes de valorar</h3>
                        <p className="text-slate-500 text-sm text-center mb-3">
                            Solo valora este vehículo si has tenido <strong>experiencia real o conocimiento directo</strong> con él (lo posees, lo conduces habitualmente o lo conoces a fondo).
                        </p>
                        <p className="text-slate-400 text-xs text-center mb-5">
                            Las valoraciones son limitadas y se revisan periódicamente. Si se detecta mal uso (opiniones falsas, repetidas o sin fundamento) la cuenta puede ser suspendida.
                        </p>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setModalAdvertenciaValorar(false)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm">
                                Cancelar
                            </button>
                            <button type="button" onClick={confirmarYAbrirFormulario}
                                className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg text-sm">
                                Continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DetalleVehiculo