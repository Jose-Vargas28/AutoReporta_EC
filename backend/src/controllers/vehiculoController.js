import Vehiculo from "../models/Vehiculo.js"
import Reporte from "../models/Reporte.js"
import cloudinary from "../config/cloudinary.js"
import fs from "fs-extra"
import mongoose from "mongoose"

const LIMITE_DIARIO = 5
const MAX_FOTOS = 5

// CREAR VEHÍCULO (cualquier usuario logueado)
export const crearVehiculo = async (req, res) => {
    try {
        let { marca, modelo, anio, version } = req.body

        if (!marca || !modelo || !anio) {
            return res.status(400).json({ msg: "Marca, modelo y año son obligatorios" })
        }

        // Límite diario (solo usuarios normales, admin sin límite)
        if (req.userBDD.rol !== "admin") {
            const inicioDelDia = new Date(); inicioDelDia.setHours(0, 0, 0, 0)
            const finDelDia = new Date(); finDelDia.setHours(23, 59, 59, 999)
            const creadosHoy = await Vehiculo.countDocuments({
                creadoPor: req.userBDD._id,
                createdAt: { $gte: inicioDelDia, $lte: finDelDia }
            })
            if (creadosHoy >= LIMITE_DIARIO) {
                return res.status(429).json({
                    msg: `Has alcanzado el límite de ${LIMITE_DIARIO} vehículos por día. Intenta nuevamente mañana.`
                })
            }
        }

        marca = marca.trim()
        modelo = modelo.trim()
        anio = Number(anio)
        version = (version || "").trim().slice(0, 20)
        const tipo = req.body.tipo || "automóvil"
        const combustible = req.body.combustible || "gasolina"

        // Validar duplicado incluyendo versión
        const existe = await Vehiculo.findOne({
            marca: { $regex: `^${marca}$`, $options: "i" },
            modelo: { $regex: `^${modelo}$`, $options: "i" },
            anio,
            version: { $regex: `^${version}$`, $options: "i" }
        })

        if (existe) {
            const nombreCompleto = version
                ? `${marca} ${modelo} ${anio} ${version}`
                : `${marca} ${modelo} ${anio}`
            return res.status(400).json({ msg: `El vehículo "${nombreCompleto}" ya existe` })
        }

        const vehiculo = new Vehiculo({ marca, modelo, anio, version, tipo, combustible, creadoPor: req.userBDD._id })
        await vehiculo.save()

        res.status(201).json({ msg: "Vehículo registrado correctamente", vehiculo })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: "Ese vehículo ya existe" })
        }
        console.error(error)
        res.status(500).json({ msg: "Error al crear el vehículo" })
    }
}

// SELECTOR DE VEHÍCULOS — endpoint liviano para ReportarFalla
// Solo devuelve los campos necesarios para armar los selectores en cascada
// (marca → modelo → año → versión), sin fotos, sin stats de reportes, sin paginación.
export const listarVehiculosSelector = async (req, res) => {
    try {
        const vehiculos = await Vehiculo.find()
            .select("marca modelo anio version")
            .sort({ marca: 1, modelo: 1, anio: -1 })
            .lean()
        res.status(200).json({ vehiculos })
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener vehículos" })
    }
}

// LISTAR TODOS LOS VEHÍCULOS
export const listarVehiculos = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = parseInt(req.query.limite) || 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""
        const tipo = req.query.tipo || ""
        const marca = req.query.marca || ""

        const filtro = {}

        if (busqueda) {
            filtro.$or = [
                { marca: { $regex: busqueda, $options: "i" } },
                { modelo: { $regex: busqueda, $options: "i" } }
            ]
        }
        if (tipo) filtro.tipo = tipo
        if (marca) filtro.marca = { $regex: `^${marca}$`, $options: "i" }

        const transmision = req.query.transmision || ""
        const traccion    = req.query.traccion    || ""
        const combustible = req.query.combustible || ""
        const turbo       = req.query.turbo       || ""

        if (transmision) filtro.transmision = transmision
        if (traccion)    filtro.traccion    = traccion
        if (combustible) filtro.combustible = combustible
        if (turbo === "true")  filtro.turbo = true
        if (turbo === "false") filtro.turbo = false

        const total = await Vehiculo.countDocuments(filtro)
        const vehiculos = await Vehiculo.find(filtro)
            .populate("creadoPor", "nombre")
            .sort({ marca: 1, modelo: 1, anio: -1 })
            .skip(skip)
            .limit(limite)

        // Una sola aggregation para contar reportes de todos los vehículos de la página
        const ids = vehiculos.map(v => v._id)
        const statsReportes = await Reporte.aggregate([
            { $match: { vehiculo: { $in: ids }, activo: true, validado: true } },
            { $group: { _id: "$vehiculo", total: { $sum: 1 } } }
        ])
        const mapaStats = {}
        statsReportes.forEach(s => { mapaStats[s._id.toString()] = s.total })

        const vehiculosConStats = vehiculos.map(v => ({
            ...v.toObject(),
            totalReportes: mapaStats[v._id.toString()] || 0
        }))

        res.status(200).json({
            vehiculos: vehiculosConStats,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener vehículos" })
    }
}

// ELIMINAR VEHÍCULO (solo admin)
export const eliminarVehiculo = async (req, res) => {
    try {
        const totalReportes = await Reporte.countDocuments({
            vehiculo: req.params.id,
            activo: true
        })

        if (totalReportes > 0) {
            return res.status(400).json({
                msg: `No se puede eliminar: este vehículo tiene ${totalReportes} reporte(s) asociado(s). Usa "Editar" para corregir los datos si hay un error.`
            })
        }

        // Eliminar fotos de Cloudinary antes de borrar el vehículo
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (vehiculo?.fotos?.length > 0) {
            await Promise.all(vehiculo.fotos.map(f => cloudinary.uploader.destroy(f.publicId)))
        }

        await Vehiculo.findByIdAndDelete(req.params.id)
        res.status(200).json({ msg: "Vehículo eliminado correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al eliminar el vehículo" })
    }
}

// ACTUALIZAR VEHÍCULO (solo admin)
export const actualizarVehiculo = async (req, res) => {
    try {
        let { marca, modelo, anio, version } = req.body
        if (!marca || !modelo || !anio) {
            return res.status(400).json({ msg: "Marca, modelo y año son obligatorios" })
        }
        marca = marca.trim()
        modelo = modelo.trim()
        anio = Number(anio)
        version = (version || "").trim().slice(0, 20)

        const existe = await Vehiculo.findOne({
            _id: { $ne: req.params.id },
            marca: { $regex: `^${marca}$`, $options: "i" },
            modelo: { $regex: `^${modelo}$`, $options: "i" },
            anio,
            version: { $regex: `^${version}$`, $options: "i" }
        })
        if (existe) {
            return res.status(400).json({ msg: `Ya existe el vehículo ${marca} ${modelo} ${anio} ${version}`.trim() })
        }

        const tipo = req.body.tipo || "automóvil"
        const combustible = req.body.combustible || "gasolina"

        // Campos técnicos opcionales (solo admin puede enviarlos)
        const tecnica = {}
        if (req.body.transmision !== undefined) tecnica.transmision = req.body.transmision || null
        if (req.body.traccion    !== undefined) tecnica.traccion    = req.body.traccion    || null
        if (req.body.potencia    !== undefined) tecnica.potencia    = req.body.potencia    ? Number(req.body.potencia)    : null
        if (req.body.torque      !== undefined) tecnica.torque      = req.body.torque      ? Number(req.body.torque)      : null
        if (req.body.airbags     !== undefined) tecnica.airbags     = req.body.airbags     ? Number(req.body.airbags)     : null
        if (req.body.peso        !== undefined) tecnica.peso        = req.body.peso        ? Number(req.body.peso)        : null
        if (req.body.turbo       !== undefined) tecnica.turbo       = req.body.turbo === null ? null : req.body.turbo === true || req.body.turbo === "true"
        if (req.body.cilindraje  !== undefined) tecnica.cilindraje  = req.body.cilindraje  ? Number(req.body.cilindraje)  : null
        if (req.body.cilindros   !== undefined) tecnica.cilindros   = req.body.cilindros   ? Number(req.body.cilindros)   : null

        await Vehiculo.findByIdAndUpdate(
            req.params.id,
            { marca, modelo, anio, version, tipo, combustible, ...tecnica },
            { new: true }
        )
        res.status(200).json({ msg: "Vehículo actualizado correctamente" })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: "Ese vehículo ya existe" })
        }
        res.status(500).json({ msg: "Error al actualizar el vehículo" })
    }
}

// SUBIR FOTO DE VEHÍCULO (solo admin)
export const subirFotoVehiculo = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        if (!req.files?.foto) return res.status(400).json({ msg: "No se envió ninguna imagen" })

        if (vehiculo.fotos.length >= MAX_FOTOS) {
            return res.status(400).json({ msg: `Solo se permiten hasta ${MAX_FOTOS} fotos por vehículo` })
        }

        const archivo = req.files.foto
        const resultado = await cloudinary.uploader.upload(archivo.tempFilePath, {
            folder: "autoreporta/vehiculos",
            transformation: [{ width: 800, height: 500, crop: "fill", quality: "auto" }]
        })
        await fs.unlink(archivo.tempFilePath)

        // La primera foto que se sube es la principal automáticamente
        const esPrincipal = vehiculo.fotos.length === 0

        vehiculo.fotos.push({
            url: resultado.secure_url,
            publicId: resultado.public_id,
            principal: esPrincipal
        })
        await vehiculo.save()

        res.status(200).json({ msg: "Foto subida correctamente", fotos: vehiculo.fotos })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al subir la foto" })
    }
}

// ELIMINAR FOTO DE VEHÍCULO (solo admin)
export const eliminarFotoVehiculo = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        const foto = vehiculo.fotos.id(req.params.fotoId)
        if (!foto) return res.status(404).json({ msg: "Foto no encontrada" })

        const eraPrincipal = foto.principal

        await cloudinary.uploader.destroy(foto.publicId)
        vehiculo.fotos.pull(req.params.fotoId)

        // Si se eliminó la principal y quedan fotos, la primera pasa a ser principal
        if (eraPrincipal && vehiculo.fotos.length > 0) {
            vehiculo.fotos[0].principal = true
        }

        await vehiculo.save()
        res.status(200).json({ msg: "Foto eliminada correctamente", fotos: vehiculo.fotos })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al eliminar la foto" })
    }
}

// REORDENAR FOTOS (solo admin)
export const reordenarFotos = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        const { orden } = req.body
        if (!Array.isArray(orden)) return res.status(400).json({ msg: "Orden inválido" })

        const fotosOrdenadas = orden
            .map(id => vehiculo.fotos.id(id))
            .filter(Boolean)

        // La primera siempre es la principal
        fotosOrdenadas.forEach((f, i) => { f.principal = i === 0 })

        vehiculo.fotos = fotosOrdenadas
        await vehiculo.save()

        res.status(200).json({ msg: "Fotos reordenadas", fotos: vehiculo.fotos })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al reordenar fotos" })
    }
}

// GUARDAR FOTO DE PEXELS como foto manual (solo admin)
export const guardarFotoPexels = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        if (vehiculo.fotos.length >= MAX_FOTOS) {
            return res.status(400).json({ msg: `Solo se permiten hasta ${MAX_FOTOS} fotos por vehículo` })
        }

        const { url } = req.body
        if (!url) return res.status(400).json({ msg: "URL de la foto requerida" })

        // Cloudinary acepta URLs directamente — no hay que descargar el archivo
        const resultado = await cloudinary.uploader.upload(url, {
            folder: "autoreporta/vehiculos",
            transformation: [{ width: 800, height: 500, crop: "fill", quality: "auto" }]
        })

        const esPrincipal = vehiculo.fotos.length === 0
        vehiculo.fotos.push({
            url: resultado.secure_url,
            publicId: resultado.public_id,
            principal: esPrincipal,
            esPexels: true,
            urlOriginal: url
        })
        await vehiculo.save()

        res.status(200).json({ msg: "Foto guardada correctamente", fotos: vehiculo.fotos })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al guardar la foto" })
    }
}

const HORAS_COOLDOWN_ENLACE = 48
const LIMITE_MENSUAL_ENLACES = 10

// AGREGAR ENLACE DE SEGURIDAD (usuario logueado)
export const agregarEnlace = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        if (vehiculo.enlaces.length >= 10) {
            return res.status(400).json({ msg: "Este vehículo ya tiene el máximo de 10 enlaces" })
        }

        // Verificar cooldown: si este usuario eliminó un enlace de este vehículo recientemente
        // (el admin está exento, ya que necesita poder corregir enlaces sin restricción)
        if (req.userBDD.rol !== "admin") {
            const cooldown = vehiculo.cooldownsEnlaces?.find(c => c.usuario.toString() === req.userBDD._id.toString())
            if (cooldown) {
                const horasDesdeEliminacion = (new Date() - new Date(cooldown.eliminadoEn)) / (1000 * 60 * 60)
                if (horasDesdeEliminacion < HORAS_COOLDOWN_ENLACE) {
                    const horasRestantes = Math.ceil(HORAS_COOLDOWN_ENLACE - horasDesdeEliminacion)
                    return res.status(400).json({
                        msg: `Eliminaste un enlace recientemente. Podrás agregar uno nuevo en ${horasRestantes}h.`
                    })
                }
            }
        }

        // Verificar límite mensual: máximo de enlaces que un usuario puede agregar
        // en los últimos 30 días, sin importar a qué vehículo (el admin está exento)
        if (req.userBDD.rol !== "admin") {
            const hace30Dias = new Date(); hace30Dias.setDate(hace30Dias.getDate() - 30)
            const conteoMensual = await Vehiculo.aggregate([
                { $unwind: "$enlaces" },
                {
                    $match: {
                        "enlaces.creadoPor": new mongoose.Types.ObjectId(req.userBDD._id),
                        "enlaces.createdAt": { $gte: hace30Dias }
                    }
                },
                { $count: "total" }
            ])
            const totalEsteMes = conteoMensual[0]?.total || 0
            if (totalEsteMes >= LIMITE_MENSUAL_ENLACES) {
                return res.status(429).json({
                    msg: `Has alcanzado el límite de ${LIMITE_MENSUAL_ENLACES} enlaces agregados en los últimos 30 días. Inténtalo más adelante.`
                })
            }
        }

        const { url, titulo, descripcion } = req.body
        if (!url || !titulo) return res.status(400).json({ msg: "URL y título son obligatorios" })

        // Validar que la URL no esté duplicada
        const existe = vehiculo.enlaces.find(e => e.url === url.trim())
        if (existe) return res.status(400).json({ msg: "Este enlace ya fue registrado" })

        vehiculo.enlaces.push({
            url: url.trim(),
            titulo: titulo.trim().slice(0, 100),
            descripcion: (descripcion || "").trim().slice(0, 200),
            creadoPor: req.userBDD._id
        })

        // Limpiar cualquier cooldown previo de este usuario al agregar exitosamente
        if (vehiculo.cooldownsEnlaces?.length) {
            vehiculo.cooldownsEnlaces = vehiculo.cooldownsEnlaces.filter(c => c.usuario.toString() !== req.userBDD._id.toString())
        }

        await vehiculo.save()

        res.status(201).json({ msg: "Enlace agregado correctamente", enlaces: vehiculo.enlaces })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al agregar el enlace" })
    }
}

// ELIMINAR ENLACE (propio o admin)
export const eliminarEnlace = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        const enlace = vehiculo.enlaces.id(req.params.enlaceId)
        if (!enlace) return res.status(404).json({ msg: "Enlace no encontrado" })

        // Solo el creador o el admin puede eliminar
        const esAdmin = req.userBDD.rol === "admin"
        const esPropietario = enlace.creadoPor?.toString() === req.userBDD._id.toString()
        if (!esAdmin && !esPropietario) {
            return res.status(403).json({ msg: "No tienes permiso para eliminar este enlace" })
        }

        // Registrar cooldown solo si un usuario normal (no admin) eliminó su propio enlace
        if (esPropietario && !esAdmin) {
            if (!vehiculo.cooldownsEnlaces) vehiculo.cooldownsEnlaces = []
            const existente = vehiculo.cooldownsEnlaces.find(c => c.usuario.toString() === req.userBDD._id.toString())
            if (existente) {
                existente.eliminadoEn = new Date()
            } else {
                vehiculo.cooldownsEnlaces.push({ usuario: req.userBDD._id, eliminadoEn: new Date() })
            }
        }

        enlace.deleteOne()
        await vehiculo.save()

        res.status(200).json({ msg: "Enlace eliminado", enlaces: vehiculo.enlaces })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al eliminar el enlace" })
    }
}

// OCULTAR / MOSTRAR FOTO AUTOMÁTICA (solo admin)
export const toggleFotoAuto = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        vehiculo.ocultarFotoAuto = !vehiculo.ocultarFotoAuto
        await vehiculo.save()

        res.status(200).json({
            msg: vehiculo.ocultarFotoAuto
                ? "Foto automática ocultada"
                : "Foto automática activada",
            ocultarFotoAuto: vehiculo.ocultarFotoAuto
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al actualizar" })
    }
}

// MARCAR FOTO COMO PRINCIPAL (solo admin)
export const marcarFotoPrincipal = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        const foto = vehiculo.fotos.id(req.params.fotoId)
        if (!foto) return res.status(404).json({ msg: "Foto no encontrada" })

        // Quitar principal de todas y asignar a la seleccionada
        vehiculo.fotos.forEach(f => { f.principal = false })
        foto.principal = true

        await vehiculo.save()
        res.status(200).json({ msg: "Foto principal actualizada", fotos: vehiculo.fotos })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al actualizar la foto principal" })
    }
}