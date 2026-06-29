import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { getRanking } from "../services/valoracionService"
import LogoMarca from "../components/ui/LogoMarca"
import Paginacion from "../components/ui/Paginacion"

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY
const pexelsCache = {}

const buscarFotoPexels = async (marca, modelo) => {
    const key = `${marca} ${modelo}`.toLowerCase()
    if (pexelsCache[key] !== undefined) return pexelsCache[key]
    try {
        const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(`${marca} ${modelo} car`)}&per_page=3&orientation=landscape`,
            { headers: { Authorization: PEXELS_API_KEY } }
        )
        const data = await res.json()
        const urls = data.photos?.map(p => p.src.medium) || []
        pexelsCache[key] = urls
        return urls
    } catch { pexelsCache[key] = []; return [] }
}

// Lightbox
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
            <button type="button" onClick={onCerrar} className="absolute top-4 right-5 text-white text-3xl font-light hover:text-slate-300">×</button>
            {fotos.length > 1 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setIdx(i => (i - 1 + fotos.length) % fotos.length) }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center text-xl">‹</button>
            )}
            <img src={fotos[idx]} alt="foto ampliada" className="max-w-full max-h-[85vh] rounded-lg object-contain" onClick={e => e.stopPropagation()} />
            {fotos.length > 1 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setIdx(i => (i + 1) % fotos.length) }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center text-xl">›</button>
            )}
            {fotos.length > 1 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                    {fotos.map((_, i) => (
                        <button key={i} type="button" onClick={e => { e.stopPropagation(); setIdx(i) }}
                            className={`w-2 h-2 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`} />
                    ))}
                </div>
            )}
            {fotos.length > 1 && <div className="absolute top-4 left-5 text-white/70 text-sm">{idx + 1} / {fotos.length}</div>}
        </div>
    )
}

// Carrusel con hover controls
const CarruselVehiculo = ({ vehiculo, onAbrir }) => {
    const fotosDB = vehiculo.fotos || []
    const [pexelsFotos, setPexelsFotos] = useState([])
    const [cargando, setCargando] = useState(false)
    const [idx, setIdx] = useState(0)

    const todasLasFotos = fotosDB.length > 0 ? fotosDB.map(f => f.url) : pexelsFotos

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

    const cambiar = (dir, e) => { e.stopPropagation(); setIdx(i => (i + dir + todasLasFotos.length) % todasLasFotos.length) }

    if (cargando) return <div className="w-full h-36 bg-slate-100 animate-pulse rounded-t-xl" />

    if (todasLasFotos.length === 0) return (
        <div className="w-full h-36 bg-slate-100 flex flex-col items-center justify-center gap-1 rounded-t-xl">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 17H3a2 2 0 01-2-2v-4a2 2 0 012-2h1l2-4h10l2 4h1a2 2 0 012 2v4a2 2 0 01-2 2h-2m-7 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <span className="text-xs text-slate-400">Sin foto</span>
        </div>
    )

    return (
        <div className="relative w-full h-36 overflow-hidden cursor-pointer group rounded-t-xl"
            onClick={() => onAbrir(todasLasFotos, idx)}>
            <img src={todasLasFotos[idx]} alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={e => e.target.style.display = "none"} />
            {todasLasFotos.length > 1 && (
                <>
                    <div className="absolute inset-0 flex items-center justify-between px-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button type="button" onClick={e => cambiar(-1, e)}
                            className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-base hover:bg-black/70">‹</button>
                        <button type="button" onClick={e => cambiar(1, e)}
                            className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-base hover:bg-black/70">›</button>
                    </div>
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                        {todasLasFotos.map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`} />
                        ))}
                    </div>
                </>
            )}
            <button type="button" onClick={e => { e.stopPropagation(); onAbrir(todasLasFotos, idx) }}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                ⛶ Ampliar
            </button>
        </div>
    )
}

// Componente estrellas (solo lectura)
// Estrellas con relleno parcial (ej: 4.3 = 4 llenas + la 5ta al 30%)
const Estrellas = ({ valor, size = "sm" }) => {
    const sz = size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm"
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

// Barra de puntaje
const BarraPuntaje = ({ valor, max = 5 }) => {
    const pct = (valor / max) * 100
    const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : pct >= 40 ? "bg-orange-400" : "bg-red-500"
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-600 w-6 text-right">{valor}</span>
        </div>
    )
}

// Foto del vehículo con fallback Pexels
// Badge de confiabilidad
const BadgeConfiabilidad = ({ puntaje }) => {
    if (puntaje >= 4.5) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">⭐ Excelente</span>
    if (puntaje >= 3.5) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">👍 Bueno</span>
    if (puntaje >= 2.5) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⚠️ Regular</span>
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">👎 Deficiente</span>
}

const TIPOS = ["automóvil", "suv", "camioneta", "moto", "vehículo comercial"]

const ORDEN_OPCIONES = [
    { value: "puntajeGeneral", label: "Puntaje general" },
    { value: "confiabilidad",  label: "Confiabilidad" },
    { value: "seguridad",      label: "Seguridad" },
    { value: "consumo",        label: "Consumo de combustible" },
    { value: "precio",         label: "Precio del vehículo" },
    { value: "comodidad",      label: "Comodidad" },
    { value: "mantenimiento",  label: "Mantenimiento" },
    { value: "repuestos",      label: "Precio de repuestos" },
    { value: "totalValoraciones", label: "Más valorados" },
]

const Confiabilidad = () => {
    const navigate = useNavigate()
    const [ranking, setRanking] = useState([])
    const [cargando, setCargando] = useState(true)
    const [filtroTipo, setFiltroTipo] = useState("")
    const [filtroMarca, setFiltroMarca] = useState("")
    const [busqueda, setBusqueda] = useState("")
    const [ordenPor, setOrdenPor] = useState("puntajeGeneral")
    const [ordenDir, setOrdenDir] = useState("desc") // desc = mayor a menor
    const [filtroClasificacion, setFiltroClasificacion] = useState("") // "mejores" | "peores" | ""
    const [filtroAnio, setFiltroAnio] = useState("")
    const [pagina, setPagina] = useState(1)
    const POR_PAGINA = 12
    const [lightbox, setLightbox] = useState(null)

    const cargar = useCallback(async () => {
        setCargando(true)
        try {
            const res = await getRanking({ tipo: filtroTipo, marca: filtroMarca, minValoraciones: 1 })
            setRanking(res.data.ranking || [])
        } catch (e) { console.error(e); setRanking([]) }
        setCargando(false)
        setPagina(1)
    }, [filtroTipo, filtroMarca])

    useEffect(() => { cargar() }, [cargar])

    // Aplicar filtros y ordenamiento en el frontend
    const rankingProcesado = ranking
        .filter(r => {
            if (busqueda && !`${r.vehiculo.marca} ${r.vehiculo.modelo}`.toLowerCase().includes(busqueda.toLowerCase())) return false
            if (filtroClasificacion === "mejores" && r.puntajeGeneral < 4) return false
            if (filtroClasificacion === "peores" && r.puntajeGeneral > 2.5) return false
            if (filtroAnio && String(r.vehiculo.anio) !== filtroAnio) return false
            return true
        })
        .sort((a, b) => {
            const valA = ordenPor === "puntajeGeneral" || ordenPor === "totalValoraciones"
                ? a[ordenPor]
                : a.aspectos[ordenPor] || 0
            const valB = ordenPor === "puntajeGeneral" || ordenPor === "totalValoraciones"
                ? b[ordenPor]
                : b.aspectos[ordenPor] || 0
            return ordenDir === "desc" ? valB - valA : valA - valB
        })

    const totalPaginas = Math.ceil(rankingProcesado.length / POR_PAGINA)
    const rankingPagina = rankingProcesado.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
    const marcasUnicas = [...new Set(ranking.map(r => r.vehiculo.marca))].sort()
    const aniosUnicos = [...new Set(ranking.map(r => r.vehiculo.anio))].sort((a, b) => b - a)

    const hayFiltros = filtroTipo || filtroMarca || busqueda || filtroClasificacion || filtroAnio || ordenPor !== "puntajeGeneral" || ordenDir !== "desc"

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Confiabilidad</h1>
            <p className="text-slate-500 mb-6 text-sm">
                Ranking basado en valoraciones de usuarios registrados · {ranking.length} vehículo(s) con valoraciones
            </p>

            {/* Panel de filtros */}
            <div className="bg-white rounded-xl shadow p-4 mb-6 space-y-3">
                <div className="flex flex-wrap gap-3">
                    <input type="text" placeholder="Buscar marca o modelo..."
                        className="flex-1 min-w-48 rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm"
                        value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1) }} />
                    <select className="rounded-md border border-slate-300 py-2 px-3 text-slate-700 text-sm"
                        value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                        <option value="">Todos los tipos</option>
                        {TIPOS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                    <select className="rounded-md border border-slate-300 py-2 px-3 text-slate-700 text-sm"
                        value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>
                        <option value="">Todas las marcas</option>
                        {marcasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select className="rounded-md border border-slate-300 py-2 px-3 text-slate-700 text-sm"
                        value={filtroAnio} onChange={e => { setFiltroAnio(e.target.value); setPagina(1) }}>
                        <option value="">Todos los años</option>
                        {aniosUnicos.map(a => <option key={a} value={String(a)}>{a}</option>)}
                    </select>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Ordenar por */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Ordenar por:</span>
                        <select className="rounded-md border border-slate-300 py-1.5 px-3 text-slate-700 text-sm"
                            value={ordenPor} onChange={e => { setOrdenPor(e.target.value); setPagina(1) }}>
                            {ORDEN_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <button type="button"
                            onClick={() => { setOrdenDir(d => d === "desc" ? "asc" : "desc"); setPagina(1) }}
                            className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
                            title={ordenDir === "desc" ? "Mayor a menor" : "Menor a mayor"}>
                            {ordenDir === "desc" ? "↓ Mayor" : "↑ Menor"}
                        </button>
                    </div>
                    {/* Clasificación rápida */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Mostrar:</span>
                        <div className="flex gap-1">
                            {[
                                { value: "", label: "Todos" },
                                { value: "mejores", label: "⭐ Mejores (≥4)" },
                                { value: "peores",  label: "👎 Peores (≤2.5)" },
                            ].map(op => (
                                <button key={op.value} type="button"
                                    onClick={() => { setFiltroClasificacion(op.value); setPagina(1) }}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                        filtroClasificacion === op.value
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
                            onClick={() => { setFiltroTipo(""); setFiltroMarca(""); setBusqueda(""); setOrdenPor("puntajeGeneral"); setOrdenDir("desc"); setFiltroClasificacion(""); setFiltroAnio(""); setPagina(1) }}
                            className="text-sm text-slate-500 hover:underline ml-auto">
                            Limpiar filtros
                        </button>
                    )}
                </div>
                <p className="text-xs text-slate-400">
                    {rankingProcesado.length} resultado(s) · ordenado por <strong>{ORDEN_OPCIONES.find(o => o.value === ordenPor)?.label}</strong> de {ordenDir === "desc" ? "mayor a menor" : "menor a mayor"}
                </p>
            </div>

            {cargando ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow overflow-hidden animate-pulse">
                            <div className="h-36 bg-slate-200" />
                            <div className="p-3 space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-3/4" />
                                <div className="h-3 bg-slate-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : rankingProcesado.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
                    <p className="text-slate-500 text-lg mb-2">Sin valoraciones aún</p>
                    <p className="text-slate-400 text-sm">Los vehículos aparecerán aquí una vez que los usuarios los valoren.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {rankingPagina.map((item, idx) => {
                            const posicion = (pagina - 1) * POR_PAGINA + idx + 1
                            return (
                                <div key={item.vehiculo._id}
                                    className="bg-white rounded-xl shadow hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                                    {/* Foto — clic abre lightbox, no navega */}
                                    <div className="relative" onClick={e => e.stopPropagation()}>
                                        <CarruselVehiculo
                                            vehiculo={item.vehiculo}
                                            onAbrir={(fotos, idx) => setLightbox({ fotos, idx })}
                                        />
                                        <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow ${
                                            posicion === 1 ? "bg-amber-400" :
                                            posicion === 2 ? "bg-slate-400" :
                                            posicion === 3 ? "bg-amber-700" : "bg-blue-900"
                                        }`}>
                                            {posicion}
                                        </div>
                                    </div>
                                    {/* Info — solo visual, ya no navega al hacer clic */}
                                    <div className="p-3 flex flex-col gap-1.5 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <LogoMarca marca={item.vehiculo.marca} size={20} />
                                            <span className="text-sm font-semibold text-slate-800 leading-tight truncate">
                                                {item.vehiculo.marca} {item.vehiculo.modelo}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">{item.vehiculo.anio} · {item.vehiculo.tipo} · {item.vehiculo.combustible}</p>
                                        {item.vehiculo.version && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 w-fit">
                                                {item.vehiculo.version}
                                            </span>
                                        )}
                                        {(() => {
                                            // Si se ordenó por un aspecto específico (no general ni total),
                                            // se muestra el puntaje de ese aspecto en vez del general
                                            const mostrandoAspecto = ordenPor !== "puntajeGeneral" && ordenPor !== "totalValoraciones"
                                            const puntajeMostrado = mostrandoAspecto ? item.aspectos?.[ordenPor] : item.puntajeGeneral
                                            const labelAspecto = ORDEN_OPCIONES.find(o => o.value === ordenPor)?.label
                                            return (
                                                <>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <Estrellas valor={puntajeMostrado} />
                                                        <span className="text-sm font-bold text-slate-700">{puntajeMostrado}</span>
                                                    </div>
                                                    {mostrandoAspecto && (
                                                        <p className="text-xs text-amber-600 font-medium -mt-1">{labelAspecto}</p>
                                                    )}
                                                    <BadgeConfiabilidad puntaje={item.puntajeGeneral} />
                                                </>
                                            )
                                        })()}
                                        <p className="text-xs text-slate-400">
                                            {item.totalValoraciones} valoración(es)
                                        </p>
                                    </div>
                                    {/* Botón explícito */}
                                    <div className="px-3 pb-3">
                                        <button type="button"
                                            onClick={() => navigate(`/dashboard/confiabilidad/${item.vehiculo._id}`)}
                                            className="w-full bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
                                            Ver valoraciones ⭐
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {totalPaginas > 1 && (
                        <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                    )}
                </>
            )}
            {lightbox && (
                <Lightbox fotos={lightbox.fotos} indiceInicial={lightbox.idx} onCerrar={() => setLightbox(null)} />
            )}
        </div>
    )
}

export default Confiabilidad