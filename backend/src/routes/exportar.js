import { Router } from "express"
import {
    exportarReportesExcel,
    exportarBoletinPDF,
    exportarReportePDF,
    exportarMisReportesExcel
} from "../controllers/exportController.js"
import { verificarTokenJWT, soloAdmin } from "../middlewares/JWT.js"

const router = Router()

// Exportaciones solo admin
router.get("/exportar/reportes-excel", verificarTokenJWT, soloAdmin, exportarReportesExcel)
router.get("/exportar/boletin-pdf", verificarTokenJWT, soloAdmin, exportarBoletinPDF)
router.get("/exportar/reporte/:id/pdf", verificarTokenJWT, soloAdmin, exportarReportePDF)

// Exportación de mis reportes (usuario logueado)
router.get("/exportar/mis-reportes-excel", verificarTokenJWT, exportarMisReportesExcel)

export default router