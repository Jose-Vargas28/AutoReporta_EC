import axios from "axios"

// =============================================================
//  SERVICIO DE REPORTES
//  Centraliza las llamadas a los endpoints de reportes.
// =============================================================

const API = import.meta.env.VITE_BACKEND_URL

// Headers con token para rutas protegidas
const authHeaders = () => {
    const storedUser = JSON.parse(localStorage.getItem("auth-token"))
    return {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedUser?.state?.token}`,
        },
    }
}

// Headers para subida de archivos (multipart)
const fileHeaders = () => {
    const storedUser = JSON.parse(localStorage.getItem("auth-token"))
    return {
        headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${storedUser?.state?.token}`,
        },
    }
}

// ---- Públicas ----
export const getReportes = () => axios.get(`${API}/reportes`)
export const getEstadisticas = () => axios.get(`${API}/reportes/estadisticas`)
export const getEstadisticasHome = () => axios.get(`${API}/estadisticas-home`)
export const getTendencias = (params = {}) => {
    const query = new URLSearchParams()
    if (params.marca) query.append("marca", params.marca)
    if (params.modelo) query.append("modelo", params.modelo)
    return axios.get(`${API}/reportes/tendencias?${query}`)
}
export const getReporteDetalle = (id) => axios.get(`${API}/reportes/${id}`)

// ---- Usuario logueado ----
export const crearReporte = (data) => axios.post(`${API}/reportes`, data, authHeaders())
export const getMisReportes = () => axios.get(`${API}/mis-reportes`, authHeaders())
export const actualizarReporte = (id, data) => axios.put(`${API}/reportes/${id}`, data, authHeaders())
export const eliminarReporte = (id) => axios.delete(`${API}/reportes/${id}`, authHeaders())

// ---- Evidencias ----
export const subirImagenes = (id, formData) => axios.post(`${API}/reportes/${id}/imagenes`, formData, fileHeaders())
export const subirDocumentos = (id, formData) => axios.post(`${API}/reportes/${id}/documentos`, formData, fileHeaders())
export const agregarEnlace = (id, data) => axios.post(`${API}/reportes/${id}/enlaces`, data, authHeaders())
export const eliminarImagen = (id, imagenId) => axios.delete(`${API}/reportes/${id}/imagenes/${imagenId}`, authHeaders())
export const eliminarDocumento = (id, documentoId) => axios.delete(`${API}/reportes/${id}/documentos/${documentoId}`, authHeaders())
export const eliminarEnlace = (id, enlaceId) => axios.delete(`${API}/reportes/${id}/enlaces/${enlaceId}`, authHeaders())

// ---- Admin ----
export const getPendientes = () => axios.get(`${API}/reportes/pendientes`, authHeaders())
export const getEliminados = () => axios.get(`${API}/reportes/eliminados`, authHeaders())
export const validarReporte = (id) => axios.patch(`${API}/reportes/${id}/validar`, {}, authHeaders())
export const invalidarReporte = (id, motivo) => axios.patch(`${API}/reportes/${id}/invalidar`, { motivo }, authHeaders())
export const devolverReporte = (id, observacion) => axios.patch(`${API}/reportes/${id}/devolver`, { observacion }, authHeaders())
export const restaurarReporte = (id) => axios.patch(`${API}/reportes/${id}/restaurar`, {}, authHeaders())