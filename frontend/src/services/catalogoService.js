import axios from "axios"

// =============================================================
//  SERVICIO DE CATÁLOGOS (Vehículos y Fallas)
// =============================================================

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

const authHeadersMultipart = () => {
    const storedUser = JSON.parse(localStorage.getItem("auth-token"))
    return {
        headers: {
            Authorization: `Bearer ${storedUser?.state?.token}`,
        },
    }
}

// ---- Vehículos ----
export const getVehiculosSelector = () =>
    axios.get(`${API}/vehiculos/selector`, authHeaders())

export const getVehiculos = (pagina = 1, busqueda = "", tipo = "", marca = "", limite = 10, extras = {}) => {
    const params = new URLSearchParams({ pagina, limite })
    if (busqueda)            params.append("busqueda",    busqueda)
    if (tipo)                params.append("tipo",        tipo)
    if (marca)               params.append("marca",       marca)
    if (extras.transmision)  params.append("transmision", extras.transmision)
    if (extras.traccion)     params.append("traccion",    extras.traccion)
    if (extras.combustible)  params.append("combustible", extras.combustible)
    if (extras.turbo !== undefined && extras.turbo !== "") params.append("turbo", extras.turbo)
    return axios.get(`${API}/vehiculos?${params}`)
}
export const crearVehiculo = (data) => axios.post(`${API}/vehiculos`, data, authHeaders())
export const actualizarVehiculo = (id, data) => axios.put(`${API}/vehiculos/${id}`, data, authHeaders())
export const eliminarVehiculo = (id) => axios.delete(`${API}/vehiculos/${id}`, authHeaders())

// ---- Fotos de vehículos (solo admin) ----
export const subirFotoVehiculo = (id, formData) =>
    axios.post(`${API}/vehiculos/${id}/fotos`, formData, authHeadersMultipart())

export const guardarFotoPexelsVehiculo = (id, url) =>
    axios.post(`${API}/vehiculos/${id}/fotos/pexels`, { url }, authHeaders())

export const eliminarFotoVehiculo = (id, fotoId) =>
    axios.delete(`${API}/vehiculos/${id}/fotos/${fotoId}`, authHeaders())

export const marcarFotoPrincipal = (id, fotoId) =>
    axios.patch(`${API}/vehiculos/${id}/fotos/${fotoId}/principal`, {}, authHeaders())

export const reordenarFotosVehiculo = (id, orden) =>
    axios.patch(`${API}/vehiculos/${id}/fotos/reordenar`, { orden }, authHeaders())

export const agregarEnlaceVehiculo = (id, data) =>
    axios.post(`${API}/vehiculos/${id}/enlaces`, data, authHeaders())

export const eliminarEnlaceVehiculo = (id, enlaceId) =>
    axios.delete(`${API}/vehiculos/${id}/enlaces/${enlaceId}`, authHeaders())

export const toggleFotoAutoVehiculo = (id) =>
    axios.patch(`${API}/vehiculos/${id}/foto-auto`, {}, authHeaders())

// ---- Fallas ----
export const getFallasSelector = () =>
    axios.get(`${API}/fallas/selector`, authHeaders())

export const getFallas = (pagina = 1, busqueda = "", limite = 10) => {
    const params = new URLSearchParams({ pagina, limite })
    if (busqueda) params.append("busqueda", busqueda)
    return axios.get(`${API}/fallas?${params}`)
}
export const crearFalla = (data) => axios.post(`${API}/fallas`, data, authHeaders())
export const actualizarFalla = (id, data) => axios.put(`${API}/fallas/${id}`, data, authHeaders())
export const eliminarFalla = (id) => axios.delete(`${API}/fallas/${id}`, authHeaders())