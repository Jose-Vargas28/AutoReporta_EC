import Falla from "../models/Falla.js"
import Reporte from "../models/Reporte.js"

// CREAR FALLA (cualquier usuario logueado)
export const crearFalla = async (req, res) => {
    try {
        let { nombre, descripcion, gravedad } = req.body

        if (!nombre) {
            return res.status(400).json({ msg: "El nombre de la falla es obligatorio" })
        }

        nombre = nombre.trim()

        // Validar que no exista (insensible a mayúsculas)
        const existe = await Falla.findOne({
            nombre: { $regex: `^${nombre}$`, $options: "i" }
        })

        if (existe) {
            return res.status(400).json({ msg: `La falla "${nombre}" ya existe` })
        }

        const falla = new Falla({ nombre, descripcion, gravedad: gravedad || "media", creadoPor: req.userBDD._id })
        await falla.save()

        res.status(201).json({ msg: "Falla registrada correctamente", falla })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: "Esa falla ya existe" })
        }
        console.error(error)
        res.status(500).json({ msg: "Error al crear la falla" })
    }
}

// SELECTOR DE FALLAS — endpoint liviano para ReportarFalla
export const listarFallasSelector = async (req, res) => {
    try {
        const fallas = await Falla.find()
            .select("nombre gravedad")
            .sort({ nombre: 1 })
            .lean()
        res.status(200).json({ fallas })
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener fallas" })
    }
}

// LISTAR TODAS LAS FALLAS
export const listarFallas = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1
        const limite = parseInt(req.query.limite) || 10
        const skip = (pagina - 1) * limite
        const busqueda = req.query.busqueda || ""

        const filtro = busqueda ? {
            nombre: { $regex: busqueda, $options: "i" }
        } : {}

        const total = await Falla.countDocuments(filtro)
        const fallas = await Falla.find(filtro)
            .populate("creadoPor", "nombre")
            .sort({ nombre: 1 })
            .skip(skip)
            .limit(limite)

        // Una sola aggregation para contar reportes de todas las fallas de la página
        const ids = fallas.map(f => f._id)
        const statsReportes = await Reporte.aggregate([
            { $match: { falla: { $in: ids }, activo: true } },
            { $group: { _id: "$falla", total: { $sum: 1 } } }
        ])
        const mapaStats = {}
        statsReportes.forEach(s => { mapaStats[s._id.toString()] = s.total })

        const fallasConStats = fallas.map(f => ({
            ...f.toObject(),
            totalReportes: mapaStats[f._id.toString()] || 0
        }))

        res.status(200).json({
            fallas: fallasConStats,
            total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        })
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener fallas" })
    }
}

// ELIMINAR FALLA (solo admin)
export const eliminarFalla = async (req, res) => {
    try {
        // Verificar si hay reportes asociados a esta falla
        const totalReportes = await Reporte.countDocuments({
            falla: req.params.id,
            activo: true
        })

        if (totalReportes > 0) {
            return res.status(400).json({
                msg: `No se puede eliminar: esta falla tiene ${totalReportes} reporte(s) asociado(s). Usa "Editar" para corregir el nombre si hay un error.`
            })
        }

        await Falla.findByIdAndDelete(req.params.id)
        res.status(200).json({ msg: "Falla eliminada correctamente" })
    } catch (error) {
        res.status(500).json({ msg: "Error al eliminar la falla" })
    }
}

// ACTUALIZAR FALLA
export const actualizarFalla = async (req, res) => {
    try {
        let { nombre, descripcion, gravedad } = req.body
        if (!nombre) {
            return res.status(400).json({ msg: "El nombre es obligatorio" })
        }
        nombre = nombre.trim()

        // Verificar que no exista otra falla con el mismo nombre (excluyendo la actual)
        const existe = await Falla.findOne({
            _id: { $ne: req.params.id },
            nombre: { $regex: `^${nombre}$`, $options: "i" }
        })
        if (existe) {
            return res.status(400).json({ msg: `La falla "${nombre}" ya existe` })
        }

        await Falla.findByIdAndUpdate(req.params.id, { nombre, descripcion, gravedad }, { new: true })
        res.status(200).json({ msg: "Falla actualizada correctamente" })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: "Esa falla ya existe" })
        }
        res.status(500).json({ msg: "Error al actualizar la falla" })
    }
}