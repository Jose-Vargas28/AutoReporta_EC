import User from "../models/User.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import { sendMailToConfirm, sendMailToRecovery, sendMailContacto } from "../config/nodemailer.js"

// REGISTRO
export const registro = async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, region, provincia } = req.body

        if (!nombre || !apellido || !email || !password) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" })
        }

        const soloLetras = /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]+$/
        if (!soloLetras.test(nombre) || !soloLetras.test(apellido)) {
            return res.status(400).json({ msg: "Nombre y apellido solo pueden contener letras" })
        }

        const passwordSegura = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
        if (!passwordSegura.test(password)) {
            return res.status(400).json({ msg: "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial" })
        }

        if (telefono && !/^09\d{8}$/.test(telefono)) {
            return res.status(400).json({ msg: "El teléfono debe tener el formato 09XXXXXXXX (10 dígitos)" })
        }

        const existe = await User.findOne({ email })
        if (existe) {
            return res.status(400).json({ msg: "El correo ya está registrado" })
        }

        const nuevoUser = new User({
            nombre, apellido, email, password,
            ...(telefono  && { telefono }),
            ...(region    && { region }),
            ...(provincia && { provincia }),
        })
        nuevoUser.password = await nuevoUser.encryptPassword(password)
        const token = nuevoUser.crearToken()

        await nuevoUser.save()
        await sendMailToConfirm(email, token)

        res.status(200).json({ msg: "Revisa tu correo para confirmar tu cuenta" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error en el servidor" })
    }
}

// CONFIRMAR EMAIL
export const confirmarEmail = async (req, res) => {
    try {
        const { token } = req.params

        const user = await User.findOne({ token })
        if (!user?.token) {
            return res.status(404).json({ msg: "La cuenta ya fue confirmada" })
        }
        if (user.tokenExpira && user.tokenExpira < new Date()) {
            return res.status(400).json({ msg: "El enlace de confirmación expiró. Contacta al administrador para reenviar el correo." })
        }

        user.token = null
        user.tokenExpira = null
        user.confirmEmail = true
        await user.save()

        res.status(200).json({ msg: "Cuenta confirmada, ya puedes iniciar sesión" })

    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" })
    }
}

// LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ msg: "Usuario no encontrado" })
        }

        if (!user.confirmEmail) {
            return res.status(401).json({ msg: "Debes confirmar tu cuenta antes de iniciar sesión" })
        }

        if (user.baneado) {
            return res.status(403).json({ msg: "Tu cuenta ha sido suspendida. Contacta al administrador." })
        }

        if (!user.password) {
            return res.status(400).json({ msg: "Esta cuenta se creó con Google. Inicia sesión con el botón 'Continuar con Google'." })
        }

        // Verificar bloqueo temporal por intentos fallidos (solo usuarios normales)
        if (user.rol !== "admin" && user.bloqueadoHasta && user.bloqueadoHasta > new Date()) {
            const minutosRestantes = Math.ceil((user.bloqueadoHasta - new Date()) / 60000)
            return res.status(429).json({
                msg: `Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta nuevamente en ${minutosRestantes} minuto${minutosRestantes !== 1 ? "s" : ""}.`
            })
        }

        const valido = await user.matchPassword(password)
        if (!valido) {
            // Solo aplicar conteo de intentos a usuarios normales
            if (user.rol !== "admin") {
                const intentos = (user.intentosFallidos || 0) + 1
                const MAX_INTENTOS = 5
                const BLOQUEO_MS = 15 * 60 * 1000

                if (intentos >= MAX_INTENTOS) {
                    await User.findByIdAndUpdate(user._id, {
                        intentosFallidos: intentos,
                        bloqueadoHasta: new Date(Date.now() + BLOQUEO_MS)
                    })
                    return res.status(429).json({
                        msg: `Has superado el límite de ${MAX_INTENTOS} intentos. Tu cuenta ha sido bloqueada 15 minutos por seguridad.`
                    })
                }

                await User.findByIdAndUpdate(user._id, { intentosFallidos: intentos })
                const restantes = MAX_INTENTOS - intentos
                return res.status(401).json({
                    msg: `Contraseña incorrecta. Te ${restantes === 1 ? "queda" : "quedan"} ${restantes} intento${restantes !== 1 ? "s" : ""} antes del bloqueo temporal.`
                })
            }

            return res.status(401).json({ msg: "Contraseña incorrecta" })
        }

        // Login exitoso — resetear contadores
        await User.findByIdAndUpdate(user._id, { intentosFallidos: 0, bloqueadoHasta: null })

        const token = crearTokenJWT(user._id, user.rol)

        res.status(200).json({
            token,
            rol: user.rol,
            _id: user._id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email
        })

    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" })
    }
}

// LOGIN CON GOOGLE
export const loginGoogle = async (req, res) => {
    try {
        const { credential } = req.body
        if (!credential) {
            return res.status(400).json({ msg: "No se recibió el token de Google" })
        }

        // Verificamos el token directamente contra Google (sin librerías adicionales).
        // Esto confirma que el token es legítimo y no fue fabricado por un tercero.
        const verificacion = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
        if (!verificacion.ok) {
            return res.status(401).json({ msg: "Token de Google inválido o expirado" })
        }
        const payload = await verificacion.json()

        // El token debe haber sido emitido específicamente para esta app
        if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
            return res.status(401).json({ msg: "Token de Google no corresponde a esta aplicación" })
        }
        if (payload.email_verified !== "true" && payload.email_verified !== true) {
            return res.status(401).json({ msg: "Tu cuenta de Google no tiene el correo verificado" })
        }

        let user = await User.findOne({ email: payload.email })

        if (user) {
            if (user.baneado) {
                return res.status(403).json({ msg: "Tu cuenta ha sido suspendida. Contacta al administrador." })
            }
            if (user.eliminado) {
                return res.status(403).json({ msg: "Esta cuenta fue eliminada. Contacta al administrador." })
            }
            // Si la cuenta ya existía (registrada con correo/contraseña), la vinculamos con Google
            // sin tocar su contraseña: el usuario conserva ambas formas de iniciar sesión.
            if (!user.googleId) {
                user.googleId = payload.sub
                user.confirmEmail = true
                await user.save()
            }
        } else {
            user = new User({
                nombre: payload.given_name || payload.name || "Usuario",
                apellido: payload.family_name || "",
                email: payload.email,
                proveedor: "google",
                googleId: payload.sub,
                confirmEmail: true // Google ya verificó este correo, no necesita confirmarlo de nuevo
            })
            await user.save()
        }

        const token = crearTokenJWT(user._id, user.rol)

        res.status(200).json({
            token,
            rol: user.rol,
            _id: user._id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al iniciar sesión con Google" })
    }
}

// PERFIL
export const perfil = (req, res) => {
    // Convertimos a objeto plano por seguridad (req.userBDD es un documento Mongoose)
    const userObj = req.userBDD.toObject ? req.userBDD.toObject() : req.userBDD
    const { password, token, confirmEmail, createdAt, updatedAt, __v, ...datos } = userObj
    res.status(200).json(datos)
}

// RECUPERAR CONTRASEÑA - Paso 1: enviar email
export const recuperarPassword = async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ msg: "El correo es obligatorio" })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ msg: "No existe una cuenta con ese correo" })
        }

        if (user.eliminado) {
            return res.status(404).json({ msg: "No existe una cuenta con ese correo" })
        }

        if (user.proveedor === "google" && !user.password) {
            return res.status(400).json({ msg: "Esta cuenta usa Google para iniciar sesión. Accede con el botón 'Continuar con Google' en la pantalla de login." })
        }

        const token = user.crearToken()
        await user.save()
        await sendMailToRecovery(email, token)

        res.status(200).json({ msg: "Revisa tu correo para restablecer tu contraseña" })

    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" })
    }
}

// RECUPERAR CONTRASEÑA - Paso 2: verificar token
export const verificarTokenPassword = async (req, res) => {
    try {
        const { token } = req.params

        const user = await User.findOne({ token })
        if (!user || user.token !== token) {
            return res.status(404).json({ msg: "Token inválido o expirado" })
        }
        if (user.tokenExpira && user.tokenExpira < new Date()) {
            return res.status(400).json({ msg: "El enlace expiró. Solicita un nuevo correo de recuperación." })
        }

        res.status(200).json({ msg: "Token válido, ya puedes crear tu nueva contraseña" })

    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" })
    }
}

// RECUPERAR CONTRASEÑA - Paso 3: nueva contraseña
export const nuevaPassword = async (req, res) => {
    try {
        const { token } = req.params
        const { password, confirmpassword } = req.body

        if (!password || !confirmpassword) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" })
        }

        if (password !== confirmpassword) {
            return res.status(400).json({ msg: "Las contraseñas no coinciden" })
        }

        const passwordSegura = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
        if (!passwordSegura.test(password)) {
            return res.status(400).json({ msg: "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial" })
        }

        const user = await User.findOne({ token })
        if (!user || user.token !== token) {
            return res.status(404).json({ msg: "Token inválido o expirado" })
        }
        if (user.tokenExpira && user.tokenExpira < new Date()) {
            return res.status(400).json({ msg: "El enlace expiró. Solicita un nuevo correo de recuperación." })
        }

        user.token = null
        user.tokenExpira = null
        user.password = await user.encryptPassword(password)
        await user.save()

        res.status(200).json({ msg: "Contraseña actualizada correctamente" })

    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" })
    }
}
// CONTACTO
export const contacto = async (req, res) => {
    try {
        const { nombre, correo, asunto, mensaje } = req.body
        if (!nombre || !correo || !asunto || !mensaje)
            return res.status(400).json({ msg: "Todos los campos son obligatorios" })
        if (mensaje.trim().length < 10)
            return res.status(400).json({ msg: "El mensaje debe tener al menos 10 caracteres" })
        await sendMailContacto({ nombre, correo, asunto, mensaje })
        res.status(200).json({ msg: "Mensaje enviado correctamente. Te responderemos pronto." })
    } catch (error) {
        res.status(500).json({ msg: "No se pudo enviar el mensaje. Intenta nuevamente." })
    }
}