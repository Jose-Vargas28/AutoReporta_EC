import { Router } from "express"
import {
    exportarReportesExcel,
    exportarBoletinPDF,
    exportarReportePDF,
    exportarMisReportesExcel,
    exportarFichaVehiculo
} from "../controllers/exportController.js"
import { verificarTokenJWT, soloAdmin } from "../middlewares/JWT.js"

const router = Router()

// Exportaciones solo admin
router.get("/exportar/reportes-excel", verificarTokenJWT, soloAdmin, exportarReportesExcel)
router.get("/exportar/boletin-pdf", verificarTokenJWT, soloAdmin, exportarBoletinPDF)

// PDF de reporte individual — admin Y usuario dueño del reporte
router.get("/exportar/reporte/:id/pdf", verificarTokenJWT, exportarReportePDF)

// Exportación de mis reportes (usuario logueado)
router.get("/exportar/mis-reportes-excel", verificarTokenJWT, exportarMisReportesExcel)

// Ficha de vehículo estilo Consumer Reports (cualquier usuario logueado)
router.get("/exportar/ficha-vehiculo/:id/pdf", verificarTokenJWT, exportarFichaVehiculo)

export default router