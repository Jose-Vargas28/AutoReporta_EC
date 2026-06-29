import { Schema, model } from "mongoose"

const valoracionSchema = new Schema({
    vehiculo: {
        type: Schema.Types.ObjectId,
        ref: "Vehiculo",
        required: true
    },
    usuario: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    aspectos: {
        confiabilidad:  { type: Number, min: 1, max: 5, required: true },
        seguridad:      { type: Number, min: 1, max: 5, required: true },
        consumo:        { type: Number, min: 1, max: 5, required: true },
        precio:         { type: Number, min: 1, max: 5, required: true },
        comodidad:      { type: Number, min: 1, max: 5, required: true },
        mantenimiento:  { type: Number, min: 1, max: 5, required: true },
        repuestos:      { type: Number, min: 1, max: 5, required: true }
    },
    comentario: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ""
    },
    edicionesEnVentana: {
        type: Number,
        default: 0
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

// Un usuario solo puede tener una valoración por vehículo
valoracionSchema.index({ vehiculo: 1, usuario: 1 }, { unique: true })

export default model("Valoracion", valoracionSchema)