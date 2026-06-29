// ============================================================
//  seedExtra.js — Agrega vehículos y valoraciones SIN borrar
//  AutoReporta EC
//
//  Uso: node seedExtra.js
//  ✅ No elimina datos existentes
//  ✅ Omite vehículos que ya existen (por marca+modelo+año+versión)
//  ✅ Omite valoraciones duplicadas (un usuario ya valoró ese vehículo)
// ============================================================

import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import User from "./src/models/User.js"
import Vehiculo from "./src/models/Vehiculo.js"
import Reporte from "./src/models/Reporte.js"
import Valoracion from "./src/models/Valoracion.js"
import Falla from "./src/models/Falla.js"

dotenv.config()

const aleatorio = (arr) => arr[Math.floor(Math.random() * arr.length)]
const aleatorioN = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n)
const num = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const fechaAleatoria = (diasAtras = 180) => {
    const d = new Date()
    d.setDate(d.getDate() - num(0, diasAtras))
    d.setHours(num(7, 22), num(0, 59))
    return d
}

// ---- VEHÍCULOS ADICIONALES ----
const VEHICULOS_EXTRA = [
    // Toyota adicionales
    { marca: "Toyota", modelo: "Fortuner",    anio: 2018, version: "2.7 4x2 AT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Toyota", modelo: "Fortuner",    anio: 2022, version: "2.8 4x4 AT",    tipo: "suv",       combustible: "diésel" },
    { marca: "Toyota", modelo: "Camry",       anio: 2019, version: "2.5 Hybrid",    tipo: "automóvil", combustible: "híbrido" },
    { marca: "Toyota", modelo: "Camry",       anio: 2022, version: "2.5 AT XSE",    tipo: "automóvil", combustible: "gasolina" },
    { marca: "Toyota", modelo: "4Runner",     anio: 2020, version: "4.0 4x4 AT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Toyota", modelo: "Highlander",  anio: 2021, version: "2.5 Hybrid AWD",tipo: "suv",       combustible: "híbrido" },
    { marca: "Toyota", modelo: "Tacoma",      anio: 2020, version: "2.7 4x2 MT",    tipo: "camioneta", combustible: "gasolina" },
    { marca: "Toyota", modelo: "Tacoma",      anio: 2023, version: "3.5 4x4 AT",    tipo: "camioneta", combustible: "gasolina" },

    // Mazda adicionales
    { marca: "Mazda", modelo: "CX-3",   anio: 2019, version: "2.0 AT 4x2",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Mazda", modelo: "CX-9",   anio: 2021, version: "2.5T AWD AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Mazda", modelo: "MX-30",  anio: 2022, version: "35.5kWh EV",    tipo: "suv",       combustible: "eléctrico" },
    { marca: "Mazda", modelo: "6",      anio: 2018, version: "2.5 AT Sedan",  tipo: "automóvil", combustible: "gasolina" },

    // Honda adicionales
    { marca: "Honda", modelo: "Pilot",      anio: 2020, version: "3.5 AWD AT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Honda", modelo: "Accord",     anio: 2019, version: "1.5T CVT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Honda", modelo: "Accord",     anio: 2022, version: "2.0 Hybrid",    tipo: "automóvil", combustible: "híbrido" },
    { marca: "Honda", modelo: "WR-V",       anio: 2023, version: "1.5 CVT",       tipo: "suv",       combustible: "gasolina" },
    { marca: "Honda", modelo: "XR190L",     anio: 2022, version: "190cc",         tipo: "moto",      combustible: "gasolina" },

    // Kia adicionales
    { marca: "Kia", modelo: "Sorento",   anio: 2020, version: "2.5 4x4 AT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Kia", modelo: "Sorento",   anio: 2022, version: "1.6T Hybrid",   tipo: "suv",       combustible: "híbrido" },
    { marca: "Kia", modelo: "Stinger",   anio: 2021, version: "3.3T AWD AT",   tipo: "automóvil", combustible: "gasolina" },
    { marca: "Kia", modelo: "Carnival",  anio: 2022, version: "2.2 CRDi AT",   tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Kia", modelo: "Niro",      anio: 2022, version: "1.6 Hybrid",    tipo: "suv",       combustible: "híbrido" },
    { marca: "Kia", modelo: "Niro",      anio: 2023, version: "64kWh EV",      tipo: "suv",       combustible: "eléctrico" },

    // Hyundai adicionales
    { marca: "Hyundai", modelo: "Creta",     anio: 2021, version: "1.5 CVT",      tipo: "suv",       combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Creta",     anio: 2023, version: "1.5T DCT",     tipo: "suv",       combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Palisade",  anio: 2021, version: "3.8 AWD AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Elantra",   anio: 2020, version: "2.0 AT Sedan", tipo: "automóvil", combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Elantra",   anio: 2022, version: "1.6T DCT N",   tipo: "automóvil", combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Kona",      anio: 2021, version: "2.0 4x2 AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Kona",      anio: 2022, version: "39kWh EV",     tipo: "suv",       combustible: "eléctrico" },

    // Nissan adicionales
    { marca: "Nissan", modelo: "Kicks",   anio: 2020, version: "1.6 CVT",      tipo: "suv",       combustible: "gasolina" },
    { marca: "Nissan", modelo: "Kicks",   anio: 2022, version: "1.6 e-Power",  tipo: "suv",       combustible: "híbrido" },
    { marca: "Nissan", modelo: "Navara",  anio: 2019, version: "2.5 4x4 AT",   tipo: "camioneta", combustible: "diésel" },
    { marca: "Nissan", modelo: "Murano",  anio: 2018, version: "3.5 CVT AWD",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Nissan", modelo: "Leaf",    anio: 2022, version: "40kWh",        tipo: "automóvil", combustible: "eléctrico" },

    // Chevrolet adicionales
    { marca: "Chevrolet", modelo: "Onix",       anio: 2021, version: "1.0T MT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Onix",       anio: 2023, version: "1.0T AT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Equinox",    anio: 2020, version: "1.5T 4x4 AT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Trailblazer",anio: 2021, version: "1.3T 4x4 AT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Silverado",  anio: 2019, version: "5.3 4x4 AT",   tipo: "camioneta", combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Blazer EV",  anio: 2024, version: "85kWh AWD",    tipo: "suv",       combustible: "eléctrico" },

    // Ford adicionales
    { marca: "Ford", modelo: "F-150",       anio: 2020, version: "3.5 EcoBoost 4x4", tipo: "camioneta", combustible: "gasolina" },
    { marca: "Ford", modelo: "Bronco",      anio: 2022, version: "2.3T 4x4 MT",      tipo: "suv",       combustible: "gasolina" },
    { marca: "Ford", modelo: "Territory",   anio: 2021, version: "1.5T EcoBoost AT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Ford", modelo: "Mustang Mach-E", anio: 2022, version: "75kWh AWD",     tipo: "suv",       combustible: "eléctrico" },

    // VW adicionales
    { marca: "Volkswagen", modelo: "Taos",     anio: 2022, version: "1.4T 4x2 AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Volkswagen", modelo: "T-Cross",  anio: 2021, version: "1.0T AT",       tipo: "suv",       combustible: "gasolina" },
    { marca: "Volkswagen", modelo: "Amarok",   anio: 2020, version: "3.0 TDI 4x4 AT",tipo: "camioneta", combustible: "diésel" },
    { marca: "Volkswagen", modelo: "ID.4",     anio: 2023, version: "77kWh AWD",     tipo: "suv",       combustible: "eléctrico" },

    // BMW adicionales
    { marca: "BMW", modelo: "X1",    anio: 2021, version: "sDrive18i AT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "BMW", modelo: "X7",    anio: 2022, version: "xDrive40i AT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "BMW", modelo: "i4",    anio: 2022, version: "eDrive40 EV",     tipo: "automóvil", combustible: "eléctrico" },
    { marca: "BMW", modelo: "iX3",   anio: 2022, version: "80kWh RWD",       tipo: "suv",       combustible: "eléctrico" },

    // Mercedes adicionales
    { marca: "Mercedes-Benz", modelo: "GLA 200",  anio: 2021, version: "1.3T AT",       tipo: "suv",       combustible: "gasolina" },
    { marca: "Mercedes-Benz", modelo: "EQC 400",  anio: 2022, version: "80kWh 4MATIC",  tipo: "suv",       combustible: "eléctrico" },
    { marca: "Mercedes-Benz", modelo: "Vito",      anio: 2020, version: "2.0 CDI AT",   tipo: "vehículo comercial", combustible: "diésel" },

    // Audi adicionales
    { marca: "Audi", modelo: "Q3",   anio: 2021, version: "1.4T TFSI AT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Audi", modelo: "Q7",   anio: 2020, version: "3.0T Quattro AT", tipo: "suv",       combustible: "gasolina" },
    { marca: "Audi", modelo: "e-tron",anio: 2022, version: "95kWh Quattro",  tipo: "suv",       combustible: "eléctrico" },
    { marca: "Audi", modelo: "A3",   anio: 2021, version: "1.4T TFSI AT",    tipo: "automóvil", combustible: "gasolina" },

    // Porsche
    { marca: "Porsche", modelo: "Cayenne", anio: 2021, version: "3.0T AT",        tipo: "suv",       combustible: "gasolina" },
    { marca: "Porsche", modelo: "Macan",   anio: 2022, version: "2.0T PDK AWD",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Porsche", modelo: "Taycan",  anio: 2022, version: "93kWh 4S",       tipo: "automóvil", combustible: "eléctrico" },

    // Renault adicionales
    { marca: "Renault", modelo: "Sandero",  anio: 2020, version: "1.6 MT",        tipo: "automóvil", combustible: "gasolina" },
    { marca: "Renault", modelo: "Sandero",  anio: 2022, version: "1.0T CVT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Renault", modelo: "Koleos",   anio: 2020, version: "2.5 4x4 CVT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Renault", modelo: "Zoe",      anio: 2022, version: "50kWh EV",      tipo: "automóvil", combustible: "eléctrico" },

    // Suzuki adicionales
    { marca: "Suzuki", modelo: "Jimny",     anio: 2021, version: "1.5 4x4 MT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Suzuki", modelo: "S-Cross",   anio: 2022, version: "1.4T Hybrid",   tipo: "suv",       combustible: "híbrido" },

    // Mitsubishi adicionales
    { marca: "Mitsubishi", modelo: "Eclipse Cross", anio: 2021, version: "1.5T CVT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Mitsubishi", modelo: "Outlander PHEV",anio: 2022, version: "2.4 PHEV AWD",tipo: "suv",       combustible: "híbrido" },

    // Jeep adicionales
    { marca: "Jeep", modelo: "Compass",    anio: 2021, version: "1.3T 4x4 AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Jeep", modelo: "Gladiator",  anio: 2022, version: "3.6 4x4 MT",    tipo: "camioneta", combustible: "gasolina" },

    // Volvo adicionales
    { marca: "Volvo", modelo: "XC90",  anio: 2021, version: "T8 Hybrid AWD",  tipo: "suv",       combustible: "híbrido" },
    { marca: "Volvo", modelo: "C40",   anio: 2022, version: "78kWh Recharge",  tipo: "suv",       combustible: "eléctrico" },

    // Chinas adicionales
    { marca: "BYD",     modelo: "Han",      anio: 2023, version: "77kWh AWD",     tipo: "automóvil", combustible: "eléctrico" },
    { marca: "BYD",     modelo: "Seal",     anio: 2023, version: "82kWh AWD",     tipo: "automóvil", combustible: "eléctrico" },
    { marca: "BYD",     modelo: "Tang",     anio: 2023, version: "108kWh AWD",    tipo: "suv",       combustible: "eléctrico" },
    { marca: "Chery",   modelo: "Omoda 5",  anio: 2023, version: "1.6T CVT",      tipo: "suv",       combustible: "gasolina" },
    { marca: "Changan", modelo: "Uni-T",    anio: 2022, version: "1.5T CVT",      tipo: "suv",       combustible: "gasolina" },
    { marca: "Changan", modelo: "Lamore",   anio: 2023, version: "1.5T AT",       tipo: "automóvil", combustible: "gasolina" },
    { marca: "Jetour",  modelo: "X90 Plus", anio: 2023, version: "2.0T CVT 4x4",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Great Wall", modelo: "Haval H6",  anio: 2022, version: "1.5T DCT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Great Wall", modelo: "Haval H6",  anio: 2023, version: "2.0T DCT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "MG",      modelo: "ZS",       anio: 2021, version: "1.5 CVT",       tipo: "suv",       combustible: "gasolina" },
    { marca: "MG",      modelo: "ZS EV",    anio: 2022, version: "50.3kWh",       tipo: "suv",       combustible: "eléctrico" },
    { marca: "MG",      modelo: "4",        anio: 2023, version: "64kWh EV",      tipo: "automóvil", combustible: "eléctrico" },

    // Motos adicionales
    { marca: "Yamaha",   modelo: "Tracer 9",   anio: 2022, version: "890cc ABS",   tipo: "moto", combustible: "gasolina" },
    { marca: "Kawasaki", modelo: "Ninja 400",  anio: 2021, version: "399cc ABS",   tipo: "moto", combustible: "gasolina" },
    { marca: "Honda",    modelo: "CB500F",     anio: 2021, version: "471cc ABS",   tipo: "moto", combustible: "gasolina" },
    { marca: "Bajaj",    modelo: "Dominar 400",anio: 2022, version: "373cc ABS",   tipo: "moto", combustible: "gasolina" },
    { marca: "CFMoto",   modelo: "650MT",      anio: 2022, version: "649cc ABS",   tipo: "moto", combustible: "gasolina" },
    { marca: "Benelli",  modelo: "TRK 502",    anio: 2021, version: "500cc ABS",   tipo: "moto", combustible: "gasolina" },
]

// Confiabilidad por marca
const CONF = {
    "Toyota": { b: 4.6, v: 0.3 }, "Mazda": { b: 4.5, v: 0.3 }, "Honda": { b: 4.4, v: 0.3 },
    "Kia": { b: 4.0, v: 0.4 }, "Hyundai": { b: 3.9, v: 0.4 },
    "BMW": { b: 3.8, v: 0.4 }, "Audi": { b: 3.7, v: 0.4 }, "Volvo": { b: 3.7, v: 0.4 },
    "Suzuki": { b: 3.8, v: 0.3 }, "Mitsubishi": { b: 3.6, v: 0.4 },
    "Volkswagen": { b: 3.4, v: 0.5 }, "Nissan": { b: 3.3, v: 0.5 },
    "Mercedes-Benz": { b: 3.3, v: 0.5 }, "Peugeot": { b: 3.2, v: 0.5 },
    "Renault": { b: 3.1, v: 0.5 }, "Porsche": { b: 3.5, v: 0.5 },
    "Ford": { b: 3.0, v: 0.5 }, "Chevrolet": { b: 2.9, v: 0.5 },
    "Jeep": { b: 2.8, v: 0.6 }, "Land Rover": { b: 2.7, v: 0.6 },
    "Chery": { b: 2.8, v: 0.5 }, "Changan": { b: 2.7, v: 0.5 },
    "JAC": { b: 2.6, v: 0.5 }, "BYD": { b: 2.5, v: 0.6 },
    "Great Wall": { b: 2.4, v: 0.5 }, "Jetour": { b: 2.4, v: 0.5 },
    "MG": { b: 2.6, v: 0.5 }, "DFSK": { b: 2.2, v: 0.5 },
    "Yamaha": { b: 4.2, v: 0.3 }, "Kawasaki": { b: 4.0, v: 0.3 },
    "Bajaj": { b: 3.5, v: 0.4 }, "CFMoto": { b: 3.0, v: 0.5 },
    "Benelli": { b: 3.2, v: 0.5 },
}

const asp = (base, v, ajuste = 0) => {
    const raw = base + ajuste + (Math.random() * v * 2 - v)
    return Math.min(5, Math.max(1, Math.round(raw)))
}

const COMENTARIOS = {
    bueno: [
        "Excelente vehículo, muy confiable para el día a día. Lo recomiendo.",
        "Lo he tenido por 3 años sin problemas mayores, muy buena inversión.",
        "Muy cómodo para viajes largos y el consumo es muy razonable.",
        "El mantenimiento es accesible y los repuestos fáciles de conseguir.",
        "Superó mis expectativas, muy satisfecho con la compra.",
    ],
    regular: [
        "Buen auto pero el consumo de combustible podría mejorar.",
        "Funciona bien, aunque la electrónica ha dado algunos problemas menores.",
        "Buena relación calidad-precio aunque los repuestos son algo costosos.",
        "Satisfecho en general aunque esperaba más fiabilidad por el precio.",
    ],
    malo: [
        "Ya tuve problemas importantes con pocos kilómetros. No lo recomiendo.",
        "Los repuestos son muy caros y difíciles de conseguir.",
        "Muchos problemas eléctricos desde el primer año.",
        "El soporte técnico es pésimo y los repuestos escasean constantemente.",
    ],
}

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("✅ Conectado a MongoDB\n")

        // Obtener usuarios y fallas existentes
        const usuarios = await User.find({ rol: "usuario" })
        const admin = await User.findOne({ rol: "admin" })
        const fallas = await Falla.find({})

        if (usuarios.length === 0) {
            console.error("❌ No hay usuarios. Ejecuta primero el seed principal.")
            process.exit(1)
        }

        const todosLosUsuarios = [...usuarios, admin]

        // ---- Insertar vehículos nuevos (omitir duplicados) ----
        console.log("🚗 Agregando vehículos nuevos...")
        let vehiculosAgregados = 0
        let vehiculosOmitidos = 0
        const vehiculosNuevos = []

        for (const v of VEHICULOS_EXTRA) {
            const existe = await Vehiculo.findOne({
                marca: { $regex: `^${v.marca}$`, $options: "i" },
                modelo: { $regex: `^${v.modelo}$`, $options: "i" },
                anio: v.anio,
                version: { $regex: `^${v.version || ""}$`, $options: "i" }
            })
            if (existe) {
                vehiculosOmitidos++
                vehiculosNuevos.push(existe) // igual lo usamos para valoraciones
            } else {
                const nuevo = await Vehiculo.create({
                    ...v,
                    creadoPor: aleatorio(usuarios)._id
                })
                vehiculosNuevos.push(nuevo)
                vehiculosAgregados++
            }
        }

        console.log(`   ✅ ${vehiculosAgregados} vehículos nuevos agregados`)
        console.log(`   ⏭️  ${vehiculosOmitidos} vehículos ya existían, omitidos\n`)

        // ---- Agregar reportes a los vehículos nuevos ----
        console.log("📋 Agregando reportes a vehículos nuevos...")
        const vehiculosRealmenteNuevos = vehiculosNuevos.filter((_, i) => {
            const v = VEHICULOS_EXTRA[i]
            return true
        }).slice(0, vehiculosAgregados)

        const reportes = []
        const vehiculosParaReportes = vehiculosNuevos.slice(0, vehiculosAgregados)

        for (const vehiculo of vehiculosParaReportes) {
            const nReportes = num(1, 4)
            for (let i = 0; i < nReportes; i++) {
                const falla = aleatorio(fallas)
                const usuario = aleatorio(todosLosUsuarios)
                const fecha = fechaAleatoria(150)
                const r = Math.random()
                reportes.push({
                    vehiculo: vehiculo._id,
                    falla: falla._id,
                    descripcion: aleatorio([
                        "El problema apareció de la nada, sin previo aviso.",
                        "Lo he notado desde hace unos 2 meses. Cada vez empeora.",
                        "Sucede especialmente cuando el vehículo está frío.",
                        "Ya lo llevé al taller pero no encontraron la falla.",
                        "El concesionario me dijo que es normal pero no lo creo.",
                    ]),
                    gravedad: falla.gravedad,
                    usuario: usuario._id,
                    validado: r < 0.60,
                    validadoEn: r < 0.60 ? new Date(fecha.getTime() + num(1,5)*86400000) : null,
                    validadoPor: r < 0.60 ? admin._id : null,
                    activo: r >= 0.90 ? false : true,
                    eliminadoEn: r >= 0.90 ? new Date(fecha.getTime() + num(2,7)*86400000) : null,
                    eliminadoPor: r >= 0.90 ? admin._id : null,
                    imagenes: [], documentos: [], enlaces: [],
                    createdAt: fecha, updatedAt: fecha
                })
            }
        }

        if (reportes.length > 0) await Reporte.insertMany(reportes)
        console.log(`   ✅ ${reportes.length} reportes agregados\n`)

        // ---- Agregar valoraciones (omitir duplicados usuario-vehículo) ----
        console.log("⭐ Agregando valoraciones...")
        let valoracionesAgregadas = 0
        let valoracionesOmitidas = 0

        for (const usuario of usuarios) {
            const vehiculosAValorar = aleatorioN(vehiculosNuevos, num(2, 6))

            for (const vehiculo of vehiculosAValorar) {
                // Verificar si ya existe valoración de este usuario para este vehículo
                const yaExiste = await Valoracion.findOne({
                    vehiculo: vehiculo._id,
                    usuario: usuario._id
                })

                if (yaExiste) { valoracionesOmitidas++; continue }

                const c = CONF[vehiculo.marca] || { b: 3.0, v: 0.5 }
                const ajusteComb = vehiculo.combustible === "eléctrico" ? -0.4
                    : vehiculo.combustible === "híbrido" ? -0.1 : 0
                const edad = new Date().getFullYear() - vehiculo.anio
                const ajusteEdad = edad > 15 ? -0.3 : edad > 8 ? -0.1 : 0

                const confiabilidad  = asp(c.b, c.v, ajusteComb + ajusteEdad)
                const seguridad      = asp(c.b, c.v, 0.1 + ajusteComb + ajusteEdad)
                const consumo        = asp(c.b, c.v, -0.2 + ajusteComb + ajusteEdad)
                const precio         = asp(c.b, c.v, -0.3 + ajusteEdad)
                const comodidad      = asp(c.b, c.v, 0.1 + ajusteEdad)
                const mantenimiento  = asp(c.b, c.v, -0.2 + ajusteEdad)
                const repuestos      = asp(c.b, c.v, -0.3 + ajusteEdad)

                const prom = (confiabilidad + seguridad + consumo + precio + comodidad + mantenimiento + repuestos) / 7
                const pool = prom >= 4 ? COMENTARIOS.bueno : prom >= 3 ? COMENTARIOS.regular : COMENTARIOS.malo

                const fecha = fechaAleatoria(120)
                await Valoracion.create({
                    vehiculo: vehiculo._id,
                    usuario: usuario._id,
                    aspectos: { confiabilidad, seguridad, consumo, precio, comodidad, mantenimiento, repuestos },
                    comentario: Math.random() > 0.25 ? aleatorio(pool) : "",
                    createdAt: fecha, updatedAt: fecha
                })
                valoracionesAgregadas++
            }
        }

        console.log(`   ✅ ${valoracionesAgregadas} valoraciones nuevas agregadas`)
        console.log(`   ⏭️  ${valoracionesOmitidas} valoraciones ya existían, omitidas\n`)

        console.log("─".repeat(50))
        console.log("🎉 seedExtra completado")
        console.log("─".repeat(50))
        console.log(`   Vehículos nuevos:     ${vehiculosAgregados}`)
        console.log(`   Reportes nuevos:      ${reportes.length}`)
        console.log(`   Valoraciones nuevas:  ${valoracionesAgregadas}`)
        console.log("─".repeat(50))
        process.exit(0)

    } catch (error) {
        console.error("❌ Error:", error)
        process.exit(1)
    }
}

seed()