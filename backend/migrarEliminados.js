import mongoose from "mongoose"
import dotenv from "dotenv"
import Reporte from "./src/models/Reporte.js"
import User from "./src/models/User.js"

dotenv.config()

const migrar = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("✅ Conectado a MongoDB\n")

        const admin = await User.findOne({ rol: "admin" })
        if (!admin) { console.error("❌ No se encontró ningún usuario admin"); process.exit(1) }
        console.log(`👤 Admin: ${admin.nombre} ${admin.apellido} (${admin.email})\n`)

        // 1 — Asignar eliminadoPor donde falta
        const r1 = await Reporte.updateMany(
            { activo: false, $or: [{ eliminadoPor: null }, { eliminadoPor: { $exists: false } }] },
            { $set: { eliminadoPor: admin._id } }
        )
        console.log(`📋 eliminadoPor corregido en ${r1.modifiedCount} reportes`)

        // 2 — Asignar eliminadoEn donde falta (usar updatedAt del reporte)
        const sinFecha = await Reporte.find({
            activo: false,
            $or: [{ eliminadoEn: null }, { eliminadoEn: { $exists: false } }]
        }).select("_id updatedAt createdAt")

        let count = 0
        for (const r of sinFecha) {
            const base = r.updatedAt || r.createdAt || new Date()
            const fecha = new Date(base.getTime() + 3 * 86400000) // +3 días
            await Reporte.findByIdAndUpdate(r._id, { $set: { eliminadoEn: fecha } })
            count++
        }
        console.log(`📅 eliminadoEn corregido en ${count} reportes`)

        console.log("\n✅ Migración completada")
        process.exit(0)
    } catch (error) {
        console.error("❌ Error en migración:", error)
        process.exit(1)
    }
}

migrar()