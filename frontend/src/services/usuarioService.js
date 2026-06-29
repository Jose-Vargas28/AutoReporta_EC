import axios from "axios"

const API = import.meta.env.VITE_BACKEND_URL

const authHeaders = () => {
    const storedUser = JSON.parse(localStorage.getItem("auth-token"))
    return {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedUser?.state?.token}`,
        },
    }
}

// ---- Listado y búsqueda ----
export const getUsuarios = (params = {}) => {
    const query = new URLSearchParams()
    if (params.pagina)      query.append("pagina",      params.pagina)
    if (params.busqueda)    query.append("busqueda",    params.busqueda)
    if (params.region)      query.append("region",      params.region)
    if (params.provincia)   query.append("provincia",   params.provincia)
    if (params.minReportes) query.append("minReportes", params.minReportes)
    if (params.maxReportes) query.append("maxReportes", params.maxReportes)
    return axios.get(`${API}/usuarios?${query}`, authHeaders())
}

export const getUsuariosEliminados = (params = {}) => {
    const query = new URLSearchParams()
    if (params.pagina)   query.append("pagina",   params.pagina)
    if (params.busqueda) query.append("busqueda", params.busqueda)
    return axios.get(`${API}/usuarios/eliminados?${query}`, authHeaders())
}

export const getReportesDeUsuario = (id, params = {}) => {
    const query = new URLSearchParams()
    if (params.pagina)   query.append("pagina",   params.pagina)
    if (params.busqueda) query.append("busqueda", params.busqueda)
    return axios.get(`${API}/usuarios/${id}/reportes?${query}`, authHeaders())
}

export const getValoracionesDeUsuario = (id, pagina = 1) =>
    axios.get(`${API}/usuarios/${id}/valoraciones?pagina=${pagina}`, authHeaders())

// ---- Acciones ----
export const banearUsuario     = (id) => axios.patch(`${API}/usuarios/${id}/banear`,         {}, authHeaders())
export const desbanearUsuario  = (id) => axios.patch(`${API}/usuarios/${id}/desbanear`,      {}, authHeaders())
export const eliminarUsuario   = (id) => axios.delete(`${API}/usuarios/${id}`,                   authHeaders())
export const restaurarUsuario  = (id) => axios.patch(`${API}/usuarios/${id}/restaurar`,      {}, authHeaders())
export const ascenderAAdmin    = (id) => axios.patch(`${API}/usuarios/${id}/ascender-admin`, {}, authHeaders())