import Reporte from "../models/Reporte.js"
import cloudinary from "../config/cloudinary.js"
import fs from "fs-extra"

// Límites de evidencias por reporte
const MAX_IMAGENES = 5
const MAX_DOCUMENTOS = 3
const MAX_ENLACES = 5

// Ventana de tiempo (horas) para que el usuario normal gestione evidencias
const LIMITE_HORAS = 48

// Helper: verifica permiso sobre el reporte (dueño o admin)
const tienePermiso = (reporte, userBDD) => {
    const esDueno = reporte.usuario.toString() === userBDD._id.toString()
    const esAdmin = userBDD.rol === "admin"
    return esDueno || esAdmin
}

// Helper: verifica si puede modificar (admin siempre; dueño solo dentro de 48h)
const puedeModificar = (reporte, userBDD) => {
    if (userBDD.rol === "admin") return true
    const horas = (new Date() - new Date(reporte.createdAt)) / (1000 * 60 * 60)
    return horas <= LIMITE_HORAS
}

// ---- SUBIR IMÁGENES (una o varias) ----
export const subirImagenes = async (req, res) => {
    try {
        const reporte = await Reporte.findById(req.params.id)
        if (!reporte || !reporte.activo) {
            return res.status(404).json({ msg: "Reporte no encontrado" })
        }
        if (!tienePermiso(reporte, req.userBDD)) {
            return res.status(403).json({ msg: "No tienes permiso sobre este reporte" })
        }
        if (!puedeModificar(reporte, req.userBDD)) {
            return res.status(403).json({ msg: `Solo puedes gestionar evidencias dentro de las primeras ${LIMITE_HORAS} horas tras crear el reporte` })
        }
        if (!req.files?.imagenes) {
            return res.status(400).json({ msg: "No se enviaron imágenes" })
        }

        const archivos = Array.isArray(req.files.imagenes)
            ? req.files.imagenes
            : [req.files.imagenes]

        // Verificar límite de imágenes
        const totalActual = reporte.imagenes?.length || 0
        if (totalActual + archivos.length > MAX_IMAGENES) {
            return res.status(400).json({
                msg: `Solo puedes subir hasta ${MAX_IMAGENES} imágenes por reporte. Ya tienes ${totalActual}.`
            })
        }

        for (const archivo of archivos) {
            try {
                const { secure_url, public_id } = await cloudinary.uploader.upload(
                    archivo.tempFilePath,
                    { folder: "reportes/imagenes" }
                )
                reporte.imagenes.push({
                    url: secure_url,
                    publicId: public_id,
                    nombre: archivo.name,
                    subidoPor: req.userBDD._id
                })
            } finally {
                await fs.unlink(archivo.tempFilePath).catch(() => {})
            }
        }

        await reporte.save()
        res.status(200).json({ msg: "Imágenes subidas correctamente", imagenes: reporte.imagenes })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al subir imágenes" })
    }
}

// ---- SUBIR DOCUMENTOS (facturas, recibos) ----
export const subirDocumentos = async (req, res) => {
    try {
        const reporte = await Reporte.findById(req.params.id)
        if (!reporte || !reporte.activo) {
            return res.status(404).json({ msg: "Reporte no encontrado" })
        }
        if (!tienePermiso(reporte, req.userBDD)) {
            return res.status(403).json({ msg: "No tienes permiso sobre este reporte" })
        }
        if (!puedeModificar(reporte, req.userBDD)) {
            return res.status(403).json({ msg: `Solo puedes gestionar evidencias dentro de las primeras ${LIMITE_HORAS} horas tras crear el reporte` })
        }
        if (!req.files?.documentos) {
            return res.status(400).json({ msg: "No se enviaron documentos" })
        }

        const archivos = Array.isArray(req.files.documentos)
            ? req.files.documentos
            : [req.files.documentos]

        // Verificar límite de documentos
        const totalActual = reporte.documentos?.length || 0
        if (totalActual + archivos.length > MAX_DOCUMENTOS) {
            return res.status(400).json({
                msg: `Solo puedes subir hasta ${MAX_DOCUMENTOS} documentos por reporte. Ya tienes ${totalActual}.`
            })
        }

        for (const archivo of archivos) {
            try {
                const { secure_url, public_id } = await cloudinary.uploader.upload(
                    archivo.tempFilePath,
                    { folder: "reportes/documentos", resource_type: "auto" }
                )
                reporte.documentos.push({
                    url: secure_url,
                    publicId: public_id,
                    nombre: archivo.name,
                    subidoPor: req.userBDD._id
                })
            } finally {
                await fs.unlink(archivo.tempFilePath).catch(() => {})
            }
        }

        await reporte.save()
        res.status(200).json({ msg: "Documentos subidos correctamente", documentos: reporte.documentos })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al subir documentos" })
    }
}

// ---- AGREGAR ENLACE (YouTube o externo) ----
export const agregarEnlace = async (req, res) => {
    try {
        const { url, tipo, titulo } = req.body

        if (!url) {
            return res.status(400).json({ msg: "La URL es obligatoria" })
        }

        const reporte = await Reporte.findById(req.params.id)
        if (!reporte || !reporte.activo) {
            return res.status(404).json({ msg: "Reporte no encontrado" })
        }
        if (!tienePermiso(reporte, req.userBDD)) {
            return res.status(403).json({ msg: "No tienes permiso sobre este reporte" })
        }
        if (!puedeModificar(reporte, req.userBDD)) {
            return res.status(403).json({ msg: `Solo puedes gestionar evidencias dentro de las primeras ${LIMITE_HORAS} horas tras crear el reporte` })
        }

        // Verificar límite de enlaces
        if (reporte.enlaces?.length >= MAX_ENLACES) {
            return res.status(400).json({
                msg: `Solo puedes agregar hasta ${MAX_ENLACES} enlaces por reporte.`
            })
        }

        reporte.enlaces.push({
            url,
            tipo: tipo === "youtube" ? "youtube" : "externo",
            titulo: titulo || "",
            agregadoPor: req.userBDD._id
        })

        await reporte.save()
        res.status(200).json({ msg: "Enlace agregado correctamente", enlaces: reporte.enlaces })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al agregar enlace" })
    }
}

// ---- ELIMINAR IMAGEN ----
export const eliminarImagen = async (req, res) => {
    try {
        const { id, imagenId } = req.params
        const reporte = await Reporte.findById(id)
        if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" })
        if (!tienePermiso(reporte, req.userBDD)) {
            return res.status(403).json({ msg: "No tienes permiso sobre este reporte" })
        }
        if (!puedeModificar(reporte, req.userBDD)) {
            return res.status(403).json({ msg: `Solo puedes gestionar evidencias dentro de las primeras ${LIMITE_HORAS} horas tras crear el reporte` })
        }

        const imagen = reporte.imagenes.id(imagenId)
        if (!imagen) return res.status(404).json({ msg: "Imagen no encontrada" })

        await cloudinary.uploader.destroy(imagen.publicId)
        reporte.imagenes.pull(imagenId)
        await reporte.save()

        res.status(200).json({ msg: "Imagen eliminada correctamente" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al eliminar imagen" })
    }
}

// ---- ELIMINAR DOCUMENTO ----
export const eliminarDocumento = async (req, res) => {
    try {
        const { id, documentoId } = req.params
        const reporte = await Reporte.findById(id)
        if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" })
        if (!tienePermiso(reporte, req.userBDD)) {
            return res.status(403).json({ msg: "No tienes permiso sobre este reporte" })
        }
        if (!puedeModificar(reporte, req.userBDD)) {
            return res.status(403).json({ msg: `Solo puedes gestionar evidencias dentro de las primeras ${LIMITE_HORAS} horas tras crear el reporte` })
        }

        const documento = reporte.documentos.id(documentoId)
        if (!documento) return res.status(404).json({ msg: "Documento no encontrado" })

        await cloudinary.uploader.destroy(documento.publicId, { resource_type: "raw" })
        reporte.documentos.pull(documentoId)
        await reporte.save()

        res.status(200).json({ msg: "Documento eliminado correctamente" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al eliminar documento" })
    }
}

// ---- ELIMINAR ENLACE ----
export const eliminarEnlace = async (req, res) => {
    try {
        const { id, enlaceId } = req.params
        const reporte = await Reporte.findById(id)
        if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" })
        if (!tienePermiso(reporte, req.userBDD)) {
            return res.status(403).json({ msg: "No tienes permiso sobre este reporte" })
        }
        if (!puedeModificar(reporte, req.userBDD)) {
            return res.status(403).json({ msg: `Solo puedes gestionar evidencias dentro de las primeras ${LIMITE_HORAS} horas tras crear el reporte` })
        }

        const enlace = reporte.enlaces.id(enlaceId)
        if (!enlace) return res.status(404).json({ msg: "Enlace no encontrado" })

        reporte.enlaces.pull(enlaceId)
        await reporte.save()

        res.status(200).json({ msg: "Enlace eliminado correctamente" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al eliminar enlace" })
    }
}