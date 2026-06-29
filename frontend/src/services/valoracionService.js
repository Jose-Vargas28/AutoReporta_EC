import axios from "axios"

const API = import.meta.env.VITE_BACKEND_URL

const authHeaders = () => {
    const stored = JSON.parse(localStorage.getItem("auth-token"))
    return {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${stored?.state?.token}`
        }
    }
}

const authHeadersOpcional = () => {
    try {
        const stored = JSON.parse(localStorage.getItem("auth-token"))
        const token = stored?.state?.token
        if (!token) return {}
        return { headers: { Authorization: `Bearer ${token}` } }
    } catch { return {} }
}

export const getRanking = (params = {}) => {
    const query = new URLSearchParams()
    if (params.tipo) query.append("tipo", params.tipo)
    if (params.marca) query.append("marca", params.marca)
    if (params.minValoraciones) query.append("minValoraciones", params.minValoraciones)
    return axios.get(`${API}/valoraciones/ranking?${query}`)
}

export const getValoracionesVehiculo = (vehiculoId, pagina = 1) =>
    axios.get(`${API}/vehiculos/${vehiculoId}/valoraciones?pagina=${pagina}`, authHeadersOpcional())

export const getMisVehiculosValorados = () =>
    axios.get(`${API}/valoraciones/mis-vehiculos`, authHeaders())

export const crearValoracion = (vehiculoId, data) =>
    axios.post(`${API}/vehiculos/${vehiculoId}/valoraciones`, data, authHeaders())

export const eliminarValoracion = (id) =>
    axios.delete(`${API}/valoraciones/${id}`, authHeaders())

// ---- Moderación (admin) ----
export const getValoracionesModeracion = (params = {}) => {
    const query = new URLSearchParams()
    if (params.pagina) query.append("pagina", params.pagina)
    if (params.busqueda) query.append("busqueda", params.busqueda)
    if (params.soloConComentario) query.append("soloConComentario", "true")
    if (params.estado) query.append("estado", params.estado)
    return axios.get(`${API}/valoraciones/moderacion?${query}`, authHeaders())
}

export const eliminarValoracionAdmin = (id) =>
    axios.patch(`${API}/valoraciones/${id}/moderar-eliminar`, {}, authHeaders())

export const restaurarValoracionAdmin = (id) =>
    axios.patch(`${API}/valoraciones/${id}/moderar-restaurar`, {}, authHeaders())