import { useEffect, useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import { getEstadisticas, getTendencias } from "../services/reporteService"
import { exportarBoletinPDF, exportarFichaVehiculo } from "../services/exportService"
import storeAuth from "../context/storeAuth"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, CartesianGrid,
    LineChart, Line, AreaChart, Area
} from "recharts"

// ── Paletas de colores ───────────────────────────────────────────
const AZUL = "#1E3A8A"
const COLORES_MARCA  = ["#1e3a8a","#1d4ed8","#2563eb","#3b82f6","#60a5fa","#93c5fd","#1e40af","#172554","#1d4ed8","#2563eb"]
const COLORES_FALLA  = ["#7c3aed","#6d28d9","#8b5cf6","#a78bfa","#c4b5fd","#7c3aed","#5b21b6","#4c1d95","#8b5cf6","#7c3aed"]
const COLORES_REGION = ["#0891b2","#0e7490","#06b6d4","#22d3ee","#67e8f9","#0891b2","#164e63","#0e7490","#06b6d4","#22d3ee"]
const COLORES_LINEAS = ["#1e3a8a","#dc2626","#16a34a","#d97706","#7c3aed","#0891b2","#be185d"]
const COLOR_GRAVEDAD = { baja: "#3b82f6", media: "#f59e0b", alta: "#dc2626" }

// ── Componentes auxiliares ───────────────────────────────────────
const TooltipBase = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-2">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-800">{payload[0].value} reporte(s)</p>
        </div>
    )
}

const TooltipTendencia = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm">
            <p className="font-bold text-slate-700 mb-2">Año {label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value} falla(s)</strong></p>
            ))}
        </div>
    )
}

const TooltipMes = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const [anio, mes] = label.split("-")
    const meses = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-2">
            <p className="text-xs text-slate-500 mb-1">{meses[parseInt(mes)]} {anio}</p>
            <p className="text-sm font-bold text-slate-800">{payload[0].value} reporte(s)</p>
        </div>
    )
}

const Tarjeta = ({ titulo, valor, sub, color = "border-blue-900", icono }) => (
    <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${color}`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-slate-500 mb-1">{titulo}</p>
                <p className="text-3xl font-black text-slate-800">{valor}</p>
                {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
            </div>
            {icono && <span className="text-2xl opacity-30">{icono}</span>}
        </div>
    </div>
)

// Regresión lineal por mínimos cuadrados
const regresionLineal = (datos) => {
    const n = datos.length
    if (n < 2) return null
    const sumX = datos.reduce((a, d) => a + d.anio, 0)
    const sumY = datos.reduce((a, d) => a + d.totalFallas, 0)
    const sumXY = datos.reduce((a, d) => a + d.anio * d.totalFallas, 0)
    const sumX2 = datos.reduce((a, d) => a + d.anio * d.anio, 0)
    const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercepto = (sumY - pendiente * sumX) / n
    const mediaY = sumY / n
    const ssTot = datos.reduce((a, d) => a + Math.pow(d.totalFallas - mediaY, 2), 0)
    const ssRes = datos.reduce((a, d) => a + Math.pow(d.totalFallas - (pendiente * d.anio + intercepto), 2), 0)
    const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot
    return {
        pendiente: Math.round(pendiente * 100) / 100,
        r2: Math.round(r2 * 100) / 100
    }
}

// Círculos estilo Consumer Reports ●●●○○
const CirculosRating = ({ valor, max = 5, color = "#1e3a8a" }) => {
    const llenos = Math.round(valor)
    return (
        <div className="flex gap-1 items-center">
            {Array.from({ length: max }, (_, i) => (
                <div key={i} className="w-3 h-3 rounded-full border-2"
                    style={{
                        backgroundColor: i < llenos ? color : "transparent",
                        borderColor: i < llenos ? color : "#CBD5E1"
                    }} />
            ))}
        </div>
    )
}

// Barra de rating horizontal con etiqueta
const BarraRating = ({ label, valor, max = 5 }) => {
    const pct = (valor / max) * 100
    const color = valor >= 4 ? "#16a34a" : valor >= 3 ? "#d97706" : "#dc2626"
    return (
        <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-600 w-36 shrink-0">{label}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <CirculosRating valor={valor} color={color} />
            <span className="text-sm font-bold w-8 text-right" style={{ color }}>{valor.toFixed(1)}</span>
        </div>
    )
}

// ── Pestañas ─────────────────────────────────────────────────────
const PESTANAS = [
    { id: "resumen",   label: "Resumen",    icono: "📊" },
    { id: "vehiculo",  label: "Por vehículo", icono: "🚗" },
    { id: "tendencia", label: "Tendencias", icono: "📈" },
    { id: "reportes",  label: "Actividad",  icono: "📅" },
]

// ── Componente principal ─────────────────────────────────────────
const Estadisticas = () => {
    const { rol, token } = storeAuth()
    const [data, setData] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [pestana, setPestana] = useState("resumen")
    const [exportandoPDF, setExportandoPDF] = useState(false)

    // Filtros pestaña Resumen
    const [filtroGravedad, setFiltroGravedad] = useState("")
    const [filtroTopN, setFiltroTopN] = useState(10)

    // Filtro pestaña Actividad
    const [filtroAnio, setFiltroAnio] = useState("")

    // Tendencias
    const [tendenciaData, setTendenciaData] = useState(null)
    const [modelosDisponibles, setModelosDisponibles] = useState([])
    const [marcaSeleccionada, setMarcaSeleccionada] = useState("")
    const [modeloSeleccionado, setModeloSeleccionado] = useState("")
    const [cargandoTendencia, setCargandoTendencia] = useState(false)

    // Por vehículo
    const [busquedaVehiculo, setBusquedaVehiculo] = useState("")
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null)
    const [descargandoFicha, setDescargandoFicha] = useState(false)

    useEffect(() => {
        const cargar = async () => {
            try {
                const res = await getEstadisticas()
                setData(res.data)
            } catch { /* silencioso */ }
            setCargando(false)
        }
        cargar()
    }, [])

    useEffect(() => {
        getTendencias().then(res => {
            setModelosDisponibles(res.data.modelos || [])
        }).catch(() => {})
    }, [])

    const cargarTendencia = async () => {
        if (!marcaSeleccionada) return
        setCargandoTendencia(true)
        try {
            const res = await getTendencias({ marca: marcaSeleccionada, modelo: modeloSeleccionado || undefined })
            setTendenciaData(res.data.tendencia || [])
        } catch { /* silencioso */ }
        setCargandoTendencia(false)
    }

    const handleExportarBoletin = async () => {
        setExportandoPDF(true)
        try { await exportarBoletinPDF(token) }
        catch { toast.error("Error al generar el boletín PDF") }
        setExportandoPDF(false)
    }

    const handleDescargarFicha = async () => {
        if (!vehiculoSeleccionado?._id) return
        setDescargandoFicha(true)
        try { await exportarFichaVehiculo(token, vehiculoSeleccionado._id) }
        catch { toast.error("Error al generar la ficha") }
        setDescargandoFicha(false)
    }

    // Marcas únicas disponibles para tendencias
    const marcasDisponibles = [...new Set(modelosDisponibles.map(m => m.marca))].sort()
    const modelosFiltrados = modelosDisponibles.filter(m => m.marca === marcaSeleccionada)

    // Datos para LineChart de tendencias
    const datosLinea = (() => {
        if (!tendenciaData?.length) return []
        const aniosSet = new Set()
        tendenciaData.forEach(t => t.datos.forEach(d => aniosSet.add(d.anio)))
        return [...aniosSet].sort().map(anio => {
            const punto = { anio }
            tendenciaData.forEach(t => {
                const d = t.datos.find(d => d.anio === anio)
                punto[t.modelo] = d?.totalFallas || 0
            })
            return punto
        })
    })()

    // Búsqueda de vehículos en tiempo real
    const [vehiculosBuscados, setVehiculosBuscados] = useState([])
    const [buscandoVehiculos, setBuscandoVehiculos] = useState(false)

    useEffect(() => {
        if (!busquedaVehiculo || busquedaVehiculo.length < 2) {
            setVehiculosBuscados([])
            return
        }
        const timer = setTimeout(async () => {
            setBuscandoVehiculos(true)
            try {
                const storedUser = JSON.parse(localStorage.getItem("auth-token"))
                const tkn = storedUser?.state?.token
                const API = import.meta.env.VITE_BACKEND_URL
                const res = await fetch(`${API}/vehiculos/selector`, {
                    headers: { Authorization: `Bearer ${tkn}` }
                })
                const data = await res.json()
                const b = busquedaVehiculo.toLowerCase()
                const filtrados = (data.vehiculos || []).filter(v =>
                    `${v.marca} ${v.modelo} ${v.anio} ${v.version || ""}`.toLowerCase().includes(b)
                ).slice(0, 8)
                setVehiculosBuscados(filtrados)
            } catch { setVehiculosBuscados([]) }
            setBuscandoVehiculos(false)
        }, 300)
        return () => clearTimeout(timer)
    }, [busquedaVehiculo])

    if (cargando) return (
        <div className="flex items-center justify-center h-48">
            <div className="text-slate-400 text-sm">Cargando estadísticas...</div>
        </div>
    )
    if (!data) return <p className="text-slate-500">No se pudieron cargar las estadísticas.</p>

    // Datos preparados
    const dataMarca    = (data.porMarca     || []).map(m => ({ nombre: m._id, total: m.total }))
    const dataTipoFalla = (data.porTipoFalla || []).map(t => ({ nombre: t._id, total: t.total }))
    const dataGravedad  = (data.porGravedad  || []).filter(g => g.total > 0).map(g => ({ nombre: g._id, total: g.total }))
    const dataModelo    = (data.porModelo    || []).map(m => ({ nombre: m._id, total: m.total }))
    const dataRegion    = (data.porRegion    || []).map(r => ({ nombre: r._id, total: r.total }))
    const dataMes       = (data.porMes       || []).map(m => {
        const [anio, mes] = m._id.split("-")
        const meses = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
        return { nombre: `${meses[parseInt(mes)]} ${anio}`, mes: m._id, total: m.total }
    })

    // Aplicar filtros
    const dataMarcaF    = filtroGravedad ? dataMarca    : dataMarca
    const dataTipoFallaF = (data.porTipoFalla || []).map(t => ({ nombre: t._id, total: t.total })).slice(0, filtroTopN)
    const dataMarcaFiltN = dataMarca.slice(0, filtroTopN)
    const dataModeloFiltN = dataModelo.slice(0, filtroTopN)

    // Años disponibles en dataMes para filtro
    const aniosDisponibles = [...new Set((data.porMes || []).map(m => m._id.split("-")[0]))].sort().reverse()
    const dataMesFiltrada = filtroAnio
        ? dataMes.filter(m => m.mes.startsWith(filtroAnio))
        : dataMes

    const totalAlta  = dataGravedad.find(g => g.nombre === "alta")?.total  || 0
    const totalMedia = dataGravedad.find(g => g.nombre === "media")?.total || 0
    const totalBaja  = dataGravedad.find(g => g.nombre === "baja")?.total  || 0
    const marcaTop   = dataMarca[0]?.nombre    || "—"
    const fallaTop   = dataTipoFalla[0]?.nombre || "—"
    const regionTop  = dataRegion[0]?.nombre   || "—"

    return (
        <div>
            <ToastContainer />

            {/* ── Header ── */}
            <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Estadísticas y tendencias</h1>
                    <p className="text-slate-500 mt-1">
                        Análisis basado en <strong>{data.total}</strong> reporte(s) verificado(s).
                    </p>
                </div>
            </div>

            {data.total === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
                    <p className="text-4xl mb-4">📊</p>
                    <p className="text-slate-600 font-semibold">Aún no hay reportes verificados</p>
                    <p className="text-slate-400 text-sm mt-1">Las estadísticas aparecerán cuando se validen los primeros reportes.</p>
                </div>
            ) : (
                <>
                    {/* ── Pestañas ── */}
                    <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 overflow-x-auto">
                        {PESTANAS.map(p => (
                            <button key={p.id} type="button"
                                onClick={() => setPestana(p.id)}
                                className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                                    pestana === p.id
                                        ? "bg-white text-blue-900 shadow"
                                        : "text-slate-500 hover:text-slate-700"
                                }`}>
                                <span>{p.icono}</span>
                                <span>{p.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* ══════════════════════════════════════════════
                        PESTAÑA 1 — RESUMEN GENERAL
                    ══════════════════════════════════════════════ */}
                    {pestana === "resumen" && (
                        <>
                            {/* Barra de filtros */}
                            <div className="flex flex-wrap gap-3 mb-5 bg-white rounded-xl border border-slate-100 shadow-sm p-4 items-center">
                                <span className="text-sm font-semibold text-slate-600 mr-1">🔍 Filtros:</span>

                                {/* Filtro gravedad */}
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-slate-500">Gravedad</label>
                                    <select value={filtroGravedad} onChange={e => setFiltroGravedad(e.target.value)}
                                        className="rounded-lg border border-slate-200 text-sm py-1.5 px-3 text-slate-700 focus:border-blue-700 focus:outline-none">
                                        <option value="">Todas</option>
                                        <option value="alta">🔴 Alta</option>
                                        <option value="media">🟡 Media</option>
                                        <option value="baja">🔵 Baja</option>
                                    </select>
                                </div>

                                {/* Filtro Top N */}
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-slate-500">Mostrar</label>
                                    <select value={filtroTopN} onChange={e => setFiltroTopN(Number(e.target.value))}
                                        className="rounded-lg border border-slate-200 text-sm py-1.5 px-3 text-slate-700 focus:border-blue-700 focus:outline-none">
                                        <option value={5}>Top 5</option>
                                        <option value={10}>Top 10</option>
                                        <option value={20}>Top 20</option>
                                        <option value={9999}>Todos</option>
                                    </select>
                                </div>

                                {/* Botón limpiar */}
                                {(filtroGravedad || filtroTopN !== 10) && (
                                    <button type="button"
                                        onClick={() => { setFiltroGravedad(""); setFiltroTopN(10) }}
                                        className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg border border-slate-200 hover:border-red-200">
                                        ✕ Limpiar
                                    </button>
                                )}

                                {filtroGravedad && (
                                    <span className="ml-auto text-xs text-slate-400">
                                        Mostrando solo gravedad <strong className="text-slate-600">{filtroGravedad}</strong>
                                    </span>
                                )}
                            </div>

                            {/* Tarjetas — se ajustan al filtro de gravedad */}
                            {(() => {
                                const totalFiltrado = filtroGravedad
                                    ? (dataGravedad.find(g => g.nombre === filtroGravedad)?.total || 0)
                                    : data.total
                                const pctAlta = data.total > 0 ? Math.round(totalAlta / data.total * 100) : 0
                                return (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <Tarjeta titulo="Total reportes" valor={filtroGravedad ? totalFiltrado : data.total}
                                            sub={filtroGravedad ? `gravedad ${filtroGravedad}` : "verificados"}
                                            color="border-blue-900" icono="📋" />
                                        <Tarjeta titulo="Gravedad alta" valor={totalAlta}
                                            sub={`${pctAlta}% del total`} color="border-red-500" icono="🔴" />
                                        <Tarjeta titulo="Marca más reportada" valor={marcaTop}
                                            sub={`${dataMarcaFiltN[0]?.total || 0} reportes`} color="border-amber-500" icono="🏆" />
                                        <Tarjeta titulo="Falla más frecuente" valor={dataTipoFallaF[0]?.nombre || fallaTop}
                                            sub={`${dataTipoFallaF[0]?.total || 0} reportes`} color="border-purple-500" icono="⚠️" />
                                    </div>
                                )
                            })()}

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Reportes por marca */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                    <h2 className="text-base font-bold text-slate-700 mb-1">Reportes por marca</h2>
                                    <p className="text-xs text-slate-400 mb-4">Top {dataMarcaFiltN.length} marcas con más reportes</p>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={dataMarcaFiltN} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                            <Tooltip content={<TooltipBase />} />
                                            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                                {dataMarcaFiltN.map((_, i) => <Cell key={i} fill={COLORES_MARCA[i % COLORES_MARCA.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Distribución por gravedad */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                    <h2 className="text-base font-bold text-slate-700 mb-1">Distribución por gravedad</h2>
                                    <p className="text-xs text-slate-400 mb-4">Proporción de reportes según nivel de gravedad</p>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie data={dataGravedad} dataKey="total" nameKey="nombre"
                                                cx="50%" cy="45%" outerRadius={90} innerRadius={40}
                                                label={({ nombre, total, percent }) =>
                                                    `${nombre}: ${total} (${(percent * 100).toFixed(0)}%)`
                                                } labelLine>
                                                {dataGravedad.map((entry, i) => (
                                                    <Cell key={i} fill={COLOR_GRAVEDAD[entry.nombre] || "#94a3b8"} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val, name) => [val, name]} />
                                            <Legend formatter={val => val.charAt(0).toUpperCase() + val.slice(1)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Fallas más frecuentes */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                    <h2 className="text-base font-bold text-slate-700 mb-1">Fallas más frecuentes</h2>
                                    <p className="text-xs text-slate-400 mb-4">Top {dataTipoFallaF.length} tipos de falla reportados</p>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={dataTipoFallaF} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                            <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={160} />
                                            <Tooltip content={<TooltipBase />} />
                                            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                                {dataTipoFallaF.map((_, i) => <Cell key={i} fill={COLORES_FALLA[i % COLORES_FALLA.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Modelos más reportados */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                    <h2 className="text-base font-bold text-slate-700 mb-1">Modelos con más reportes</h2>
                                    <p className="text-xs text-slate-400 mb-4">Top {dataModeloFiltN.length} modelos con mayor incidencia</p>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={dataModeloFiltN} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                            <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={160} />
                                            <Tooltip content={<TooltipBase />} />
                                            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                                {dataModeloFiltN.map((_, i) => <Cell key={i} fill={COLORES_MARCA[i % COLORES_MARCA.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Resumen textual */}
                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
                                <div className="flex justify-between items-start flex-wrap gap-3 mb-2">
                                    <h3 className="font-bold text-blue-900">📝 Resumen del análisis</h3>
                                    {rol === "admin" && data.total > 0 && (
                                        <button type="button" onClick={handleExportarBoletin} disabled={exportandoPDF}
                                            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                            {exportandoPDF ? "⏳ Generando..." : "📄 Descargar boletín PDF"}
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-blue-800">
                                    Se han analizado <strong>{data.total} reportes verificados</strong>. La marca con más incidencias es <strong>{marcaTop}</strong> y la falla más reportada es <strong>"{fallaTop}"</strong>.
                                    El <strong>{Math.round(totalAlta / data.total * 100)}%</strong> de los reportes corresponde a fallas de gravedad alta,
                                    el <strong>{Math.round(totalMedia / data.total * 100)}%</strong> a media
                                    y el <strong>{Math.round(totalBaja / data.total * 100)}%</strong> a baja.
                                    {regionTop !== "—" && <> La región con más reportes es <strong>{regionTop}</strong>.</>}
                                </p>
                            </div>
                        </>
                    )}

                    {/* ══════════════════════════════════════════════
                        PESTAÑA 2 — POR VEHÍCULO (estilo Consumer Reports)
                    ══════════════════════════════════════════════ */}
                    {pestana === "vehiculo" && (
                        <div>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
                                <h2 className="text-base font-bold text-slate-700 mb-1">Ficha de confiabilidad por vehículo</h2>
                                <p className="text-xs text-slate-400 mb-4">
                                    Busca un vehículo para ver su puntuación por aspecto, fallas más comunes y descargar su ficha en PDF.
                                </p>

                            {/* Buscador con hint */}
                                <div className="relative max-w-md">
                                    <input
                                        type="text"
                                        placeholder="Ej: Toyota, Chevrolet, Honda CR-V..."
                                        value={busquedaVehiculo}
                                        onChange={e => { setBusquedaVehiculo(e.target.value); setVehiculoSeleccionado(null) }}
                                        className="w-full rounded-lg border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 pl-4 pr-10 text-slate-700 text-sm mb-3"
                                    />
                                    {busquedaVehiculo && (
                                        <button type="button"
                                            onClick={() => { setBusquedaVehiculo(""); setVehiculoSeleccionado(null) }}
                                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-lg">×</button>
                                    )}
                                </div>
                                {!busquedaVehiculo && !vehiculoSeleccionado && (
                                    <p className="text-xs text-slate-400 mb-3">
                                        💡 Escribe la marca o modelo para ver su ficha de confiabilidad y descargar el PDF.
                                    </p>
                                )}

                                {/* Lista de resultados */}
                                {busquedaVehiculo.length >= 2 && !vehiculoSeleccionado && (
                                    <div className="max-w-md border border-slate-200 rounded-lg overflow-hidden mb-4 shadow-sm">
                                        {buscandoVehiculos ? (
                                            <p className="text-sm text-slate-400 p-4 text-center">Buscando...</p>
                                        ) : vehiculosBuscados.length === 0 ? (
                                            <p className="text-sm text-slate-400 p-4 text-center">Sin resultados para "{busquedaVehiculo}".</p>
                                        ) : vehiculosBuscados.map((v, i) => (
                                            <button key={v._id || i} type="button"
                                                onClick={() => {
                                                    setVehiculoSeleccionado(v)
                                                    setBusquedaVehiculo(`${v.marca} ${v.modelo} ${v.anio}${v.version ? " " + v.version : ""}`)
                                                    setVehiculosBuscados([])
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors">
                                                <span className="font-semibold text-slate-700">{v.marca} {v.modelo}</span>
                                                <span className="text-slate-500 text-sm ml-2">{v.anio}</span>
                                                {v.version && <span className="text-xs text-blue-700 ml-2 bg-blue-50 px-1.5 py-0.5 rounded">{v.version}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Ficha del vehículo seleccionado */}
                                {vehiculoSeleccionado && (
                                    <VehiculoFicha
                                        vehiculo={vehiculoSeleccionado}
                                        token={token}
                                        onDescargar={handleDescargarFicha}
                                        descargando={descargandoFicha}
                                        onLimpiar={() => { setVehiculoSeleccionado(null); setBusquedaVehiculo("") }}
                                    />
                                )}
                            </div>

                                    {/* Tabla comparativa de top modelos */}
                                    {!vehiculoSeleccionado && (
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                            <h2 className="text-base font-bold text-slate-700 mb-1">Comparativa de modelos</h2>
                                            <p className="text-xs text-slate-400 mb-4">Modelos con más reportes de falla — indicador relativo al promedio del sistema</p>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-blue-900 text-white">
                                                            <th className="text-left py-3 px-4 rounded-tl-lg font-semibold">#</th>
                                                            <th className="text-left py-3 px-4 font-semibold">Vehículo</th>
                                                            <th className="text-center py-3 px-4 font-semibold">Reportes</th>
                                                            <th className="text-center py-3 px-4 font-semibold">Participación</th>
                                                            <th className="text-center py-3 px-4 rounded-tr-lg font-semibold">Indicador</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(() => {
                                                            const promedio = dataModelo.length > 0
                                                                ? dataModelo.reduce((a, m) => a + m.total, 0) / dataModelo.length
                                                                : 1
                                                            return dataModelo.slice(0, 10).map((m, i) => {
                                                                const pct = (m.total / data.total) * 100
                                                                const ratio = m.total / promedio
                                                                const esAlto = ratio >= 2
                                                                const esMedio = ratio >= 1.3
                                                                const color = esAlto ? "text-red-600" : esMedio ? "text-amber-600" : "text-green-600"
                                                                const bg = esAlto ? "bg-red-50" : esMedio ? "bg-amber-50" : "bg-green-50"
                                                                const label = esAlto ? "⬆ Por encima" : esMedio ? "➡ Promedio" : "⬇ Por debajo"
                                                                const tooltip = esAlto
                                                                    ? "Tiene el doble o más del promedio de reportes"
                                                                    : esMedio
                                                                    ? "Está en torno al promedio del sistema"
                                                                    : "Está por debajo del promedio del sistema"
                                                                return (
                                                                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-slate-50" : "bg-white"}`}>
                                                                        <td className="py-3 px-4 font-bold text-slate-400">{i + 1}</td>
                                                                        <td className="py-3 px-4 font-semibold text-slate-700">{m.nombre}</td>
                                                                        <td className="py-3 px-4 text-center">
                                                                            <span className="font-bold text-slate-800">{m.total}</span>
                                                                        </td>
                                                                        <td className="py-3 px-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                                                                    <div className="h-2 rounded-full bg-blue-900" style={{ width: `${Math.min(pct * 3, 100)}%` }} />
                                                                                </div>
                                                                                <span className="text-xs text-slate-500 w-10">{pct.toFixed(1)}%</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-center">
                                                                            <span title={tooltip} className={`text-xs font-bold px-2 py-1 rounded-full cursor-help ${bg} ${color}`}>
                                                                                {label}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })
                                                        })()}
                                                    </tbody>
                                                </table>
                                                <p className="text-xs text-slate-400 mt-3">
                                                    ℹ️ El indicador compara cada modelo con el promedio de reportes del sistema ({dataModelo.length > 0 ? (dataModelo.reduce((a, m) => a + m.total, 0) / dataModelo.length).toFixed(1) : "—"} reportes/modelo).
                                                </p>
                                            </div>
                                        </div>
                                    )}
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════
                        PESTAÑA 3 — TENDENCIAS
                    ══════════════════════════════════════════════ */}
                    {pestana === "tendencia" && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                            <h2 className="text-base font-bold text-slate-700 mb-1">Tendencia de fallas por año de fabricación</h2>
                            <p className="text-xs text-slate-400 mb-4">
                                Selecciona una marca y modelo para ver cómo evolucionan las fallas según el año de fabricación del vehículo.
                            </p>

                            <div className="flex flex-wrap gap-3 mb-6">
                                <select
                                    className="rounded-lg border border-slate-300 focus:border-blue-700 focus:outline-none py-2 px-3 text-slate-700 text-sm"
                                    value={marcaSeleccionada}
                                    onChange={e => { setMarcaSeleccionada(e.target.value); setModeloSeleccionado(""); setTendenciaData(null) }}>
                                    <option value="">Seleccionar marca...</option>
                                    {marcasDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>

                                {marcaSeleccionada && (
                                    <select
                                        className="rounded-lg border border-slate-300 focus:border-blue-700 focus:outline-none py-2 px-3 text-slate-700 text-sm"
                                        value={modeloSeleccionado}
                                        onChange={e => setModeloSeleccionado(e.target.value)}>
                                        <option value="">Todos los modelos</option>
                                        {modelosFiltrados.map(m => <option key={m.key} value={m.modelo}>{m.modelo}</option>)}
                                    </select>
                                )}

                                {marcaSeleccionada && (
                                    <button type="button" onClick={cargarTendencia} disabled={cargandoTendencia}
                                        className="bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                                        {cargandoTendencia ? "Cargando..." : "Ver tendencia"}
                                    </button>
                                )}
                            </div>

                            {!tendenciaData && !cargandoTendencia && (
                                <div className="bg-slate-50 rounded-xl p-12 text-center">
                                    <p className="text-4xl mb-3">📈</p>
                                    <p className="text-slate-500 text-sm">Selecciona una marca para ver la tendencia de fallas por año de fabricación.</p>
                                </div>
                            )}

                            {tendenciaData?.length === 0 && (
                                <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-400 text-sm">
                                    No hay suficientes datos para mostrar una tendencia de este modelo.
                                </div>
                            )}

                            {tendenciaData && datosLinea.length > 0 && (
                                <>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={datosLinea} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="anio" tick={{ fontSize: 12 }} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                            <Tooltip content={<TooltipTendencia />} />
                                            <Legend />
                                            {tendenciaData.map((t, i) => (
                                                <Line key={t.modelo} type="monotone" dataKey={t.modelo}
                                                    stroke={COLORES_LINEAS[i % COLORES_LINEAS.length]}
                                                    strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>

                                    {/* Interpretación con regresión */}
                                    <div className="mt-4 space-y-2">
                                        {tendenciaData.map((t, i) => {
                                            if (t.datos.length < 2) return null
                                            const reg = regresionLineal(t.datos)
                                            if (!reg) return null
                                            const { pendiente, r2 } = reg
                                            const subiendo = pendiente > 0.05
                                            const bajando  = pendiente < -0.05
                                            const color    = subiendo ? "text-red-600" : bajando ? "text-green-600" : "text-slate-500"
                                            const bgColor  = subiendo ? "bg-red-50 border-red-200" : bajando ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
                                            const icono    = subiendo ? "↑" : bajando ? "↓" : "→"
                                            const texto    = subiendo
                                                ? `Tendencia creciente (+${pendiente} fallas/año)`
                                                : bajando
                                                ? `Tendencia decreciente (${pendiente} fallas/año)`
                                                : "Tendencia estable"
                                            return (
                                                <div key={t.modelo} className={`rounded-lg px-4 py-3 border ${bgColor}`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-3 h-3 rounded-full shrink-0"
                                                            style={{ backgroundColor: COLORES_LINEAS[i % COLORES_LINEAS.length] }} />
                                                        <span className="text-sm font-semibold text-slate-700">{t.modelo}</span>
                                                        <span className={`text-sm font-bold ${color}`}>{icono} {texto}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 ml-5">
                                                        Pendiente: <strong>{pendiente}</strong> · Ajuste R²: <strong>{r2}</strong>
                                                        {r2 < 0.3 && " · (pocos datos, tendencia referencial)"}
                                                    </p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════
                        PESTAÑA 4 — ACTIVIDAD (por mes y región)
                    ══════════════════════════════════════════════ */}
                    {pestana === "reportes" && (
                        <div className="space-y-6">
                            {/* Evolución mensual */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-700 mb-0.5">Evolución mensual de reportes</h2>
                                        <p className="text-xs text-slate-400">Cantidad de reportes verificados por mes</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-slate-500">Año</label>
                                        <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}
                                            className="rounded-lg border border-slate-200 text-sm py-1.5 px-3 text-slate-700 focus:border-blue-700 focus:outline-none">
                                            <option value="">Todos</option>
                                            {aniosDisponibles.map(a => (
                                                <option key={a} value={a}>{a}</option>
                                            ))}
                                        </select>
                                        {filtroAnio && (
                                            <button type="button" onClick={() => setFiltroAnio("")}
                                                className="text-xs text-slate-400 hover:text-red-500 px-2 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 transition-colors">
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {dataMesFiltrada.length === 0 ? (
                                    <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-400 text-sm">Sin datos de evolución mensual todavía.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <AreaChart data={dataMesFiltrada} margin={{ top: 8, right: 16, bottom: 40, left: 0 }}>
                                            <defs>
                                                <linearGradient id="gradAzul" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="nombre" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                            <Tooltip content={<TooltipMes />} />
                                            <Area type="monotone" dataKey="total" stroke="#1e3a8a" strokeWidth={2.5}
                                                fill="url(#gradAzul)" dot={{ r: 4, fill: "#1e3a8a" }} activeDot={{ r: 6 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* Por región */}
                            {dataRegion.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                    <h2 className="text-base font-bold text-slate-700 mb-1">Reportes por región</h2>
                                    <p className="text-xs text-slate-400 mb-4">Distribución geográfica de los reportes de fallas en Ecuador</p>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={dataRegion} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 8 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={130} />
                                                <Tooltip content={<TooltipBase />} />
                                                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                                    {dataRegion.map((_, i) => <Cell key={i} fill={COLORES_REGION[i % COLORES_REGION.length]} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>

                                        {/* Tabla de regiones */}
                                        <div className="overflow-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-blue-900 text-white">
                                                        <th className="text-left py-2 px-3 rounded-tl-lg font-semibold">Región</th>
                                                        <th className="text-center py-2 px-3 font-semibold">Reportes</th>
                                                        <th className="text-center py-2 px-3 rounded-tr-lg font-semibold">%</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dataRegion.map((r, i) => (
                                                        <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-slate-50" : "bg-white"}`}>
                                                            <td className="py-2 px-3 font-medium text-slate-700">{r.nombre}</td>
                                                            <td className="py-2 px-3 text-center font-bold text-slate-800">{r.total}</td>
                                                            <td className="py-2 px-3 text-center text-slate-500">
                                                                {((r.total / data.total) * 100).toFixed(1)}%
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tarjetas de actividad */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <Tarjeta titulo="Región más activa" valor={regionTop} sub={`${dataRegion[0]?.total || 0} reportes`} color="border-cyan-500" icono="📍" />
                                <Tarjeta titulo="Mes más activo" valor={dataMesFiltrada.length > 0 ? dataMesFiltrada.reduce((a, b) => a.total > b.total ? a : b).nombre : "—"} sub="mayor cantidad de reportes" color="border-indigo-500" icono="📅" />
                                <Tarjeta titulo="Promedio mensual" valor={dataMesFiltrada.length > 0 ? Math.round(dataMesFiltrada.reduce((a, b) => a + b.total, 0) / dataMesFiltrada.length) : "—"} sub="reportes por mes" color="border-blue-900" icono="📊" />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

// ── Sub-componente: ficha de vehículo ────────────────────────────
const VehiculoFicha = ({ vehiculo, token, onDescargar, descargando, onLimpiar }) => {
    const [ficha, setFicha] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const cargar = async () => {
            setCargando(true)
            try {
                const API = import.meta.env.VITE_BACKEND_URL
                const storedUser = JSON.parse(localStorage.getItem("auth-token"))
                const tkn = storedUser?.state?.token

                // Buscar todos los reportes de este vehículo por su _id exacto
                const resR = await fetch(
                    `${API}/reportes?vehiculo=${vehiculo._id}&pagina=1&limite=200`,
                    { headers: { Authorization: `Bearer ${tkn}` } }
                )
                const dataR = await resR.json()

                setFicha({ reportes: dataR.reportes || [], vehiculoReal: vehiculo })
            } catch (e) {
                console.error(e)
                setFicha({ reportes: [], vehiculoReal: vehiculo })
            }
            setCargando(false)
        }
        cargar()
    }, [vehiculo])

    const aspectos = [
        { key: "confiabilidad", label: "Confiabilidad" },
        { key: "seguridad",     label: "Seguridad"     },
        { key: "consumo",       label: "Consumo"       },
        { key: "precio",        label: "Precio / Valor"},
        { key: "comodidad",     label: "Comodidad"     },
        { key: "mantenimiento", label: "Mantenimiento" },
        { key: "repuestos",     label: "Disponibilidad de repuestos" },
    ]

    // Calcular stats de los reportes
    const gravedadMap = { baja: 0, media: 0, alta: 0 }
    const fallaMap = {}
    ;(ficha?.reportes || []).forEach(r => {
        if (r.gravedad) gravedadMap[r.gravedad] = (gravedadMap[r.gravedad] || 0) + 1
        const f = r.falla?.nombre || "N/D"
        fallaMap[f] = (fallaMap[f] || 0) + 1
    })
    const topFallas = Object.entries(fallaMap).sort((a, b) => b[1] - a[1]).slice(0, 6)
    const totalR = ficha?.reportes?.length || 0

    if (cargando) return (
        <div className="py-10 text-center text-slate-400 text-sm">Cargando datos del vehículo...</div>
    )

    return (
        <div className="mt-4">
            {/* Header de la ficha */}
            <div className="bg-blue-900 rounded-xl p-5 text-white mb-4">
                <div className="flex justify-between items-start flex-wrap gap-3">
                    <div>
                        <h3 className="text-xl font-black">{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}{vehiculo.version ? ` · ${vehiculo.version}` : ""}</h3>
                        <p className="text-blue-200 text-sm mt-1">
                            {totalR} reporte(s) de falla verificado(s) en la plataforma
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={onLimpiar}
                            className="px-3 py-2 bg-blue-800 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                            ✕ Limpiar
                        </button>
                        <button type="button" onClick={onDescargar} disabled={descargando || !ficha?.vehiculoReal}
                            className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-900 font-bold text-sm rounded-lg transition-colors disabled:opacity-50">
                            {descargando ? "⏳ Generando..." : "⬇️ Descargar ficha PDF"}
                        </button>
                    </div>
                </div>
                {!ficha?.vehiculoReal && (
                    <p className="text-amber-300 text-xs mt-2">⚠️ No se encontró un vehículo exacto — la descarga PDF no está disponible.</p>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Fallas más comunes */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3">⚠️ Fallas más reportadas</h4>
                    {topFallas.length === 0 ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <p className="text-green-700 text-sm font-semibold">✅ Sin fallas reportadas</p>
                            <p className="text-green-600 text-xs mt-1">Este vehículo no tiene reportes verificados todavía.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {topFallas.map(([nombre, count], i) => (
                                <div key={i} className="flex items-center gap-3 py-1">
                                    <span className="text-xs text-slate-500 w-4">{i + 1}.</span>
                                    <span className="text-sm text-slate-700 flex-1">{nombre}</span>
                                    <div className="w-24 bg-slate-100 rounded-full h-2">
                                        <div className="h-2 rounded-full bg-red-500"
                                            style={{ width: `${(count / topFallas[0][1]) * 100}%` }} />
                                    </div>
                                    <span className="text-sm font-bold text-red-600 w-6 text-right">{count}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Distribución gravedad */}
                    {totalR > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-700 mb-3">Distribución por gravedad</h4>
                            {[
                                { label: "🔴 Alta",   val: gravedadMap.alta,  color: "bg-red-500"    },
                                { label: "🟡 Media",  val: gravedadMap.media, color: "bg-amber-400"  },
                                { label: "🔵 Baja",   val: gravedadMap.baja,  color: "bg-blue-500"   },
                            ].map((g, i) => (
                                <div key={i} className="flex items-center gap-3 mb-2">
                                    <span className="text-xs text-slate-600 w-20">{g.label}</span>
                                    <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                                        <div className={`h-2.5 rounded-full ${g.color}`}
                                            style={{ width: `${totalR > 0 ? (g.val / totalR) * 100 : 0}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 w-8 text-right">
                                        {totalR > 0 ? `${Math.round((g.val / totalR) * 100)}%` : "0%"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Nota sobre valoraciones */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3">📋 Resumen de confiabilidad</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-14 h-14 bg-blue-900 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-white font-black text-lg">
                                    {totalR === 0 ? "N/A" : totalR > 10 ? "⚠" : "✓"}
                                </span>
                            </div>
                            <div>
                                <p className="font-bold text-blue-900 text-sm">
                                    {totalR === 0
                                        ? "Sin historial de fallas"
                                        : totalR > 10
                                        ? "Alto número de reportes"
                                        : "Historial moderado"}
                                </p>
                                <p className="text-blue-700 text-xs mt-0.5">
                                    {totalR} reporte(s) verificado(s)
                                </p>
                            </div>
                        </div>
                        <p className="text-blue-800 text-xs leading-relaxed">
                            {totalR === 0
                                ? "Este vehículo no tiene reportes de falla verificados en la plataforma. Puede ser un vehículo nuevo en el catálogo o con buen historial."
                                : `Se han registrado ${totalR} reporte(s) de falla para este vehículo. ${
                                    gravedadMap.alta > 0
                                        ? `${gravedadMap.alta} de ellos son de gravedad alta.`
                                        : "Ninguno es de gravedad alta."
                                  }`
                            }
                        </p>
                    </div>

                    <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <p className="text-xs text-slate-500 leading-relaxed">
                            💡 Las valoraciones detalladas por aspecto (confiabilidad, seguridad, consumo, etc.) están disponibles en la sección <strong>Confiabilidad</strong> del menú principal.
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                            La ficha PDF incluye las valoraciones de la comunidad junto con el análisis de fallas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Estadisticas