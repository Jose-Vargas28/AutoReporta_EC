import { useEffect, useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import Paginacion from "../components/ui/Paginacion"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import LogoMarca from "../components/ui/LogoMarca"
import {
    getVehiculos, subirFotoVehiculo,
    eliminarFotoVehiculo, marcarFotoPrincipal, toggleFotoAutoVehiculo, guardarFotoPexelsVehiculo, reordenarFotosVehiculo
} from "../services/catalogoService"

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY
const pexelsCache = {}

const buscarFotoPexels = async (marca, modelo) => {
    const key = `${marca} ${modelo}`.toLowerCase()
    if (pexelsCache[key] !== undefined) return pexelsCache[key]
    try {
        const query = encodeURIComponent(`${marca} ${modelo} car`)
        const res = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=3&orientation=landscape`, {
            headers: { Authorization: PEXELS_API_KEY }
        })
        const data = await res.json()
        const urls = data.photos?.map(p => p.src.medium) || []
        pexelsCache[key] = urls
        return urls
    } catch {
        pexelsCache[key] = []
        return []
    }
}

// ---- Carrusel con hover controls + lightbox ----
const CarruselVehiculo = ({ vehiculo, onAbrir }) => {
    const fotosDB = vehiculo.fotos || []
    const [pexelsFotos, setPexelsFotos] = useState([])
    const [cargando, setCargando] = useState(false)
    const [idx, setIdx] = useState(0)

    const todasLasFotos = fotosDB.length > 0
        ? fotosDB.map(f => f.url)
        : pexelsFotos

    useEffect(() => {
        setIdx(0)
        if (fotosDB.length > 0 || vehiculo.ocultarFotoAuto) return
        let cancelado = false
        setCargando(true)
        buscarFotoPexels(vehiculo.marca, vehiculo.modelo).then(urls => {
            if (!cancelado) { setPexelsFotos(urls); setCargando(false) }
        })
        return () => { cancelado = true }
    }, [vehiculo._id, fotosDB.length, vehiculo.ocultarFotoAuto])

    const cambiar = (dir, e) => {
        e.stopPropagation()
        setIdx(i => (i + dir + todasLasFotos.length) % todasLasFotos.length)
    }

    if (cargando) {
        return (
            <div className="w-full h-40 bg-slate-100 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
        )
    }

    if (todasLasFotos.length === 0) {
        return (
            <div className="w-full h-40 bg-slate-100 flex flex-col items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 17H3a2 2 0 01-2-2v-4a2 2 0 012-2h1l2-4h10l2 4h1a2 2 0 012 2v4a2 2 0 01-2 2h-2m-7 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                <span className="text-xs text-slate-400">Sin foto</span>
            </div>
        )
    }

    return (
        <div
            className="relative w-full h-40 overflow-hidden cursor-pointer group"
            onClick={() => onAbrir(todasLasFotos, idx)}
        >
            {/* Foto con scale en hover */}
            <img
                src={todasLasFotos[idx]}
                alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => e.target.style.display = "none"}
            />

            {/* Controles — solo visibles en hover */}
            {todasLasFotos.length > 1 && (
                <>
                    <div className="absolute inset-0 flex items-center justify-between px-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button type="button" onClick={(e) => cambiar(-1, e)}
                            className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-base hover:bg-black/70 transition-colors">
                            ‹
                        </button>
                        <button type="button" onClick={(e) => cambiar(1, e)}
                            className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-base hover:bg-black/70 transition-colors">
                            ›
                        </button>
                    </div>
                    {/* Puntos indicadores — siempre visibles */}
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                        {todasLasFotos.map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/40"}`} />
                        ))}
                    </div>
                </>
            )}

            {/* Botón ampliar — solo en hover */}
            <button type="button"
                onClick={(e) => { e.stopPropagation(); onAbrir(todasLasFotos, idx) }}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                ⛶ Ampliar
            </button>
        </div>
    )
}

// ---- Lightbox ----
const Lightbox = ({ fotos, indiceInicial, onCerrar }) => {
    const [idx, setIdx] = useState(indiceInicial)

    useEffect(() => {
        setIdx(indiceInicial)
        const handleKey = (e) => {
            if (e.key === "ArrowLeft") setIdx(i => (i - 1 + fotos.length) % fotos.length)
            if (e.key === "ArrowRight") setIdx(i => (i + 1) % fotos.length)
            if (e.key === "Escape") onCerrar()
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [indiceInicial])

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onCerrar}>
            {/* Cerrar */}
            <button type="button" onClick={onCerrar}
                className="absolute top-4 right-5 text-white text-3xl font-light hover:text-slate-300 transition-colors">
                ×
            </button>

            {/* Flecha izquierda */}
            {fotos.length > 1 && (
                <button type="button"
                    onClick={(e) => { e.stopPropagation(); setIdx(i => (i - 1 + fotos.length) % fotos.length) }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center text-xl transition-colors">
                    ‹
                </button>
            )}

            {/* Imagen */}
            <img
                src={fotos[idx]}
                alt="foto ampliada"
                className="max-w-full max-h-[85vh] rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
            />

            {/* Flecha derecha */}
            {fotos.length > 1 && (
                <button type="button"
                    onClick={(e) => { e.stopPropagation(); setIdx(i => (i + 1) % fotos.length) }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center text-xl transition-colors">
                    ›
                </button>
            )}

            {/* Puntos */}
            {fotos.length > 1 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                    {fotos.map((_, i) => (
                        <button key={i} type="button"
                            onClick={(e) => { e.stopPropagation(); setIdx(i) }}
                            className={`w-2 h-2 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/40"}`}
                        />
                    ))}
                </div>
            )}

            {/* Contador */}
            {fotos.length > 1 && (
                <div className="absolute top-4 left-5 text-white/70 text-sm">
                    {idx + 1} / {fotos.length}
                </div>
            )}
        </div>
    )
}

// ---- Modal de características del vehículo ----
const ModalCaracteristicas = ({ vehiculo, onCerrar }) => {
    const [fotoSrc, setFotoSrc] = useState(null)

    useEffect(() => {
        const fotoPrincipal = vehiculo.fotos?.find(f => f.principal) || vehiculo.fotos?.[0]
        if (fotoPrincipal) { setFotoSrc(fotoPrincipal.url); return }
        if (vehiculo.ocultarFotoAuto) return
        buscarFotoPexels(vehiculo.marca, vehiculo.modelo).then(urls => {
            if (urls[0]) setFotoSrc(urls[0])
        })
    }, [vehiculo._id])

    const faltanTecnicos = !vehiculo.transmision && !vehiculo.traccion &&
        vehiculo.potencia == null && vehiculo.torque == null &&
        vehiculo.airbags == null && vehiculo.peso == null &&
        vehiculo.turbo == null && !vehiculo.cilindraje && !vehiculo.cilindros

    const Campo = ({ label, valor, capitalize }) => (
        <div>
            <p className="text-xs text-slate-400 mb-0.5">{label}</p>
            {valor !== null && valor !== undefined && valor !== ""
                ? <p className={`text-sm font-semibold text-slate-700 ${capitalize ? "capitalize" : ""}`}>{valor}</p>
                : <p className="text-sm font-medium text-slate-300">S/D</p>}
        </div>
    )

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onCerrar}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}>

                {/* Foto principal */}
                {fotoSrc ? (
                    <div className="relative w-full h-44 bg-slate-100">
                        <img src={fotoSrc} alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                            className="w-full h-full object-cover"
                            onError={() => setFotoSrc(null)} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                ) : (
                    <div className="w-full h-28 bg-slate-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 17H3a2 2 0 01-2-2v-4a2 2 0 012-2h1l2-4h10l2 4h1a2 2 0 012 2v4a2 2 0 01-2 2h-2m-7 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                        </svg>
                    </div>
                )}

                {/* Header: logo grande + nombre + botón cerrar */}
                <div className="px-5 pt-4 pb-3 flex items-center gap-4 border-b border-slate-100">
                    <LogoMarca marca={vehiculo.marca} size={52} />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-slate-800 leading-tight truncate">
                            {vehiculo.marca} {vehiculo.modelo}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {vehiculo.anio}
                        </p>
                    </div>
                    <button type="button" onClick={onCerrar}
                        className="shrink-0 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 text-2xl rounded-full hover:bg-slate-100 transition-colors leading-none">
                        ×
                    </button>
                </div>

                {/* Ficha técnica */}
                <div className="px-5 py-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Ficha técnica</p>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                        <Campo label="Tipo"        valor={vehiculo.tipo}        capitalize />
                        <Campo label="Combustible" valor={vehiculo.combustible} capitalize />
                        <Campo label="Versión"     valor={vehiculo.version || null} />
                        <Campo label="Transmisión" valor={vehiculo.transmision || null} capitalize />
                        <Campo label="Tracción"    valor={vehiculo.traccion || null} />
                        <Campo label="Cilindraje"  valor={vehiculo.cilindraje != null ? `${vehiculo.cilindraje} cc` : null} />
                        <Campo label="Cilindros"   valor={vehiculo.cilindros  != null ? vehiculo.cilindros : null} />
                        <Campo label="Potencia"    valor={vehiculo.potencia != null ? `${vehiculo.potencia} HP` : null} />
                        <Campo label="Torque"      valor={vehiculo.torque != null ? `${vehiculo.torque} Nm` : null} />
                        <div>
                            <p className="text-xs text-slate-400 mb-0.5">Turbo</p>
                            {vehiculo.turbo === true
                                ? <p className="text-sm font-semibold text-green-600">✓ Sí</p>
                                : vehiculo.turbo === false
                                    ? <p className="text-sm font-semibold text-slate-700">No</p>
                                    : <p className="text-sm font-medium text-slate-300">S/D</p>}
                        </div>
                        <Campo label="Peso"        valor={vehiculo.peso != null ? `${vehiculo.peso} kg` : null} />
                        <Campo label="Airbags"     valor={vehiculo.airbags != null ? vehiculo.airbags : null} />
                    </div>
                    {faltanTecnicos && (
                        <p className="text-xs text-slate-400 italic mt-3 pt-3 border-t border-slate-100">
                            Los datos técnicos serán completados por la administración.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

const TIPOS_VEHICULO = ["automóvil", "suv", "camioneta", "moto", "vehículo comercial"]

// ---- Página principal ----
const CatalogoVehiculos = () => {
    const navigate = useNavigate()
    const { rol } = storeAuth()
    const esAdmin = rol === "admin"

    const [vehiculos, setVehiculos] = useState([])
    const [marcasDisponibles, setMarcasDisponibles] = useState([])
    const [busqueda, setBusqueda] = useState("")
    const [filtroTipo, setFiltroTipo] = useState("")
    const [filtroMarca, setFiltroMarca] = useState("")
    const [ordenPor, setOrdenPor] = useState("marca")
    const [filtroReportes, setFiltroReportes] = useState("")
    const [cargando, setCargando] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [total, setTotal] = useState(0)
    const [modoEdicion, setModoEdicion] = useState(false)

    const [lightbox, setLightbox] = useState(null)
    const [vehiculoFotos, setVehiculoFotos] = useState(null)
    const [subiendo, setSubiendo] = useState(false)
    const [guardandoPexels, setGuardandoPexels] = useState(null)
    const [modalEliminarFoto, setModalEliminarFoto] = useState(null)
    const inputFotoRef = useRef(null)
    const [modalAdvertenciaValorar, setModalAdvertenciaValorar] = useState(null)
    const [modalCaracteristicas, setModalCaracteristicas] = useState(null)
    const [filtroTransmision, setFiltroTransmision] = useState("")
    const [filtroTraccion, setFiltroTraccion] = useState("")
    const [filtroCombustible, setFiltroCombustible] = useState("")
    const [filtroTurbo, setFiltroTurbo] = useState("")

    const cargar = useCallback(async (pag = 1, busq = "", tipo = "", marca = "", extras = {}) => {
        setCargando(true)
        try {
            const res = await getVehiculos(pag, busq, tipo, marca, 10, extras)
            const lista = res.data.vehiculos || []
            setVehiculos(lista)
            setTotalPaginas(res.data.paginas || 1)
            setTotal(res.data.total || 0)
        } catch (error) {
            console.error(error)
            setVehiculos([])
        }
        setCargando(false)
    }, [])

    // Cargar marcas al inicio con límite alto para tenerlas todas
    useEffect(() => {
        getVehiculos(1, "", "", "", 500).then(res => {
            setMarcasDisponibles([...new Set((res.data.vehiculos || []).map(v => v.marca))].sort())
        }).catch(() => {})
        cargar()
    }, [])

    // Debounce en búsqueda
    useEffect(() => {
        const extras = { transmision: filtroTransmision, traccion: filtroTraccion, combustible: filtroCombustible, turbo: filtroTurbo }
        const t = setTimeout(() => { setPagina(1); cargar(1, busqueda, filtroTipo, filtroMarca, extras) }, 400)
        return () => clearTimeout(t)
    }, [busqueda])

    // Filtros inmediatos
    useEffect(() => {
        const extras = { transmision: filtroTransmision, traccion: filtroTraccion, combustible: filtroCombustible, turbo: filtroTurbo }
        setPagina(1); cargar(1, busqueda, filtroTipo, filtroMarca, extras)
    }, [filtroTipo, filtroMarca, filtroTransmision, filtroTraccion, filtroCombustible, filtroTurbo])

    // Ordenamiento en frontend (los datos ya vienen filtrados del backend)
    const vehiculosOrdenados = [...vehiculos]
        .filter(v => {
            if (filtroReportes === "con") return (v.totalReportes || 0) > 0
            if (filtroReportes === "sin") return (v.totalReportes || 0) === 0
            return true
        })
        .sort((a, b) => {
            if (ordenPor === "marca") return `${a.marca} ${a.modelo}`.localeCompare(`${b.marca} ${b.modelo}`)
            if (ordenPor === "anio_desc") return b.anio - a.anio
            if (ordenPor === "anio_asc") return a.anio - b.anio
            if (ordenPor === "reportes") return (b.totalReportes || 0) - (a.totalReportes || 0)
            if (ordenPor === "reportes_asc") return (a.totalReportes || 0) - (b.totalReportes || 0)
            return 0
        })

    const hayFiltros = filtroTipo || filtroMarca || busqueda || ordenPor !== "marca" || filtroReportes || filtroTransmision || filtroTraccion || filtroCombustible || filtroTurbo
    const cambiarPagina = (p) => { setPagina(p); cargar(p, busqueda, filtroTipo, filtroMarca) }
    const abrirGestionFotos = async (v) => {
        setVehiculoFotos({ ...v })
        if (!v.ocultarFotoAuto) {
            const key = `${v.marca} ${v.modelo}`.toLowerCase()
            if (pexelsCache[key] === undefined) {
                await buscarFotoPexels(v.marca, v.modelo)
                setVehiculoFotos(prev => prev ? { ...prev } : null)
            }
        }
    }

    const handleGuardarFotoPexels = async (url) => {
        if ((vehiculoFotos.fotos?.length || 0) >= 5) return toast.error("Máximo 5 fotos por vehículo")
        setGuardandoPexels(url)
        try {
            const res = await guardarFotoPexelsVehiculo(vehiculoFotos._id, url)
            toast.success("Foto guardada correctamente")
            setVehiculoFotos(prev => ({ ...prev, fotos: res.data.fotos }))
            setVehiculos(prev => prev.map(v =>
                v._id === vehiculoFotos._id ? { ...v, fotos: res.data.fotos } : v
            ))
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al guardar la foto")
        }
        setGuardandoPexels(null)
    }

    const handleSubirFoto = async (e) => {
        const archivo = e.target.files[0]
        if (!archivo) return
        if (vehiculoFotos.fotos?.length >= 5) return toast.error("Máximo 5 fotos por vehículo")
        setSubiendo(true)
        try {
            const formData = new FormData()
            formData.append("foto", archivo)
            const res = await subirFotoVehiculo(vehiculoFotos._id, formData)
            toast.success("Foto subida correctamente")
            setVehiculoFotos(prev => ({ ...prev, fotos: res.data.fotos }))
            setVehiculos(prev => prev.map(v =>
                v._id === vehiculoFotos._id ? { ...v, fotos: res.data.fotos } : v
            ))
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al subir la foto")
        }
        setSubiendo(false)
        if (inputFotoRef.current) inputFotoRef.current.value = ""
    }

    const handleEliminarFoto = async () => {
        try {
            const res = await eliminarFotoVehiculo(vehiculoFotos._id, modalEliminarFoto._id)
            toast.success("Foto eliminada")
            setVehiculoFotos(prev => ({ ...prev, fotos: res.data.fotos }))
            setVehiculos(prev => prev.map(v =>
                v._id === vehiculoFotos._id ? { ...v, fotos: res.data.fotos } : v
            ))
            setModalEliminarFoto(null)
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al eliminar la foto")
            setModalEliminarFoto(null)
        }
    }

    const handleMarcarPrincipal = async (fotoId) => {
        try {
            const res = await marcarFotoPrincipal(vehiculoFotos._id, fotoId)
            toast.success("Foto principal actualizada")
            setVehiculoFotos(prev => ({ ...prev, fotos: res.data.fotos }))
            setVehiculos(prev => prev.map(v =>
                v._id === vehiculoFotos._id ? { ...v, fotos: res.data.fotos } : v
            ))
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al actualizar")
        }
    }

    const handleToggleFotoAuto = async () => {
        try {
            const res = await toggleFotoAutoVehiculo(vehiculoFotos._id)
            toast.success(res.data.msg)
            const nuevoValor = res.data.ocultarFotoAuto
            setVehiculoFotos(prev => ({ ...prev, ocultarFotoAuto: nuevoValor }))
            setVehiculos(prev => prev.map(v =>
                v._id === vehiculoFotos._id ? { ...v, ocultarFotoAuto: nuevoValor } : v
            ))
            const key = `${vehiculoFotos.marca} ${vehiculoFotos.modelo}`.toLowerCase()
            delete pexelsCache[key]
        } catch (error) {
            toast.error("Error al actualizar")
        }
    }

    return (
        <div>
            <ToastContainer />

            <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-1">Vehículos</h1>
                    <p className="text-slate-500 text-sm">{total} vehículo(s) registrado(s)</p>
                </div>
                {esAdmin && (
                    <button type="button" onClick={() => setModoEdicion(!modoEdicion)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            modoEdicion ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-600"
                        }`}>
                        {modoEdicion ? "✏️ Modo edición activo" : "Gestionar fotos"}
                    </button>
                )}
            </div>

            {modoEdicion && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800">
                    Modo edición activo. Haz clic en "Gestionar fotos" de cada vehículo para subir o quitar imágenes.
                </div>
            )}

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow p-4 mb-6 space-y-3">
                {/* Fila 1 — búsqueda, tipo, marca */}
                <div className="flex flex-wrap gap-3">
                    <input type="text" placeholder="Buscar por marca o modelo..."
                        className="flex-1 min-w-48 rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm"
                        value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    <select className="rounded-md border border-slate-300 py-2 px-3 text-slate-700 text-sm"
                        value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPagina(1) }}>
                        <option value="">Todos los tipos</option>
                        {TIPOS_VEHICULO.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                    <select className="rounded-md border border-slate-300 py-2 px-3 text-slate-700 text-sm"
                        value={filtroMarca} onChange={e => { setFiltroMarca(e.target.value); setPagina(1) }}>
                        <option value="">Todas las marcas</option>
                        {marcasDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                {/* Fila 3 — filtros técnicos */}
                <div className="flex flex-wrap gap-3 items-center">
                    <select className="rounded-md border border-slate-300 py-2 px-3 text-slate-700 text-sm"
                        value={filtroCombustible} onChange={e => setFiltroCombustible(e.target.value)}>
                        <option value="">Combustible</option>
                        <option value="gasolina">Gasolina</option>
                        <option value="diésel">Diésel</option>
                        <option value="híbrido">Híbrido</option>
                        <option value="eléctrico">Eléctrico</option>
                    </select>
                    <select className="rounded-md border border-slate-300 py-2 px-3 text-slate-700 text-sm"
                        value={filtroTransmision} onChange={e => setFiltroTransmision(e.target.value)}>
                        <option value="">Transmisión</option>
                        <option value="manual">Manual</option>
                        <option value="automática">Automática</option>
                        <option value="automática doble embrague">Doble embrague</option>
                        <option value="CVT">CVT</option>
                        <option value="e-CVT">e-CVT</option>
                        <option value="semi-automática">Semi-automática</option>
                        <option value="directa">Directa (eléctrico)</option>
                    </select>
                    <select className="rounded-md border border-slate-300 py-2 px-3 text-slate-700 text-sm"
                        value={filtroTraccion} onChange={e => setFiltroTraccion(e.target.value)}>
                        <option value="">Tracción</option>
                        <option value="FWD">FWD — Delantera</option>
                        <option value="RWD">RWD — Trasera</option>
                        <option value="AWD">AWD — Total</option>
                        <option value="4WD">4WD — Cuatro ruedas</option>
                    </select>
                    <select className="rounded-md border border-slate-300 py-2 px-3 text-slate-700 text-sm"
                        value={filtroTurbo} onChange={e => setFiltroTurbo(e.target.value)}>
                        <option value="">Turbo</option>
                        <option value="true">Con turbo</option>
                        <option value="false">Sin turbo</option>
                    </select>
                    {(filtroTransmision || filtroTraccion || filtroCombustible || filtroTurbo) && (
                        <p className="text-xs text-slate-400 italic w-full">
                            Los vehículos sin datos en el campo seleccionado no aparecerán en los resultados.
                        </p>
                    )}
                </div>
                {/* Fila 2 — ordenamiento y clasificación rápida */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Ordenar por:</span>
                        <select className="rounded-md border border-slate-300 py-1.5 px-3 text-slate-700 text-sm"
                            value={ordenPor} onChange={e => setOrdenPor(e.target.value)}>
                            <option value="marca">A-Z</option>
                            <option value="anio_desc">Año: más nuevo</option>
                            <option value="anio_asc">Año: más antiguo</option>
                            <option value="reportes">Más reportes</option>
                            <option value="reportes_asc">Menos reportes</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Mostrar:</span>
                        <div className="flex gap-1">
                            {[
                                { value: "",          label: "Todos" },
                                { value: "con",       label: "Con reportes" },
                                { value: "sin",       label: "Sin reportes" },
                            ].map(op => (
                                <button key={op.value} type="button"
                                    onClick={() => { setFiltroReportes(op.value); setPagina(1) }}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                        filtroReportes === op.value
                                            ? "bg-blue-900 text-white"
                                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                    }`}>
                                    {op.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {hayFiltros && (
                        <button type="button"
                            onClick={() => { setFiltroTipo(""); setFiltroMarca(""); setBusqueda(""); setOrdenPor("marca"); setFiltroReportes(""); setFiltroTransmision(""); setFiltroTraccion(""); setFiltroCombustible(""); setFiltroTurbo("") }}
                            className="text-sm text-slate-500 hover:underline ml-auto">
                            Limpiar filtros
                        </button>
                    )}
                </div>
                <p className="text-xs text-slate-400">
                    {vehiculosOrdenados.length} vehículo(s) · ordenado por <strong>
                        {ordenPor === "marca" ? "A-Z" :
                         ordenPor === "anio_desc" ? "año más nuevo" :
                         ordenPor === "anio_asc" ? "año más antiguo" :
                         ordenPor === "reportes" ? "más reportes" : "menos reportes"}
                    </strong>
                </p>
            </div>

            {cargando ? (
                <p className="text-slate-400">Cargando vehículos...</p>
            ) : vehiculos.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">
                    No hay vehículos que coincidan.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {vehiculosOrdenados.map(v => (
                            <div key={v._id} className={`bg-white rounded-xl shadow overflow-hidden flex flex-col ${modoEdicion ? "border-2 border-amber-400" : ""}`}>
                                <CarruselVehiculo
                                    vehiculo={v}
                                    onAbrir={(fotos, idx) => setLightbox({ fotos, idx })}
                                />
                                <div className="p-3 flex flex-col gap-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <LogoMarca marca={v.marca} size={24} />
                                        <span className="text-sm font-semibold text-slate-800 leading-tight">
                                            {v.marca} {v.modelo}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{v.anio} · {v.tipo} · {v.combustible}</p>
                                    {v.version && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 w-fit">
                                            {v.version}
                                        </span>
                                    )}
                                    {v.totalReportes > 0 && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 w-fit">
                                            {v.totalReportes} reporte(s)
                                        </span>
                                    )}
                                    <div className="mt-auto pt-1">
                                        {modoEdicion ? (
                                            <button type="button" onClick={() => abrirGestionFotos(v)}
                                                className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors">
                                                🖼 Gestionar fotos ({v.fotos?.length || 0}/5)
                                            </button>
                                        ) : (
                                            <div className="flex flex-col gap-1.5">
                                                <button type="button"
                                                    onClick={() => setModalCaracteristicas(v)}
                                                    className="w-full border border-blue-900 text-blue-900 bg-white hover:bg-blue-50 text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors">
                                                    Características
                                                </button>
                                                <button type="button"
                                                    onClick={() => navigate(`/dashboard/reportes?vehiculo=${v._id}`)}
                                                    className="w-full bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors">
                                                    Ver reportes
                                                </button>
                                                <button type="button"
                                                    onClick={() => setModalAdvertenciaValorar(v._id)}
                                                    className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors">
                                                    ⭐ Valorar vehículo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
                </>
            )}

            {/* Lightbox */}
            {lightbox && (
                <Lightbox
                    fotos={lightbox.fotos}
                    indiceInicial={lightbox.idx}
                    onCerrar={() => setLightbox(null)}
                />
            )}

            {/* Modal gestión de fotos */}
            {vehiculoFotos && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <LogoMarca marca={vehiculoFotos.marca} size={32} />
                                <div>
                                    <h3 className="font-bold text-slate-800">
                                        {vehiculoFotos.marca} {vehiculoFotos.modelo} {vehiculoFotos.anio}
                                    </h3>
                                    <p className="text-xs text-slate-400">{vehiculoFotos.fotos?.length || 0} / 5 fotos</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setVehiculoFotos(null)}
                                className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Fotos manuales */}
                            {vehiculoFotos.fotos?.length > 0 ? (
                                <div>
                                    <p className="text-xs text-slate-400 mb-2">Arrastra las fotos para reordenar · La primera es la principal</p>
                                    <div className="grid grid-cols-3 gap-3" id="foto-grid">
                                        {vehiculoFotos.fotos.map((foto, index) => (
                                            <div
                                                key={foto._id}
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData("fotoId", foto._id)
                                                    e.currentTarget.style.opacity = "0.4"
                                                }}
                                                onDragEnd={(e) => { e.currentTarget.style.opacity = "1" }}
                                                onDragOver={(e) => {
                                                    e.preventDefault()
                                                    e.currentTarget.style.border = "2px solid #378ADD"
                                                    e.currentTarget.style.transform = "scale(1.03)"
                                                }}
                                                onDragLeave={(e) => {
                                                    e.currentTarget.style.border = "0.5px solid var(--color-border-tertiary, #e2e8f0)"
                                                    e.currentTarget.style.transform = "scale(1)"
                                                }}
                                                onDrop={async (e) => {
                                                    e.preventDefault()
                                                    e.currentTarget.style.border = "0.5px solid var(--color-border-tertiary, #e2e8f0)"
                                                    e.currentTarget.style.transform = "scale(1)"
                                                    const fromId = e.dataTransfer.getData("fotoId")
                                                    if (fromId === foto._id) return
                                                    const fotos = [...vehiculoFotos.fotos]
                                                    const fromIdx = fotos.findIndex(f => f._id === fromId)
                                                    const toIdx = fotos.findIndex(f => f._id === foto._id)
                                                    const [moved] = fotos.splice(fromIdx, 1)
                                                    fotos.splice(toIdx, 0, moved)
                                                    // Actualizar UI inmediatamente
                                                    setVehiculoFotos(prev => ({ ...prev, fotos }))
                                                    try {
                                                        const res = await reordenarFotosVehiculo(vehiculoFotos._id, fotos.map(f => f._id))
                                                        setVehiculoFotos(prev => ({ ...prev, fotos: res.data.fotos }))
                                                        setVehiculos(prev => prev.map(v =>
                                                            v._id === vehiculoFotos._id ? { ...v, fotos: res.data.fotos } : v
                                                        ))
                                                    } catch {
                                                        toast.error("Error al reordenar")
                                                    }
                                                }}
                                                className="relative group rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
                                                style={{ border: "0.5px solid #e2e8f0", transition: "transform 0.15s, border 0.15s" }}
                                            >
                                                <img src={foto.url} alt="foto vehículo" className="w-full h-24 object-cover pointer-events-none" />
                                                {index === 0 && (
                                                    <span className="absolute top-1 left-1 bg-blue-900 text-white text-xs px-1.5 py-0.5 rounded pointer-events-none">
                                                        Principal
                                                    </span>
                                                )}
                                                {foto.esPexels && (
                                                    <span className="absolute top-1 right-1 bg-green-700 text-white text-xs px-1.5 py-0.5 rounded pointer-events-none">
                                                        P
                                                    </span>
                                                )}
                                                <button type="button"
                                                    onClick={() => setModalEliminarFoto(foto)}
                                                    className="absolute bottom-1.5 right-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    🗑
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-400 text-sm">
                                    No hay fotos manuales aún.
                                </div>
                            )}

                            {/* Fotos de Pexels disponibles para guardar */}
                            {!vehiculoFotos.ocultarFotoAuto && (() => {
                                const key = `${vehiculoFotos.marca} ${vehiculoFotos.modelo}`.toLowerCase()
                                const fotosPexels = pexelsCache[key] || []
                                // Fotos de Pexels ya guardadas en BD (tienen urlOriginal)
                                const urlsYaGuardadas = (vehiculoFotos.fotos || [])
                                    .filter(f => f.esPexels && f.urlOriginal)
                                    .map(f => f.urlOriginal)
                                const pendientes = fotosPexels.filter(url => !urlsYaGuardadas.includes(url))
                                if (pendientes.length === 0) return null
                                return (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 mb-2">Fotos automáticas (Pexels) — guarda las que quieras:</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {pendientes.map((url, i) => (
                                                <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-200">
                                                    <img src={url} alt={`pexels ${i}`} className="w-full h-24 object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                                                        <button type="button"
                                                            onClick={() => handleGuardarFotoPexels(url)}
                                                            disabled={guardandoPexels === url}
                                                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 rounded disabled:opacity-60">
                                                            {guardandoPexels === url ? "Guardando..." : "💾 Guardar"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })()}

                            {(vehiculoFotos.fotos?.length || 0) < 5 ? (
                                <div>
                                    <input type="file" ref={inputFotoRef} accept="image/*" className="hidden" onChange={handleSubirFoto} />
                                    <button type="button" onClick={() => inputFotoRef.current?.click()} disabled={subiendo}
                                        className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 text-slate-500 hover:text-blue-600 rounded-lg py-3 text-sm font-semibold transition-colors disabled:opacity-50">
                                        {subiendo ? "Subiendo..." : "+ Agregar foto"}
                                    </button>
                                    <p className="text-xs text-slate-400 text-center mt-1">
                                        Máximo 5 fotos · La primera subida será la principal
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 text-center">
                                    Límite de 5 fotos alcanzado. Elimina una para agregar otra.
                                </div>
                            )}

                            {(vehiculoFotos.fotos?.length || 0) === 0 && (
                                <div className={`rounded-lg px-4 py-3 border ${vehiculoFotos.ocultarFotoAuto ? "bg-slate-50 border-slate-200" : "bg-blue-50 border-blue-200"}`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {vehiculoFotos.ocultarFotoAuto ? "Foto automática oculta" : "Foto automática activa"}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {vehiculoFotos.ocultarFotoAuto
                                                    ? "Se muestra el placeholder hasta que subas una foto."
                                                    : "Se busca automáticamente en internet si no hay foto manual."}
                                            </p>
                                        </div>
                                        <button type="button" onClick={handleToggleFotoAuto}
                                            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                                vehiculoFotos.ocultarFotoAuto
                                                    ? "bg-blue-100 hover:bg-blue-200 text-blue-800"
                                                    : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                                            }`}>
                                            {vehiculoFotos.ocultarFotoAuto ? "Activar" : "Ocultar"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {modalEliminarFoto && (
                <ModalConfirmar
                    titulo="¿Eliminar esta foto?"
                    descripcion="La foto se eliminará permanentemente. Si es la principal, la siguiente tomará su lugar."
                    textoConfirmar="Sí, eliminar"
                    colorBoton="bg-red-600 hover:bg-red-700"
                    onConfirmar={handleEliminarFoto}
                    onCancelar={() => setModalEliminarFoto(null)}
                />
            )}

            {/* Modal características */}
            {modalCaracteristicas && (
                <ModalCaracteristicas
                    vehiculo={modalCaracteristicas}
                    onCerrar={() => setModalCaracteristicas(null)}
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
                            <button type="button" onClick={() => setModalAdvertenciaValorar(null)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm">
                                Cancelar
                            </button>
                            <button type="button"
                                onClick={() => { const id = modalAdvertenciaValorar; setModalAdvertenciaValorar(null); navigate(`/dashboard/confiabilidad/${id}?confirmado=true`) }}
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

export default CatalogoVehiculos