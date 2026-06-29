import mongoose from "mongoose"
import dotenv from "dotenv"
import Vehiculo from "./src/models/Vehiculo.js"

dotenv.config()

const migrar = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Conectado a MongoDB")

        // Actualizar vehículos que no tienen tipo o combustible
        const resultado = await Vehiculo.updateMany(
            { $or: [{ tipo: { $exists: false } }, { tipo: null }, { tipo: "auto" }] },
            { $set: { tipo: "automóvil" } }
        )
        console.log(`Tipo actualizado en ${resultado.modifiedCount} vehículos`)

        const resultado2 = await Vehiculo.updateMany(
            { $or: [{ combustible: { $exists: false } }, { combustible: null }] },
            { $set: { combustible: "gasolina" } }
        )
        console.log(`Combustible actualizado en ${resultado2.modifiedCount} vehículos`)

        console.log("✅ Migración completada")
        process.exit(0)
    } catch (error) {
        console.error("Error en migración:", error)
        process.exit(1)
    }
}

migrar()
