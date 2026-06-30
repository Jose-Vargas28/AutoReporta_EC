import { useState, useEffect } from "react"
import { Link } from "react-router"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import Logo from "../components/Logo"
import LogoMarca from "../components/ui/LogoMarca"
import { theme } from "../config/theme"
import { getEstadisticasHome } from "../services/reporteService"
import { getRanking } from "../services/valoracionService"
import heroBg from "../assets/hero-bg.jpg"

// Formulario de contacto del Home (sin login)
const HomeContactoForm = () => {
    const [form, setForm] = useState({ nombre: "", correo: "", mensaje: "" })
    const [enviando, setEnviando] = useState(false)
    const inputClass = "block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.nombre || !form.correo || !form.mensaje)
            return toast.error("Completa todos los campos")
        setEnviando(true)
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/contacto`, {
                ...form, asunto: "Consulta desde el Home"
            })
            toast.success(res.data.msg)
            setForm({ nombre: "", correo: "", mensaje: "" })
        } catch (err) {
            toast.error(err.response?.data?.msg || "No se pudo enviar el mensaje")
        }
        setEnviando(false)
    }
    return (
        <form className="bg-slate-50 rounded-xl p-6 space-y-4" onSubmit={handleSubmit}>
            <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Nombre</label>
                <input type="text" placeholder="Tu nombre" className={inputClass}
                    value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</label>
                <input type="email" placeholder="tucorreo@ejemplo.com" className={inputClass}
                    value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} />
            </div>
            <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Mensaje</label>
                <textarea rows={4} placeholder="Cuéntanos tu duda, queja o sugerencia..."
                    className={`${inputClass} resize-none`}
                    value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })} />
            </div>
            <button type="submit" disabled={enviando}
                className={`w-full font-semibold py-3 rounded-lg transition-colors ${enviando ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-blue-900 hover:bg-blue-800 text-white"}`}>
                {enviando ? "Enviando..." : "Enviar mensaje"}
            </button>
        </form>
    )
}

// =============================================================
//  ÍCONOS DE REDES SOCIALES (footer)
//  Implementados como SVG inline — apuntan a la página principal
//  de cada red. Cuando crees las cuentas reales, solo cambia el
//  href de cada <a> en el footer por la URL de tu perfil.
// =============================================================

// Búsqueda de foto de stock cuando un vehículo no tiene fotos reales subidas
// (misma función y misma key que ya usan Confiabilidad.jsx y CatalogoVehiculos.jsx)
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

// Foto de cada tarjeta del top 3: usa la real si el vehículo tiene una subida,
// si no busca una foto de stock en Pexels automáticamente.
const FotoTarjetaTop = ({ vehiculo }) => {
    const fotoReal = vehiculo.fotos?.find(f => f.principal)?.url || vehiculo.fotos?.[0]?.url
    const [fotoPexels, setFotoPexels] = useState(null)
    const [cargando, setCargando] = useState(!fotoReal)

    useEffect(() => {
        if (fotoReal) return
        let cancelado = false
        setCargando(true)
        buscarFotoPexels(vehiculo.marca, vehiculo.modelo).then(urls => {
            if (!cancelado) {
                setFotoPexels(urls[0] || null)
                setCargando(false)
            }
        })
        return () => { cancelado = true }
    }, [vehiculo._id, fotoReal])

    const foto = fotoReal || fotoPexels

    if (cargando) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
        )
    }
    if (!foto) {
        return <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">Sin foto</div>
    }
    return <img src={foto} alt={`${vehiculo.marca} ${vehiculo.modelo}`} className="w-full h-full object-cover" />
}

const Home = () => {
    const [stats, setStats] = useState(null)
    const [topVehiculos, setTopVehiculos] = useState([])

    useEffect(() => {
        getEstadisticasHome()
            .then(res => setStats(res.data))
            .catch(() => setStats(null))

        getRanking({ minValoraciones: 1 })
            .then(res => setTopVehiculos(res.data.ranking.slice(0, 3)))
            .catch(() => setTopVehiculos([]))
    }, [])

    return (
        <div className="min-h-screen bg-white">
            <ToastContainer />

            {/* ── Hero con foto de fondo ── */}
            <div className="relative min-h-screen flex flex-col">
                {/* Foto de fondo */}
                <img
                    src={heroBg}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                {/* Overlay: degradado de izquierda azul oscuro hacia transparente + capa oscura general */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-950/70 to-blue-950/40" />
                <div className="absolute inset-0 bg-black/20" />

                {/* Header sobre el hero */}
                <header className="relative z-10 h-20 flex items-center">
                    <div className="container mx-auto px-6 flex justify-between items-center h-full">
                        <div className="mt-3">
                            <Logo size="md" light />
                        </div>
                        <div className="flex items-center gap-6">
                        <a href="#contacto" className="hidden sm:inline text-white/80 hover:text-white font-medium transition-colors">
                            Contacto
                        </a>
                        <Link
                            to="/login"
                            className="px-5 py-2 text-white font-semibold hover:underline"
                        >
                            Iniciar sesión
                        </Link>
                        <Link
                            to="/register"
                            className="px-5 py-2 bg-white hover:bg-slate-100 text-blue-900 font-semibold rounded-lg transition-colors shadow"
                        >
                            Registrarse
                        </Link>
                    </div>
                    </div>
                </header>

                {/* Contenido hero */}
                <div className="relative z-10 flex-1 flex items-center">
                    <div className="container mx-auto px-6">
                        <section className="py-20 max-w-2xl">
                            {/* Bandera ecuatoriana — franja decorativa */}
                            <div className="flex gap-0 mb-6 w-16 rounded overflow-hidden h-1.5">
                                <div className="flex-1 bg-yellow-400" />
                                <div className="flex-[0.5] bg-blue-700" />
                                <div className="flex-[0.5] bg-red-600" />
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">
                                Reportes vehiculares{" "}
                                <span className="text-yellow-400">colaborativos</span>
                            </h1>
                            <p className="text-lg text-white/80 mb-10 max-w-xl leading-relaxed">
                                {theme.descripcion} Consulta fallas reportadas por otros usuarios y toma decisiones
                                informadas antes de comprar tu próximo vehículo.
                            </p>
                            <div className="flex gap-4 flex-wrap">
                                <Link
                                    to="/register"
                                    className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold rounded-lg transition-colors shadow-lg"
                                >
                                    Comenzar ahora
                                </Link>
                                <Link
                                    to="/login"
                                    className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    Ya tengo cuenta
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Flecha scroll down */}
                <div className="relative z-10 flex justify-center pb-8">
                    <a href="#caracteristicas" className="text-white/50 hover:text-white/80 transition-colors animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </a>
                </div>
            </div>

            <main className="container mx-auto px-6">

                {/* Características */}
                <section id="caracteristicas" className="py-16 grid md:grid-cols-3 gap-8">
                    <div className="bg-slate-50 rounded-xl p-6 text-center">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-blue-900 text-2xl font-bold">1</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Reporta fallas</h3>
                        <p className="text-slate-500 text-sm">
                            Registra problemas mecánicos con evidencia: fotos, documentos y enlaces de referencia.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 text-center">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-blue-900 text-2xl font-bold">2</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Verificación</h3>
                        <p className="text-slate-500 text-sm">
                            Cada reporte es revisado y verificado antes de publicarse, garantizando información confiable.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 text-center">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-blue-900 text-2xl font-bold">3</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Consulta tendencias</h3>
                        <p className="text-slate-500 text-sm">
                            Visualiza estadísticas y patrones de fallas por marca y modelo de vehículo.
                        </p>
                    </div>
                </section>

                {/* Más funciones del sistema */}
                <section className="pb-16">
                    <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">Y eso no es todo</h2>
                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        <div className="bg-slate-50 rounded-xl p-6 text-center">
                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Consulta reportes</h3>
                            <p className="text-slate-500 text-sm">
                                Explora el historial de fallas reportadas por otros conductores y filtra por marca,
                                modelo o tipo de falla antes de tomar una decisión.
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-6 text-center">
                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 21.03a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Ranking de confiabilidad</h3>
                            <p className="text-slate-500 text-sm">
                                Califica vehículos en aspectos como seguridad, consumo y mantenimiento, y descubre
                                cuáles son los mejor evaluados por la comunidad.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Estadísticas reales del sistema — banda de impacto */}
                {stats && (stats.totalReportes > 0 || stats.totalVehiculos > 0) && (
                    <section className="-mx-6 px-6 py-14 bg-blue-900">
                        <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center max-w-3xl mx-auto">
                            <div>
                                <p className="text-4xl sm:text-6xl font-black text-white">{stats.totalReportes}</p>
                                <div className="w-8 h-0.5 bg-yellow-400 mx-auto mt-2 mb-2 rounded" />
                                <p className="text-blue-200 text-xs sm:text-sm">Reportes verificados</p>
                            </div>
                            <div>
                                <p className="text-4xl sm:text-6xl font-black text-white">{stats.totalVehiculos}</p>
                                <div className="w-8 h-0.5 bg-yellow-400 mx-auto mt-2 mb-2 rounded" />
                                <p className="text-blue-200 text-xs sm:text-sm">Vehículos en el catálogo</p>
                            </div>
                            <div>
                                <p className="text-4xl sm:text-6xl font-black text-white">{stats.totalMarcas}</p>
                                <div className="w-8 h-0.5 bg-yellow-400 mx-auto mt-2 mb-2 rounded" />
                                <p className="text-blue-200 text-xs sm:text-sm">Marcas distintas</p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Top 3 mejor calificados — vista previa del ranking de Confiabilidad */}
                {topVehiculos.length > 0 && (
                    <section className="py-16">
                        <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">Los mejor calificados</h2>
                        <p className="text-slate-500 text-center mb-10">
                            Según las valoraciones reales de nuestra comunidad de conductores.
                        </p>
                        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {topVehiculos.map((item, i) => (
                                    <div key={item.vehiculo._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="relative w-full h-36 bg-slate-100">
                                            <FotoTarjetaTop vehiculo={item.vehiculo} />
                                            <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow ${
                                                i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : "bg-amber-700"
                                            }`}>
                                                {i + 1}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-center gap-1.5">
                                                <LogoMarca marca={item.vehiculo.marca} size={18} />
                                                <span className="text-sm font-semibold text-slate-800 truncate">
                                                    {item.vehiculo.marca} {item.vehiculo.modelo}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">{item.vehiculo.anio} · {item.vehiculo.tipo}</p>
                                            <div className="flex items-center gap-1 mt-2">
                                                <span className="text-amber-500">⭐</span>
                                                <span className="text-sm font-bold text-slate-700">{item.puntajeGeneral}</span>
                                                <span className="text-xs text-slate-400">· {item.totalValoraciones} valoración(es)</span>
                                            </div>
                                        </div>
                                    </div>
                            ))}
                        </div>
                        <p className="text-center mt-8">
                            <Link to="/register" className="text-blue-900 font-semibold hover:underline">
                                Regístrate para ver el ranking completo y dejar tus propias valoraciones →
                            </Link>
                        </p>
                    </section>
                )}

                {/* ¿Qué es AutoReporta EC? — texto + foto lateral */}
                <section className="py-16 grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-lg">
                    {/* Columna texto */}
                    <div className="bg-slate-50 p-10 flex flex-col justify-center gap-8">
                        <div>
                            <div className="flex gap-0 mb-4 w-10 rounded overflow-hidden h-1">
                                <div className="flex-1 bg-yellow-400" />
                                <div className="flex-[0.5] bg-blue-700" />
                                <div className="flex-[0.5] bg-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-3">¿Qué es AutoReporta EC?</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Es una plataforma colaborativa donde conductores ecuatorianos comparten experiencias
                                reales sobre fallas mecánicas de sus vehículos. En lugar de depender de opiniones
                                aisladas, aquí encuentras reportes verificados y estadísticas construidas a partir
                                de datos reales de la comunidad, organizados por marca, modelo y año.
                            </p>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-3">Objetivo del proyecto</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Este sistema nace como proyecto de tesis con un objetivo concreto: facilitar el
                                acceso a información confiable sobre la confiabilidad de los vehículos que circulan
                                en Ecuador, ayudando a reducir la incertidumbre al momento de comprar un vehículo
                                usado o nuevo.
                            </p>
                        </div>
                    </div>
                    {/* Columna foto */}
                    <div className="relative min-h-72 md:min-h-0 overflow-hidden">
                        <img
                            src={heroBg}
                            alt="Vehículo de referencia"
                            className="absolute inset-0 w-full h-full object-cover object-center"
                        />
                        {/* Overlay muy sutil solo para que no compita con el texto del lado izquierdo */}
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(248,250,252,0.15) 0%, rgba(0,0,0,0) 40%)" }} />
                    </div>
                </section>

                <section id="contacto" className="py-16 max-w-xl mx-auto scroll-mt-20">
                    <h2 className="text-3xl font-bold text-slate-800 text-center mb-3">Contáctanos</h2>
                    <p className="text-slate-500 text-center mb-6">
                        ¿Tienes dudas, quejas o sugerencias? Escríbenos y te responderemos lo antes posible.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 space-y-2">
                        <p className="text-sm font-semibold text-blue-800">💬 ¿En qué podemos ayudarte?</p>
                        <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                            <li>Dudas o preguntas sobre el funcionamiento de la plataforma.</li>
                            <li>Sugerencias para mejorar AutoReporta EC.</li>
                            <li>Reportar un <strong>enlace caído</strong> en un reporte existente.</li>
                            <li>Informar sobre un <strong>comentario ofensivo o inapropiado</strong> que hayas detectado.</li>
                            <li>Cualquier problema técnico que hayas experimentado.</li>
                        </ul>
                        <p className="text-xs text-blue-600 pt-1 border-t border-blue-200">
                            Te responderemos al correo que indiques a la brevedad posible.
                        </p>
                    </div>
                    <HomeContactoForm />
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-800 text-slate-300 py-6 mt-10">
                <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Logo size="sm" light />

                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 order-last sm:order-none">
                        <p className="text-xs text-slate-500">{theme.derechos}</p>
                        <a href="/terminos" target="_blank" rel="noreferrer"
                            className="text-xs text-slate-400 hover:text-slate-200 hover:underline transition-colors">
                            Términos y condiciones
                        </a>
                    </div>

                    {/* Redes sociales — apuntan a la página principal de cada red.
                        Cuando crees las cuentas reales, solo cambia el href de cada <a>
                        por la URL de tu perfil/página específica. */}
                    <div className="flex gap-2">
                        <a href="https://www.facebook.com" target="_blank" rel="noreferrer" title="Facebook"
                            className="w-8 h-8 bg-slate-700 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                                <path d="M22 12.06C22 6.5 17.5 2 12 2S2 6.5 2 12.06c0 5 3.66 9.13 8.44 9.88v-7H7.9v-2.88h2.54V9.83c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.77l-.44 2.88h-2.33v7c4.78-.75 8.44-4.88 8.44-9.88z" />
                            </svg>
                        </a>
                        <a href="https://www.instagram.com" target="_blank" rel="noreferrer" title="Instagram"
                            className="w-8 h-8 bg-slate-700 hover:bg-pink-600 rounded-full flex items-center justify-center transition-colors">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                                <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.02-3.58.07-4.85c.15-3.23 1.67-4.77 4.92-4.92 1.27-.05 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07c-4.35.2-6.78 2.62-6.98 6.98C0 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.4-11.84a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z" />
                            </svg>
                        </a>
                        <a href="https://www.x.com" target="_blank" rel="noreferrer" title="X (Twitter)"
                            className="w-8 h-8 bg-slate-700 hover:bg-black rounded-full flex items-center justify-center transition-colors">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                                <path d="M18.9 1.92h3.68l-8.04 9.19L24 22.08h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.92h7.59l5.24 6.93zM17.6 19.98h2.04L6.49 3.99H4.3z" />
                            </svg>
                        </a>
                        <a href="https://www.whatsapp.com" target="_blank" rel="noreferrer" title="WhatsApp"
                            className="w-8 h-8 bg-slate-700 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                                <path d="M17.5 14.38c-.25-.13-1.47-.72-1.7-.81-.23-.08-.4-.13-.56.13-.17.25-.65.81-.8.97-.14.17-.3.19-.55.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.38.11-.5.12-.13.27-.33.4-.5.13-.16.18-.28.27-.46.08-.18.04-.34-.03-.47-.08-.13-.6-1.45-.82-1.99-.22-.52-.45-.45-.62-.46h-.53c-.18 0-.46.07-.7.34-.25.27-.95.93-.95 2.26 0 1.34.97 2.63 1.1 2.81.14.18 1.9 2.91 4.62 3.96 2.71 1.06 2.71.7 3.2.66.5-.05 1.6-.66 1.83-1.29.23-.63.23-1.17.16-1.29-.06-.13-.24-.2-.5-.32zM12.04 2C6.55 2 2.1 6.45 2.1 11.94c0 1.94.55 3.75 1.5 5.29L2 22l4.93-1.55a9.85 9.85 0 0 0 5.11 1.4h.01c5.49 0 9.94-4.45 9.94-9.94S17.53 2 12.04 2z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Home