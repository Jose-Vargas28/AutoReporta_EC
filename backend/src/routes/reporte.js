import { Router } from "express"
import {
    crearReporte,
    obtenerReportes,
    obtenerMisReportes,
    obtenerReportesPendientes,
    detalleReporte,
    actualizarReporte,
    eliminarReporte,
    restaurarReporte,
    obtenerReportesEliminados,
    validarReporte,
    invalidarReporte,
    estadisticas,
    estadisticasHome,
    tendencias,
    devolverReporte
} from "../controllers/reporteController.js"
import { verificarTokenJWT, soloAdmin } from "../middlewares/JWT.js"

const router = Router()

// ---- Públicas ----
router.get("/reportes", obtenerReportes)
router.get("/reportes/estadisticas", estadisticas)
router.get("/reportes/tendencias", tendencias)
router.get("/estadisticas-home", estadisticasHome)

// ---- Solo admin (rutas específicas ANTES de /reportes/:id) ----
router.get("/reportes/pendientes", verificarTokenJWT, soloAdmin, obtenerReportesPendientes)
router.get("/reportes/eliminados", verificarTokenJWT, soloAdmin, obtenerReportesEliminados)

// ---- Protegidas (usuario logueado) ----
router.get("/mis-reportes", verificarTokenJWT, obtenerMisReportes)
router.post("/reportes", verificarTokenJWT, crearReporte)

// Detalle (pública, va después de las rutas específicas)
router.get("/reportes/:id", detalleReporte)

router.put("/reportes/:id", verificarTokenJWT, actualizarReporte)
router.delete("/reportes/:id", verificarTokenJWT, eliminarReporte)

// ---- Solo admin (acciones sobre un reporte) ----
router.patch("/reportes/:id/validar", verificarTokenJWT, soloAdmin, validarReporte)
router.patch("/reportes/:id/invalidar", verificarTokenJWT, soloAdmin, invalidarReporte)
router.patch("/reportes/:id/devolver", verificarTokenJWT, soloAdmin, devolverReporte)
router.patch("/reportes/:id/restaurar", verificarTokenJWT, soloAdmin, restaurarReporte)

export default router