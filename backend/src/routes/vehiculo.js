import { Router } from "express"
import {
    crearVehiculo, listarVehiculos, listarVehiculosSelector, eliminarVehiculo, actualizarVehiculo,
    subirFotoVehiculo, eliminarFotoVehiculo, marcarFotoPrincipal,
    toggleFotoAuto, guardarFotoPexels, reordenarFotos,
    agregarEnlace, eliminarEnlace
} from "../controllers/vehiculoController.js"
import { verificarTokenJWT, soloAdmin } from "../middlewares/JWT.js"

const router = Router()

router.get("/vehiculos/selector", verificarTokenJWT, listarVehiculosSelector) // liviano para selectores
router.get("/vehiculos", listarVehiculos)                                      // público con filtros
router.post("/vehiculos", verificarTokenJWT, crearVehiculo)                            // usuario logueado
router.put("/vehiculos/:id", verificarTokenJWT, soloAdmin, actualizarVehiculo)         // solo admin
router.delete("/vehiculos/:id", verificarTokenJWT, soloAdmin, eliminarVehiculo)        // solo admin

// Fotos (solo admin)
router.post("/vehiculos/:id/fotos", verificarTokenJWT, soloAdmin, subirFotoVehiculo)
router.post("/vehiculos/:id/fotos/pexels", verificarTokenJWT, soloAdmin, guardarFotoPexels)
router.patch("/vehiculos/:id/fotos/reordenar", verificarTokenJWT, soloAdmin, reordenarFotos)
router.delete("/vehiculos/:id/fotos/:fotoId", verificarTokenJWT, soloAdmin, eliminarFotoVehiculo)
router.patch("/vehiculos/:id/fotos/:fotoId/principal", verificarTokenJWT, soloAdmin, marcarFotoPrincipal)
router.patch("/vehiculos/:id/foto-auto", verificarTokenJWT, soloAdmin, toggleFotoAuto)
router.post("/vehiculos/:id/enlaces", verificarTokenJWT, agregarEnlace)
router.delete("/vehiculos/:id/enlaces/:enlaceId", verificarTokenJWT, eliminarEnlace)

export default router