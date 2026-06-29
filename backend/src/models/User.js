import { Schema, model } from "mongoose"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

const userSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        // Solo es obligatoria si la cuenta se creó con correo/contraseña.
        // Las cuentas creadas vía Google no tienen password local.
        required: function () {
            return this.proveedor === "local"
        }
    },
    proveedor: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },
    googleId: {
        type: String,
        default: null
    },
    rol: {
        type: String,
        enum: ["usuario", "admin"],
        default: "usuario"
    },
    confirmEmail: {
        type: Boolean,
        default: false
    },
    token: {
        type: String,
        default: null
    },
    tokenExpira: {
        type: Date,
        default: null
    },
    // Datos opcionales del usuario
    telefono: { type: String, trim: true, default: null },
    region: {
        type: String,
        enum: ["Costa", "Sierra", "Oriente", "Galápagos"],
        default: null
    },
    provincia: { type: String, trim: true, default: null },

    // Foto de perfil (Cloudinary). Ambos null = se muestra el avatar con inicial.
    foto: {
        url: { type: String, default: null },
        publicId: { type: String, default: null }
    },

    baneado: {
        type: Boolean,
        default: false
    },
    baneadoEn: {
        type: Date,
        default: null
    },
    eliminado: {
        type: Boolean,
        default: false
    },
    eliminadoEn: {
        type: Date,
        default: null
    },
    // Bloqueo temporal por intentos fallidos de login
    intentosFallidos: { type: Number, default: 0 },
    bloqueadoHasta:   { type: Date,   default: null }
}, {
    timestamps: true
})

// Cifrar contraseña
userSchema.methods.encryptPassword = async function (password) {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

// Verificar contraseña
userSchema.methods.matchPassword = async function (password) {
    return bcrypt.compare(password, this.password)
}

// Generar token criptográficamente seguro con expiración de 1 hora
userSchema.methods.crearToken = function () {
    this.token = randomBytes(32).toString("hex")
    this.tokenExpira = new Date(Date.now() + 60 * 60 * 1000) // 1 hora
    return this.token
}

export default model("User", userSchema)