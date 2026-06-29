import { Router } from "express"
import rateLimit from "express-rate-limit"
import {
    registro,
    confirmarEmail,
    login,
    loginGoogle,
    perfil,
    recuperarPassword,
    verificarTokenPassword,
    nuevaPassword,
    contacto
} from "../controllers/authController.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"

const router = Router()

// Rate limiter login: 10 intentos cada 15 minutos por IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: "Demasiados intentos de inicio de sesión desde esta dirección. Intenta nuevamente en 15 minutos." }
})

// Rate limiter registro: 5 cuentas cada hora por IP
const registroLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: "Has creado demasiadas cuentas desde esta dirección. Intenta nuevamente en una hora." }
})

// Rate limiter recuperación: 5 solicitudes cada hora por IP
const recuperacionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: "Demasiadas solicitudes de recuperación desde esta dirección. Intenta nuevamente en una hora." }
})

// Rate limiter contacto: 5 mensajes cada hora por IP
const contactoLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: "Has enviado demasiados mensajes. Intenta nuevamente en una hora." }
})

// Públicas
router.post("/registro", registroLimiter, registro)
router.get("/confirmar/:token", confirmarEmail)
router.post("/login", loginLimiter, login)
router.post("/login-google", loginGoogle)
router.post("/recuperarpassword", recuperacionLimiter, recuperarPassword)
router.get("/recuperarpassword/:token", verificarTokenPassword)
router.post("/nuevopassword/:token", nuevaPassword)
router.post("/contacto", contactoLimiter, contacto)

// Protegida
router.get("/perfil", verificarTokenJWT, perfil)

export default router