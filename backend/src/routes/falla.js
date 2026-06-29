import { Router } from "express"
import { crearFalla, listarFallas, listarFallasSelector, eliminarFalla, actualizarFalla } from "../controllers/fallaController.js"
import { verificarTokenJWT, soloAdmin } from "../middlewares/JWT.js"

const router = Router()

router.get("/fallas/selector", verificarTokenJWT, listarFallasSelector) // liviano para selectores
router.get("/fallas", listarFallas)                                      // público con filtros
router.post("/fallas", verificarTokenJWT, crearFalla)
router.put("/fallas/:id", verificarTokenJWT, soloAdmin, actualizarFalla)
router.delete("/fallas/:id", verificarTokenJWT, soloAdmin, eliminarFalla)

export default router