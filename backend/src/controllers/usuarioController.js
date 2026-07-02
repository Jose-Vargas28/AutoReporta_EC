import User from "../models/User.js"
import Reporte from "../models/Reporte.js"
import cloudinary from "../config/cloudinary.js"
import fs from "fs-extra"

// LISTAR USUARIOS con conteo de reportes y paginación
export const listarUsuarios = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const busqueda = req.query.busqueda || ""
        const region = req.query.region || ""
        const provincia = req.query.provincia || ""
        const minReportes = req.query.minReportes ? parseInt(req.query.minReportes) : null
        const maxReportes = req.query.maxReportes ? parseInt(req.query.maxReportes) : null

        const filtro = {
            rol: "usuario",
            eliminado: { $ne: true },
            ...(busqueda && {
                $or: [
                    { nombre: { $regex: busqueda, $options: "i" } },
                    { apellido: { $regex: busqueda, $options: "i" } },
                    { email: { $regex: busqueda, $options: "i" } }
                ]
            }),
            ...(region && { region }),
            ...(provincia && { provincia })
        }

        // Si hay filtro por reportes necesitamos calcular stats de todos antes de paginar.
        // Si no hay filtro por reportes, paginamos directo en MongoDB (más eficiente).
        if (minReportes !== null || maxReportes !== null) {
            // Traer todos los que matchean filtros de texto/región (sin paginar aún)
            const todosUsuarios = await User.find(filtro)
                .select("-password -token -confirmEmail -__v")
                .sort({ createdAt: -1 })

            // Calcular stats de reportes para cada uno
            const conStats = await Promise.all(
                todosUsuarios.map(async (u) => {
                    const obj = u.toObject()
                    obj.totalReportes = await Reporte.countDocuments({ usuario: u._id })
                    obj.reportesActivos = await Reporte.countDocuments({ usuario: u._id, activo: true })
                    obj.reportesVerificados = await Reporte.countDocuments({ usuario: u._id, activo: true, validado: true })
                    return obj
                })
            )

            // Ahora sí filtrar por cantidad de reportes
            let filtrados = conStats
            if (minReportes !== null) filtrados = filtrados.filter(u => u.totalReportes >= minReportes)
            if (maxReportes !== null) filtrados = filtrados.filter(u => u.totalReportes <= maxReportes)

            // Paginar en memoria sobre el resultado ya filtrado
            const total = filtrados.length
            const skip = (pagina - 1) * limite
            const usuariosPagina = filtrados.slice(skip, skip + limite)

            return res.status(200).json({
                usuarios: usuariosPagina,
                total,
                paginas: Math.ceil(total / limite),
                paginaActual: pagina
            })
        }

        // Sin filtro por reportes: paginar directo en MongoDB
        const total = await User.countDocuments(filtro)
        const usuarios = await User.find(filtro)
            .select("-password -token -confirmEmail -__v")
            .sort({ createdAt: -1 })
            .skip((pagina - 1) * limite)
            .limit(limite)

        const usuariosConStats = await Promise.all(
            usuarios.map(async (u) => {
                const obj = u.toObject()
                obj.totalReportes = await Reporte.countDocuments({ usuario: u._id })
                obj.reportesActivos = await Reporte.countDocuments({ usuario: u._id, activo: true })
                obj.reportesVerificados = await Reporte.countDocuments({ usuario: u._id, activo: true, validado: true })
                return obj
            })
        )

        res.status(200).json({
            usuarios: usuariosConStats,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener usuarios" })
    }
}

// BANEAR USUARIO
export const banearUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id)
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })
        if (usuario.rol === "admin") return res.status(400).json({ msg: "No se puede suspender a un administrador" })
        if (usuario.baneado) return res.status(400).json({ msg: "El usuario ya está suspendido" })

        usuario.baneado = true
        usuario.baneadoEn = new Date()
        await usuario.save()

        res.status(200).json({ msg: `Usuario ${usuario.nombre} ${usuario.apellido} suspendido correctamente` })
    } catch (error) {
        res.status(500).json({ msg: "Error al suspender el usuario" })
    }
}

// DESBANEAR USUARIO
export const desbanearUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id)
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })
        if (!usuario.baneado) return res.status(400).json({ msg: "El usuario no está suspendido" })

        usuario.baneado = false
        usuario.baneadoEn = null
        await usuario.save()

        res.status(200).json({ msg: `Usuario ${usuario.nombre} ${usuario.apellido} reactivado correctamente` })
    } catch (error) {
        res.status(500).json({ msg: "Error al reactivar el usuario" })
    }
}

// DARSE DE BAJA (usuario logueado)
// El usuario elimina su propia cuenta. Sus reportes validados permanecen
// en la plataforma como información pública verificada.
// Si se registra de nuevo con el mismo correo, la cuenta se reactiva completa.
export const darmedeBaja = async (req, res) => {
    try {
        const usuario = await User.findById(req.userBDD._id)
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })
        if (usuario.rol === "admin") return res.status(400).json({ msg: "Un administrador no puede darse de baja desde el perfil." })

        usuario.eliminado = true
        usuario.eliminadoEn = new Date()
        // No se marca como baneado para permitir reactivación al registrarse de nuevo
        await usuario.save()

        res.status(200).json({ msg: "Tu cuenta ha sido eliminada. Tus reportes verificados permanecen en la plataforma." })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al procesar la baja" })
    }
}

// ELIMINAR USUARIO (borrado lógico)
export const eliminarUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id)
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })
        if (usuario.rol === "admin") return res.status(400).json({ msg: "No se puede eliminar a un administrador" })

        // Contar reportes activos del usuario
        const totalReportes = await Reporte.countDocuments({ usuario: usuario._id, activo: true })

        usuario.eliminado = true
        usuario.eliminadoEn = new Date()
        // También baneamos para que no pueda entrar si aún tiene token activo
        usuario.baneado = true
        await usuario.save()

        res.status(200).json({
            msg: `Usuario ${usuario.nombre} ${usuario.apellido} eliminado correctamente`,
            reportesAsociados: totalReportes
        })
    } catch (error) {
        res.status(500).json({ msg: "Error al eliminar el usuario" })
    }
}

// PERFIL DEL USUARIO LOGUEADO
export const obtenerPerfil = async (req, res) => {
    try {
        const { password, token, confirmEmail, createdAt, updatedAt, __v, ...datos } =
            req.userBDD.toObject ? req.userBDD.toObject() : req.userBDD
        res.status(200).json(datos)
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener perfil" })
    }
}

// ACTUALIZAR PERFIL
export const actualizarPerfil = async (req, res) => {
    try {
        const { nombre, apellido, email, telefono, region, provincia } = req.body
        if (!nombre || !apellido || !email) {
            return res.status(400).json({ msg: "Nombre, apellido y correo son obligatorios" })
        }

        const soloLetras = /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]+$/
        if (!soloLetras.test(nombre) || !soloLetras.test(apellido)) {
            return res.status(400).json({ msg: "Nombre y apellido solo pueden contener letras" })
        }

        if (telefono && !/^\d{10}$/.test(telefono)) {
            return res.status(400).json({ msg: "El celular debe tener exactamente 10 dígitos" })
        }

        const emailExiste = await User.findOne({ email, _id: { $ne: req.userBDD._id } })
        if (emailExiste) {
            return res.status(400).json({ msg: "Ese correo ya está en uso por otro usuario" })
        }

        await User.findByIdAndUpdate(req.userBDD._id, {
            nombre, apellido, email,
            telefono: telefono || null,
            region: region || null,
            provincia: provincia || null
        }, { new: true })

        res.status(200).json({ msg: "Perfil actualizado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al actualizar perfil" })
    }
}

// CAMBIAR CONTRASEÑA
export const cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNuevo, confirmarPassword } = req.body

        if (!passwordActual || !passwordNuevo || !confirmarPassword) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" })
        }
        if (passwordNuevo !== confirmarPassword) {
            return res.status(400).json({ msg: "Las contraseñas nuevas no coinciden" })
        }
        const passwordSegura = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
        if (!passwordSegura.test(passwordNuevo)) {
            return res.status(400).json({ msg: "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial" })
        }

        const usuario = await User.findById(req.userBDD._id)
        const valido = await usuario.matchPassword(passwordActual)
        if (!valido) {
            return res.status(400).json({ msg: "La contraseña actual es incorrecta" })
        }

        usuario.password = await usuario.encryptPassword(passwordNuevo)
        await usuario.save()

        res.status(200).json({ msg: "Contraseña actualizada correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al cambiar contraseña" })
    }
}

// LISTAR USUARIOS ELIMINADOS (admin)
export const listarUsuariosEliminados = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""

        const filtro = {
            rol: "usuario",
            eliminado: true,
            ...(busqueda && {
                $or: [
                    { nombre: { $regex: busqueda, $options: "i" } },
                    { apellido: { $regex: busqueda, $options: "i" } },
                    { email: { $regex: busqueda, $options: "i" } }
                ]
            })
        }

        const total = await User.countDocuments(filtro)
        const usuarios = await User.find(filtro)
            .select("-password -token -confirmEmail -__v")
            .sort({ eliminadoEn: -1 })
            .skip(skip)
            .limit(limite)

        res.status(200).json({
            usuarios,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener usuarios eliminados" })
    }
}

// REPORTES DE UN USUARIO (admin)
export const reportesDeUsuario = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""

        let filtro = { usuario: req.params.id }

        if (busqueda) {
            const Vehiculo = (await import("../models/Vehiculo.js")).default
            const Falla = (await import("../models/Falla.js")).default
            const regex = { $regex: busqueda, $options: "i" }
            const vehiculosMatch = await Vehiculo.find({ $or: [{ marca: regex }, { modelo: regex }] }).select("_id")
            const fallasMatch = await Falla.find({ nombre: regex }).select("_id")
            filtro.$or = [
                { vehiculo: { $in: vehiculosMatch.map(v => v._id) } },
                { falla: { $in: fallasMatch.map(f => f._id) } }
            ]
        }

        const total = await Reporte.countDocuments(filtro)
        const reportes = await Reporte.find(filtro)
            .populate("vehiculo", "marca modelo anio")
            .populate("falla", "nombre")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limite)

        res.status(200).json({
            reportes,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener reportes del usuario" })
    }
}

// ASCENDER USUARIO A ADMIN
export const ascenderAAdmin = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id)
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })
        if (usuario.rol === "admin") return res.status(400).json({ msg: "El usuario ya es administrador" })
        if (usuario.eliminado) return res.status(400).json({ msg: "No se puede ascender un usuario eliminado" })

        usuario.rol = "admin"
        await usuario.save()

        res.status(200).json({ msg: `${usuario.nombre} ${usuario.apellido} ahora es administrador` })
    } catch (error) {
        res.status(500).json({ msg: "Error al ascender usuario" })
    }
}

// RESTAURAR USUARIO ELIMINADO (admin)
export const restaurarUsuario = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id)
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })
        if (!usuario.eliminado) return res.status(400).json({ msg: "El usuario no está eliminado" })

        usuario.eliminado = false
        usuario.eliminadoEn = null
        usuario.baneado = false
        usuario.baneadoEn = null
        await usuario.save()

        res.status(200).json({ msg: `Usuario ${usuario.nombre} ${usuario.apellido} restaurado correctamente` })
    } catch (error) {
        res.status(500).json({ msg: "Error al restaurar el usuario" })
    }
}

// SUBIR/REEMPLAZAR FOTO DE PERFIL (usuario logueado, sobre sí mismo)
const MAX_TAMANO_FOTO_PERFIL = 5 * 1024 * 1024 // 5MB

export const subirFotoPerfil = async (req, res) => {
    try {
        if (!req.files?.foto) {
            return res.status(400).json({ msg: "No se envió ninguna imagen" })
        }

        const archivo = req.files.foto

        if (!archivo.mimetype?.startsWith("image/")) {
            await fs.unlink(archivo.tempFilePath)
            return res.status(400).json({ msg: "El archivo debe ser una imagen" })
        }
        if (archivo.size > MAX_TAMANO_FOTO_PERFIL) {
            await fs.unlink(archivo.tempFilePath)
            return res.status(400).json({ msg: "La imagen no puede pesar más de 5MB" })
        }

        const usuario = await User.findById(req.userBDD._id)
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })

        // El recorte ya se hizo en el navegador (el usuario encuadra su foto antes de subirla);
        // esta transformación es una red de seguridad por si llega una imagen sin recortar.
        const resultado = await cloudinary.uploader.upload(archivo.tempFilePath, {
            folder: "autoreporta/usuarios",
            transformation: [{ width: 400, height: 400, crop: "fill", quality: "auto" }]
        })
        await fs.unlink(archivo.tempFilePath)

        // Si ya tenía una foto, se elimina la anterior de Cloudinary para no dejar basura acumulada
        if (usuario.foto?.publicId) {
            await cloudinary.uploader.destroy(usuario.foto.publicId)
        }

        // findByIdAndUpdate en vez de usuario.save(): así solo se actualiza el campo
        // foto sin revalidar el documento completo. Algunas cuentas son anteriores a
        // que 'apellido' se volviera obligatorio, y .save() las rechazaba por eso
        // aunque no tuviera nada que ver con la foto (mismo problema que ya resolvimos
        // antes con el campo 'activo' de las valoraciones).
        const actualizado = await User.findByIdAndUpdate(
            req.userBDD._id,
            { foto: { url: resultado.secure_url, publicId: resultado.public_id } },
            { new: true }
        )

        res.status(200).json({ msg: "Foto de perfil actualizada", foto: actualizado.foto })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al subir la foto de perfil" })
    }
}

// ELIMINAR FOTO DE PERFIL (usuario logueado, sobre sí mismo)
export const eliminarFotoPerfil = async (req, res) => {
    try {
        const usuario = await User.findById(req.userBDD._id)
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })

        if (!usuario.foto?.publicId) {
            return res.status(400).json({ msg: "No tienes una foto de perfil para eliminar" })
        }

        await cloudinary.uploader.destroy(usuario.foto.publicId)
        await User.findByIdAndUpdate(req.userBDD._id, { foto: { url: null, publicId: null } })

        res.status(200).json({ msg: "Foto de perfil eliminada" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al eliminar la foto de perfil" })
    }
}