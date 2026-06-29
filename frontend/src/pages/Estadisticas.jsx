import { useEffect, useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import { getEstadisticas, getTendencias } from "../services/reporteService"
import { exportarBoletinPDF } from "../services/exportService"
import storeAuth from "../context/storeAuth"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, CartesianGrid,
    LineChart, Line
} from "recharts"

const COLORES_MARCA = ["#1e3a8a", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#1e40af", "#1e3a8a", "#172554", "#1d4ed8"]
const COLORES_FALLA = ["#7c3aed", "#6d28d9", "#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed", "#5b21b6", "#4c1d95", "#8b5cf6", "#7c3aed"]
const COLORES_GRAVEDAD = { baja: "#3b82f6", media: "#f59e0b", alta: "#dc2626" }

const TooltipPersonalizado = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-2">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-800">{payload[0].value} reporte(s)</p>
            </div>
        )
    }
    return null
}

const TarjetaResumen = ({ titulo, valor, subtitulo, color }) => (
    <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${color}`}>
        <p className="text-sm text-slate-500 mb-1">{titulo}</p>
        <p className="text-3xl font-black text-slate-800">{valor}</p>
        {subtitulo && <p className="text-xs text-slate-400 mt-1">{subtitulo}</p>}
    </div>
)

const COLORES_LINEAS = ["#1e3a8a", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#be185d"]

// Regresión lineal por mínimos cuadrados
// Recibe array de { anio, totalFallas } y devuelve { pendiente, intercepto, r2 }
const regresionLineal = (datos) => {
    const n = datos.length
    if (n < 2) return null
    const sumX = datos.reduce((a, d) => a + d.anio, 0)
    const sumY = datos.reduce((a, d) => a + d.totalFallas, 0)
    const sumXY = datos.reduce((a, d) => a + d.anio * d.totalFallas, 0)
    const sumX2 = datos.reduce((a, d) => a + d.anio * d.anio, 0)
    const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercepto = (sumY - pendiente * sumX) / n
    // Coeficiente de determinación R²
    const mediaY = sumY / n
    const ssTot = datos.reduce((a, d) => a + Math.pow(d.totalFallas - mediaY, 2), 0)
    const ssRes = datos.reduce((a, d) => a + Math.pow(d.totalFallas - (pendiente * d.anio + intercepto), 2), 0)
    const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot
    return {
        pendiente: Math.round(pendiente * 100) / 100,
        r2: Math.round(r2 * 100) / 100
    }
}

const TooltipTendencia = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm">
                <p className="font-bold text-slate-700 mb-2">Año {label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }}>
                        {p.name}: <strong>{p.value} falla(s)</strong>
                    </p>
                ))}
            </div>
        )
    }
    return null
}

const Estadisticas = () => {
    const { rol, token } = storeAuth()
    const [data, setData] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [exportandoPDF, setExportandoPDF] = useState(false)

    // Tendencias
    const [tendenciaData, setTendenciaData] = useState(null)
    const [modelosDisponibles, setModelosDisponibles] = useState([])
    const [marcaSeleccionada, setMarcaSeleccionada] = useState("")
    const [modeloSeleccionado, setModeloSeleccionado] = useState("")
    const [cargandoTendencia, setCargandoTendencia] = useState(false)

    useEffect(() => {
        const cargar = async () => {
            try {
                const res = await getEstadisticas()
                setData(res.data)
            } catch (error) {
                console.error(error)
            }
            setCargando(false)
        }
        cargar()
    }, [])

    // Cargar modelos disponibles al inicio
    useEffect(() => {
        getTendencias().then(res => {
            setModelosDisponibles(res.data.modelos || [])
        }).catch(() => {})
    }, [])

    const cargarTendencia = async () => {
        if (!marcaSeleccionada) return
        setCargandoTendencia(true)
        try {
            const res = await getTendencias({
                marca: marcaSeleccionada,
                modelo: modeloSeleccionado || undefined
            })
            setTendenciaData(res.data.tendencia || [])
        } catch (e) { console.error(e) }
        setCargandoTendencia(false)
    }

    // Marcas únicas disponibles
    const marcasDisponibles = [...new Set(modelosDisponibles.map(m => m.marca))].sort()
    const modelosFiltrados = modelosDisponibles.filter(m => m.marca === marcaSeleccionada)

    // Construir datos para LineChart: array de { anio, [modelo]: total }
    const datosLinea = (() => {
        if (!tendenciaData || tendenciaData.length === 0) return []
        const aniosSet = new Set()
        tendenciaData.forEach(t => t.datos.forEach(d => aniosSet.add(d.anio)))
        const anios = [...aniosSet].sort()
        return anios.map(anio => {
            const punto = { anio }
            tendenciaData.forEach(t => {
                const d = t.datos.find(d => d.anio === anio)
                punto[t.modelo] = d?.totalFallas || 0
            })
            return punto
        })
    })()

    if (cargando) return <p className="text-slate-400">Cargando estadísticas...</p>
    if (!data) return <p className="text-slate-500">No se pudieron cargar las estadísticas.</p>

    // ---- Preparar datos ----
    const dataMarca = (data.porMarca || []).map(m => ({ nombre: m._id, total: m.total }))
    const dataTipoFalla = (data.porTipoFalla || []).map(t => ({ nombre: t._id, total: t.total }))
    const dataGravedad = (data.porGravedad || []).filter(g => g.total > 0).map(g => ({ nombre: g._id, total: g.total }))
    // Bug fix: _id ya es un string "Marca Modelo"
    const dataModelo = (data.porModelo || []).map(m => ({ nombre: m._id, total: m.total }))

    const totalAlta = dataGravedad.find(g => g.nombre === "alta")?.total || 0
    const totalMedia = dataGravedad.find(g => g.nombre === "media")?.total || 0
    const totalBaja = dataGravedad.find(g => g.nombre === "baja")?.total || 0
    const marcaTop = dataMarca[0]?.nombre || "—"
    const fallaTop = dataTipoFalla[0]?.nombre || "—"

    const handleExportarBoletin = async () => {
        setExportandoPDF(true)
        try {
            await exportarBoletinPDF(token)
        } catch (error) {
            toast.error("Error al generar el boletín PDF")
        }
        setExportandoPDF(false)
    }

    return (
        <div>
            <ToastContainer />
            <div className="flex justify-between items-start flex-wrap gap-4 mb-1">
                <h1 className="text-3xl font-bold text-slate-800">Estadísticas y tendencias</h1>
                {rol === "admin" && data?.total > 0 && (
                    <button type="button" onClick={handleExportarBoletin} disabled={exportandoPDF}
                        className="bg-red-700 hover:bg-red-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                        {exportandoPDF ? "Generando..." : "📄 Descargar boletín PDF"}
                    </button>
                )}
            </div>
            <p className="text-slate-500 mb-6">Análisis basado en {data.total} reporte(s) verificado(s).</p>

            {data.total === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">
                    Aún no hay reportes verificados para generar estadísticas.
                </div>
            ) : (
                <>
                    {/* Tarjetas resumen */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <TarjetaResumen titulo="Total reportes" valor={data.total} subtitulo="verificados" color="border-blue-900" />
                        <TarjetaResumen titulo="Gravedad alta" valor={totalAlta} subtitulo={`${Math.round(totalAlta / data.total * 100)}% del total`} color="border-red-500" />
                        <TarjetaResumen titulo="Marca más reportada" valor={marcaTop} subtitulo={`${dataMarca[0]?.total || 0} reportes`} color="border-amber-500" />
                        <TarjetaResumen titulo="Falla más frecuente" valor={fallaTop} subtitulo={`${dataTipoFalla[0]?.total || 0} reportes`} color="border-purple-500" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">

                        {/* Reportes por marca */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-bold text-slate-700 mb-1">Reportes por marca</h2>
                            <p className="text-xs text-slate-400 mb-4">Top {dataMarca.length} marcas con más reportes</p>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={dataMarca} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip content={<TooltipPersonalizado />} />
                                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                        {dataMarca.map((_, i) => <Cell key={i} fill={COLORES_MARCA[i % COLORES_MARCA.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Distribución por gravedad */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-bold text-slate-700 mb-1">Distribución por gravedad</h2>
                            <p className="text-xs text-slate-400 mb-4">Proporción de reportes según nivel de gravedad</p>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={dataGravedad} dataKey="total" nameKey="nombre"
                                        cx="50%" cy="45%" outerRadius={95} innerRadius={45}
                                        label={({ nombre, total, percent }) =>
                                            `${nombre}: ${total} (${(percent * 100).toFixed(0)}%)`
                                        }
                                        labelLine={true}>
                                        {dataGravedad.map((entry, i) => (
                                            <Cell key={i} fill={COLORES_GRAVEDAD[entry.nombre] || "#94a3b8"} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val, name) => [val, name]} />
                                    <Legend formatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Fallas más frecuentes */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-bold text-slate-700 mb-1">Fallas más frecuentes</h2>
                            <p className="text-xs text-slate-400 mb-4">Top {dataTipoFalla.length} tipos de falla reportados</p>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={dataTipoFalla} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={160} />
                                    <Tooltip content={<TooltipPersonalizado />} />
                                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                        {dataTipoFalla.map((_, i) => <Cell key={i} fill={COLORES_FALLA[i % COLORES_FALLA.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Modelos más reportados */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-bold text-slate-700 mb-1">Modelos con más reportes</h2>
                            <p className="text-xs text-slate-400 mb-4">Top {dataModelo.length} modelos con mayor incidencia</p>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={dataModelo} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={160} />
                                    <Tooltip content={<TooltipPersonalizado />} />
                                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                        {dataModelo.map((_, i) => <Cell key={i} fill={COLORES_MARCA[i % COLORES_MARCA.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                    </div>

                    {/* Resumen textual al pie */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
                        <h3 className="font-bold text-blue-900 mb-2">Resumen del análisis</h3>
                        <p className="text-sm text-blue-800">
                            Se han analizado <strong>{data.total} reportes verificados</strong>. La marca con más incidencias es <strong>{marcaTop}</strong> y la falla más reportada es <strong>"{fallaTop}"</strong>.
                            El <strong>{Math.round(totalAlta / data.total * 100)}%</strong> de los reportes corresponde a fallas de gravedad alta,
                            el <strong>{Math.round(totalMedia / data.total * 100)}%</strong> a gravedad media
                            y el <strong>{Math.round(totalBaja / data.total * 100)}%</strong> a gravedad baja.
                        </p>
                    </div>

                    {/* Sección de tendencias */}
                    <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-lg font-bold text-slate-700 mb-1">Tendencia de fallas por año de fabricación</h2>
                        <p className="text-xs text-slate-400 mb-4">
                            Selecciona una marca y modelo para ver cómo evolucionan las fallas según el año de fabricación del vehículo.
                        </p>

                        <div className="flex flex-wrap gap-3 mb-4">
                            <select
                                className="rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none py-2 px-3 text-slate-700 text-sm"
                                value={marcaSeleccionada}
                                onChange={e => { setMarcaSeleccionada(e.target.value); setModeloSeleccionado(""); setTendenciaData(null) }}>
                                <option value="">Seleccionar marca...</option>
                                {marcasDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>

                            {marcaSeleccionada && (
                                <select
                                    className="rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none py-2 px-3 text-slate-700 text-sm"
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
                            <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-400 text-sm">
                                Selecciona una marca para ver la tendencia de fallas por año de fabricación.
                            </div>
                        )}

                        {tendenciaData && tendenciaData.length === 0 && (
                            <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-400 text-sm">
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
                                            <Line
                                                key={t.modelo}
                                                type="monotone"
                                                dataKey={t.modelo}
                                                stroke={COLORES_LINEAS[i % COLORES_LINEAS.length]}
                                                strokeWidth={2.5}
                                                dot={{ r: 5 }}
                                                activeDot={{ r: 7 }}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>

                                {/* Interpretación con regresión lineal */}
                                <div className="mt-4 space-y-2">
                                    {tendenciaData.map((t, i) => {
                                        if (t.datos.length < 2) return null
                                        const reg = regresionLineal(t.datos)
                                        if (!reg) return null
                                        const { pendiente, r2 } = reg
                                        const subiendo = pendiente > 0.05
                                        const bajando = pendiente < -0.05
                                        const color = subiendo ? "text-red-600" : bajando ? "text-green-600" : "text-slate-500"
                                        const icono = subiendo ? "↑" : bajando ? "↓" : "→"
                                        const texto = subiendo
                                            ? `aumentando (+${pendiente} fallas/año)`
                                            : bajando
                                            ? `mejorando (${pendiente} fallas/año)`
                                            : "estable"
                                        return (
                                            <div key={t.modelo} className="bg-slate-50 rounded-lg px-4 py-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-3 h-3 rounded-full shrink-0"
                                                        style={{ backgroundColor: COLORES_LINEAS[i % COLORES_LINEAS.length] }} />
                                                    <span className="text-sm font-semibold text-slate-700">{t.modelo}</span>
                                                    <span className={`text-sm font-bold ${color}`}>{icono} {texto}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 ml-5">
                                                    Pendiente de regresión: <strong>{pendiente}</strong> · Ajuste R²: <strong>{r2}</strong>
                                                    {r2 < 0.3 && " · (pocos datos, tendencia referencial)"}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default Estadisticas