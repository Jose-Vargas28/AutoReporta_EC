import mongoose from "mongoose"
import dotenv from "dotenv"
import User from "./src/models/User.js"

dotenv.config()

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Conectado a MongoDB")

        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD
        const adminNombre = process.env.ADMIN_NOMBRE || "Administrador"
        const adminApellido = process.env.ADMIN_APELLIDO || "Sistema"

        if (!adminEmail || !adminPassword) {
            console.error("Faltan ADMIN_EMAIL o ADMIN_PASSWORD en el archivo .env")
            process.exit(1)
        }

        // Verificar si el admin ya existe
        const existe = await User.findOne({ email: adminEmail })
        if (existe) {
            console.log("El administrador ya existe. No se crea de nuevo.")
            process.exit(0)
        }

        // Crear el admin
        const admin = new User({
            nombre: adminNombre,
            apellido: adminApellido,
            email: adminEmail,
            rol: "admin",
            confirmEmail: true  // el admin no necesita confirmar por correo
        })
        admin.password = await admin.encryptPassword(adminPassword)

        await admin.save()

        console.log("✅ Administrador creado correctamente")
        console.log(`   Correo: ${adminEmail}`)
        console.log(`   Rol: admin`)
        process.exit(0)

    } catch (error) {
        console.error("Error al crear el administrador:", error)
        process.exit(1)
    }
}

seedAdmin()