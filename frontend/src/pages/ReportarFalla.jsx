import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import storeUI from "../context/storeUI"
import { ToastContainer, toast } from "react-toastify"
import {
    crearReporte,
    subirImagenes,
    subirDocumentos,
    agregarEnlace,
} from "../services/reporteService"
import {
    getVehiculosSelector, getVehiculos, crearVehiculo,
    getFallasSelector, getFallas, crearFalla,
} from "../services/catalogoService"
import { esYoutube } from "../helpers/youtube"
import SeccionEvidencia from "../components/ui/SeccionEvidencia"
import { tiposCombustible, tiposVehiculo, aniosVehiculo } from "../config/ecuador"

const ReportarFalla = () => {
    const navigate = useNavigate()

    const [vehiculos, setVehiculos] = useState([])
    const [fallas, setFallas] = useState([])

    const [marca, setMarca] = useState("")
    const [modelo, setModelo] = useState("")
    const [anioSeleccionado, setAnioSeleccionado] = useState("")
    const [vehiculoId, setVehiculoId] = useState("")
    const [version, setVersion] = useState("")
    const [fallaId, setFallaId] = useState("")
    const [gravedad, setGravedad] = useState("media")
    const [descripcion, setDescripcion] = useState("")

    const [nuevoVehiculo, setNuevoVehiculo] = useState({ marca: "", modelo: "", anio: "", version: "", tipo: "automóvil", combustible: "gasolina" })
    const [anioManual, setAnioManual] = useState(false)
    const [nuevaFalla, setNuevaFalla] = useState({ nombre: "", descripcion: "", gravedad: "media" })
    const [mostrarFormVehiculo, setMostrarFormVehiculo] = useState(false)
    const [mostrarFormFalla, setMostrarFormFalla] = useState(false)

    const [paso, setPaso] = useState(1)
    const [vehiculoReportado, setVehiculoReportado] = useState(null)
    const [modalCancelar, setModalCancelar] = useState(false)
    const [modalConfirmarEnvio, setModalConfirmarEnvio] = useState(false)

    // Estado de envío: idle | enviando | exito | exito_con_errores | error
    const [estadoEnvio, setEstadoEnvio] = useState("idle")
    const [erroresEnvio, setErroresEnvio] = useState([])

    // Evidencias — TODO en memoria del navegador hasta confirmar
    const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState([])
    const [documentosSeleccionados, setDocumentosSeleccionados] = useState([])
    const [enlacesAgregados, setEnlacesAgregados] = useState([]) // [{ url, titulo, tipo }]
    const [enlaceUrl, setEnlaceUrl] = useState("")
    const [enlaceTitulo, setEnlaceTitulo] = useState("")

    const { setFormDirty } = storeUI()

    // Marcar formulario como sucio cuando hay datos ingresados
    const hayDatosIngresados = !!(marca || vehiculoId || fallaId || descripcion || paso === 2)

    useEffect(() => {
        setFormDirty(hayDatosIngresados)
    }, [hayDatosIngresados])

    // Limpiar al desmontar (cuando el reporte se envía o el usuario confirma salir)
    useEffect(() => {
        return () => setFormDirty(false)
    }, [])

    // Advertir al cerrar o recargar la pestaña
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hayDatosIngresados) { e.preventDefault(); e.returnValue = "" }
        }
        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [hayDatosIngresados])

    const cargarCatalogos = async () => {
        try {
            const [v, f] = await Promise.all([
                getVehiculosSelector(),
                getFallasSelector()
            ])
            setVehiculos(v.data.vehiculos || [])
            setFallas(f.data.fallas || [])
        } catch (error) { console.error(error) }
    }

    useEffect(() => { cargarCatalogos() }, [])

    const marcas = [...new Set(vehiculos.map(v => v.marca))].sort()
    const modelosDeMarca = [...new Set(vehiculos.filter(v => v.marca === marca).map(v => v.modelo))].sort()
    const aniosDeModelo = [...new Set(
        vehiculos.filter(v => v.marca === marca && v.modelo === modelo).map(v => v.anio)
    )].sort((a, b) => b - a)
    const versionesDeAnio = vehiculos
        .filter(v => v.marca === marca && v.modelo === modelo && v.anio === Number(anioSeleccionado))
        .map(v => ({ id: v._id, version: v.version || "" }))

    const inputClass = "block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
    const labelClass = "mb-2 block text-sm font-semibold text-slate-700"

    const limpiarTodo = () => {
        setMarca(""); setModelo(""); setAnioSeleccionado(""); setVehiculoId(""); setVersion("")
        setFallaId(""); setGravedad("media"); setDescripcion("")
        setImagenesSeleccionadas([]); setDocumentosSeleccionados([]); setEnlacesAgregados([])
        setEnlaceUrl(""); setEnlaceTitulo("")
        setMostrarFormVehiculo(false); setMostrarFormFalla(false)
        setEstadoEnvio("idle"); setErroresEnvio([])
    }

    // ---- Cancelar — vuelve al paso 1 y limpia evidencias (nada en servidor aún) ----
    const handleCancelar = () => {
        // Limpiar paso 1
        setMarca(""); setModelo(""); setAnioSeleccionado(""); setVehiculoId("")
        setVersion(""); setFallaId(""); setGravedad("media"); setDescripcion("")
        setMostrarFormVehiculo(false); setMostrarFormFalla(false)
        setVehiculoReportado(null)
        // Limpiar paso 2
        setImagenesSeleccionadas([])
        setDocumentosSeleccionados([])
        setEnlacesAgregados([])
        setEnlaceUrl(""); setEnlaceTitulo("")
        setModalCancelar(false)
        setPaso(1)
        toast.info("Proceso cancelado. Puedes empezar de nuevo.")
    }

    // ---- Crear vehículo ----
    const handleCrearVehiculo = async () => {
        if (!nuevoVehiculo.marca || !nuevoVehiculo.modelo || !nuevoVehiculo.anio)
            return toast.error("Completa marca, modelo y año")
        try {
            const res = await crearVehiculo({
                marca: nuevoVehiculo.marca, modelo: nuevoVehiculo.modelo,
                anio: Number(nuevoVehiculo.anio), version: nuevoVehiculo.version.trim() || "Estándar",
                tipo: nuevoVehiculo.tipo, combustible: nuevoVehiculo.combustible
            })
            toast.success(res.data.msg)
            await cargarCatalogos()
            setMarca(res.data.vehiculo.marca)
            setModelo(res.data.vehiculo.modelo)
            setAnioSeleccionado(String(res.data.vehiculo.anio))
            setVehiculoId(res.data.vehiculo._id)
            setVersion(res.data.vehiculo.version || "")
            setNuevoVehiculo({ marca: "", modelo: "", anio: "", version: "", tipo: "automóvil", combustible: "gasolina" })
            setMostrarFormVehiculo(false)
        } catch (error) { toast.error(error?.response?.data?.msg || "Error al crear vehículo") }
    }

    // ---- Crear falla ----
    const handleCrearFalla = async () => {
        if (!nuevaFalla.nombre) return toast.error("Ingresa el nombre de la falla")
        try {
            const res = await crearFalla(nuevaFalla)
            toast.success(res.data.msg)
            await cargarCatalogos()
            setFallaId(res.data.falla._id)
            setGravedad(res.data.falla.gravedad || "media")
            setNuevaFalla({ nombre: "", descripcion: "", gravedad: "media" })
            setMostrarFormFalla(false)
        } catch (error) { toast.error(error?.response?.data?.msg || "Error al crear falla") }
    }

    // ---- Paso 1 -> Paso 2: solo avanza, nada al servidor ----
    const handleContinuarAPaso2 = () => {
        if (!vehiculoId) return toast.error("Selecciona el vehículo completo")
        if (!fallaId) return toast.error("Selecciona una falla")
        if (!descripcion.trim()) return toast.error("Describe el problema antes de continuar")
        const v = vehiculos.find(v => v._id === vehiculoId)
        if (v) setVehiculoReportado({ id: v._id, marca: v.marca, modelo: v.modelo, version: v.version || "" })
        setPaso(2)
    }

    // ---- Agregar enlace a la lista en memoria ----
    const handleAgregarEnlaceLocal = () => {
        if (!enlaceUrl) return toast.error("Ingresa una URL")
        const tipo = esYoutube(enlaceUrl) ? "youtube" : "externo"
        setEnlacesAgregados(prev => [...prev, { url: enlaceUrl, titulo: enlaceTitulo, tipo }])
        setEnlaceUrl(""); setEnlaceTitulo("")
    }

    const handleQuitarEnlaceLocal = (idx) => {
        setEnlacesAgregados(prev => prev.filter((_, i) => i !== idx))
    }

    // ---- Confirmar y generar todo: reporte + evidencias ----
    const handleConfirmarEnvio = async () => {
        setModalConfirmarEnvio(false)
        setEstadoEnvio("enviando")
        const errores = []
        let reporteCreado = null

        try {
            const res = await crearReporte({ vehiculo: vehiculoId, falla: fallaId, descripcion, gravedad })
            reporteCreado = res?.data?.reporteId
        } catch (error) {
            setEstadoEnvio("error")
            setErroresEnvio([error?.response?.data?.msg || "No se pudo crear el reporte"])
            return
        }

        // Subir imágenes
        if (imagenesSeleccionadas.length > 0) {
            try {
                const formData = new FormData()
                imagenesSeleccionadas.forEach(img => formData.append("imagenes", img))
                await subirImagenes(reporteCreado, formData)
            } catch (error) {
                errores.push("No se pudieron subir algunas imágenes")
            }
        }

        // Subir documentos
        if (documentosSeleccionados.length > 0) {
            try {
                const formData = new FormData()
                documentosSeleccionados.forEach(doc => formData.append("documentos", doc))
                await subirDocumentos(reporteCreado, formData)
            } catch (error) {
                errores.push("No se pudieron subir algunos documentos")
            }
        }

        // Agregar enlaces
        for (const enlace of enlacesAgregados) {
            try {
                await agregarEnlace(reporteCreado, enlace)
            } catch (error) {
                errores.push(`No se pudo agregar el enlace: ${enlace.titulo || enlace.url}`)
            }
        }

        if (errores.length > 0) {
            setErroresEnvio(errores)
            setEstadoEnvio("exito_con_errores")
        } else {
            setEstadoEnvio("exito")
        }
        setPaso(3)
    }

    const handleReintentar = () => {
        setEstadoEnvio("idle")
        setPaso(1)
    }

    // ---- Indicador de pasos ----
    const Pasos = () => (
        <div className="flex items-center gap-2 mb-8">
            {[{ n: 1, label: "Datos" }, { n: 2, label: "Evidencias" }, { n: 3, label: "Valoración" }].map((p, i, arr) => (
                <div key={p.n} className="flex items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${paso === p.n ? "bg-blue-900 text-white" : paso > p.n ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                        {paso > p.n ? "✓" : p.n}
                    </div>
                    <span className={`text-sm whitespace-nowrap ${paso === p.n ? "font-bold text-blue-900" : "text-slate-400"}`}>{p.label}</span>
                    {i < arr.length - 1 && <div className="flex-1 h-px bg-slate-200 mx-1" />}
                </div>
            ))}
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto">
            <ToastContainer />

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Reportar una falla</h1>
                    {paso === 1 && (
                        <p className="text-slate-500 text-sm mt-1">Selecciona el vehículo y la falla. Si no están en la lista, puedes registrarlos.</p>
                    )}
                </div>
                {paso === 2 && (
                    <div className="flex gap-3 items-center mt-1">
                        <button type="button" onClick={() => setPaso(1)}
                            className="text-sm text-blue-700 hover:underline font-medium">
                            ← Volver al paso 1
                        </button>
                        <button type="button" onClick={() => setModalCancelar(true)}
                            className="shrink-0 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                            Cancelar
                        </button>
                    </div>
                )}
            </div>

            <Pasos />

            {/* PASO 1 — Datos */}
            {paso === 1 && (
                <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">

                    {/* Mensaje informativo */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800 font-semibold mb-1">💡 ¿No encuentras tu vehículo?</p>
                        <p className="text-xs text-blue-700">
                            Si el vehículo que buscas no aparece en la lista, o aparece pero con un año o versión diferente al tuyo,
                            usa el botón <strong>"+ Registrar nuevo vehículo"</strong> para agregarlo.
                            Cada combinación de marca, modelo, año y versión es un vehículo independiente en el sistema.
                        </p>
                    </div>

                    {/* Vehículo */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-slate-700">Vehículo</h3>
                            <button type="button" onClick={() => setMostrarFormVehiculo(!mostrarFormVehiculo)}
                                className="text-sm text-blue-700 hover:underline">
                                {mostrarFormVehiculo ? "Cancelar" : "+ Registrar nuevo vehículo"}
                            </button>
                        </div>

                        {mostrarFormVehiculo ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                <input className={inputClass} placeholder="Marca (Ej. Toyota)"
                                    value={nuevoVehiculo.marca} onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, marca: e.target.value })} />
                                <input className={inputClass} placeholder="Modelo (Ej. Corolla)"
                                    value={nuevoVehiculo.modelo} onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, modelo: e.target.value })} />
                                {!anioManual ? (
                                    <select className={inputClass} value={nuevoVehiculo.anio}
                                        onChange={e => {
                                            if (e.target.value === "otro") { setAnioManual(true); setNuevoVehiculo({ ...nuevoVehiculo, anio: "" }) }
                                            else setNuevoVehiculo({ ...nuevoVehiculo, anio: e.target.value })
                                        }}>
                                        <option value="">Seleccionar año</option>
                                        {aniosVehiculo.map(a => <option key={a} value={a}>{a}</option>)}
                                        <option value="otro">Otro año...</option>
                                    </select>
                                ) : (
                                    <div className="flex gap-2">
                                        <input type="number" className={inputClass} placeholder="Ej. 2027"
                                            value={nuevoVehiculo.anio} min="1900" max="2100"
                                            onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, anio: e.target.value })} />
                                        <button type="button" onClick={() => { setAnioManual(false); setNuevoVehiculo({ ...nuevoVehiculo, anio: "" }) }}
                                            className="px-3 py-2 text-sm text-slate-500 border border-slate-300 rounded-md shrink-0">← Volver</button>
                                    </div>
                                )}
                                <select className={inputClass} value={nuevoVehiculo.tipo}
                                    onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, tipo: e.target.value })}>
                                    {tiposVehiculo.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <select className={inputClass} value={nuevoVehiculo.combustible}
                                    onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, combustible: e.target.value })}>
                                    {tiposCombustible.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <div>
                                    <input className={inputClass} placeholder="Versión (opcional, máx 20 car.)"
                                        maxLength={20} value={nuevoVehiculo.version}
                                        onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, version: e.target.value })} />
                                    <p className="text-xs text-slate-400 mt-1">Ej: 1.5 MT · 2.0 AT · 4x4 AWD · Hatchback</p>
                                    {!nuevoVehiculo.version && (
                                        <p className="text-xs text-blue-600 mt-1">
                                            💡 Si no indicas una versión, se asignará <strong>Estándar</strong> automáticamente.
                                        </p>
                                    )}
                                </div>
                                <button type="button" onClick={handleCrearVehiculo}
                                    className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg w-full">
                                    Registrar vehículo
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className={labelClass}>Marca</label>
                                        <select className={inputClass} value={marca}
                                            onChange={e => { setMarca(e.target.value); setModelo(""); setAnioSeleccionado(""); setVehiculoId(""); setVersion("") }}>
                                            <option value="">Seleccionar</option>
                                            {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Modelo</label>
                                        <select className={inputClass} value={modelo} disabled={!marca}
                                            onChange={e => { setModelo(e.target.value); setAnioSeleccionado(""); setVehiculoId(""); setVersion("") }}>
                                            <option value="">Seleccionar</option>
                                            {modelosDeMarca.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Año</label>
                                        <select className={inputClass} value={anioSeleccionado} disabled={!modelo}
                                            onChange={e => { setAnioSeleccionado(e.target.value); setVehiculoId(""); setVersion("") }}>
                                            <option value="">Seleccionar</option>
                                            {aniosDeModelo.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {anioSeleccionado && versionesDeAnio.length > 0 && (
                                    <div className="mt-3">
                                        <label className={labelClass}>Versión</label>
                                        <select className={inputClass} value={vehiculoId}
                                            onChange={e => {
                                                setVehiculoId(e.target.value)
                                                const v = versionesDeAnio.find(v => v.id === e.target.value)
                                                setVersion(v?.version || "")
                                            }}>
                                            <option value="">Seleccionar versión</option>
                                            {versionesDeAnio.map(v => (
                                                <option key={v.id} value={v.id}>{v.version || "Versión estándar"}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {anioSeleccionado && versionesDeAnio.length === 1 && !vehiculoId && (() => {
                                    setTimeout(() => { setVehiculoId(versionesDeAnio[0].id); setVersion(versionesDeAnio[0].version || "") }, 0)
                                    return null
                                })()}
                            </>
                        )}
                    </div>

                    {/* Falla */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-700">Tipo de falla</h3>
                            <button type="button" onClick={() => setMostrarFormFalla(!mostrarFormFalla)}
                                className="text-sm text-blue-700 hover:underline">
                                {mostrarFormFalla ? "Cancelar" : "+ Registrar nueva falla"}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">
                            Si la falla no está en la lista, regístrala con <strong>"+ Registrar nueva falla"</strong>. La gravedad la defines tú según la severidad con la que experimentaste el problema.
                        </p>
                        {mostrarFormFalla ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                <input className={inputClass} placeholder="Nombre de la falla"
                                    value={nuevaFalla.nombre} onChange={e => setNuevaFalla({ ...nuevaFalla, nombre: e.target.value })} />
                                <input className={inputClass} placeholder="Descripción breve (opcional)"
                                    value={nuevaFalla.descripcion} onChange={e => setNuevaFalla({ ...nuevaFalla, descripcion: e.target.value })} />
                                <select className={inputClass} value={nuevaFalla.gravedad}
                                    onChange={e => setNuevaFalla({ ...nuevaFalla, gravedad: e.target.value })}>
                                    <option value="baja">Baja (no afecta el funcionamiento)</option>
                                    <option value="media">Media (funciona con fallas)</option>
                                    <option value="alta">Alta (riesgo o falla grave)</option>
                                </select>
                                <button type="button" onClick={handleCrearFalla}
                                    className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg w-full">
                                    Registrar falla
                                </button>
                            </div>
                        ) : (
                            <select className={inputClass} value={fallaId} onChange={e => {
                                setFallaId(e.target.value)
                                const f = fallas.find(f => f._id === e.target.value)
                                if (f?.gravedad) setGravedad(f.gravedad)
                            }}>
                                <option value="">Seleccionar falla</option>
                                {fallas.map(f => <option key={f._id} value={f._id}>{f.nombre} ({f.gravedad || "media"})</option>)}
                            </select>
                        )}
                    </div>

                    {/* Gravedad */}
                    <div>
                        <label className={labelClass}>Nivel de gravedad</label>
                        <select className={inputClass} value={gravedad} onChange={e => setGravedad(e.target.value)}>
                            <option value="baja">Baja (no afecta el funcionamiento)</option>
                            <option value="media">Media (funciona con fallas)</option>
                            <option value="alta">Alta (riesgo o falla grave)</option>
                        </select>
                        {fallaId && <p className="text-xs text-slate-400 mt-1">💡 Sugerida por el tipo de falla. Puedes ajustarla según tu caso.</p>}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className={labelClass}>Descripción del problema</label>
                        <textarea className={`${inputClass} h-28 resize-none`}
                            placeholder="Describe la falla con detalle..."
                            value={descripcion} onChange={e => setDescripcion(e.target.value)} />
                        <p className="text-xs text-slate-400 mt-1">
                            ⚠️ Proporciona una descripción clara y detallada de la falla. Sin una descripción adecuada el reporte puede ser devuelto para corrección o eliminado según corresponda.
                        </p>
                    </div>

                    {(marca || vehiculoId || fallaId || descripcion) && (
                        <div className="flex justify-end">
                            <button type="button"
                                onClick={() => { setMarca(""); setModelo(""); setAnioSeleccionado(""); setVehiculoId(""); setVersion(""); setFallaId(""); setGravedad("media"); setDescripcion(""); setMostrarFormVehiculo(false); setMostrarFormFalla(false) }}
                                className="text-sm text-slate-400 hover:text-red-500 hover:underline transition-colors">
                                🗑 Limpiar campos
                            </button>
                        </div>
                    )}

                    <button type="button" onClick={handleContinuarAPaso2}
                        className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors">
                        Continuar a evidencias →
                    </button>
                </div>
            )}

            {/* PASO 2 — Evidencias (todo en memoria) */}
            {paso === 2 && (
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 space-y-1">
                        <p className="font-semibold">📋 Recomendaciones para una validación rápida</p>
                        <ul className="text-xs space-y-1 list-disc pl-4 text-amber-700">
                            <li>Adjunta <strong>fotos claras</strong> del problema: tablero, motor, neumáticos o la parte afectada.</li>
                            <li>Si tienes <strong>facturas o recibos</strong> de taller relacionados con la falla, inclúyelos como documentos.</li>
                            <li>Un <strong>enlace a un video</strong> que muestre la falla en funcionamiento es la evidencia más sólida.</li>
                            <li>Los reportes sin evidencia pueden ser <strong>devueltos para corrección o eliminados</strong> si no se puede verificar la falla.</li>
                        </ul>
                        <p className="text-xs text-amber-600 pt-1 border-t border-amber-200 mt-1">
                            ℹ️ Las evidencias se subirán todas juntas al confirmar el reporte al final. Aún no se ha creado ningún reporte.
                        </p>
                    </div>

                    {/* Imágenes — solo selección, sin botón de subida */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">🖼️ Fotos de la falla</h3>
                                <p className="text-slate-400 text-sm mt-1">Hasta 5 imágenes que muestren el problema.</p>
                            </div>
                            <div className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ml-2 ${imagenesSeleccionadas.length >= 5 ? "bg-red-100 text-red-700" : imagenesSeleccionadas.length > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                                {imagenesSeleccionadas.length}/5
                            </div>
                        </div>
                        {imagenesSeleccionadas.length > 0 && (
                            <ul className="space-y-2 mb-4">
                                {imagenesSeleccionadas.map((f, i) => (
                                    <li key={i} className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-blue-500 shrink-0">📎</span>
                                            <span className="text-sm text-slate-700 truncate">{f.name}</span>
                                            <span className="text-xs text-slate-400 shrink-0">({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                                        </div>
                                        <button type="button" onClick={() => setImagenesSeleccionadas(prev => prev.filter((_, idx) => idx !== i))}
                                            className="text-red-500 hover:text-red-700 text-lg leading-none ml-2 shrink-0">×</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {imagenesSeleccionadas.length < 5 && (
                            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition-colors py-5 px-4 border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50">
                                <span className="text-2xl mb-1">🖼️</span>
                                <span className="text-sm font-semibold text-slate-600">Haz clic para agregar fotos</span>
                                <span className="text-xs text-slate-400 mt-1">Puedes agregar hasta {5 - imagenesSeleccionadas.length} más</span>
                                <input type="file" multiple accept="image/*" className="hidden"
                                    onChange={e => {
                                        const nuevos = Array.from(e.target.files).slice(0, 5 - imagenesSeleccionadas.length)
                                        setImagenesSeleccionadas(prev => [...prev, ...nuevos])
                                        e.target.value = ""
                                    }} />
                            </label>
                        )}
                    </div>

                    {/* Documentos — solo selección */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">📄 Documentos (facturas, recibos)</h3>
                                <p className="text-slate-400 text-sm mt-1">Hasta 3 comprobantes que respalden tu reporte.</p>
                            </div>
                            <div className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ml-2 ${documentosSeleccionados.length >= 3 ? "bg-red-100 text-red-700" : documentosSeleccionados.length > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                                {documentosSeleccionados.length}/3
                            </div>
                        </div>
                        {documentosSeleccionados.length > 0 && (
                            <ul className="space-y-2 mb-4">
                                {documentosSeleccionados.map((f, i) => (
                                    <li key={i} className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-blue-500 shrink-0">📎</span>
                                            <span className="text-sm text-slate-700 truncate">{f.name}</span>
                                            <span className="text-xs text-slate-400 shrink-0">({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                                        </div>
                                        <button type="button" onClick={() => setDocumentosSeleccionados(prev => prev.filter((_, idx) => idx !== i))}
                                            className="text-red-500 hover:text-red-700 text-lg leading-none ml-2 shrink-0">×</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {documentosSeleccionados.length < 3 && (
                            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition-colors py-5 px-4 border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50">
                                <span className="text-2xl mb-1">📄</span>
                                <span className="text-sm font-semibold text-slate-600">Haz clic para agregar documentos</span>
                                <span className="text-xs text-slate-400 mt-1">Puedes agregar hasta {3 - documentosSeleccionados.length} más</span>
                                <input type="file" multiple accept="image/*,application/pdf" className="hidden"
                                    onChange={e => {
                                        const nuevos = Array.from(e.target.files).slice(0, 3 - documentosSeleccionados.length)
                                        setDocumentosSeleccionados(prev => [...prev, ...nuevos])
                                        e.target.value = ""
                                    }} />
                            </label>
                        )}
                    </div>

                    {/* Enlaces — solo en memoria */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-slate-700 mb-1">🔗 Enlaces de referencia</h3>
                        <p className="text-slate-500 text-sm mb-2">
                            Puedes adjuntar enlaces de <strong>YouTube, Google Drive, Facebook, TikTok</strong> u otras fuentes donde se muestre la falla.
                        </p>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-xs text-slate-500 space-y-1">
                            <p>📹 Si tienes un video propio de la falla, <strong>súbelo a YouTube, Google Drive o cualquier servicio en la nube</strong> y pega aquí el enlace.</p>
                            <p>⚠️ Si en algún momento el enlace deja de funcionar, envía un correo a <strong>{import.meta.env.VITE_CORREO_CONTACTO || "la administración"}</strong> indicando el reporte y el nuevo enlace para corregirlo.</p>
                        </div>
                        <div className="space-y-3">
                            <input className={inputClass} placeholder="https://..." value={enlaceUrl} onChange={e => setEnlaceUrl(e.target.value)} />
                            <input className={inputClass} placeholder="Título o descripción (opcional)" value={enlaceTitulo} onChange={e => setEnlaceTitulo(e.target.value)} />
                            <button type="button" onClick={handleAgregarEnlaceLocal}
                                className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg">
                                Agregar enlace
                            </button>
                        </div>
                        {enlacesAgregados.length > 0 && (
                            <ul className="mt-4 space-y-2">
                                {enlacesAgregados.map((e, i) => (
                                    <li key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${e.tipo === "youtube" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                                                {e.tipo === "youtube" ? "YouTube" : "Externo"}
                                            </span>
                                            <span className="text-sm text-slate-700 truncate">{e.titulo || e.url}</span>
                                        </div>
                                        <button type="button" onClick={() => handleQuitarEnlaceLocal(i)}
                                            className="text-red-500 hover:text-red-700 text-lg leading-none ml-2 shrink-0">×</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                        <p className="text-blue-800 text-sm mb-4">Las evidencias son opcionales. Al confirmar se creará el reporte con todo lo seleccionado.</p>
                        <button type="button" onClick={() => setModalConfirmarEnvio(true)}
                            className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 px-8 rounded-lg">
                            Continuar →
                        </button>
                    </div>
                </div>
            )}

            {/* PASO 3 — Resultado */}
            {paso === 3 && (
                <div className="bg-white rounded-xl shadow-xl p-8 text-center">
                    {estadoEnvio === "exito" && (
                        <>
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">✅</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">¡Muchas gracias por tu aporte!</h2>
                            <p className="text-slate-500 text-sm mb-1">
                                Tu reporte del <strong>{vehiculoReportado?.marca} {vehiculoReportado?.modelo}{vehiculoReportado?.version ? ` ${vehiculoReportado.version}` : ""}</strong> está pendiente de validación.
                            </p>
                            <p className="text-slate-400 text-xs mb-6">
                                ¿Quieres valorar tu experiencia general con este vehículo? Puedes hacerlo ahora o después desde <strong>Confiabilidad</strong>.
                            </p>
                            <div className="flex flex-col gap-3 max-w-xs mx-auto">
                                <button type="button" onClick={() => navigate(`/dashboard/confiabilidad/${vehiculoReportado?.id}?confirmado=true`)}
                                    className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors">
                                    ⭐ Valorar este vehículo ahora
                                </button>
                                <button type="button" onClick={() => navigate("/dashboard/mis-reportes")}
                                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors">
                                    Valorar después — ir a mis reportes
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-4">💡 Tienes hasta 30 días desde que la haces para actualizar tu valoración</p>
                        </>
                    )}

                    {estadoEnvio === "exito_con_errores" && (
                        <>
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Reporte generado con algunos errores</h2>
                            <p className="text-slate-500 text-sm mb-3">
                                Tu reporte del <strong>{vehiculoReportado?.marca} {vehiculoReportado?.modelo}</strong> se creó correctamente, pero hubo problemas al subir parte de la evidencia:
                            </p>
                            <ul className="text-xs text-red-500 text-left bg-red-50 rounded-lg p-3 mb-4 max-w-sm mx-auto space-y-1">
                                {erroresEnvio.map((e, i) => <li key={i}>• {e}</li>)}
                            </ul>
                            <p className="text-slate-400 text-xs mb-6">
                                Puedes corregir o reintentar la subida desde <strong>Mis Reportes</strong> dentro de las primeras 48 horas.
                            </p>
                            <div className="flex flex-col gap-3 max-w-xs mx-auto">
                                <button type="button" onClick={() => navigate("/dashboard/mis-reportes")}
                                    className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors">
                                    Ir a mis reportes
                                </button>
                                <button type="button" onClick={() => navigate(`/dashboard/confiabilidad/${vehiculoReportado?.id}?confirmado=true`)}
                                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors">
                                    ⭐ Valorar este vehículo
                                </button>
                            </div>
                        </>
                    )}

                    {estadoEnvio === "error" && (
                        <>
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">❌</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">No se pudo generar el reporte</h2>
                            <p className="text-slate-500 text-sm mb-4">
                                {erroresEnvio[0] || "Ocurrió un error inesperado. Intenta nuevamente."}
                            </p>
                            <button type="button" onClick={handleReintentar}
                                className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 px-8 rounded-lg">
                                Volver a intentar
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Overlay de envío en progreso */}
            {estadoEnvio === "enviando" && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-8 text-center">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-900 rounded-full animate-spin mx-auto mb-4" />
                        <h3 className="font-bold text-slate-800 text-lg mb-1">Generando tu reporte...</h3>
                        <p className="text-slate-500 text-sm">Subiendo evidencias, esto puede tardar unos segundos.</p>
                    </div>
                </div>
            )}

            {/* Modal confirmar envío */}
            {modalConfirmarEnvio && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">📋</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">¿Confirmas el envío?</h3>
                        <p className="text-slate-500 text-sm mb-2">
                            Verifica que las evidencias seleccionadas sean correctas antes de generar el reporte.
                        </p>
                        <p className="text-xs text-slate-400 mb-5">
                            {imagenesSeleccionadas.length} foto(s) · {documentosSeleccionados.length} documento(s) · {enlacesAgregados.length} enlace(s)
                        </p>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setModalConfirmarEnvio(false)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg">
                                Revisar de nuevo
                            </button>
                            <button type="button" onClick={handleConfirmarEnvio}
                                className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg">
                                Sí, generar reporte
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal confirmar cancelación */}
            {modalCancelar && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">¿Cancelar el proceso?</h3>
                        <p className="text-slate-500 text-sm mb-5">
                            Se perderán las evidencias seleccionadas y volverás al paso 1. Aún no se ha generado ningún reporte.
                        </p>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setModalCancelar(false)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg">
                                Volver
                            </button>
                            <button type="button" onClick={handleCancelar}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg">
                                Sí, cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ReportarFalla