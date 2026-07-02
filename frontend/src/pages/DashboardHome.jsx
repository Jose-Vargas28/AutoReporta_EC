import { Link } from "react-router"
import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import storeAuth from "../context/storeAuth"
import storeProfile from "../context/storeProfile"

const DashboardHome = () => {
    const { rol, token } = storeAuth()
    const { user } = storeProfile()
    const [pendientes, setPendientes] = useState(null)
    const toastShown = useRef(false)

    useEffect(() => {
        // Mostrar toast de bienvenida solo la primera vez que se monta
        if (!toastShown.current && user?.nombre) {
            toast.success(`¡Hola, ${user.nombre}! 👋`, { autoClose: 3000 })
            toastShown.current = true
        }
    }, [user])

    useEffect(() => {
        if (rol !== "admin") return
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/reportes/pendientes?pagina=1`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setPendientes(res.data.total || 0))
        .catch(() => setPendientes(null))
    }, [])

    const acciones = [
        { to: "/dashboard/reportar", titulo: "Reportar una falla", desc: "Registra un nuevo problema vehicular con evidencias", color: "bg-blue-900" },
        { to: "/dashboard/reportes", titulo: "Ver reportes", desc: "Consulta los reportes verificados de la comunidad", color: "bg-slate-700" },
        { to: "/dashboard/mis-reportes", titulo: "Mis reportes", desc: "Gestiona los reportes que has creado", color: "bg-slate-700" },
        { to: "/dashboard/vehiculos", titulo: "Vehículos", desc: "Explora el catálogo y consulta fichas técnicas", color: "bg-slate-700" },
        { to: "/dashboard/confiabilidad", titulo: "Confiabilidad", desc: "Ranking de vehículos según valoraciones de la comunidad", color: "bg-slate-700" },
        { to: "/dashboard/estadisticas", titulo: "Estadísticas",    desc: "Visualiza tendencias de fallas por marca y modelo", color: "bg-slate-700" },
        { to: "/dashboard/contacto",    titulo: "Contacto",         desc: "Comunícate con la administración para dudas, sugerencias o reportar contenido inapropiado", color: "bg-slate-700" },
    ]

    return (
        <div>
            <ToastContainer />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Bienvenido, {user?.nombre}
            </h1>
            <p className="text-slate-500 mb-8">
                Plataforma de reportes de fallas vehiculares del Ecuador
            </p>

            <div className="grid md:grid-cols-2 gap-6">
                {acciones.map((a) => (
                    <Link
                        key={a.to}
                        to={a.to}
                        className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-slate-100"
                    >
                        <h3 className="text-xl font-bold text-slate-700 mb-2">{a.titulo}</h3>
                        <p className="text-slate-500 text-sm">{a.desc}</p>
                    </Link>
                ))}
            </div>

            {rol === "admin" && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Panel de administración</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Link
                            to="/dashboard/admin/pendientes"
                            className="bg-amber-50 border border-amber-200 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow relative"
                        >
                            {pendientes > 0 && (
                                <span className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                    {pendientes}
                                </span>
                            )}
                            <h3 className="text-xl font-bold text-amber-800 mb-2">Validar reportes</h3>
                            <p className="text-amber-700 text-sm">
                                {pendientes === null ? "Revisa y verifica los reportes pendientes" :
                                 pendientes === 0 ? "No hay reportes pendientes por revisar" :
                                 `${pendientes} reporte${pendientes !== 1 ? "s" : ""} esperando revisión`}
                            </p>
                        </Link>
                        <Link
                            to="/dashboard/admin/usuarios"
                            className="bg-blue-50 border border-blue-200 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <h3 className="text-xl font-bold text-blue-900 mb-2">Gestión de usuarios</h3>
                            <p className="text-blue-800 text-sm">Administra las cuentas de usuarios de la plataforma</p>
                        </Link>
                        <Link
                            to="/dashboard/admin/catalogos"
                            className="bg-slate-50 border border-slate-200 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Catálogos</h3>
                            <p className="text-slate-600 text-sm">Gestiona los vehículos y tipos de falla registrados</p>
                        </Link>
                        <Link
                            to="/dashboard/admin/valoraciones"
                            className="bg-purple-50 border border-purple-200 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <h3 className="text-xl font-bold text-purple-800 mb-2">Moderar valoraciones</h3>
                            <p className="text-purple-700 text-sm">Revisa comentarios y elimina contenido inapropiado</p>
                        </Link>
                        <Link
                            to="/dashboard/admin/eliminados"
                            className="bg-red-50 border border-red-200 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <h3 className="text-xl font-bold text-red-800 mb-2">Papelera / Auditoría</h3>
                            <p className="text-red-700 text-sm">Consulta y restaura reportes eliminados</p>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DashboardHome