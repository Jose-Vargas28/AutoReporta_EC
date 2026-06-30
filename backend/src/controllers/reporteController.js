import Reporte from "../models/Reporte.js"
import User from "../models/User.js"
import Vehiculo from "../models/Vehiculo.js"
import {
    sendMailReporteVerificado,
    sendMailReporteInvalidado,
    sendMailReporteEliminado,
    sendMailReporteDevuelto
} from "../config/nodemailer.js"

const LIMITE_HORAS = 48
const LIMITE_REPORTES_DIARIOS = 5

const dentroDeVentana = (reporte) => {
    const horas = (new Date() - new Date(reporte.createdAt)) / (1000 * 60 * 60)
    return horas <= LIMITE_HORAS
}

// Populate reutilizable para traer vehículo, falla y usuario
const popReporte = (query) =>
    query
        .populate("vehiculo", "marca modelo anio tipo combustible fotos")
        .populate("falla", "nombre descripcion")
        .populate("usuario", "nombre apellido email region provincia")
        .populate("validadoPor", "nombre apellido email")

// CREAR REPORTE
export const crearReporte = async (req, res) => {
    try {
        const { vehiculo, falla, descripcion, gravedad } = req.body

        if (!vehiculo || !falla) {
            return res.status(400).json({ msg: "Debes seleccionar un vehículo y una falla" })
        }

        // Límite diario (solo usuarios normales)
        if (req.userBDD.rol !== "admin") {
            const inicioDelDia = new Date(); inicioDelDia.setHours(0, 0, 0, 0)
            const finDelDia = new Date(); finDelDia.setHours(23, 59, 59, 999)
            const reportesHoy = await Reporte.countDocuments({
                usuario: req.userBDD._id,
                createdAt: { $gte: inicioDelDia, $lte: finDelDia }
            })
            if (reportesHoy >= LIMITE_REPORTES_DIARIOS) {
                return res.status(429).json({
                    msg: `Has alcanzado el límite de ${LIMITE_REPORTES_DIARIOS} reportes por día. Intenta nuevamente mañana.`
                })
            }
        }

        const reporte = new Reporte({
            vehiculo,
            falla,
            descripcion,
            gravedad,
            usuario: req.userBDD._id
        })

        await reporte.save()
        res.status(201).json({
            msg: "Reporte registrado. Quedará visible públicamente una vez sea verificado.",
            reporteId: reporte._id
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error en el servidor" })
    }
}

// REPORTES PÚBLICOS - activos y verificados, con paginación y filtros
export const obtenerReportes = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite
        const { busqueda, gravedad, vehiculo, marca, anio, orden } = req.query

        // Construir filtro dinámico
        let filtro = { activo: true, validado: true }
        if (gravedad) filtro.gravedad = gravedad

        // Filtro directo por ID de vehículo (viene desde CatalogoVehiculos)
        if (vehiculo) filtro.vehiculo = vehiculo

        // Filtro por marca y/o año del vehículo — resuelve IDs de vehículos que coincidan
        if (!vehiculo && (marca || anio)) {
            const Vehiculo = (await import("../models/Vehiculo.js")).default
            const filtroVeh = {}
            if (marca) filtroVeh.marca = marca
            if (anio) filtroVeh.anio = Number(anio)
            const vehiculosMatch = await Vehiculo.find(filtroVeh).select("_id")
            const idsVeh = vehiculosMatch.map(v => v._id)
            filtro.vehiculo = filtro.vehiculo ? filtro.vehiculo : { $in: idsVeh }
        }

        // Si hay búsqueda, filtrar por campos del populate
        if (busqueda && !vehiculo) {
            const Vehiculo = (await import("../models/Vehiculo.js")).default
            const Falla = (await import("../models/Falla.js")).default
            const regex = { $regex: busqueda, $options: "i" }

            const vehiculosMatch = await Vehiculo.find({
                $or: [{ marca: regex }, { modelo: regex }]
            }).select("_id")

            const fallasMatch = await Falla.find({ nombre: regex }).select("_id")

            filtro.$or = [
                { vehiculo: { $in: vehiculosMatch.map(v => v._id) } },
                { falla: { $in: fallasMatch.map(f => f._id) } }
            ]
        }

        // Orden dinámico — por defecto más reciente primero
        const ordenamiento = orden === "antiguo" ? { createdAt: 1 } : { createdAt: -1 }

        const total = await Reporte.countDocuments(filtro)
        const reportes = await popReporte(
            Reporte.find(filtro).sort(ordenamiento).skip(skip).limit(limite)
        )

        res.status(200).json({
            reportes,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener reportes" })
    }
}

// MIS REPORTES con paginación y búsqueda
export const obtenerMisReportes = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""

        let filtro = { usuario: req.userBDD._id, activo: true }

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
        const reportes = await popReporte(
            Reporte.find(filtro).sort({ createdAt: -1 }).skip(skip).limit(limite)
        )

        const conPermiso = reportes.map(r => {
            const obj = r.toObject()
            obj.puedeModificar = req.userBDD.rol === "admin" ? true : dentroDeVentana(r)
            // Estado: validado / devuelto (tiene observación sin corregir) / pendiente
            obj.estado = r.validado ? "validado" : r.observacion ? "devuelto" : "pendiente"
            return obj
        })

        res.status(200).json({
            reportes: conPermiso,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener tus reportes" })
    }
}

// REPORTES PENDIENTES (admin) con paginación y búsqueda
export const obtenerReportesPendientes = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""

        let filtro = { activo: true, validado: false }

        // Excluir reportes creados por el propio admin que consulta
        filtro.usuario = { $ne: req.userBDD._id }

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
        const reportes = await popReporte(
            Reporte.find(filtro).sort({ createdAt: 1 }).skip(skip).limit(limite)
        )

        res.status(200).json({
            reportes,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener reportes pendientes" })
    }
}

// DETALLE
export const detalleReporte = async (req, res) => {
    try {
        const reporte = await popReporte(Reporte.findById(req.params.id))
        if (!reporte || !reporte.activo) {
            return res.status(404).json({ msg: "Reporte no encontrado" })
        }
        res.status(200).json(reporte)
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener el reporte" })
    }
}

// ACTUALIZAR
export const actualizarReporte = async (req, res) => {
    try {
        const reporte = await Reporte.findById(req.params.id)
        if (!reporte || !reporte.activo) {
            return res.status(404).json({ msg: "Reporte no encontrado" })
        }
        const esDueno = reporte.usuario.toString() === req.userBDD._id.toString()
        const esAdmin = req.userBDD.rol === "admin"
        if (!esDueno && !esAdmin) {
            return res.status(403).json({ msg: "No tienes permiso para editar este reporte" })
        }
        if (esDueno && !esAdmin && !dentroDeVentana(reporte)) {
            return res.status(403).json({ msg: `Solo puedes editar dentro de las primeras ${LIMITE_HORAS} horas` })
        }

        const { descripcion, gravedad, vehiculo, falla } = req.body
        if (descripcion !== undefined) reporte.descripcion = descripcion
        if (gravedad !== undefined) reporte.gravedad = gravedad
        if (vehiculo !== undefined) reporte.vehiculo = vehiculo
        if (falla !== undefined) reporte.falla = falla

        reporte.observacion = null
        reporte.observadoPor = null
        reporte.observadoEn = null
        await reporte.save()
        res.status(200).json({ msg: "Reporte actualizado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al actualizar" })
    }
}

// ELIMINAR (borrado lógico)
export const eliminarReporte = async (req, res) => {
    try {
        const reporte = await Reporte.findById(req.params.id)
        if (!reporte || !reporte.activo) {
            return res.status(404).json({ msg: "Reporte no encontrado" })
        }
        const esDueno = reporte.usuario.toString() === req.userBDD._id.toString()
        const esAdmin = req.userBDD.rol === "admin"
        if (!esDueno && !esAdmin) {
            return res.status(403).json({ msg: "No tienes permiso para eliminar este reporte" })
        }
        if (esDueno && !esAdmin && !dentroDeVentana(reporte)) {
            return res.status(403).json({ msg: `Solo puedes eliminar dentro de las primeras ${LIMITE_HORAS} horas` })
        }
        const reportePoblado = await popReporte(Reporte.findById(req.params.id))

        reporte.activo = false
        reporte.eliminadoEn = new Date()
        reporte.eliminadoPor = req.userBDD._id
        await reporte.save()

        if (esAdmin && !esDueno) {
            const motivo = req.body?.motivo || "El reporte no cumple con las normas de la plataforma."
            const usuario = await User.findById(reporte.usuario)
            if (usuario?.email) {
                const vehiculo = reportePoblado?.vehiculo
                    ? `${reportePoblado.vehiculo.marca} ${reportePoblado.vehiculo.modelo} ${reportePoblado.vehiculo.anio}`
                    : "Vehículo"
                const falla = reportePoblado?.falla?.nombre || "Falla reportada"
                sendMailReporteEliminado(usuario.email, usuario.nombre, vehiculo, falla, motivo)
            }
        }

        res.status(200).json({ msg: "Reporte eliminado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al eliminar" })
    }
}

// RESTAURAR (admin)
export const restaurarReporte = async (req, res) => {
    try {
        const reporte = await Reporte.findById(req.params.id)
        if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" })
        if (reporte.activo) return res.status(400).json({ msg: "El reporte no está eliminado" })
        reporte.activo = true
        reporte.eliminadoEn = null
        reporte.eliminadoPor = null
        await reporte.save()
        res.status(200).json({ msg: "Reporte restaurado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al restaurar" })
    }
}

// ELIMINADOS (admin) con paginación y búsqueda
export const obtenerReportesEliminados = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""

        let filtro = { activo: false }

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
        const reportes = await popReporte(
            Reporte.find(filtro).populate("eliminadoPor", "nombre apellido email").sort({ eliminadoEn: -1 }).skip(skip).limit(limite)
        )

        res.status(200).json({
            reportes,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener reportes eliminados" })
    }
}

// VALIDAR (admin)
export const validarReporte = async (req, res) => {
    try {
        const reporte = await Reporte.findOne({ _id: req.params.id, activo: true })
        if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" })
        reporte.validado = true
        reporte.validadoEn = new Date()
        reporte.validadoPor = req.userBDD._id
        reporte.observacion = null
        reporte.observadoPor = null
        reporte.observadoEn = null
        await reporte.save()

        const usuario = await User.findById(reporte.usuario)
        if (usuario?.email) {
            const vehiculo = reporte.vehiculo
                ? `${reporte.vehiculo.marca} ${reporte.vehiculo.modelo} ${reporte.vehiculo.anio}`
                : "Vehículo"
            const falla = reporte.falla?.nombre || "Falla reportada"
            sendMailReporteVerificado(usuario.email, usuario.nombre, vehiculo, falla, reporte._id)
        }

        res.status(200).json({ msg: "Reporte validado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al validar" })
    }
}

// INVALIDAR (admin)
export const invalidarReporte = async (req, res) => {
    try {
        const { motivo } = req.body

        const reporte = await popReporte(Reporte.findOne({ _id: req.params.id, activo: true }))
        if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" })

        // Si el admin retira la validación de su propio reporte, no se le exige
        // un motivo escrito ni se le envía un correo explicándoselo a sí mismo.
        // Eso solo tiene sentido cuando el reporte pertenece a otro usuario.
        const esPropio = reporte.usuario._id.toString() === req.userBDD._id.toString()

        if (!esPropio && !motivo) {
            return res.status(400).json({ msg: "Debes indicar el motivo para retirar la verificación" })
        }

        reporte.validado = false
        reporte.validadoEn = null
        reporte.validadoPor = null
        await reporte.save()

        if (!esPropio) {
            const usuario = await User.findById(reporte.usuario._id)
            if (usuario?.email) {
                const vehiculo = reporte.vehiculo
                    ? `${reporte.vehiculo.marca} ${reporte.vehiculo.modelo} ${reporte.vehiculo.anio}`
                    : "Vehículo"
                const falla = reporte.falla?.nombre || "Falla reportada"
                sendMailReporteInvalidado(usuario.email, usuario.nombre, vehiculo, falla, motivo)
            }
        }

        res.status(200).json({ msg: "Validación retirada correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al invalidar" })
    }
}

// ESTADÍSTICAS
export const estadisticas = async (req, res) => {
    try {
        const filtro = { activo: true, validado: true }
        const reportes = await popReporte(Reporte.find(filtro))

        const marcaMap = {}
        const modeloMap = {}
        const fallaMap = {}
        const gravedadMap = { baja: 0, media: 0, alta: 0 }

        reportes.forEach(r => {
            const marca = r.vehiculo?.marca || "N/D"
            const modelo = r.vehiculo ? `${r.vehiculo.marca} ${r.vehiculo.modelo}` : "N/D"
            const falla = r.falla?.nombre || "N/D"

            marcaMap[marca] = (marcaMap[marca] || 0) + 1
            modeloMap[modelo] = (modeloMap[modelo] || 0) + 1
            fallaMap[falla] = (fallaMap[falla] || 0) + 1
            if (r.gravedad) gravedadMap[r.gravedad] = (gravedadMap[r.gravedad] || 0) + 1
        })

        const aArray = (obj) => Object.entries(obj)
            .map(([k, v]) => ({ _id: k, total: v }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)

        res.status(200).json({
            total: reportes.length,
            porMarca: aArray(marcaMap),
            porModelo: aArray(modeloMap),
            porTipoFalla: aArray(fallaMap),
            porGravedad: Object.entries(gravedadMap).map(([k, v]) => ({ _id: k, total: v }))
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener estadísticas" })
    }
}

// TENDENCIAS — fallas por modelo agrupadas por año de fabricación
export const tendencias = async (req, res) => {
    try {
        const { marca, modelo } = req.query

        // Buscar vehículos que coincidan con marca/modelo
        const Vehiculo = (await import("../models/Vehiculo.js")).default
        const filtroVehiculo = {}
        if (marca) filtroVehiculo.marca = { $regex: marca, $options: "i" }
        if (modelo) filtroVehiculo.modelo = { $regex: modelo, $options: "i" }

        const vehiculos = await Vehiculo.find(filtroVehiculo).select("_id marca modelo anio")

        if (vehiculos.length === 0) return res.status(200).json({ tendencia: [], modelos: [] })

        // Agrupar reportes por vehículo
        const vehiculoIds = vehiculos.map(v => v._id)
        const reportes = await Reporte.find({
            vehiculo: { $in: vehiculoIds },
            activo: true,
            validado: true
        }).populate("vehiculo", "marca modelo anio")

        // Construir mapa: "Marca Modelo" → { anio → { totalFallas, gravedades } }
        const mapaModelos = {}

        reportes.forEach(r => {
            if (!r.vehiculo) return
            const key = `${r.vehiculo.marca} ${r.vehiculo.modelo}`
            const anio = r.vehiculo.anio

            if (!mapaModelos[key]) mapaModelos[key] = {}
            if (!mapaModelos[key][anio]) mapaModelos[key][anio] = { totalFallas: 0, alta: 0, media: 0, baja: 0 }

            mapaModelos[key][anio].totalFallas++
            if (r.gravedad) mapaModelos[key][anio][r.gravedad]++
        })

        // Convertir a formato para gráfica de líneas
        // Cada modelo = una línea, cada punto = un año
        const tendencia = Object.entries(mapaModelos).map(([nombreModelo, porAnio]) => ({
            modelo: nombreModelo,
            datos: Object.entries(porAnio)
                .map(([anio, stats]) => ({ anio: Number(anio), ...stats }))
                .sort((a, b) => a.anio - b.anio)
        }))

        // Lista de modelos disponibles para el selector
        const modelosDisponibles = [...new Set(vehiculos.map(v => ({
            marca: v.marca,
            modelo: v.modelo,
            key: `${v.marca} ${v.modelo}`
        })).map(v => JSON.stringify(v)))].map(v => JSON.parse(v))

        res.status(200).json({ tendencia, modelos: modelosDisponibles })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener tendencias" })
    }
}

// DEVOLVER REPORTE AL USUARIO (admin)
export const devolverReporte = async (req, res) => {
    try {
        const { observacion } = req.body
        if (!observacion || observacion.trim().length < 10) {
            return res.status(400).json({ msg: "Debes escribir una observación de al menos 10 caracteres" })
        }

        const reporte = await popReporte(Reporte.findOne({ _id: req.params.id, activo: true, validado: false }))
        if (!reporte) {
            return res.status(404).json({ msg: "Reporte no encontrado o ya fue validado" })
        }

        reporte.observacion = observacion.trim()
        reporte.observadoPor = req.userBDD._id
        reporte.observadoEn = new Date()
        await reporte.save()

        const usuario = await User.findById(reporte.usuario)
        if (usuario?.email) {
            const vehiculo = reporte.vehiculo
                ? `${reporte.vehiculo.marca} ${reporte.vehiculo.modelo} ${reporte.vehiculo.anio}`
                : "Vehículo"
            const falla = reporte.falla?.nombre || "Falla reportada"
            sendMailReporteDevuelto(usuario.email, usuario.nombre, vehiculo, falla, observacion.trim(), reporte._id)
        }

        res.status(200).json({ msg: "Reporte devuelto al usuario con observación" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al devolver el reporte" })
    }
}

// ESTADÍSTICAS PÚBLICAS PARA EL HOME — solo 3 números, pensado para
// cargar rápido en la página de inicio (no requiere login).
export const estadisticasHome = async (req, res) => {
    try {
        const [totalReportes, totalVehiculos, marcas] = await Promise.all([
            Reporte.countDocuments({ activo: true, validado: true }),
            Vehiculo.countDocuments(),
            Vehiculo.distinct("marca")
        ])

        res.status(200).json({
            totalReportes,
            totalVehiculos,
            totalMarcas: marcas.length
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener estadísticas del home" })
    }
}