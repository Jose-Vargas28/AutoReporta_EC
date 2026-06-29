// ============================================================
//  seedDatos.js — Carga masiva de datos de prueba
//  AutoReporta EC — v3 con versiones, valoraciones Consumer Reports
//
//  Uso: node seedDatos.js
//  ⚠️  Elimina todos los usuarios (no admin), vehículos,
//      fallas, reportes y valoraciones existentes
// ============================================================

import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import User from "./src/models/User.js"
import Vehiculo from "./src/models/Vehiculo.js"
import Falla from "./src/models/Falla.js"
import Reporte from "./src/models/Reporte.js"
import Valoracion from "./src/models/Valoracion.js"

dotenv.config()

const aleatorio = (arr) => arr[Math.floor(Math.random() * arr.length)]
const aleatorioN = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n)
const num = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const numF = (min, max, dec = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(dec))
const fechaAleatoria = (diasAtras = 180) => {
    const d = new Date()
    d.setDate(d.getDate() - num(0, diasAtras))
    d.setHours(num(7, 22), num(0, 59))
    return d
}

// ---- USUARIOS ----
const USUARIOS_DATA = [
    { nombre: "Carlos",    apellido: "Andrade",    email: "candrade@mail.com",   region: "Sierra",    provincia: "Pichincha" },
    { nombre: "María",     apellido: "Salazar",    email: "msalazar@mail.com",   region: "Sierra",    provincia: "Pichincha" },
    { nombre: "Jorge",     apellido: "Mosquera",   email: "jmosquera@mail.com",  region: "Sierra",    provincia: "Pichincha" },
    { nombre: "Daniela",   apellido: "Ortiz",      email: "dortiz@mail.com",     region: "Sierra",    provincia: "Pichincha" },
    { nombre: "Sebastián", apellido: "Ríos",       email: "srios@mail.com",      region: "Sierra",    provincia: "Tungurahua" },
    { nombre: "Valeria",   apellido: "Cárdenas",   email: "vcardenas@mail.com",  region: "Sierra",    provincia: "Tungurahua" },
    { nombre: "Pablo",     apellido: "Herrera",    email: "pherrera@mail.com",   region: "Sierra",    provincia: "Azuay" },
    { nombre: "Sofía",     apellido: "Mora",       email: "smora@mail.com",      region: "Sierra",    provincia: "Azuay" },
    { nombre: "Diego",     apellido: "Castillo",   email: "dcastillo@mail.com",  region: "Sierra",    provincia: "Imbabura" },
    { nombre: "Gabriela",  apellido: "Vega",       email: "gvega@mail.com",      region: "Sierra",    provincia: "Cotopaxi" },
    { nombre: "Andrés",    apellido: "Tapia",      email: "atapia@mail.com",     region: "Sierra",    provincia: "Chimborazo" },
    { nombre: "Camila",    apellido: "Paredes",    email: "cparedes@mail.com",   region: "Sierra",    provincia: "Loja" },
    { nombre: "Ricardo",   apellido: "Espinoza",   email: "respinoza@mail.com",  region: "Sierra",    provincia: "Carchi" },
    { nombre: "Fernanda",  apellido: "Lara",       email: "flara@mail.com",      region: "Sierra",    provincia: "Cañar" },
    { nombre: "Mateo",     apellido: "Guevara",    email: "mguevara@mail.com",   region: "Sierra",    provincia: "Bolívar" },
    { nombre: "Luis",      apellido: "Mendoza",    email: "lmendoza@mail.com",   region: "Costa",     provincia: "Guayas" },
    { nombre: "Ana",       apellido: "Torres",     email: "atorres@mail.com",    region: "Costa",     provincia: "Guayas" },
    { nombre: "Roberto",   apellido: "Freire",     email: "rfreire@mail.com",    region: "Costa",     provincia: "Manabí" },
    { nombre: "Patricia",  apellido: "Suárez",     email: "psuarez@mail.com",    region: "Costa",     provincia: "El Oro" },
    { nombre: "Miguel",    apellido: "Alvarado",   email: "malvarado@mail.com",  region: "Costa",     provincia: "Esmeraldas" },
    { nombre: "José",      apellido: "Pintado",    email: "jpintado@mail.com",   region: "Oriente",   provincia: "Napo" },
    { nombre: "Carmen",    apellido: "Aguirre",    email: "caguirre@mail.com",   region: "Oriente",   provincia: "Pastaza" },
    { nombre: "Nelson",    apellido: "Shiguango",  email: "nshiguango@mail.com", region: "Oriente",   provincia: "Orellana" },
    { nombre: "Iván",      apellido: "Granja",     email: "igranja@mail.com",    region: "Galápagos", provincia: "Galápagos" },
    { nombre: "Rosa",      apellido: "Cedeño",     email: "rcedeno@mail.com",    region: "Galápagos", provincia: "Galápagos" },
]

// ---- VEHÍCULOS con versiones ----
// Formato: { marca, modelo, anio, version, tipo, combustible }
const VEHICULOS_DATA = [
    // ===== TOYOTA — top fiabilidad =====
    { marca: "Toyota", modelo: "Corolla", anio: 1998, version: "1.8 MT",        tipo: "automóvil", combustible: "gasolina" },
    { marca: "Toyota", modelo: "Corolla", anio: 2005, version: "1.8 MT",        tipo: "automóvil", combustible: "gasolina" },
    { marca: "Toyota", modelo: "Corolla", anio: 2010, version: "1.8 AT",        tipo: "automóvil", combustible: "gasolina" },
    { marca: "Toyota", modelo: "Corolla", anio: 2015, version: "1.8 AT",        tipo: "automóvil", combustible: "gasolina" },
    { marca: "Toyota", modelo: "Corolla", anio: 2020, version: "2.0 AT XEI",    tipo: "automóvil", combustible: "gasolina" },
    { marca: "Toyota", modelo: "Corolla", anio: 2022, version: "1.8 Hybrid",    tipo: "automóvil", combustible: "híbrido" },
    { marca: "Toyota", modelo: "Hilux",   anio: 2005, version: "2.5 4x2 MT",    tipo: "camioneta", combustible: "diésel" },
    { marca: "Toyota", modelo: "Hilux",   anio: 2010, version: "2.5 4x4 MT",    tipo: "camioneta", combustible: "diésel" },
    { marca: "Toyota", modelo: "Hilux",   anio: 2016, version: "2.8 4x4 AT",    tipo: "camioneta", combustible: "diésel" },
    { marca: "Toyota", modelo: "Hilux",   anio: 2021, version: "2.8 4x4 AT GR", tipo: "camioneta", combustible: "diésel" },
    { marca: "Toyota", modelo: "RAV4",    anio: 2012, version: "2.0 4x2 AT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Toyota", modelo: "RAV4",    anio: 2019, version: "2.5 4x4 AT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Toyota", modelo: "RAV4",    anio: 2022, version: "2.5 Hybrid AWD", tipo: "suv",      combustible: "híbrido" },
    { marca: "Toyota", modelo: "Land Cruiser Prado", anio: 2010, version: "3.0 TDI 4x4", tipo: "suv", combustible: "diésel" },
    { marca: "Toyota", modelo: "Land Cruiser Prado", anio: 2018, version: "2.8 TDI 4x4", tipo: "suv", combustible: "diésel" },
    { marca: "Toyota", modelo: "Yaris",   anio: 2018, version: "1.5 AT",        tipo: "automóvil", combustible: "gasolina" },
    { marca: "Toyota", modelo: "Yaris",   anio: 2022, version: "1.5 Hybrid",    tipo: "automóvil", combustible: "híbrido" },

    // ===== MAZDA — top fiabilidad =====
    { marca: "Mazda", modelo: "3",    anio: 2012, version: "1.6 MT Sedan",  tipo: "automóvil", combustible: "gasolina" },
    { marca: "Mazda", modelo: "3",    anio: 2017, version: "2.0 AT Sedan",  tipo: "automóvil", combustible: "gasolina" },
    { marca: "Mazda", modelo: "3",    anio: 2021, version: "2.5 AT Sedan",  tipo: "automóvil", combustible: "gasolina" },
    { marca: "Mazda", modelo: "CX-5", anio: 2016, version: "2.0 4x2 AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Mazda", modelo: "CX-5", anio: 2019, version: "2.5 4x4 AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Mazda", modelo: "CX-5", anio: 2022, version: "2.5 Turbo AWD",tipo: "suv",       combustible: "gasolina" },
    { marca: "Mazda", modelo: "CX-30", anio: 2021, version: "2.0 AT",      tipo: "suv",       combustible: "gasolina" },
    { marca: "Mazda", modelo: "323",   anio: 2000, version: "1.3 MT",      tipo: "automóvil", combustible: "gasolina" },

    // ===== HONDA =====
    { marca: "Honda", modelo: "Civic",  anio: 2008, version: "1.8 MT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Honda", modelo: "Civic",  anio: 2015, version: "1.8 AT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Honda", modelo: "Civic",  anio: 2021, version: "1.5T CVT",    tipo: "automóvil", combustible: "gasolina" },
    { marca: "Honda", modelo: "HR-V",   anio: 2016, version: "1.8 CVT 4x2", tipo: "suv",       combustible: "gasolina" },
    { marca: "Honda", modelo: "HR-V",   anio: 2021, version: "1.5T CVT AWD",tipo: "suv",       combustible: "gasolina" },
    { marca: "Honda", modelo: "CR-V",   anio: 2018, version: "1.5T CVT AWD",tipo: "suv",       combustible: "gasolina" },
    { marca: "Honda", modelo: "CR-V",   anio: 2022, version: "2.0 Hybrid",  tipo: "suv",       combustible: "híbrido" },
    { marca: "Honda", modelo: "CB160F", anio: 2021, version: "160cc",       tipo: "moto",      combustible: "gasolina" },

    // ===== KIA =====
    { marca: "Kia", modelo: "Sportage", anio: 2010, version: "2.0 4x2 MT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Kia", modelo: "Sportage", anio: 2016, version: "2.0 4x4 AT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Kia", modelo: "Sportage", anio: 2021, version: "2.0 4x4 AT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Kia", modelo: "Rio",      anio: 2013, version: "1.4 MT Sedan",tipo: "automóvil", combustible: "gasolina" },
    { marca: "Kia", modelo: "Rio",      anio: 2018, version: "1.4 AT Sedan",tipo: "automóvil", combustible: "gasolina" },
    { marca: "Kia", modelo: "Rio",      anio: 2022, version: "1.4 AT Hatch",tipo: "automóvil", combustible: "gasolina" },
    { marca: "Kia", modelo: "Picanto",  anio: 2018, version: "1.2 AT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Kia", modelo: "Seltos",   anio: 2021, version: "1.5 CVT",     tipo: "suv",       combustible: "gasolina" },
    { marca: "Kia", modelo: "EV6",      anio: 2023, version: "AWD",         tipo: "suv",       combustible: "eléctrico" },

    // ===== HYUNDAI =====
    { marca: "Hyundai", modelo: "Tucson",  anio: 2012, version: "2.0 4x2 AT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Tucson",  anio: 2017, version: "2.0 4x4 AT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Tucson",  anio: 2022, version: "1.6T Hybrid",  tipo: "suv",       combustible: "híbrido" },
    { marca: "Hyundai", modelo: "Accent",  anio: 2010, version: "1.4 MT Sedan", tipo: "automóvil", combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Accent",  anio: 2016, version: "1.6 AT Sedan", tipo: "automóvil", combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Accent",  anio: 2021, version: "1.6 AT Hatch", tipo: "automóvil", combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Santa Fe",anio: 2019, version: "2.4 4x4 AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Hyundai", modelo: "Ioniq 5", anio: 2022, version: "AWD 72kWh",    tipo: "suv",       combustible: "eléctrico" },
    { marca: "Hyundai", modelo: "H1",      anio: 2019, version: "2.5 AT",       tipo: "vehículo comercial", combustible: "gasolina" },

    // ===== NISSAN =====
    { marca: "Nissan", modelo: "Sentra",   anio: 2007, version: "1.8 MT",       tipo: "automóvil", combustible: "gasolina" },
    { marca: "Nissan", modelo: "Sentra",   anio: 2014, version: "1.8 CVT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Nissan", modelo: "Sentra",   anio: 2021, version: "2.0 CVT SR",   tipo: "automóvil", combustible: "gasolina" },
    { marca: "Nissan", modelo: "Frontier", anio: 2008, version: "2.5 4x2 MT",   tipo: "camioneta", combustible: "diésel" },
    { marca: "Nissan", modelo: "Frontier", anio: 2015, version: "2.5 4x4 MT",   tipo: "camioneta", combustible: "diésel" },
    { marca: "Nissan", modelo: "Frontier", anio: 2021, version: "2.5 4x4 AT",   tipo: "camioneta", combustible: "diésel" },
    { marca: "Nissan", modelo: "X-Trail",  anio: 2018, version: "2.0 4x4 CVT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Nissan", modelo: "Pathfinder",anio: 2003, version: "3.5 4x4 AT",  tipo: "suv",       combustible: "gasolina" },

    // ===== CHEVROLET =====
    { marca: "Chevrolet", modelo: "Aveo",    anio: 2008, version: "1.5 MT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Aveo",    anio: 2012, version: "1.6 MT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Aveo",    anio: 2016, version: "1.5 AT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Aveo",    anio: 2020, version: "1.5 AT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Sail",    anio: 2015, version: "1.5 MT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Sail",    anio: 2019, version: "1.5 AT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Tracker", anio: 2016, version: "1.8 4x2 AT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Tracker", anio: 2020, version: "1.2T 4x2 AT", tipo: "suv",       combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Tracker", anio: 2023, version: "1.2T 4x4 AT", tipo: "suv",       combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "D-Max",   anio: 2010, version: "2.5 4x2 MT",  tipo: "camioneta", combustible: "diésel" },
    { marca: "Chevrolet", modelo: "D-Max",   anio: 2016, version: "2.5 4x4 MT",  tipo: "camioneta", combustible: "diésel" },
    { marca: "Chevrolet", modelo: "D-Max",   anio: 2022, version: "3.0 4x4 AT",  tipo: "camioneta", combustible: "diésel" },
    { marca: "Chevrolet", modelo: "Captiva", anio: 2012, version: "2.4 4x2 AT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Chevrolet", modelo: "Captiva", anio: 2021, version: "1.5T 4x4 AT", tipo: "suv",       combustible: "gasolina" },

    // ===== VOLKSWAGEN =====
    { marca: "Volkswagen", modelo: "Golf",   anio: 2005, version: "1.6 MT",      tipo: "automóvil", combustible: "gasolina" },
    { marca: "Volkswagen", modelo: "Golf",   anio: 2012, version: "1.4T MT",     tipo: "automóvil", combustible: "gasolina" },
    { marca: "Volkswagen", modelo: "Golf",   anio: 2018, version: "1.4T AT",     tipo: "automóvil", combustible: "gasolina" },
    { marca: "Volkswagen", modelo: "Golf",   anio: 2022, version: "2.0T DSG",    tipo: "automóvil", combustible: "gasolina" },
    { marca: "Volkswagen", modelo: "Tiguan", anio: 2017, version: "1.4T 4x2 AT", tipo: "suv",       combustible: "gasolina" },
    { marca: "Volkswagen", modelo: "Tiguan", anio: 2021, version: "2.0T 4x4 AT", tipo: "suv",       combustible: "gasolina" },
    { marca: "Volkswagen", modelo: "Crafter",anio: 2018, version: "2.0 TDI",     tipo: "vehículo comercial", combustible: "diésel" },

    // ===== RENAULT =====
    { marca: "Renault", modelo: "Duster",  anio: 2013, version: "1.6 4x2 MT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Renault", modelo: "Duster",  anio: 2018, version: "1.6 4x4 MT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Renault", modelo: "Duster",  anio: 2022, version: "2.0 4x4 CVT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Renault", modelo: "Logan",   anio: 2008, version: "1.4 MT",       tipo: "automóvil", combustible: "gasolina" },
    { marca: "Renault", modelo: "Logan",   anio: 2015, version: "1.6 MT",       tipo: "automóvil", combustible: "gasolina" },
    { marca: "Renault", modelo: "Kwid",    anio: 2019, version: "1.0 MT",       tipo: "automóvil", combustible: "gasolina" },
    { marca: "Renault", modelo: "Kwid",    anio: 2022, version: "1.0 CVT",      tipo: "automóvil", combustible: "gasolina" },

    // ===== FORD =====
    { marca: "Ford", modelo: "Ranger",   anio: 2008, version: "2.5 4x2 MT",    tipo: "camioneta", combustible: "diésel" },
    { marca: "Ford", modelo: "Ranger",   anio: 2014, version: "3.2 4x4 AT",    tipo: "camioneta", combustible: "diésel" },
    { marca: "Ford", modelo: "Ranger",   anio: 2020, version: "3.2 4x4 AT",    tipo: "camioneta", combustible: "diésel" },
    { marca: "Ford", modelo: "Explorer", anio: 2003, version: "4.0 4x4 AT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Ford", modelo: "Escape",   anio: 2017, version: "2.0T 4x4 AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Ford", modelo: "Transit",  anio: 2012, version: "2.2 TDCi MT",   tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Ford", modelo: "Transit",  anio: 2020, version: "2.0 EcoBlue AT",tipo: "vehículo comercial", combustible: "diésel" },

    // ===== BMW =====
    { marca: "BMW", modelo: "320i",  anio: 2013, version: "2.0T AT",          tipo: "automóvil", combustible: "gasolina" },
    { marca: "BMW", modelo: "320i",  anio: 2018, version: "2.0T AT Sport",    tipo: "automóvil", combustible: "gasolina" },
    { marca: "BMW", modelo: "320i",  anio: 2022, version: "2.0T AT M Sport",  tipo: "automóvil", combustible: "gasolina" },
    { marca: "BMW", modelo: "X3",    anio: 2017, version: "2.0T xDrive AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "BMW", modelo: "X5",    anio: 2019, version: "3.0T xDrive AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "BMW", modelo: "X5",    anio: 2022, version: "xDrive45e Hybrid", tipo: "suv",       combustible: "híbrido" },

    // ===== MERCEDES-BENZ =====
    { marca: "Mercedes-Benz", modelo: "C180",    anio: 2012, version: "1.6T AT",        tipo: "automóvil", combustible: "gasolina" },
    { marca: "Mercedes-Benz", modelo: "C200",    anio: 2018, version: "1.5T EQ Boost",  tipo: "automóvil", combustible: "híbrido" },
    { marca: "Mercedes-Benz", modelo: "C200",    anio: 2022, version: "2.0T AT AMG",    tipo: "automóvil", combustible: "gasolina" },
    { marca: "Mercedes-Benz", modelo: "GLC 300", anio: 2020, version: "2.0T 4MATIC AT", tipo: "suv",       combustible: "gasolina" },
    { marca: "Mercedes-Benz", modelo: "Sprinter",anio: 2016, version: "2.1 CDI MT",     tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Mercedes-Benz", modelo: "Sprinter",anio: 2021, version: "2.0 CDI AT",     tipo: "vehículo comercial", combustible: "diésel" },

    // ===== AUDI =====
    { marca: "Audi", modelo: "A4", anio: 2012, version: "1.8T AT",           tipo: "automóvil", combustible: "gasolina" },
    { marca: "Audi", modelo: "A4", anio: 2018, version: "2.0T Quattro AT",   tipo: "automóvil", combustible: "gasolina" },
    { marca: "Audi", modelo: "A4", anio: 2022, version: "2.0T Quattro S-T",  tipo: "automóvil", combustible: "gasolina" },
    { marca: "Audi", modelo: "Q5", anio: 2017, version: "2.0T Quattro AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Audi", modelo: "Q5", anio: 2021, version: "2.0T TFSI Quattro", tipo: "suv",       combustible: "gasolina" },

    // ===== VOLVO =====
    { marca: "Volvo", modelo: "XC60",  anio: 2019, version: "T5 AWD AT",      tipo: "suv",       combustible: "gasolina" },
    { marca: "Volvo", modelo: "XC60",  anio: 2022, version: "T6 Hybrid AWD",  tipo: "suv",       combustible: "híbrido" },
    { marca: "Volvo", modelo: "XC40",  anio: 2021, version: "Recharge P8 EV", tipo: "suv",       combustible: "eléctrico" },

    // ===== SUZUKI =====
    { marca: "Suzuki", modelo: "Vitara",       anio: 2008, version: "2.0 4x4 MT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Suzuki", modelo: "Vitara",       anio: 2017, version: "1.6 4x2 AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Suzuki", modelo: "Vitara",       anio: 2022, version: "1.4T Hybrid",  tipo: "suv",       combustible: "híbrido" },
    { marca: "Suzuki", modelo: "Grand Vitara", anio: 2005, version: "2.0 4x4 MT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Suzuki", modelo: "Swift",        anio: 2018, version: "1.2 MT",       tipo: "automóvil", combustible: "gasolina" },
    { marca: "Suzuki", modelo: "GS150R",       anio: 2020, version: "150cc",        tipo: "moto",      combustible: "gasolina" },

    // ===== MITSUBISHI =====
    { marca: "Mitsubishi", modelo: "L200",         anio: 2007, version: "2.5 4x2 MT",   tipo: "camioneta", combustible: "diésel" },
    { marca: "Mitsubishi", modelo: "L200",         anio: 2014, version: "2.5 4x4 MT",   tipo: "camioneta", combustible: "diésel" },
    { marca: "Mitsubishi", modelo: "L200",         anio: 2020, version: "2.4 4x4 AT",   tipo: "camioneta", combustible: "diésel" },
    { marca: "Mitsubishi", modelo: "Montero Sport",anio: 2002, version: "3.0 4x4 AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Mitsubishi", modelo: "Outlander",    anio: 2019, version: "2.0 4x2 CVT",  tipo: "suv",       combustible: "gasolina" },

    // ===== JEEP =====
    { marca: "Jeep", modelo: "Wrangler",      anio: 2015, version: "3.6 4x4 AT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Jeep", modelo: "Wrangler",      anio: 2021, version: "2.0T 4x4 AT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Jeep", modelo: "Grand Cherokee",anio: 2008, version: "3.7 4x4 AT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Jeep", modelo: "Grand Cherokee",anio: 2019, version: "3.6 4x4 AT",    tipo: "suv",       combustible: "gasolina" },

    // ===== LAND ROVER =====
    { marca: "Land Rover", modelo: "Discovery",anio: 2016, version: "3.0 TDV6 4x4", tipo: "suv",       combustible: "diésel" },
    { marca: "Land Rover", modelo: "Defender", anio: 2021, version: "2.0T 4x4 AT",  tipo: "suv",       combustible: "gasolina" },

    // ===== PEUGEOT =====
    { marca: "Peugeot", modelo: "206", anio: 2003, version: "1.4 MT",         tipo: "automóvil", combustible: "gasolina" },
    { marca: "Peugeot", modelo: "208", anio: 2019, version: "1.2T AT",        tipo: "automóvil", combustible: "gasolina" },
    { marca: "Peugeot", modelo: "208", anio: 2022, version: "1.2T AT Allure", tipo: "automóvil", combustible: "gasolina" },

    // ===== CHINAS =====
    { marca: "Chery",     modelo: "Tiggo 2", anio: 2018, version: "1.5 MT",    tipo: "suv",       combustible: "gasolina" },
    { marca: "Chery",     modelo: "Tiggo 2", anio: 2021, version: "1.5 CVT",   tipo: "suv",       combustible: "gasolina" },
    { marca: "Chery",     modelo: "Tiggo 7", anio: 2020, version: "1.5T CVT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Chery",     modelo: "Tiggo 7", anio: 2022, version: "1.6T CVT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "JAC",       modelo: "T8",      anio: 2019, version: "2.0T 4x2",  tipo: "camioneta", combustible: "gasolina" },
    { marca: "JAC",       modelo: "T8",      anio: 2022, version: "2.0T 4x4",  tipo: "camioneta", combustible: "gasolina" },
    { marca: "JAC",       modelo: "S4",      anio: 2020, version: "1.5T CVT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "BYD",       modelo: "Atto 3",  anio: 2022, version: "60kWh FWD", tipo: "suv",       combustible: "eléctrico" },
    { marca: "BYD",       modelo: "Atto 3",  anio: 2023, version: "60kWh AWD", tipo: "suv",       combustible: "eléctrico" },
    { marca: "BYD",       modelo: "Dolphin", anio: 2023, version: "44kWh",     tipo: "automóvil", combustible: "eléctrico" },
    { marca: "Changan",   modelo: "CS35 Plus",anio: 2021, version: "1.4T MT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "Changan",   modelo: "CS35 Plus",anio: 2023, version: "1.4T CVT", tipo: "suv",       combustible: "gasolina" },
    { marca: "Great Wall",modelo: "Poer",    anio: 2021, version: "2.0T 4x4",  tipo: "camioneta", combustible: "diésel" },
    { marca: "Jetour",    modelo: "X70",     anio: 2021, version: "1.5T CVT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "DFSK",      modelo: "Glory 580",anio: 2020, version: "1.5T MT",  tipo: "suv",       combustible: "gasolina" },
    { marca: "DFSK",      modelo: "Glory 580",anio: 2022, version: "1.5T CVT", tipo: "suv",       combustible: "gasolina" },

    // ===== COMERCIALES =====
    { marca: "Hino",    modelo: "300 Series", anio: 2012, version: "4.0 TDI",      tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Hino",    modelo: "300 Series", anio: 2019, version: "5.1 TDI",      tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Hino",    modelo: "500 Series", anio: 2018, version: "7.7 TDI",      tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Foton",   modelo: "Aumark",     anio: 2019, version: "2.8 TDI",      tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Foton",   modelo: "View CS2",   anio: 2021, version: "2.0 MT 15p",   tipo: "vehículo comercial", combustible: "gasolina" },
    { marca: "King Long",modelo: "XMQ6900",   anio: 2019, version: "Diésel 35p",   tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Yutong",  modelo: "ZK6930H",    anio: 2020, version: "Diésel 45p",   tipo: "vehículo comercial", combustible: "diésel" },
    { marca: "Scania",  modelo: "F250",       anio: 2018, version: "DC9 360HP",    tipo: "vehículo comercial", combustible: "diésel" },

    // ===== MOTOS =====
    { marca: "Yamaha", modelo: "FZ 15",    anio: 2019, version: "150cc",       tipo: "moto", combustible: "gasolina" },
    { marca: "Yamaha", modelo: "FZ 15",    anio: 2022, version: "150cc ABS",   tipo: "moto", combustible: "gasolina" },
    { marca: "Yamaha", modelo: "MT-03",    anio: 2021, version: "321cc ABS",   tipo: "moto", combustible: "gasolina" },
    { marca: "Yamaha", modelo: "YBR 125",  anio: 2012, version: "125cc",       tipo: "moto", combustible: "gasolina" },
    { marca: "Bajaj",  modelo: "Pulsar NS200", anio: 2020, version: "200cc",   tipo: "moto", combustible: "gasolina" },
    { marca: "Bajaj",  modelo: "Rouser 135",   anio: 2015, version: "135cc",   tipo: "moto", combustible: "gasolina" },
    { marca: "Bajaj",  modelo: "Rouser 135",   anio: 2020, version: "135cc NS",tipo: "moto", combustible: "gasolina" },
    { marca: "Kawasaki",modelo: "Z400",    anio: 2021, version: "399cc ABS",   tipo: "moto", combustible: "gasolina" },
    { marca: "AKT",    modelo: "TTX 125",  anio: 2020, version: "125cc",       tipo: "moto", combustible: "gasolina" },
    { marca: "Hero",   modelo: "Hunk 160R",anio: 2021, version: "160cc ABS",   tipo: "moto", combustible: "gasolina" },
]

// ---- FALLAS ----
const FALLAS_DATA = [
    { nombre: "Falla en frenos",              descripcion: "El sistema de frenos no responde o presenta ruidos",           gravedad: "alta" },
    { nombre: "Problemas de dirección",       descripcion: "Dificultad para girar o vibración en el volante",             gravedad: "alta" },
    { nombre: "Falla en transmisión",         descripcion: "Cambios bruscos, resbalones o ruidos en la caja de cambios",  gravedad: "alta" },
    { nombre: "Problema en motor",            descripcion: "Pérdida de potencia, ruidos inusuales o humo excesivo",       gravedad: "alta" },
    { nombre: "Falla en sistema eléctrico",   descripcion: "Cortocircuitos, luces que no funcionan o batería que no carga",gravedad: "alta" },
    { nombre: "Banda de distribución",        descripcion: "Desgaste prematuro o rotura de la banda de distribución",     gravedad: "alta" },
    { nombre: "Sobrecalentamiento",           descripcion: "El motor alcanza temperaturas excesivas con frecuencia",       gravedad: "alta" },
    { nombre: "Airbag defectuoso",            descripcion: "El airbag no se despliega correctamente o lo hace sin motivo", gravedad: "alta" },
    { nombre: "Falla en batería eléctrica",   descripcion: "Degradación prematura o falla en batería de vehículo eléctrico/híbrido", gravedad: "alta" },
    { nombre: "Falla en suspensión",          descripcion: "Ruidos, golpes o inestabilidad en la suspensión",             gravedad: "media" },
    { nombre: "Consumo excesivo de combustible", descripcion: "El vehículo consume más combustible de lo normal",         gravedad: "media" },
    { nombre: "Problema en radiador",         descripcion: "Fugas de refrigerante o falla en la disipación de calor",     gravedad: "media" },
    { nombre: "Falla en embrague",            descripcion: "El embrague resbala, hace ruido o no conecta bien",           gravedad: "media" },
    { nombre: "Problema en escape",           descripcion: "Ruidos excesivos, fugas de gases o humo anormal",             gravedad: "media" },
    { nombre: "Falla en caja automática",     descripcion: "Cambios irregulares o impactos al cambiar de marcha",         gravedad: "media" },
    { nombre: "Consumo excesivo de aceite",   descripcion: "El motor consume aceite en cantidades anormales",             gravedad: "media" },
    { nombre: "Carrocería con corrosión",     descripcion: "Oxidación prematura en partes de la carrocería",              gravedad: "media" },
    { nombre: "Problema en turbo",            descripcion: "Pérdida de potencia o ruidos del turbocompresor",             gravedad: "media" },
    { nombre: "Falla en sistema de carga EV", descripcion: "El vehículo eléctrico no carga o lo hace lentamente",        gravedad: "media" },
    { nombre: "Falla en luces",               descripcion: "Luces que se apagan solas, parpadean o no encienden",         gravedad: "baja" },
    { nombre: "Problema en aire acondicionado", descripcion: "El A/C no enfría correctamente o hace ruidos",             gravedad: "baja" },
    { nombre: "Ruido en interiores",          descripcion: "Ruidos y vibraciones molestas en el habitáculo",              gravedad: "baja" },
    { nombre: "Problema en parabrisas",       descripcion: "Fisuras, deslaminación o defectos en el vidrio",              gravedad: "baja" },
    { nombre: "Falla en cierre centralizado", descripcion: "Las puertas no se bloquean o desbloquean correctamente",      gravedad: "baja" },
    { nombre: "Problema en sensores",         descripcion: "Sensores de parqueo, lluvia o temperatura con fallas",        gravedad: "baja" },
    { nombre: "Pintura defectuosa",           descripcion: "Desprendimiento, burbujas o cambio de color en la pintura",   gravedad: "baja" },
    { nombre: "Falla en infotainment",        descripcion: "Pantalla táctil que no responde, freezes o errores de software", gravedad: "baja" },
]

// Confiabilidad por marca basada en Consumer Reports 2025
// Escala 1-5: Toyota/Mazda/Honda = 4.2-5.0, Koreanas = 3.5-4.2, Europeas = 3.0-3.8, Americanas/Chinas = 2.0-3.5
const CONFIABILIDAD_MARCA = {
    "Toyota":        { base: 4.6, var: 0.3 },
    "Mazda":         { base: 4.5, var: 0.3 },
    "Honda":         { base: 4.4, var: 0.3 },
    "Subaru":        { base: 4.3, var: 0.3 },
    "Kia":           { base: 4.0, var: 0.4 },
    "Hyundai":       { base: 3.9, var: 0.4 },
    "BMW":           { base: 3.8, var: 0.4 },
    "Audi":          { base: 3.7, var: 0.4 },
    "Volvo":         { base: 3.7, var: 0.4 },
    "Suzuki":        { base: 3.8, var: 0.3 },
    "Mitsubishi":    { base: 3.6, var: 0.4 },
    "Volkswagen":    { base: 3.4, var: 0.5 },
    "Nissan":        { base: 3.3, var: 0.5 },
    "Mercedes-Benz": { base: 3.3, var: 0.5 },
    "Peugeot":       { base: 3.2, var: 0.5 },
    "Renault":       { base: 3.1, var: 0.5 },
    "Ford":          { base: 3.0, var: 0.5 },
    "Chevrolet":     { base: 2.9, var: 0.5 },
    "Jeep":          { base: 2.8, var: 0.6 },
    "Land Rover":    { base: 2.7, var: 0.6 },
    "Chery":         { base: 2.8, var: 0.5 },
    "Changan":       { base: 2.7, var: 0.5 },
    "JAC":           { base: 2.6, var: 0.5 },
    "BYD":           { base: 2.5, var: 0.6 },
    "Great Wall":    { base: 2.4, var: 0.5 },
    "Jetour":        { base: 2.4, var: 0.5 },
    "DFSK":          { base: 2.2, var: 0.5 },
    "Hino":          { base: 3.5, var: 0.4 },
    "Foton":         { base: 2.8, var: 0.5 },
    "Scania":        { base: 4.0, var: 0.3 },
    "Yamaha":        { base: 4.2, var: 0.3 },
    "Kawasaki":      { base: 4.0, var: 0.3 },
    "Honda_moto":    { base: 4.3, var: 0.3 },
    "Bajaj":         { base: 3.5, var: 0.4 },
    "Suzuki_moto":   { base: 3.8, var: 0.3 },
}

const getConfiabilidad = (marca) => {
    const c = CONFIABILIDAD_MARCA[marca] || { base: 3.0, var: 0.5 }
    return c
}

const puntajeAspecto = (base, variacion, ajuste = 0) => {
    const raw = base + ajuste + (Math.random() * variacion * 2 - variacion)
    return Math.min(5, Math.max(1, Math.round(raw)))
}

const DESCRIPCIONES = [
    "El problema apareció de la nada. Ya lo llevé al taller pero no encontraron la falla.",
    "Lo he notado desde hace unos 3 meses. Cada vez empeora más.",
    "El concesionario me dijo que es normal, pero claramente algo está mal.",
    "Sucede especialmente cuando el vehículo está frío, al arrancar en las mañanas.",
    "Tuve que dejar el vehículo en el taller por una semana. El repuesto tardó en llegar.",
    "Varios vecinos tienen el mismo modelo y reportan el mismo problema. Parece ser de fábrica.",
    "Ya cambié las piezas dos veces pero el problema regresa al poco tiempo.",
    "El problema se presentó apenas cumplí la garantía. Muy sospechoso.",
    "Me sucedió en plena carretera, fue muy peligroso.",
    "Ya hice el reclamo formal al importador pero no me han dado solución.",
    "El taller me indicó que es un defecto de diseño conocido en este modelo.",
    "Empezó con un pequeño ruido y ahora ya es una falla completa del sistema.",
    "Lo noté en el primer año de uso, con apenas 15.000 km recorridos.",
    "Fui a revisar y me confirmaron que es un problema recurrente en este vehículo.",
    "El manual no menciona nada al respecto pero claramente no es normal.",
]

const COMENTARIOS_VALORACION = {
    bueno: [
        "Excelente vehículo, muy confiable para el día a día. Lo recomiendo ampliamente.",
        "Buen auto en general, el mantenimiento es accesible y los repuestos fáciles de conseguir.",
        "Lo he tenido por 4 años sin problemas mayores, muy confiable para la sierra ecuatoriana.",
        "Muy cómodo para viajes largos, la suspensión es excelente en carretera.",
        "El consumo de combustible es muy bueno para el tamaño del vehículo.",
        "Excelente relación calidad-precio, superó mis expectativas.",
        "El servicio postventa del concesionario es muy bueno, resuelven todo rápido.",
    ],
    regular: [
        "Buen auto pero el consumo de combustible podría mejorar.",
        "Los repuestos son un poco caros pero el vehículo vale la pena.",
        "Buena relación calidad-precio aunque en carretera de tierra se siente un poco inestable.",
        "El mantenimiento es un poco costoso pero la calidad está ahí.",
        "Buen vehículo en general, aunque la electrónica ha dado algunos problemas.",
        "Funciona bien pero los repuestos son difíciles de conseguir fuera de la capital.",
    ],
    malo: [
        "Ya tuve que cambiar piezas importantes con pocos kilómetros, no lo recomiendo.",
        "Los repuestos son muy caros y difíciles de conseguir. Mucho cuidado.",
        "El concesionario no da buenas soluciones a los problemas de fábrica.",
        "La calidad de los materiales deja mucho que desear para el precio que cuesta.",
        "Muchos problemas eléctricos desde el primer año. No lo volvería a comprar.",
        "El soporte técnico es pésimo y los repuestos escasean constantemente.",
    ],
}

// ============================================================
//  SCRIPT PRINCIPAL
// ============================================================
const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("✅ Conectado a MongoDB\n")

        const admin = await User.findOne({ rol: "admin" })
        if (!admin) {
            console.error("❌ No se encontró administrador. Ejecuta primero: node seedAdmin.js")
            process.exit(1)
        }

        // Limpiar
        console.log("🧹 Limpiando datos anteriores...")
        await User.deleteMany({ rol: "usuario" })
        await Vehiculo.deleteMany({})
        await Falla.deleteMany({})
        await Reporte.deleteMany({})
        await Valoracion.deleteMany({})
        console.log("   Datos anteriores eliminados\n")

        // Usuarios
        console.log("👥 Creando usuarios...")
        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash("Password123", salt)
        const usuariosCreados = await User.insertMany(
            USUARIOS_DATA.map(u => ({ ...u, password: passwordHash, confirmEmail: true, rol: "usuario" }))
        )
        console.log(`   ✅ ${usuariosCreados.length} usuarios creados\n`)

        // Vehículos
        console.log("🚗 Creando vehículos...")
        const vehiculosCreados = await Vehiculo.insertMany(
            VEHICULOS_DATA.map(v => ({ ...v, creadoPor: aleatorio(usuariosCreados)._id }))
        )
        console.log(`   ✅ ${vehiculosCreados.length} vehículos creados\n`)

        // Fallas
        console.log("⚠️  Creando fallas...")
        const fallasCreadas = await Falla.insertMany(
            FALLAS_DATA.map(f => ({ ...f, creadoPor: aleatorio(usuariosCreados)._id }))
        )
        console.log(`   ✅ ${fallasCreadas.length} fallas creadas\n`)

        // Reportes — ~150 registros
        console.log("📋 Creando reportes...")
        const todosLosUsuarios = [...usuariosCreados, admin]
        const reportes = []
        const TOTAL_REPORTES = 155

        for (let i = 0; i < TOTAL_REPORTES; i++) {
            const vehiculo = aleatorio(vehiculosCreados)
            const falla = aleatorio(fallasCreadas)
            const usuario = aleatorio(todosLosUsuarios)
            const fechaCreacion = fechaAleatoria(200)
            const r = Math.random()
            let validado = false, validadoEn = null, validadoPor = null
            let activo = true, eliminadoEn = null, eliminadoPor = null

            if (r < 0.62) {
                validado = true
                validadoEn = new Date(fechaCreacion.getTime() + num(1, 5) * 86400000)
                validadoPor = admin._id
            } else if (r < 0.90) {
                validado = false
            } else {
                activo = false
                eliminadoEn = new Date(fechaCreacion.getTime() + num(1, 3) * 86400000)
                eliminadoPor = admin._id
            }

            reportes.push({
                vehiculo: vehiculo._id, falla: falla._id,
                descripcion: aleatorio(DESCRIPCIONES),
                gravedad: falla.gravedad,
                usuario: usuario._id,
                validado, validadoEn, validadoPor,
                activo, eliminadoEn, eliminadoPor,
                imagenes: [], documentos: [], enlaces: [],
                createdAt: fechaCreacion, updatedAt: fechaCreacion
            })
        }

        await Reporte.insertMany(reportes)
        const validos = reportes.filter(r => r.validado && r.activo).length
        const pendientes = reportes.filter(r => !r.validado && r.activo).length
        const eliminados = reportes.filter(r => !r.activo).length
        console.log(`   ✅ ${reportes.length} reportes creados`)
        console.log(`      → ${validos} validados | ${pendientes} pendientes | ${eliminados} eliminados\n`)

        // Valoraciones — basadas en Consumer Reports
        console.log("⭐ Creando valoraciones...")
        const valoraciones = []

        for (const usuario of usuariosCreados) {
            const vehiculosAValorar = aleatorioN(vehiculosCreados, num(2, 5))
            for (const vehiculo of vehiculosAValorar) {
                const conf = getConfiabilidad(vehiculo.marca)
                const base = conf.base
                const v = conf.var

                // Ajuste por tipo de combustible (eléctricos y nuevos híbridos menos fiables según CR)
                const ajusteCombustible = vehiculo.combustible === "eléctrico" ? -0.4
                    : vehiculo.combustible === "híbrido" ? -0.1 : 0

                // Ajuste por antigüedad (vehículos más viejos tienden a tener más fallas)
                const anioActual = new Date().getFullYear()
                const edad = anioActual - vehiculo.anio
                const ajusteEdad = edad > 15 ? -0.3 : edad > 8 ? -0.1 : 0

                const asp = (ajuste = 0) => puntajeAspecto(base, v, ajuste + ajusteCombustible + ajusteEdad)

                const confiabilidad = asp(0)
                const seguridad = asp(0.1)
                const consumo = asp(-0.2)
                const precio = asp(-0.3)
                const comodidad = asp(0.1)
                const mantenimiento = asp(-0.2)
                const repuestos = asp(-0.3)

                const promedioAspectos = (confiabilidad + seguridad + consumo + precio + comodidad + mantenimiento + repuestos) / 7
                const comentarioPool = promedioAspectos >= 4 ? COMENTARIOS_VALORACION.bueno
                    : promedioAspectos >= 3 ? COMENTARIOS_VALORACION.regular
                    : COMENTARIOS_VALORACION.malo

                const fechaVal = fechaAleatoria(120)
                valoraciones.push({
                    vehiculo: vehiculo._id,
                    usuario: usuario._id,
                    aspectos: { confiabilidad, seguridad, consumo, precio, comodidad, mantenimiento, repuestos },
                    comentario: Math.random() > 0.25 ? aleatorio(comentarioPool) : "",
                    createdAt: fechaVal, updatedAt: fechaVal
                })
            }
        }

        // Eliminar duplicados usuario-vehiculo
        const vistos = new Set()
        const valoracionesUnicas = valoraciones.filter(v => {
            const key = `${v.usuario}-${v.vehiculo}`
            if (vistos.has(key)) return false
            vistos.add(key); return true
        })

        await Valoracion.insertMany(valoracionesUnicas)
        console.log(`   ✅ ${valoracionesUnicas.length} valoraciones creadas\n`)

        console.log("─".repeat(50))
        console.log("🎉 Seed completado exitosamente")
        console.log("─".repeat(50))
        console.log(`   Vehículos: ${vehiculosCreados.length}`)
        console.log(`   Fallas:    ${fallasCreadas.length}`)
        console.log(`   Reportes:  ${reportes.length}`)
        console.log(`   Valoraciones: ${valoracionesUnicas.length}`)
        console.log("─".repeat(50))
        console.log("📧 Contraseña de todos los usuarios: Password123")
        console.log("   Ej: candrade@mail.com | lmendoza@mail.com | jpintado@mail.com")
        console.log("─".repeat(50))
        process.exit(0)

    } catch (error) {
        console.error("❌ Error en el seed:", error)
        process.exit(1)
    }
}

seed()