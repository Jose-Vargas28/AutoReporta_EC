import { useEffect, useState, useCallback } from "react"
import { ToastContainer, toast } from "react-toastify"
import { tiposCombustible, tiposVehiculo, aniosVehiculo } from "../config/ecuador"
import {
    getVehiculos, actualizarVehiculo, eliminarVehiculo, crearVehiculo,
    getFallas, actualizarFalla, eliminarFalla, crearFalla
} from "../services/catalogoService"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import Paginacion from "../components/ui/Paginacion"
import LogoMarca from "../components/ui/LogoMarca"

const formatearFecha = (fecha) => {
    if (!fecha) return "—"
    return new Date(fecha).toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const AdminCatalogos = () => {
    // Vehículos
    const [vehiculos, setVehiculos] = useState([])
    const [busquedaV, setBusquedaV] = useState("")
    const [paginaV, setPaginaV] = useState(1)
    const [totalPaginasV, setTotalPaginasV] = useState(1)
    const [totalV, setTotalV] = useState(0)
    const [cargandoV, setCargandoV] = useState(true)

    // Fallas
    const [fallas, setFallas] = useState([])
    const [busquedaF, setBusquedaF] = useState("")
    const [paginaF, setPaginaF] = useState(1)
    const [totalPaginasF, setTotalPaginasF] = useState(1)
    const [totalF, setTotalF] = useState(0)
    const [cargandoF, setCargandoF] = useState(true)

    // Modales vehículo
    const [detalleVehiculo, setDetalleVehiculo] = useState(null)
    const [editarVehiculo, setEditarVehiculo] = useState(null)
    const [eliminarVehiculoModal, setEliminarVehiculoModal] = useState(null)
    const [formVehiculo, setFormVehiculo] = useState({ marca: "", modelo: "", anio: "", version: "", tipo: "automóvil", combustible: "gasolina", transmision: "", traccion: "", potencia: "", torque: "", airbags: "", peso: "", turbo: "", cilindraje: "", cilindros: "" })
    const [anioManualModal, setAnioManualModal] = useState(false)
    const [mostrarFormCrearV, setMostrarFormCrearV] = useState(false)
    const [formCrearV, setFormCrearV] = useState({ marca: "", modelo: "", anio: "", version: "", tipo: "automóvil", combustible: "gasolina" })
    const [anioManualCrear, setAnioManualCrear] = useState(false)

    // Modales falla
    const [detalleFalla, setDetalleFalla] = useState(null)
    const [editarFalla, setEditarFalla] = useState(null)
    const [eliminarFallaModal, setEliminarFallaModal] = useState(null)
    const [formFalla, setFormFalla] = useState({ nombre: "", descripcion: "", gravedad: "media" })
    const [mostrarFormCrearF, setMostrarFormCrearF] = useState(false)
    const [formCrearF, setFormCrearF] = useState({ nombre: "", descripcion: "", gravedad: "media" })

    const inputClass = "block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"

    const cargarVehiculos = useCallback(async (pag = 1, busq = "") => {
        setCargandoV(true)
        try {
            const res = await getVehiculos(pag, busq)
            setVehiculos(res.data.vehiculos || [])
            setTotalPaginasV(res.data.paginas || 1)
            setTotalV(res.data.total || 0)
        } catch (error) { console.error(error); setVehiculos([]) }
        setCargandoV(false)
    }, [])

    const cargarFallas = useCallback(async (pag = 1, busq = "") => {
        setCargandoF(true)
        try {
            const res = await getFallas(pag, busq)
            setFallas(res.data.fallas || [])
            setTotalPaginasF(res.data.paginas || 1)
            setTotalF(res.data.total || 0)
        } catch (error) { console.error(error); setFallas([]) }
        setCargandoF(false)
    }, [])

    useEffect(() => { cargarVehiculos(); cargarFallas() }, [])

    useEffect(() => {
        const t = setTimeout(() => { setPaginaV(1); cargarVehiculos(1, busquedaV) }, 400)
        return () => clearTimeout(t)
    }, [busquedaV])

    useEffect(() => {
        const t = setTimeout(() => { setPaginaF(1); cargarFallas(1, busquedaF) }, 400)
        return () => clearTimeout(t)
    }, [busquedaF])

    // ---- Crear vehículo ----
    const handleCrearVehiculo = async () => {
        if (!formCrearV.marca || !formCrearV.modelo || !formCrearV.anio) return toast.error("Completa marca, modelo y año")
        try {
            const res = await crearVehiculo({
                marca: formCrearV.marca, modelo: formCrearV.modelo,
                anio: Number(formCrearV.anio), version: formCrearV.version || "",
                tipo: formCrearV.tipo, combustible: formCrearV.combustible
            })
            toast.success(res.data.msg)
            setMostrarFormCrearV(false)
            setFormCrearV({ marca: "", modelo: "", anio: "", version: "", tipo: "automóvil", combustible: "gasolina" })
            setAnioManualCrear(false)
            cargarVehiculos(paginaV, busquedaV)
        } catch (error) { toast.error(error?.response?.data?.msg || "Error al crear vehículo") }
    }

    // ---- Crear falla ----
    const handleCrearFalla = async () => {
        if (!formCrearF.nombre) return toast.error("El nombre es obligatorio")
        try {
            const res = await crearFalla(formCrearF)
            toast.success(res.data.msg)
            setMostrarFormCrearF(false)
            setFormCrearF({ nombre: "", descripcion: "", gravedad: "media" })
            cargarFallas(paginaF, busquedaF)
        } catch (error) { toast.error(error?.response?.data?.msg || "Error al crear falla") }
    }

    // ---- Vehículos ----
    const abrirEditarVehiculo = (v) => {
        setFormVehiculo({
            marca: v.marca, modelo: v.modelo, anio: v.anio, version: v.version || "",
            tipo: v.tipo || "automóvil", combustible: v.combustible || "gasolina",
            transmision: v.transmision || "", traccion: v.traccion || "",
            potencia: v.potencia ?? "", torque: v.torque ?? "",
            airbags: v.airbags ?? "", peso: v.peso ?? "",
            turbo: v.turbo === true ? "true" : v.turbo === false ? "false" : "",
            cilindraje: v.cilindraje ?? "", cilindros: v.cilindros ?? ""
        })
        setAnioManualModal(!aniosVehiculo.includes(Number(v.anio)))
        setEditarVehiculo(v)
    }

    const handleGuardarVehiculo = async () => {
        if (!formVehiculo.marca || !formVehiculo.modelo || !formVehiculo.anio) return toast.error("Completa todos los campos")
        try {
            const res = await actualizarVehiculo(editarVehiculo._id, {
                marca: formVehiculo.marca, modelo: formVehiculo.modelo,
                anio: Number(formVehiculo.anio), version: formVehiculo.version.trim() || "Estándar",
                tipo: formVehiculo.tipo, combustible: formVehiculo.combustible,
                transmision: formVehiculo.transmision || null,
                traccion: formVehiculo.traccion || null,
                potencia: formVehiculo.potencia !== "" ? Number(formVehiculo.potencia) : null,
                torque: formVehiculo.torque !== "" ? Number(formVehiculo.torque) : null,
                airbags: formVehiculo.airbags !== "" ? Number(formVehiculo.airbags) : null,
                peso: formVehiculo.peso !== "" ? Number(formVehiculo.peso) : null,
                turbo: formVehiculo.turbo === "true" ? true : formVehiculo.turbo === "false" ? false : null,
                cilindraje: formVehiculo.cilindraje !== "" ? Number(formVehiculo.cilindraje) : null,
                cilindros:  formVehiculo.cilindros  !== "" ? Number(formVehiculo.cilindros)  : null,
            })
            toast.success(res.data.msg)
            setEditarVehiculo(null)
            cargarVehiculos(paginaV, busquedaV)
        } catch (error) { toast.error(error?.response?.data?.msg || "Error al actualizar") }
    }

    const handleEliminarVehiculo = async () => {
        try {
            const res = await eliminarVehiculo(eliminarVehiculoModal._id)
            toast.success(res.data.msg)
            setEliminarVehiculoModal(null)
            cargarVehiculos(paginaV, busquedaV)
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al eliminar")
            setEliminarVehiculoModal(null)
        }
    }

    // ---- Fallas ----
    const abrirEditarFalla = (f) => {
        setFormFalla({ nombre: f.nombre, descripcion: f.descripcion || "", gravedad: f.gravedad || "media" })
        setEditarFalla(f)
    }

    const handleGuardarFalla = async () => {
        if (!formFalla.nombre) return toast.error("El nombre es obligatorio")
        try {
            const res = await actualizarFalla(editarFalla._id, formFalla)
            toast.success(res.data.msg)
            setEditarFalla(null)
            cargarFallas(paginaF, busquedaF)
        } catch (error) { toast.error(error?.response?.data?.msg || "Error al actualizar") }
    }

    const handleEliminarFalla = async () => {
        try {
            const res = await eliminarFalla(eliminarFallaModal._id)
            toast.success(res.data.msg)
            setEliminarFallaModal(null)
            cargarFallas(paginaF, busquedaF)
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al eliminar")
            setEliminarFallaModal(null)
        }
    }

    return (
        <div>
            <ToastContainer />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Catálogos</h1>
            <p className="text-slate-500 mb-2">Gestiona los vehículos y tipos de falla registrados.</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-800">
                ⚠️ Los vehículos y fallas con reportes asociados no pueden eliminarse. Usa "Editar" para corregir datos incorrectos.
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* ---- VEHÍCULOS ---- */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-slate-700">Vehículos ({totalV})</h2>
                        <button type="button" onClick={() => setMostrarFormCrearV(!mostrarFormCrearV)}
                            className="text-sm text-blue-700 hover:underline font-semibold">
                            {mostrarFormCrearV ? "Cancelar" : "+ Nuevo"}
                        </button>
                    </div>

                    {mostrarFormCrearV && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3 space-y-2">
                            <input className={inputClass} placeholder="Marca (Ej. Toyota)" value={formCrearV.marca}
                                onChange={(e) => setFormCrearV({ ...formCrearV, marca: e.target.value })} />
                            <input className={inputClass} placeholder="Modelo (Ej. Corolla)" value={formCrearV.modelo}
                                onChange={(e) => setFormCrearV({ ...formCrearV, modelo: e.target.value })} />
                            {!anioManualCrear ? (
                                <select className={inputClass} value={formCrearV.anio} onChange={(e) => {
                                    if (e.target.value === "otro") { setAnioManualCrear(true); setFormCrearV({ ...formCrearV, anio: "" }) }
                                    else setFormCrearV({ ...formCrearV, anio: e.target.value })
                                }}>
                                    <option value="">Seleccionar año</option>
                                    {aniosVehiculo.map(a => <option key={a} value={a}>{a}</option>)}
                                    <option value="otro">Otro año...</option>
                                </select>
                            ) : (
                                <div className="flex gap-2">
                                    <input type="number" className={inputClass} placeholder="Ej. 2027" value={formCrearV.anio}
                                        onChange={(e) => setFormCrearV({ ...formCrearV, anio: e.target.value })} min="1900" max="2100" />
                                    <button type="button" onClick={() => { setAnioManualCrear(false); setFormCrearV({ ...formCrearV, anio: "" }) }}
                                        className="px-3 py-2 text-sm text-slate-500 border border-slate-300 rounded-md shrink-0">← Volver</button>
                                </div>
                            )}
                            <select className={inputClass} value={formCrearV.tipo}
                                onChange={(e) => setFormCrearV({ ...formCrearV, tipo: e.target.value })}>
                                {tiposVehiculo.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <select className={inputClass} value={formCrearV.combustible}
                                onChange={(e) => setFormCrearV({ ...formCrearV, combustible: e.target.value })}>
                                {tiposCombustible.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <div>
                                <input className={inputClass}
                                    placeholder="Versión (opcional, máx 20 car.)"
                                    maxLength={20}
                                    value={formCrearV.version}
                                    onChange={(e) => setFormCrearV({ ...formCrearV, version: e.target.value })} />
                                <p className="text-xs text-slate-400 mt-1">Ej: 1.6 MT · 2.0 AT · 4x4 AWD · Hatchback · Emotion</p>
                            </div>
                            <button type="button" onClick={handleCrearVehiculo}
                                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg text-sm">
                                Registrar vehículo
                            </button>
                        </div>
                    )}
                    <input type="text" placeholder="Buscar por marca o modelo..."
                        className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm mb-3"
                        value={busquedaV} onChange={(e) => setBusquedaV(e.target.value)} />

                    {cargandoV ? <p className="text-slate-400 text-sm">Cargando...</p>
                    : vehiculos.length === 0 ? (
                        <p className="text-slate-400 text-sm">No hay vehículos que coincidan.</p>
                    ) : (
                        <>
                            <ul className="space-y-2">
                                {vehiculos.map(v => (
                                    <li key={v._id} className="bg-slate-50 px-3 py-2.5 rounded-lg">
                                        <div className="flex justify-between items-center gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <LogoMarca marca={v.marca} size={28} />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700">{v.marca} {v.modelo} {v.anio}</p>
                                                    <div className="flex gap-1 mt-0.5 flex-wrap">
                                                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">{v.tipo || "automóvil"}</span>
                                                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{v.combustible || "gasolina"}</span>
                                                        {v.totalReportes > 0 && (
                                                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">{v.totalReportes} reporte(s)</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-0.5">{v.creadoPor?.nombre || "—"} · {formatearFecha(v.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button type="button" onClick={() => setDetalleVehiculo(v)} className="text-blue-700 hover:underline text-xs font-semibold">Ver</button>
                                                <button type="button" onClick={() => abrirEditarVehiculo(v)} className="text-amber-600 hover:underline text-xs font-semibold">Editar</button>
                                                <button type="button" onClick={() => setEliminarVehiculoModal(v)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <Paginacion paginaActual={paginaV} totalPaginas={totalPaginasV}
                                onCambiar={(p) => { setPaginaV(p); cargarVehiculos(p, busquedaV) }} />
                        </>
                    )}
                </div>

                {/* ---- FALLAS ---- */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-slate-700">Tipos de falla ({totalF})</h2>
                        <button type="button" onClick={() => setMostrarFormCrearF(!mostrarFormCrearF)}
                            className="text-sm text-blue-700 hover:underline font-semibold">
                            {mostrarFormCrearF ? "Cancelar" : "+ Nueva"}
                        </button>
                    </div>

                    {mostrarFormCrearF && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3 space-y-2">
                            <input className={inputClass} placeholder="Nombre de la falla (Ej. Falla de frenos)" value={formCrearF.nombre}
                                onChange={(e) => setFormCrearF({ ...formCrearF, nombre: e.target.value })} />
                            <input className={inputClass} placeholder="Descripción breve (opcional)" value={formCrearF.descripcion}
                                onChange={(e) => setFormCrearF({ ...formCrearF, descripcion: e.target.value })} />
                            <select className={inputClass} value={formCrearF.gravedad}
                                onChange={(e) => setFormCrearF({ ...formCrearF, gravedad: e.target.value })}>
                                <option value="baja">Baja (no afecta el funcionamiento)</option>
                                <option value="media">Media (funciona con fallas)</option>
                                <option value="alta">Alta (riesgo o falla grave)</option>
                            </select>
                            <button type="button" onClick={handleCrearFalla}
                                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg text-sm">
                                Registrar falla
                            </button>
                        </div>
                    )}
                    <input type="text" placeholder="Buscar por nombre de falla..."
                        className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm mb-3"
                        value={busquedaF} onChange={(e) => setBusquedaF(e.target.value)} />

                    {cargandoF ? <p className="text-slate-400 text-sm">Cargando...</p>
                    : fallas.length === 0 ? (
                        <p className="text-slate-400 text-sm">No hay fallas que coincidan.</p>
                    ) : (
                        <>
                            <ul className="space-y-2">
                                {fallas.map(f => (
                                    <li key={f._id} className="bg-slate-50 px-3 py-2.5 rounded-lg">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-semibold text-slate-700">{f.nombre}</span>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                        f.gravedad === "alta" ? "bg-red-100 text-red-700" :
                                                        f.gravedad === "baja" ? "bg-blue-100 text-blue-700" :
                                                        "bg-amber-100 text-amber-700"
                                                    }`}>{f.gravedad || "media"}</span>
                                                    {f.totalReportes > 0 && (
                                                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">{f.totalReportes} reporte(s)</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5">{f.creadoPor?.nombre || "—"} · {formatearFecha(f.createdAt)}</p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button type="button" onClick={() => setDetalleFalla(f)} className="text-blue-700 hover:underline text-xs font-semibold">Ver</button>
                                                <button type="button" onClick={() => abrirEditarFalla(f)} className="text-amber-600 hover:underline text-xs font-semibold">Editar</button>
                                                <button type="button" onClick={() => setEliminarFallaModal(f)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <Paginacion paginaActual={paginaF} totalPaginas={totalPaginasF}
                                onCambiar={(p) => { setPaginaF(p); cargarFallas(p, busquedaF) }} />
                        </>
                    )}
                </div>
            </div>

            {/* Modal detalle vehículo */}
            {detalleVehiculo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <LogoMarca marca={detalleVehiculo.marca} size={40} />
                            <h3 className="text-xl font-bold text-slate-700">Detalle del vehículo</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><p className="text-xs text-slate-400">Marca</p><p className="font-semibold">{detalleVehiculo.marca}</p></div>
                            <div><p className="text-xs text-slate-400">Modelo</p><p className="font-semibold">{detalleVehiculo.modelo}</p></div>
                            <div><p className="text-xs text-slate-400">Año</p><p className="font-semibold">{detalleVehiculo.anio}</p></div>
                            <div><p className="text-xs text-slate-400">Tipo</p><p className="font-semibold capitalize">{detalleVehiculo.tipo || "automóvil"}</p></div>
                            <div><p className="text-xs text-slate-400">Combustible</p><p className="font-semibold capitalize">{detalleVehiculo.combustible || "gasolina"}</p></div>
                            <div><p className="text-xs text-slate-400">Registrado por</p><p className="font-semibold">{detalleVehiculo.creadoPor?.nombre || "—"}</p></div>
                            <div><p className="text-xs text-slate-400">Fecha</p><p className="font-semibold">{formatearFecha(detalleVehiculo.createdAt)}</p></div>
                            <div><p className="text-xs text-slate-400">Reportes asociados</p>
                                <p className={`font-bold text-lg ${detalleVehiculo.totalReportes > 0 ? "text-green-600" : "text-slate-400"}`}>{detalleVehiculo.totalReportes}</p>
                            </div>
                        </div>
                        {detalleVehiculo.totalReportes > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-3 text-sm text-amber-800">
                                Tiene <strong>{detalleVehiculo.totalReportes} reporte(s)</strong> asociado(s) y no puede eliminarse. Gestiona los reportes desde la tabla general.
                            </div>
                        )}
                        <button type="button" onClick={() => setDetalleVehiculo(null)}
                            className="mt-6 w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg">Cerrar</button>
                    </div>
                </div>
            )}

            {/* Modal detalle falla */}
            {detalleFalla && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-slate-700 mb-4">Detalle del tipo de falla</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="col-span-2"><p className="text-xs text-slate-400">Nombre</p><p className="font-semibold">{detalleFalla.nombre}</p></div>
                            {detalleFalla.descripcion && <div className="col-span-2"><p className="text-xs text-slate-400">Descripción</p><p className="text-slate-700">{detalleFalla.descripcion}</p></div>}
                            <div><p className="text-xs text-slate-400">Gravedad</p>
                                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold mt-1 ${
                                    detalleFalla.gravedad === "alta" ? "bg-red-100 text-red-700" :
                                    detalleFalla.gravedad === "baja" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                                }`}>{detalleFalla.gravedad || "media"}</span>
                            </div>
                            <div><p className="text-xs text-slate-400">Reportes asociados</p>
                                <p className={`font-bold text-lg ${detalleFalla.totalReportes > 0 ? "text-green-600" : "text-slate-400"}`}>{detalleFalla.totalReportes}</p>
                            </div>
                            <div><p className="text-xs text-slate-400">Registrado por</p><p className="font-semibold">{detalleFalla.creadoPor?.nombre || "—"}</p></div>
                            <div><p className="text-xs text-slate-400">Fecha</p><p className="font-semibold">{formatearFecha(detalleFalla.createdAt)}</p></div>
                        </div>
                        {detalleFalla.totalReportes > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-3 text-sm text-amber-800">
                                Tiene <strong>{detalleFalla.totalReportes} reporte(s)</strong> asociado(s) y no puede eliminarse. Gestiona los reportes desde la tabla general.
                            </div>
                        )}
                        <button type="button" onClick={() => setDetalleFalla(null)}
                            className="mt-6 w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg">Cerrar</button>
                    </div>
                </div>
            )}

            {/* Modal editar vehículo */}
            {editarVehiculo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-700 mb-4">Editar vehículo</h3>
                        <div className="space-y-3">
                            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Marca</label>
                                <input className={inputClass} value={formVehiculo.marca} onChange={(e) => setFormVehiculo({ ...formVehiculo, marca: e.target.value })} /></div>
                            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Modelo</label>
                                <input className={inputClass} value={formVehiculo.modelo} onChange={(e) => setFormVehiculo({ ...formVehiculo, modelo: e.target.value })} /></div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Año</label>
                                {!anioManualModal ? (
                                    <select className={inputClass} value={formVehiculo.anio} onChange={(e) => {
                                        if (e.target.value === "otro") { setAnioManualModal(true); setFormVehiculo({ ...formVehiculo, anio: "" }) }
                                        else setFormVehiculo({ ...formVehiculo, anio: e.target.value })
                                    }}>
                                        <option value="">Seleccionar año</option>
                                        {aniosVehiculo.map(a => <option key={a} value={a}>{a}</option>)}
                                        <option value="otro">Otro año...</option>
                                    </select>
                                ) : (
                                    <div className="flex gap-2">
                                        <input type="number" className={inputClass} placeholder="Ej. 2027" value={formVehiculo.anio}
                                            onChange={(e) => setFormVehiculo({ ...formVehiculo, anio: e.target.value })} min="1900" max="2100" />
                                        <button type="button" onClick={() => { setAnioManualModal(false); setFormVehiculo({ ...formVehiculo, anio: "" }) }}
                                            className="px-3 py-2 text-sm text-slate-500 border border-slate-300 rounded-md">← Volver</button>
                                    </div>
                                )}
                            </div>
                            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Tipo</label>
                                <select className={inputClass} value={formVehiculo.tipo} onChange={(e) => setFormVehiculo({ ...formVehiculo, tipo: e.target.value })}>
                                    {tiposVehiculo.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select></div>
                            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Combustible</label>
                                <select className={inputClass} value={formVehiculo.combustible} onChange={(e) => setFormVehiculo({ ...formVehiculo, combustible: e.target.value })}>
                                    {tiposCombustible.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select></div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Versión <span className="text-slate-400 font-normal">(opcional)</span></label>
                                <input className={inputClass} maxLength={20} placeholder="Ej: 1.6 MT · 2.0 AT · 4x4 AWD"
                                    value={formVehiculo.version}
                                    onChange={(e) => setFormVehiculo({ ...formVehiculo, version: e.target.value })} />
                                <p className="text-xs text-slate-400 mt-1">Máx. 20 caracteres</p>
                            </div>

                            {/* Características técnicas */}
                            <div className="border-t border-slate-100 pt-3 mt-1">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Características técnicas <span className="font-normal normal-case">(opcional)</span></p>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">Transmisión</label>
                                            <select className={inputClass} value={formVehiculo.transmision}
                                                onChange={e => setFormVehiculo({ ...formVehiculo, transmision: e.target.value })}>
                                                <option value="">— Sin datos —</option>
                                                <option value="manual">Manual</option>
                                                <option value="automática">Automática</option>
                                                <option value="automática doble embrague">Automática doble embrague</option>
                                                <option value="CVT">CVT</option>
                                                <option value="e-CVT">e-CVT</option>
                                                <option value="semi-automática">Semi-automática</option>
                                                <option value="directa">Directa (eléctrico)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">Tracción</label>
                                            <select className={inputClass} value={formVehiculo.traccion}
                                                onChange={e => setFormVehiculo({ ...formVehiculo, traccion: e.target.value })}>
                                                <option value="">— Sin datos —</option>
                                                <option value="delantera">Delantera</option>
                                                <option value="trasera">Trasera</option>
                                                <option value="4x4">4x4</option>
                                                <option value="AWD">AWD</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">Potencia (CV)</label>
                                            <input type="number" min="0" max="2000" className={inputClass} placeholder="Ej: 150"
                                                value={formVehiculo.potencia}
                                                onChange={e => setFormVehiculo({ ...formVehiculo, potencia: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">Torque (Nm)</label>
                                            <input type="number" min="0" max="2000" className={inputClass} placeholder="Ej: 320"
                                                value={formVehiculo.torque}
                                                onChange={e => setFormVehiculo({ ...formVehiculo, torque: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">Airbags</label>
                                            <input type="number" min="0" max="20" className={inputClass} placeholder="Ej: 6"
                                                value={formVehiculo.airbags}
                                                onChange={e => setFormVehiculo({ ...formVehiculo, airbags: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">Peso (kg)</label>
                                            <input type="number" min="0" max="10000" className={inputClass} placeholder="Ej: 1450"
                                                value={formVehiculo.peso}
                                                onChange={e => setFormVehiculo({ ...formVehiculo, peso: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Turbo</label>
                                        <select className={inputClass} value={formVehiculo.turbo}
                                            onChange={e => setFormVehiculo({ ...formVehiculo, turbo: e.target.value })}>
                                            <option value="">— Sin datos —</option>
                                            <option value="true">Sí — con turbo</option>
                                            <option value="false">No — aspiración natural</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">Cilindraje (cc)</label>
                                            <input type="number" min="0" max="10000" className={inputClass} placeholder="Ej: 1984"
                                                value={formVehiculo.cilindraje}
                                                onChange={e => setFormVehiculo({ ...formVehiculo, cilindraje: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-slate-700">Cilindros</label>
                                            <input type="number" min="1" max="16" className={inputClass} placeholder="Ej: 4"
                                                value={formVehiculo.cilindros}
                                                onChange={e => setFormVehiculo({ ...formVehiculo, cilindros: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button type="button" onClick={handleGuardarVehiculo}
                                className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg">Guardar</button>
                            <button type="button" onClick={() => setEditarVehiculo(null)}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal editar falla */}
            {editarFalla && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-slate-700 mb-4">Editar tipo de falla</h3>
                        <div className="space-y-3">
                            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Nombre</label>
                                <input className={inputClass} value={formFalla.nombre} onChange={(e) => setFormFalla({ ...formFalla, nombre: e.target.value })} /></div>
                            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Descripción (opcional)</label>
                                <input className={inputClass} value={formFalla.descripcion} onChange={(e) => setFormFalla({ ...formFalla, descripcion: e.target.value })} /></div>
                            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Gravedad</label>
                                <select className={inputClass} value={formFalla.gravedad} onChange={(e) => setFormFalla({ ...formFalla, gravedad: e.target.value })}>
                                    <option value="baja">Baja</option>
                                    <option value="media">Media</option>
                                    <option value="alta">Alta</option>
                                </select></div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button type="button" onClick={handleGuardarFalla}
                                className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg">Guardar</button>
                            <button type="button" onClick={() => setEditarFalla(null)}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal confirmar eliminar vehículo */}
            {eliminarVehiculoModal && (
                <ModalConfirmar
                    titulo="¿Eliminar vehículo?"
                    descripcion={
                        eliminarVehiculoModal.totalReportes > 0
                            ? `Este vehículo tiene ${eliminarVehiculoModal.totalReportes} reporte(s) y no puede eliminarse. Primero gestiona esos reportes desde la tabla general.`
                            : `¿Eliminar ${eliminarVehiculoModal.marca} ${eliminarVehiculoModal.modelo} ${eliminarVehiculoModal.anio}?`
                    }
                    textoConfirmar={eliminarVehiculoModal.totalReportes > 0 ? null : "Sí, eliminar"}
                    textoCancelar={eliminarVehiculoModal.totalReportes > 0 ? "Entendido" : "Cancelar"}
                    colorBoton="bg-red-600 hover:bg-red-700"
                    onConfirmar={eliminarVehiculoModal.totalReportes > 0 ? null : handleEliminarVehiculo}
                    onCancelar={() => setEliminarVehiculoModal(null)}
                />
            )}

            {/* Modal confirmar eliminar falla */}
            {eliminarFallaModal && (
                <ModalConfirmar
                    titulo="¿Eliminar tipo de falla?"
                    descripcion={
                        eliminarFallaModal.totalReportes > 0
                            ? `Esta falla tiene ${eliminarFallaModal.totalReportes} reporte(s) y no puede eliminarse. Primero gestiona esos reportes desde la tabla general.`
                            : `¿Eliminar "${eliminarFallaModal.nombre}" del catálogo?`
                    }
                    textoConfirmar={eliminarFallaModal.totalReportes > 0 ? null : "Sí, eliminar"}
                    textoCancelar={eliminarFallaModal.totalReportes > 0 ? "Entendido" : "Cancelar"}
                    colorBoton="bg-red-600 hover:bg-red-700"
                    onConfirmar={eliminarFallaModal.totalReportes > 0 ? null : handleEliminarFalla}
                    onCancelar={() => setEliminarFallaModal(null)}
                />
            )}
        </div>
    )
}

export default AdminCatalogos