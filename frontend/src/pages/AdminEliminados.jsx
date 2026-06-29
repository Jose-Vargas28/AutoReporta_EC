import { useEffect, useState, useCallback } from "react"
import { ToastContainer } from "react-toastify"
import axios from "axios"
import storeAuth from "../context/storeAuth"
import Paginacion from "../components/ui/Paginacion"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import useFetch from "../hooks/useFetch"

const AdminEliminados = () => {
    const { token } = storeAuth()
    const { fetchDataBackend } = useFetch()

    const [reportes, setReportes] = useState([])
    const [busqueda, setBusqueda] = useState("")
    const [cargando, setCargando] = useState(true)
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [total, setTotal] = useState(0)
    const [modalRestaurar, setModalRestaurar] = useState(null)

    const cargar = useCallback(async (pag = 1, busq = "") => {
        setCargando(true)
        try {
            const params = new URLSearchParams({ pagina: pag })
            if (busq) params.append("busqueda", busq)
            const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/reportes/eliminados?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setReportes(res.data.reportes || [])
            setTotalPaginas(res.data.paginas || 1)
            setTotal(res.data.total || 0)
        } catch (error) { console.error(error); setReportes([]) }
        setCargando(false)
    }, [token])

    useEffect(() => { cargar() }, [])

    useEffect(() => {
        const timer = setTimeout(() => { setPagina(1); cargar(1, busqueda) }, 400)
        return () => clearTimeout(timer)
    }, [busqueda])

    const cambiarPagina = (p) => { setPagina(p); cargar(p, busqueda) }

    const handleRestaurar = async () => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/reportes/${modalRestaurar._id}/restaurar`
        const headers = { Authorization: `Bearer ${token}` }
        const res = await fetchDataBackend(url, undefined, "PATCH", headers)
        if (res) { setModalRestaurar(null); cargar(pagina, busqueda) }
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return "—"
        return new Date(fecha).toLocaleString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    }

    return (
        <div>
            <ToastContainer />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Papelera y auditoría</h1>
            <p className="text-slate-500 mb-6">{total} reporte(s) eliminados. Los datos se conservan y pueden restaurarse.</p>

            <div className="flex gap-3 mb-6">
                <input type="text" placeholder="Buscar por marca, modelo o falla..."
                    className="flex-1 rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                    value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                {busqueda && <button type="button" onClick={() => setBusqueda("")} className="px-3 py-2 text-sm text-slate-500 hover:underline">Limpiar</button>}
            </div>

            {cargando ? <p className="text-slate-400">Cargando...</p>
            : reportes.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500">No hay reportes eliminados.</div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                        <table className="w-full">
                            <thead className="bg-slate-800 text-slate-200">
                                <tr>
                                    <th className="p-3 text-center">Vehículo</th>
                                    <th className="p-3 text-center">Falla</th>
                                    <th className="p-3 text-center">Reportado por</th>
                                    <th className="p-3 text-center">Eliminado por</th>
                                    <th className="p-3 text-center">Fecha eliminación</th>
                                    <th className="p-3 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportes.map((r, i) => (
                                    <tr key={r._id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                        <td className="p-3 text-sm">
                                            <div className="font-semibold text-slate-700">{r.vehiculo?.marca} {r.vehiculo?.modelo}</div>
                                            <div className="text-slate-400 text-xs">{r.vehiculo?.anio}</div>
                                        </td>
                                        <td className="p-3 text-sm text-center">{r.falla?.nombre}</td>
                                        <td className="p-3 text-sm text-center">
                                            <div className="font-semibold text-slate-700">{r.usuario?.nombre} {r.usuario?.apellido}</div>
                                            <div className="text-slate-400 text-xs">{r.usuario?.email}</div>
                                        </td>
                                        <td className="p-3 text-sm text-center">
                                            {r.eliminadoPor
                                                ? <><div className="font-semibold text-slate-700">{r.eliminadoPor.nombre} {r.eliminadoPor.apellido}</div>
                                                    <div className="text-slate-400 text-xs">{r.eliminadoPor.email}</div></>
                                                : <span className="text-slate-400 italic text-xs">Propio usuario</span>
                                            }
                                        </td>
                                        <td className="p-3 text-sm text-slate-500 text-center">{formatearFecha(r.eliminadoEn)}</td>
                                        <td className="p-3 text-center">
                                            <button type="button" onClick={() => setModalRestaurar(r)}
                                                className="bg-blue-900 hover:bg-blue-800 text-white text-sm px-3 py-1 rounded-lg transition-colors">
                                                Restaurar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
                </>
            )}

            {modalRestaurar && (
                <ModalConfirmar
                    titulo="¿Restaurar reporte?"
                    descripcion={`¿Restaurar el reporte del ${modalRestaurar.vehiculo?.marca} ${modalRestaurar.vehiculo?.modelo}?`}
                    textoConfirmar="Sí, restaurar"
                    colorBoton="bg-blue-900 hover:bg-blue-800"
                    onConfirmar={handleRestaurar}
                    onCancelar={() => setModalRestaurar(null)}
                />
            )}
        </div>
    )
}

export default AdminEliminados