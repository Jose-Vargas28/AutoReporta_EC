import axios from "axios"

const API = import.meta.env.VITE_BACKEND_URL

// Descarga un archivo protegido (requiere token) y dispara la descarga
// en el navegador, sin necesidad de abrir una pestaña nueva.
const descargarBlob = async (url, token, nombreArchivo) => {
    const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
    })
    const blobUrl = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement("a")
    link.href = blobUrl
    link.setAttribute("download", nombreArchivo)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
}

// Exporta los reportes validados a Excel. Acepta los mismos filtros
// (busqueda, gravedad) que se estén usando en "Ver reportes".
export const exportarReportesExcel = (token, filtros = {}) => {
    const params = {}
    if (filtros.busqueda) params.busqueda = filtros.busqueda
    if (filtros.gravedad) params.gravedad = filtros.gravedad
    const query = new URLSearchParams(params).toString()
    return descargarBlob(
        `${API}/exportar/reportes-excel${query ? `?${query}` : ""}`,
        token,
        `reportes-autoreporta-ec-${Date.now()}.xlsx`
    )
}

// Descarga el boletín estadístico general en PDF.
export const exportarBoletinPDF = (token) =>
    descargarBlob(`${API}/exportar/boletin-pdf`, token, `boletin-autoreporta-ec-${Date.now()}.pdf`)

// Descarga el detalle de un reporte individual en PDF.
export const exportarReportePDF = (token, id) =>
    descargarBlob(`${API}/exportar/reporte/${id}/pdf`, token, `reporte-${id}.pdf`)

// Exporta los propios reportes del usuario a Excel.
export const exportarMisReportesExcel = (token) =>
    descargarBlob(`${API}/exportar/mis-reportes-excel`, token, `mis-reportes-${Date.now()}.xlsx`)
// Ficha de vehículo estilo Consumer Reports (usuario logueado)
export const exportarFichaVehiculo = (token, vehiculoId) =>
    descargarBlob(`${API}/exportar/ficha-vehiculo/${vehiculoId}/pdf`, token, `ficha-vehiculo-${vehiculoId}.pdf`)