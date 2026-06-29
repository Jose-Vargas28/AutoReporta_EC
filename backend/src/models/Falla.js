import { Schema, model } from "mongoose"

const fallaSchema = new Schema({
    nombre: { type: String, required: true, trim: true, unique: true },
    descripcion: { type: String, trim: true },
    gravedad: {
        type: String,
        enum: ["baja", "media", "alta"],
        default: "media"
    },
    creadoPor: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
})

export default model("Falla", fallaSchema)
