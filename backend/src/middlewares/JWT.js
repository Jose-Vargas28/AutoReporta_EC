import jwt from "jsonwebtoken"
import User from "../models/User.js"

const crearTokenJWT = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "1d" })
}

const verificarTokenJWT = async (req, res, next) => {
    const { authorization } = req.headers

    if (!authorization) {
        return res.status(401).json({ msg: "Acceso denegado: token no proporcionado" })
    }

    try {
        const token = authorization.split(" ")[1]
        const { id, rol } = jwt.verify(token, process.env.JWT_SECRET)

        const usuario = await User.findById(id).select("-password")
        if (!usuario) return res.status(401).json({ msg: "Token inválido o expirado" })
        if (usuario.eliminado) return res.status(403).json({ msg: "Esta cuenta fue eliminada.", eliminado: true })
        if (usuario.baneado) return res.status(403).json({ msg: "Tu cuenta ha sido suspendida. Contacta al administrador.", baneado: true })

        req.userBDD = usuario
        req.userBDD.rol = rol
        next()

    } catch (error) {
        return res.status(401).json({ msg: "Token inválido o expirado" })
    }
}

// Solo permite acceso a administradores
const soloAdmin = (req, res, next) => {
    if (req.userBDD?.rol !== "admin") {
        return res.status(403).json({ msg: "Acceso denegado: solo administradores" })
    }
    next()
}

// Token opcional — si hay token lo verifica, si no hay continúa igual
const verificarTokenOpcional = async (req, res, next) => {
    const { authorization } = req.headers
    if (!authorization) { req.userBDD = null; return next() }
    try {
        const token = authorization.split(" ")[1]
        const { id, rol } = jwt.verify(token, process.env.JWT_SECRET)
        const usuario = await User.findById(id).select("-password")
        if (usuario && !usuario.baneado && !usuario.eliminado) {
            req.userBDD = usuario
            req.userBDD.rol = rol
        } else {
            req.userBDD = null
        }
    } catch {
        req.userBDD = null
    }
    next()
}

export { crearTokenJWT, verificarTokenJWT, soloAdmin, verificarTokenOpcional }