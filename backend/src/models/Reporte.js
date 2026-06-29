import { Schema, model } from "mongoose"

// Subesquema para imágenes/documentos subidos a Cloudinary
const archivoSchema = new Schema({
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    nombre: { type: String },
    subidoPor: { type: Schema.Types.ObjectId, ref: "User" }
}, { _id: true, timestamps: true })

// Subesquema para enlaces (YouTube o fuentes externas)
const enlaceSchema = new Schema({
    url: { type: String, required: true },
    tipo: { type: String, enum: ["youtube", "externo"], default: "externo" },
    titulo: { type: String },
    agregadoPor: { type: Schema.Types.ObjectId, ref: "User" }
}, { _id: true, timestamps: true })

const reporteSchema = new Schema({
    // ---- Referencias (normalización) ----
    vehiculo: {
        type: Schema.Types.ObjectId,
        ref: "Vehiculo",
        required: true
    },
    falla: {
        type: Schema.Types.ObjectId,
        ref: "Falla",
        required: true
    },

    // ---- Datos propios del reporte ----
    descripcion: { type: String, trim: true },
    gravedad: {
        type: String,
        enum: ["baja", "media", "alta"],
        default: "media"
    },
    usuario: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    validado: {
        type: Boolean,
        default: false
    },
    observacion: {
        type: String,
        default: null
    },
    observadoPor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    observadoEn: {
        type: Date,
        default: null
    },
    validadoEn: {
        type: Date,
        default: null
    },
    validadoPor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    // ---- Evidencias ----
    imagenes: [archivoSchema],
    documentos: [archivoSchema],
    enlaces: [enlaceSchema],

    // ---- Borrado lógico ----
    activo: { type: Boolean, default: true },
    eliminadoEn: { type: Date, default: null },
    eliminadoPor: { type: Schema.Types.ObjectId, ref: "User", default: null }
}, {
    timestamps: true
})

export default model("Reporte", reporteSchema)
