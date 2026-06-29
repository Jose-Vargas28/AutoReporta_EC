import { Router } from "express"
import {
    listarUsuarios,
    banearUsuario,
    desbanearUsuario,
    eliminarUsuario,
    obtenerPerfil,
    actualizarPerfil,
    cambiarPassword,
    subirFotoPerfil,
    eliminarFotoPerfil,
    listarUsuariosEliminados,
    restaurarUsuario,
    reportesDeUsuario,
    ascenderAAdmin
} from "../controllers/usuarioController.js"
import { verificarTokenJWT, soloAdmin } from "../middlewares/JWT.js"

const router = Router()

// Perfil (usuario logueado)
router.get("/perfil", verificarTokenJWT, obtenerPerfil)
router.put("/perfil", verificarTokenJWT, actualizarPerfil)
router.put("/perfil/password", verificarTokenJWT, cambiarPassword)
router.post("/perfil/foto", verificarTokenJWT, subirFotoPerfil)
router.delete("/perfil/foto", verificarTokenJWT, eliminarFotoPerfil)

// Solo admin
router.get("/usuarios", verificarTokenJWT, soloAdmin, listarUsuarios)
router.patch("/usuarios/:id/banear", verificarTokenJWT, soloAdmin, banearUsuario)
router.patch("/usuarios/:id/desbanear", verificarTokenJWT, soloAdmin, desbanearUsuario)
router.delete("/usuarios/:id", verificarTokenJWT, soloAdmin, eliminarUsuario)
router.get("/usuarios/eliminados", verificarTokenJWT, soloAdmin, listarUsuariosEliminados)
router.patch("/usuarios/:id/restaurar", verificarTokenJWT, soloAdmin, restaurarUsuario)
router.get("/usuarios/:id/reportes", verificarTokenJWT, soloAdmin, reportesDeUsuario)
router.patch("/usuarios/:id/ascender-admin", verificarTokenJWT, soloAdmin, ascenderAAdmin)

export default router