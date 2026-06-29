import { Router } from "express"
import {
    subirImagenes,
    subirDocumentos,
    agregarEnlace,
    eliminarImagen,
    eliminarDocumento,
    eliminarEnlace
} from "../controllers/evidenciaController.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"

const router = Router()

// Todas requieren estar logueado (dueño o admin, validado dentro del controlador)

// Subir
router.post("/reportes/:id/imagenes", verificarTokenJWT, subirImagenes)
router.post("/reportes/:id/documentos", verificarTokenJWT, subirDocumentos)
router.post("/reportes/:id/enlaces", verificarTokenJWT, agregarEnlace)

// Eliminar
router.delete("/reportes/:id/imagenes/:imagenId", verificarTokenJWT, eliminarImagen)
router.delete("/reportes/:id/documentos/:documentoId", verificarTokenJWT, eliminarDocumento)
router.delete("/reportes/:id/enlaces/:enlaceId", verificarTokenJWT, eliminarEnlace)

export default router
