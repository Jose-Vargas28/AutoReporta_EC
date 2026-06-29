import Valoracion from "../models/Valoracion.js"
import Vehiculo from "../models/Vehiculo.js"

const ASPECTOS = ["confiabilidad", "seguridad", "consumo", "precio", "comodidad", "mantenimiento", "repuestos"]
const HORAS_VENTANA_CORRECCION = 48
const MAX_EDICIONES_EN_VENTANA = 3
const DIAS_COOLDOWN = 30
const LIMITE_DIARIO = 5
const LIMITE_MENSUAL = 10

// Calcula el estado de edición de una valoración existente:
// { puedeEditar, enVentanaCorreccion, horasRestantesVentana, diasRestantesCooldown }
const calcularEstadoEdicion = (valoracion) => {
    const ahora = new Date()
    const horasDesdeUltimaEdicion = (ahora - new Date(valoracion.updatedAt)) / (1000 * 60 * 60)
    const diasDesdeUltimaEdicion = horasDesdeUltimaEdicion / 24

    const dentroDeVentana = horasDesdeUltimaEdicion <= HORAS_VENTANA_CORRECCION
    const ediciones = valoracion.edicionesEnVentana || 0

    // Dentro de la ventana de 48h Y no ha agotado las 3 ediciones permitidas
    if (dentroDeVentana && ediciones < MAX_EDICIONES_EN_VENTANA) {
        return {
            puedeEditar: true,
            enVentanaCorreccion: true,
            horasRestantesVentana: Math.max(0, Math.ceil(HORAS_VENTANA_CORRECCION - horasDesdeUltimaEdicion)),
            diasRestantesCooldown: 0
        }
    }

    // Ya sea porque pasaron las 48h o porque agotó las 3 ediciones: aplica cooldown de 30 días
    // desde la última edición
    if (diasDesdeUltimaEdicion >= DIAS_COOLDOWN) {
        return {
            puedeEditar: true,
            enVentanaCorreccion: false,
            horasRestantesVentana: 0,
            diasRestantesCooldown: 0
        }
    }

    return {
        puedeEditar: false,
        enVentanaCorreccion: false,
        horasRestantesVentana: 0,
        diasRestantesCooldown: Math.ceil(DIAS_COOLDOWN - diasDesdeUltimaEdicion)
    }
}

// Calcular promedio de valoraciones para un vehículo
const calcularPromedios = (valoraciones) => {
    if (valoraciones.length === 0) return null
    const sumas = {}
    ASPECTOS.forEach(a => sumas[a] = 0)
    valoraciones.forEach(v => ASPECTOS.forEach(a => sumas[a] += v.aspectos[a] || 0))
    const promedios = {}
    ASPECTOS.forEach(a => promedios[a] = Math.round((sumas[a] / valoraciones.length) * 10) / 10)
    const puntajeGeneral = Math.round(
        (ASPECTOS.reduce((acc, a) => acc + promedios[a], 0) / ASPECTOS.length) * 10
    ) / 10
    return { promedios, puntajeGeneral }
}

// CREAR O ACTUALIZAR VALORACIÓN
export const crearOActualizarValoracion = async (req, res) => {
    try {
        const { aspectos, comentario } = req.body
        const vehiculoId = req.params.vehiculoId

        // Validar que exista el vehículo
        const vehiculo = await Vehiculo.findById(vehiculoId)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        // Validar aspectos
        for (const a of ASPECTOS) {
            const val = Number(aspectos?.[a])
            if (!val || val < 1 || val > 5) {
                return res.status(400).json({ msg: `El aspecto "${a}" debe ser entre 1 y 5` })
            }
        }

        // Buscar valoración existente (activa o desactivada) — el índice único vehiculo+usuario
        // significa que solo puede existir un documento por esa combinación
        const existente = await Valoracion.findOne({
            vehiculo: vehiculoId,
            usuario: req.userBDD._id
        })

        if (existente && existente.activo !== false) {
            // ---- Caso 1: ya tiene una valoración activa (o sin el campo seteado aún) ----
            const estado = calcularEstadoEdicion(existente)

            if (!estado.puedeEditar) {
                return res.status(400).json({
                    msg: `Ya editaste esta valoración recientemente. Podrás actualizarla en ${estado.diasRestantesCooldown} día(s).`,
                    diasRestantes: estado.diasRestantesCooldown
                })
            }

            existente.edicionesEnVentana = estado.enVentanaCorreccion
                ? (existente.edicionesEnVentana || 0) + 1
                : 1

            existente.activo = true
            existente.aspectos = aspectos
            existente.comentario = comentario?.trim()?.slice(0, 500) || ""
            await existente.save()

            const nuevoEstado = calcularEstadoEdicion(existente)
            return res.status(200).json({
                msg: "Valoración actualizada correctamente",
                valoracion: existente,
                enVentanaCorreccion: nuevoEstado.enVentanaCorreccion,
                horasRestantesVentana: nuevoEstado.horasRestantesVentana
            })
        }

        if (existente && !existente.activo) {
            // ---- Caso 2: el usuario había eliminado su valoración — se reactiva ----
            // heredando el mismo cooldown que tenía antes de eliminarla (evita el
            // atajo de "eliminar y crear de nuevo" para saltarse el cooldown de 30 días)
            const estado = calcularEstadoEdicion(existente)

            if (!estado.puedeEditar) {
                return res.status(400).json({
                    msg: `Eliminaste esta valoración recientemente. Podrás volver a valorar este vehículo en ${estado.diasRestantesCooldown} día(s).`,
                    diasRestantes: estado.diasRestantesCooldown
                })
            }

            existente.activo = true
            existente.edicionesEnVentana = estado.enVentanaCorreccion
                ? (existente.edicionesEnVentana || 0) + 1
                : 1
            existente.aspectos = aspectos
            existente.comentario = comentario?.trim()?.slice(0, 500) || ""
            await existente.save()

            return res.status(201).json({
                msg: "Valoración registrada correctamente",
                valoracion: existente
            })
        }

        // ---- Caso 3: nunca había valorado este vehículo — verificar límites diario y mensual ----
        const inicioDelDia = new Date(); inicioDelDia.setHours(0, 0, 0, 0)
        const finDelDia = new Date(); finDelDia.setHours(23, 59, 59, 999)
        const valoracionesHoy = await Valoracion.countDocuments({
            usuario: req.userBDD._id,
            createdAt: { $gte: inicioDelDia, $lte: finDelDia }
        })
        if (valoracionesHoy >= LIMITE_DIARIO) {
            return res.status(429).json({
                msg: `Has alcanzado el límite de ${LIMITE_DIARIO} valoraciones nuevas por día. Inténtalo mañana.`
            })
        }

        const hace30Dias = new Date(); hace30Dias.setDate(hace30Dias.getDate() - 30)
        const valoracionesEsteMes = await Valoracion.countDocuments({
            usuario: req.userBDD._id,
            createdAt: { $gte: hace30Dias }
        })
        if (valoracionesEsteMes >= LIMITE_MENSUAL) {
            return res.status(429).json({
                msg: `Has alcanzado el límite de ${LIMITE_MENSUAL} valoraciones nuevas en los últimos 30 días. Inténtalo más adelante.`
            })
        }

        // Crear nueva valoración
        const valoracion = new Valoracion({
            vehiculo: vehiculoId,
            usuario: req.userBDD._id,
            aspectos,
            comentario: comentario?.trim()?.slice(0, 500) || "",
            edicionesEnVentana: 0
        })
        await valoracion.save()
        res.status(201).json({ msg: "Valoración registrada correctamente", valoracion })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: "Ya tienes una valoración para este vehículo" })
        }
        console.error(error)
        res.status(500).json({ msg: "Error al guardar la valoración" })
    }
}

// OBTENER VALORACIONES DE UN VEHÍCULO
export const obtenerValoracionesVehiculo = async (req, res) => {
    try {
        const { vehiculoId } = req.params
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite

        const vehiculo = await Vehiculo.findById(vehiculoId)
            .select("marca modelo anio tipo combustible fotos version enlaces ocultarFotoAuto transmision traccion potencia torque airbags peso turbo cilindraje cilindros")
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        const total = await Valoracion.countDocuments({ vehiculo: vehiculoId, activo: { $ne: false } })
        const valoraciones = await Valoracion.find({ vehiculo: vehiculoId, activo: { $ne: false } })
            .populate("usuario", "nombre apellido region provincia")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limite)

        // Calcular promedios con todas las valoraciones activas (no solo la página)
        const todasLasValoraciones = await Valoracion.find({ vehiculo: vehiculoId, activo: { $ne: false } }).select("aspectos")
        const resumen = calcularPromedios(todasLasValoraciones)

        // Si el usuario está logueado, ver si ya valoró (incluye valoraciones desactivadas
        // para poder calcular el cooldown de reactivación)
        let miValoracion = null
        let puedoValorar = true
        let enVentanaCorreccion = false
        let horasRestantesVentana = 0
        let diasRestantesCooldown = 0

        if (req.userBDD) {
            const valoracionPropia = await Valoracion.findOne({
                vehiculo: vehiculoId,
                usuario: req.userBDD._id
            })
            // Solo se expone como "miValoracion" si está activa (para mostrarla en el form);
            // si está desactivada, no se muestra pero sí se usa para calcular el cooldown.
            // Los documentos antiguos sin el campo "activo" se tratan como activos.
            if (valoracionPropia && valoracionPropia.activo !== false) {
                miValoracion = valoracionPropia
                const estado = calcularEstadoEdicion(valoracionPropia)
                puedoValorar = estado.puedeEditar
                enVentanaCorreccion = estado.enVentanaCorreccion
                horasRestantesVentana = estado.horasRestantesVentana
                diasRestantesCooldown = estado.diasRestantesCooldown
            }
        }

        res.status(200).json({
            vehiculo,
            resumen,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina,
            valoraciones,
            miValoracion,
            puedoValorar,
            enVentanaCorreccion,
            horasRestantesVentana,
            diasRestantesCooldown
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener valoraciones" })
    }
}

// RANKING DE VEHÍCULOS POR CONFIABILIDAD
export const rankingConfiabilidad = async (req, res) => {
    try {
        const { tipo, marca, minValoraciones = 1 } = req.query

        // Agrupar valoraciones por vehículo (solo activas)
        const pipeline = [
            { $match: { activo: { $ne: false } } },
            {
                $group: {
                    _id: "$vehiculo",
                    totalValoraciones: { $sum: 1 },
                    confiabilidad:  { $avg: "$aspectos.confiabilidad" },
                    seguridad:      { $avg: "$aspectos.seguridad" },
                    consumo:        { $avg: "$aspectos.consumo" },
                    precio:         { $avg: "$aspectos.precio" },
                    comodidad:      { $avg: "$aspectos.comodidad" },
                    mantenimiento:  { $avg: "$aspectos.mantenimiento" },
                    repuestos:      { $avg: "$aspectos.repuestos" }
                }
            },
            { $match: { totalValoraciones: { $gte: parseInt(minValoraciones) } } },
            {
                $addFields: {
                    puntajeGeneral: {
                        $round: [{
                            $avg: ["$confiabilidad", "$seguridad", "$consumo",
                                   "$precio", "$comodidad", "$mantenimiento", "$repuestos"]
                        }, 1]
                    }
                }
            },
            { $sort: { puntajeGeneral: -1 } }
        ]

        const resultados = await Valoracion.aggregate(pipeline)

        // Popular datos del vehículo
        const vehiculoIds = resultados.map(r => r._id)
        let filtroVehiculo = { _id: { $in: vehiculoIds } }
        if (tipo) filtroVehiculo.tipo = tipo
        if (marca) filtroVehiculo.marca = { $regex: marca, $options: "i" }

        const vehiculos = await Vehiculo.find(filtroVehiculo)
            .select("marca modelo anio version tipo combustible fotos")

        const vehiculoMap = {}
        vehiculos.forEach(v => vehiculoMap[v._id.toString()] = v)

        const ranking = resultados
            .filter(r => vehiculoMap[r._id.toString()])
            .map(r => ({
                vehiculo: vehiculoMap[r._id.toString()],
                totalValoraciones: r.totalValoraciones,
                puntajeGeneral: Math.round(r.puntajeGeneral * 10) / 10,
                aspectos: {
                    confiabilidad:  Math.round(r.confiabilidad * 10) / 10,
                    seguridad:      Math.round(r.seguridad * 10) / 10,
                    consumo:        Math.round(r.consumo * 10) / 10,
                    precio:         Math.round(r.precio * 10) / 10,
                    comodidad:      Math.round(r.comodidad * 10) / 10,
                    mantenimiento:  Math.round(r.mantenimiento * 10) / 10,
                    repuestos:      Math.round(r.repuestos * 10) / 10
                }
            }))

        res.status(200).json({ ranking, total: ranking.length })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener el ranking" })
    }
}

// VALORACIONES DE UN USUARIO (admin)
export const valoracionesDeUsuario = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 10
        const skip = (pagina - 1) * limite

        const total = await Valoracion.countDocuments({ usuario: req.params.id })
        const valoraciones = await Valoracion.find({ usuario: req.params.id })
            .populate("vehiculo", "marca modelo anio version")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limite)

        res.status(200).json({
            valoraciones,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener valoraciones del usuario" })
    }
}

// LISTAR TODAS LAS VALORACIONES (admin) — para moderación, incluye activas e inactivas
export const listarTodasValoraciones = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = 15
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""
        const soloConComentario = req.query.soloConComentario === "true"
        const estado = req.query.estado || ""

        const filtro = {}
        if (soloConComentario) filtro.comentario = { $ne: "" }
        if (estado === "activo") filtro.activo = { $ne: false }
        if (estado === "eliminado") filtro.activo = false

        // Si hay búsqueda, resolver los IDs de usuarios y vehículos que coincidan
        // para poder filtrar en MongoDB en vez de en memoria
        if (busqueda) {
            const User = (await import("../models/User.js")).default
            const Vehiculo = (await import("../models/Vehiculo.js")).default
            const regex = { $regex: busqueda, $options: "i" }

            const [usuariosMatch, vehiculosMatch] = await Promise.all([
                User.find({ $or: [{ nombre: regex }, { apellido: regex }, { email: regex }] }).select("_id"),
                Vehiculo.find({ $or: [{ marca: regex }, { modelo: regex }] }).select("_id")
            ])

            filtro.$or = [
                { usuario: { $in: usuariosMatch.map(u => u._id) } },
                { vehiculo: { $in: vehiculosMatch.map(v => v._id) } },
                { comentario: regex }
            ]
        }

        const [total, valoraciones] = await Promise.all([
            Valoracion.countDocuments(filtro),
            Valoracion.find(filtro)
                .populate("usuario", "nombre apellido email")
                .populate("vehiculo", "marca modelo anio version")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limite)
        ])

        res.status(200).json({
            valoraciones,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al listar valoraciones" })
    }
}

// ELIMINAR VALORACIÓN COMO ADMIN (moderación — borrado lógico)
export const eliminarValoracionAdmin = async (req, res) => {
    try {
        const valoracion = await Valoracion.findById(req.params.id)
        if (!valoracion) return res.status(404).json({ msg: "Valoración no encontrada" })

        valoracion.activo = false
        await valoracion.save()

        res.status(200).json({ msg: "Valoración eliminada por moderación" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al eliminar la valoración" })
    }
}

// RESTAURAR VALORACIÓN ELIMINADA (admin)
export const restaurarValoracionAdmin = async (req, res) => {
    try {
        const valoracion = await Valoracion.findById(req.params.id)
        if (!valoracion) return res.status(404).json({ msg: "Valoración no encontrada" })

        valoracion.activo = true
        await valoracion.save()

        res.status(200).json({ msg: "Valoración restaurada" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al restaurar la valoración" })
    }
}

// MIS VEHÍCULOS YA VALORADOS (usuario logueado) — solo IDs, para marcar UI
export const misVehiculosValorados = async (req, res) => {
    try {
        const valoraciones = await Valoracion.find({
            usuario: req.userBDD._id,
            activo: { $ne: false }
        }).select("vehiculo")

        const vehiculoIds = valoraciones.map(v => v.vehiculo.toString())
        res.status(200).json({ vehiculoIds })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al obtener tus valoraciones" })
    }
}

// ELIMINAR VALORACIÓN PROPIA
export const eliminarValoracion = async (req, res) => {
    try {
        const valoracion = await Valoracion.findOne({
            _id: req.params.id,
            usuario: req.userBDD._id,
            activo: true
        })
        if (!valoracion) return res.status(404).json({ msg: "Valoración no encontrada" })

        // Borrado lógico: se conserva el documento para heredar el cooldown si se reactiva
        valoracion.activo = false
        await valoracion.save()

        res.status(200).json({ msg: "Valoración eliminada" })
    } catch (error) {
        res.status(500).json({ msg: "Error al eliminar" })
    }
}