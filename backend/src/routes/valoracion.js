import { Router } from "express"
import {
    crearOActualizarValoracion,
    obtenerValoracionesVehiculo,
    rankingConfiabilidad,
    eliminarValoracion,
    valoracionesDeUsuario,
    listarTodasValoraciones,
    eliminarValoracionAdmin,
    restaurarValoracionAdmin,
    misVehiculosValorados
} from "../controllers/valoracionController.js"
import { verificarTokenJWT, verificarTokenOpcional, soloAdmin } from "../middlewares/JWT.js"

const router = Router()

// Ranking general — público
router.get("/valoraciones/ranking", rankingConfiabilidad)

// Mis vehículos ya valorados — usuario logueado
router.get("/valoraciones/mis-vehiculos", verificarTokenJWT, misVehiculosValorados)

// Moderación — solo admin
router.get("/valoraciones/moderacion", verificarTokenJWT, soloAdmin, listarTodasValoraciones)
router.patch("/valoraciones/:id/moderar-eliminar", verificarTokenJWT, soloAdmin, eliminarValoracionAdmin)
router.patch("/valoraciones/:id/moderar-restaurar", verificarTokenJWT, soloAdmin, restaurarValoracionAdmin)

// Valoraciones de un usuario — solo admin
router.get("/usuarios/:id/valoraciones", verificarTokenJWT, soloAdmin, valoracionesDeUsuario)

// Valoraciones de un vehículo — público pero con info extra si está logueado
router.get("/vehiculos/:vehiculoId/valoraciones", verificarTokenOpcional, obtenerValoracionesVehiculo)

// Crear o actualizar valoración — requiere login
router.post("/vehiculos/:vehiculoId/valoraciones", verificarTokenJWT, crearOActualizarValoracion)

// Eliminar valoración propia
router.delete("/valoraciones/:id", verificarTokenJWT, eliminarValoracion)

export default router