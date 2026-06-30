import ExcelJS from "exceljs"
import PDFDocument from "pdfkit"
import Reporte from "../models/Reporte.js"
import Valoracion from "../models/Valoracion.js"
import Vehiculo from "../models/Vehiculo.js"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// Fuentes con soporte completo de caracteres latinos (tildes, ñ, etc.)
const FONT_NORMAL = join(__dirname, "../../fonts/LiberationSans-Regular.ttf")
const FONT_BOLD   = join(__dirname, "../../fonts/LiberationSans-Bold.ttf")
// Logo del auto para el header de los PDFs
const LOGO_AUTO = join(__dirname, "../../fonts/logo-auto.png")

// Mapa de dominios por marca para obtener el logo desde logo.dev
const DOMINIOS_MARCA = {
    chevrolet: "chevrolet.com", ford: "ford.com", dodge: "dodge.com", ram: "ramtrucks.com",
    jeep: "jeep.com", cadillac: "cadillac.com", gmc: "gmc.com", lincoln: "lincoln.com",
    buick: "buick.com", chrysler: "chrysler.com",
    toyota: "toyota.com", nissan: "nissan-global.com", honda: "honda.com", mazda: "mazda.com",
    suzuki: "globalsuzuki.com", mitsubishi: "mitsubishi-motors.com", subaru: "subaru.com",
    lexus: "lexus.com", infiniti: "infinitiusa.com", acura: "acura.com", isuzu: "isuzu.com",
    daihatsu: "daihatsu.com", hino: "hino-global.com",
    kia: "kia.com", hyundai: "hyundai.com", genesis: "genesis.com", ssangyong: "ssangyong.com",
    volkswagen: "vw.com", bmw: "bmw.com", "mercedes-benz": "mercedes-benz.com", mercedes: "mercedes-benz.com",
    audi: "audi.com", porsche: "porsche.com", opel: "opel.com",
    renault: "renault.com", peugeot: "peugeot.com", citroen: "citroen.com", ds: "dsautomobiles.com",
    fiat: "fiat.com", alfa: "alfaromeo.com", "alfa romeo": "alfaromeo.com", ferrari: "ferrari.com",
    lamborghini: "lamborghini.com", maserati: "maserati.com",
    volvo: "volvocars.com", "land rover": "landrover.com", jaguar: "jaguar.com", mini: "mini.com",
    bentley: "bentleymotors.com", rolls: "rolls-roycemotorcars.com", "rolls-royce": "rolls-roycemotorcars.com",
    seat: "seat.com", cupra: "cupraofficial.com",
    chery: "cheryinternational.com", jac: "jac.com.cn", byd: "byd.com", changan: "globalchangan.com",
    "great wall": "gwm-global.com", gwm: "gwm-global.com", haval: "haval-global.com", jetour: "jetour.com.cn",
    dfsk: "dfskmotor.com", foton: "foton-global.com", geely: "geely.com", mg: "mgmotor.co.uk",
    hongqi: "faw-hongqi.com", omoda: "omoda.com", jaecoo: "jaecoo.com", tank: "gwm-global.com",
    aion: "aion.gac.com.cn", gac: "gac.com.cn", zotye: "zotye.com", lifan: "lifan.com",
    yamaha: "yamaha-motor.com", kawasaki: "kawasaki.com", bajaj: "bajajauto.com", ktm: "ktm.com",
    ducati: "ducati.com", harley: "harley-davidson.com", "harley-davidson": "harley-davidson.com",
    triumph: "triumphmotorcycles.com", hero: "heroMotocorp.com", akt: "aktmotos.com", tvs: "tvsmotor.com",
    royal: "royalenfield.com", "royal enfield": "royalenfield.com", benelli: "benelli.com", cfmoto: "cfmoto.com",
    scania: "scania.com", man: "man.eu", iveco: "iveco.com", kinglong: "kinglong.com.cn",
    yutong: "yutong.com", marcopolo: "marcopolo.com.br",
    tesla: "tesla.com", rivian: "rivian.com", lucid: "lucidmotors.com",
}

const getLogoMarcaUrl = (marca) => {
    const dominio = DOMINIOS_MARCA[(marca || "").trim().toLowerCase()]
    if (!dominio) return null
    const token = process.env.LOGO_DEV_TOKEN || ""
    const params = new URLSearchParams({ size: "120", format: "png" })
    if (token) params.append("token", token)
    return `https://img.logo.dev/${dominio}?${params}`
}

// Descarga un archivo remoto (http/https) y devuelve el buffer, o null si falla
const descargarBuffer = (url) => new Promise(async (resolve) => {
    try {
        const https = await import("https")
        const http = await import("http")
        const cliente = url.startsWith("https") ? https.default : http.default
        cliente.get(url, (resp) => {
            if (resp.statusCode !== 200) { resolve(null); return }
            const chunks = []
            resp.on("data", c => chunks.push(c))
            resp.on("end", () => resolve(Buffer.concat(chunks)))
            resp.on("error", () => resolve(null))
        }).on("error", () => resolve(null))
    } catch { resolve(null) }
})

const popReporte = (query) =>
    query
        .populate("vehiculo", "marca modelo anio tipo combustible")
        .populate("falla", "nombre descripcion")
        .populate("usuario", "nombre apellido email region provincia")
        .populate("validadoPor", "nombre apellido")

const nombreCompleto = (persona) =>
    `${persona?.nombre || ""} ${persona?.apellido || ""}`.trim() || "—"

const fechaLarga = (f) =>
    f ? new Date(f).toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" }) : "—"

const fechaCorta = (f) =>
    f ? new Date(f).toLocaleDateString("es-EC") : "—"

// =============================================================
//  EXPORTAR REPORTES VALIDADOS A EXCEL
//  Respeta los mismos filtros (busqueda, gravedad) que la vista
//  "Ver reportes", para que el admin pueda exportar exactamente
//  lo que está viendo en pantalla.
// =============================================================
export const exportarReportesExcel = async (req, res) => {
    try {
        const { busqueda, gravedad } = req.query
        const filtro = { activo: true, validado: true }
        if (gravedad) filtro.gravedad = gravedad

        let reportes = await popReporte(Reporte.find(filtro)).sort({ createdAt: -1 })

        if (busqueda) {
            const b = busqueda.toLowerCase()
            reportes = reportes.filter(r =>
                r.vehiculo?.marca?.toLowerCase().includes(b) ||
                r.vehiculo?.modelo?.toLowerCase().includes(b) ||
                r.falla?.nombre?.toLowerCase().includes(b)
            )
        }

        const workbook = new ExcelJS.Workbook()
        workbook.creator = "AutoReporta EC"
        workbook.created = new Date()

        const hoja = workbook.addWorksheet("Reportes validados")

        hoja.columns = [
            { header: "Marca", key: "marca", width: 14 },
            { header: "Modelo", key: "modelo", width: 16 },
            { header: "Año", key: "anio", width: 8 },
            { header: "Tipo", key: "tipo", width: 14 },
            { header: "Combustible", key: "combustible", width: 12 },
            { header: "Falla", key: "falla", width: 24 },
            { header: "Gravedad", key: "gravedad", width: 10 },
            { header: "Descripción", key: "descripcion", width: 45 },
            { header: "Reportado por", key: "reportadoPor", width: 24 },
            { header: "Correo", key: "email", width: 28 },
            { header: "Región", key: "region", width: 14 },
            { header: "Provincia", key: "provincia", width: 16 },
            { header: "Fecha de reporte", key: "fechaReporte", width: 16 },
            { header: "Validado el", key: "fechaValidacion", width: 16 },
            { header: "Validado por", key: "validadoPor", width: 24 },
        ]

        hoja.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
        hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } }
        hoja.getRow(1).alignment = { vertical: "middle", horizontal: "center" }
        hoja.getRow(1).height = 22

        reportes.forEach(r => {
            hoja.addRow({
                marca: r.vehiculo?.marca || "—",
                modelo: r.vehiculo?.modelo || "—",
                anio: r.vehiculo?.anio || "—",
                tipo: r.vehiculo?.tipo || "—",
                combustible: r.vehiculo?.combustible || "—",
                falla: r.falla?.nombre || "—",
                gravedad: r.gravedad,
                descripcion: r.descripcion || "",
                reportadoPor: nombreCompleto(r.usuario),
                email: r.usuario?.email || "—",
                region: r.usuario?.region || "—",
                provincia: r.usuario?.provincia || "—",
                fechaReporte: fechaCorta(r.createdAt),
                fechaValidacion: fechaCorta(r.validadoEn),
                validadoPor: r.validadoPor ? nombreCompleto(r.validadoPor) : "—",
            })
        })

        hoja.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin", color: { argb: "FFE2E8F0" } },
                    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
                }
                cell.alignment = { vertical: "middle", wrapText: false }
            })
        })
        hoja.views = [{ state: "frozen", ySplit: 1 }]

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        res.setHeader("Content-Disposition", `attachment; filename="reportes-autoreporta-ec-${Date.now()}.xlsx"`)

        await workbook.xlsx.write(res)
        res.end()
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al exportar reportes a Excel" })
    }
}

// Dibuja una tabla simple de 3 columnas en el PDF, con paginación automática.
// Devuelve la posición Y final para poder seguir dibujando después.
const dibujarTabla = (doc, startY, headers, rows, colWidths) => {
    let y = startY

    const dibujarEncabezado = () => {
        doc.rect(50, y, 495, 20).fill("#1E3A8A")
        let x = 50
        doc.fontSize(9).font(FONT_BOLD).fillColor("#FFFFFF")
        headers.forEach((h, i) => {
            doc.text(h, x + 6, y + 6, { width: colWidths[i] - 10 })
            x += colWidths[i]
        })
        y += 20
    }

    dibujarEncabezado()
    doc.font(FONT_NORMAL).fontSize(9)

    rows.forEach((row, i) => {
        if (y > 740) {
            doc.addPage()
            y = 50
            dibujarEncabezado()
            doc.font(FONT_NORMAL).fontSize(9)
        }
        if (i % 2 === 0) doc.rect(50, y, 495, 18).fill("#F8FAFC")
        let x = 50
        row.forEach((cell, j) => {
            doc.fillColor("#334155").text(String(cell), x + 6, y + 5, { width: colWidths[j] - 10 })
            x += colWidths[j]
        })
        y += 18
    })

    return y
}

const dibujarEncabezadoOficial = (doc, titulo, subtitulo) => {
    const W = doc.page.width
    // Banda azul principal
    doc.rect(0, 0, W, 95).fill("#1E3A8A")
    // Banda decorativa inferior (tricolor bandera EC)
    doc.rect(0, 85, W, 4).fill("#FFD100")
    doc.rect(0, 89, W, 3).fill("#DC2626")

    // Logo del auto — PNG con fondo transparente, sin círculo de respaldo
    try {
        doc.image(LOGO_AUTO, 38, 18, { width: 58, height: 58, fit: [58, 58], align: "center", valign: "center" })
    } catch {
        // Fallback si la imagen no carga: ícono simple en texto
        doc.fillColor("#FFFFFF").fontSize(20).font(FONT_BOLD).text("🚗", 50, 36)
    }

    // Nombre del sistema
    doc.fillColor("#FFFFFF").fontSize(20).font(FONT_BOLD)
        .text("AutoReporta EC", 104, 24)
    doc.fontSize(10).font(FONT_NORMAL).fillColor("#BFDBFE")
        .text("Plataforma colaborativa de fallas vehiculares — Ecuador", 104, 50)

    // Título y subtítulo del documento
    doc.fontSize(9).fillColor("#FFFFFF").font(FONT_BOLD)
        .text(titulo, W - 260, 22, { width: 210, align: "right" })
    doc.fontSize(8).font(FONT_NORMAL).fillColor("#93C5FD")
        .text(subtitulo, W - 260, 38, { width: 210, align: "right" })

    doc.fillColor("#000000")
}

const dibujarPiePagina = (doc, texto) => {
    doc.fontSize(8).fillColor("#94A3B8").text(texto, 50, 760, { width: 495 })
}

// =============================================================
//  BOLETÍN ESTADÍSTICO EN PDF
//  Informe tipo boletín oficial (en el espíritu de los reportes
//  de mercado de SERNAC/INDECOPI/PROFECO): totales, distribución
//  por gravedad, marcas con más reportes y fallas más comunes.
// =============================================================
export const exportarBoletinPDF = async (req, res) => {
    try {
        const reportes = await popReporte(Reporte.find({ activo: true, validado: true }))
        const total = reportes.length

        const porGravedad = { baja: 0, media: 0, alta: 0 }
        const porMarca = {}
        const porFalla = {}

        reportes.forEach(r => {
            if (r.gravedad) porGravedad[r.gravedad] = (porGravedad[r.gravedad] || 0) + 1
            const marca = r.vehiculo?.marca || "Sin marca"
            porMarca[marca] = (porMarca[marca] || 0) + 1
            const falla = r.falla?.nombre || "Sin especificar"
            porFalla[falla] = (porFalla[falla] || 0) + 1
        })

        const topMarcas = Object.entries(porMarca).sort((a, b) => b[1] - a[1]).slice(0, 10)
        const topFallas = Object.entries(porFalla).sort((a, b) => b[1] - a[1]).slice(0, 10)

        const doc = new PDFDocument({ size: "A4", margin: 50 })
        res.setHeader("Content-Type", "application/pdf")
        res.setHeader("Content-Disposition", `attachment; filename="boletin-autoreporta-ec-${Date.now()}.pdf"`)
        doc.pipe(res)

        const azul = "#1E3A8A"
        const gris = "#475569"

        dibujarEncabezadoOficial(
            doc,
            "Boletín Estadístico de Fallas Vehiculares",
            `Generado el ${fechaLarga(new Date())}`
        )

        let y = 115
        doc.fontSize(10).fillColor(gris).text(
            "Este boletín resume los reportes de fallas vehiculares verificados y publicados por la comunidad de AutoReporta EC. La información proviene de reportes enviados por usuarios registrados y validados por el equipo administrador antes de su publicación.",
            50, y, { width: 495 }
        )
        y = doc.y + 20

        // ---- Resumen general ----
        doc.fontSize(13).fillColor(azul).font(FONT_BOLD).text("Resumen general", 50, y)
        y = doc.y + 10

        const tarjetas = [
            { label: "Reportes verificados", valor: total },
            { label: "Gravedad alta", valor: porGravedad.alta || 0 },
            { label: "Gravedad media", valor: porGravedad.media || 0 },
            { label: "Gravedad baja", valor: porGravedad.baja || 0 },
        ]
        const anchoTarjeta = 118
        tarjetas.forEach((t, i) => {
            const x = 50 + i * (anchoTarjeta + 5)
            doc.rect(x, y, anchoTarjeta, 55).fillAndStroke("#F1F5F9", "#E2E8F0")
            doc.fillColor(azul).fontSize(20).font(FONT_BOLD)
                .text(String(t.valor), x, y + 8, { width: anchoTarjeta, align: "center" })
            doc.fillColor(gris).fontSize(8).font(FONT_NORMAL)
                .text(t.label, x, y + 34, { width: anchoTarjeta, align: "center" })
        })
        y += 75
        doc.fillColor("#000000")

        // ---- Marcas con más reportes ----
        doc.fontSize(13).fillColor(azul).font(FONT_BOLD).text("Marcas con más reportes", 50, y)
        y = doc.y + 10
        if (topMarcas.length === 0) {
            doc.fontSize(10).fillColor(gris).font(FONT_NORMAL).text("Sin datos suficientes todavía.", 50, y)
            y = doc.y + 10
        } else {
            y = dibujarTabla(
                doc, y, ["Marca", "Reportes", "% del total"],
                topMarcas.map(([m, c]) => [m, c, `${((c / total) * 100).toFixed(1)}%`]),
                [280, 100, 115]
            )
        }

        // ---- Fallas más comunes ----
        y += 20
        if (y > 650) { doc.addPage(); y = 50 }
        doc.fontSize(13).fillColor(azul).font(FONT_BOLD).text("Fallas más reportadas", 50, y)
        y = doc.y + 10
        if (topFallas.length === 0) {
            doc.fontSize(10).fillColor(gris).font(FONT_NORMAL).text("Sin datos suficientes todavía.", 50, y)
        } else {
            dibujarTabla(
                doc, y, ["Tipo de falla", "Reportes", "% del total"],
                topFallas.map(([f, c]) => [f, c, `${((c / total) * 100).toFixed(1)}%`]),
                [280, 100, 115]
            )
        }

        dibujarPiePagina(
            doc,
            "AutoReporta EC — Plataforma colaborativa de reportes de fallas vehiculares en Ecuador. Este boletín se genera automáticamente a partir de datos aportados por la comunidad y no constituye una certificación oficial de organismos de protección al consumidor."
        )

        doc.end()
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al generar el boletín" })
    }
}

// =============================================================
//  EXPORTAR MIS REPORTES A EXCEL (usuario logueado)
//  Solo exporta los reportes del usuario autenticado.
// =============================================================
export const exportarMisReportesExcel = async (req, res) => {
    try {
        const usuarioId = req.userBDD._id
        const reportes = await popReporte(
            Reporte.find({ usuario: usuarioId, activo: true })
        ).sort({ createdAt: -1 })

        const workbook = new ExcelJS.Workbook()
        workbook.creator = "AutoReporta EC"
        workbook.created = new Date()

        const hoja = workbook.addWorksheet("Mis reportes")

        hoja.columns = [
            { header: "Marca",            key: "marca",        width: 14 },
            { header: "Modelo",           key: "modelo",       width: 16 },
            { header: "Año",              key: "anio",         width: 8  },
            { header: "Falla",            key: "falla",        width: 24 },
            { header: "Gravedad",         key: "gravedad",     width: 10 },
            { header: "Descripción",      key: "descripcion",  width: 45 },
            { header: "Estado",           key: "estado",       width: 12 },
            { header: "Fecha de reporte", key: "fechaReporte", width: 16 },
            { header: "Validado el",      key: "fechaVal",     width: 16 },
        ]

        hoja.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
        hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } }
        hoja.getRow(1).alignment = { vertical: "middle", horizontal: "center" }
        hoja.getRow(1).height = 22

        reportes.forEach(r => {
            const estado = r.validado ? "Validado" : r.observacion ? "Devuelto" : "Pendiente"
            hoja.addRow({
                marca:        r.vehiculo?.marca  || "—",
                modelo:       r.vehiculo?.modelo || "—",
                anio:         r.vehiculo?.anio   || "—",
                falla:        r.falla?.nombre    || "—",
                gravedad:     r.gravedad,
                descripcion:  r.descripcion      || "",
                estado,
                fechaReporte: fechaCorta(r.createdAt),
                fechaVal:     r.validado ? fechaCorta(r.validadoEn) : "—",
            })
        })

        hoja.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top:    { style: "thin", color: { argb: "FFE2E8F0" } },
                    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
                }
                cell.alignment = { vertical: "middle", wrapText: false }
            })
        })
        hoja.views = [{ state: "frozen", ySplit: 1 }]

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        res.setHeader("Content-Disposition", `attachment; filename="mis-reportes-${Date.now()}.xlsx"`)

        await workbook.xlsx.write(res)
        res.end()
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al exportar tus reportes" })
    }
}
//  Documento de una página con el detalle completo de un reporte,
//  con formato de constancia/certificado.
// =============================================================
export const exportarReportePDF = async (req, res) => {
    try {
        const reporte = await popReporte(Reporte.findOne({ _id: req.params.id, activo: true }))
        if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" })

        const doc = new PDFDocument({ size: "A4", margin: 50 })
        res.setHeader("Content-Type", "application/pdf")
        res.setHeader("Content-Disposition", `attachment; filename="reporte-${reporte._id}.pdf"`)
        doc.pipe(res)

        dibujarEncabezadoOficial(
            doc,
            "Constancia de Reporte de Falla Vehicular",
            `N.° de reporte: ${reporte._id}`
        )

        const azul = "#1E3A8A"
        const gris = "#475569"
        let y = 115

        const estado = reporte.validado ? "VALIDADO" : "PENDIENTE DE VALIDACIÓN"
        doc.fontSize(10).fillColor(reporte.validado ? "#15803D" : "#B45309").font(FONT_BOLD)
            .text(`Estado: ${estado}`, 50, y)
        y = doc.y + 18

        const campo = (label, valor) => {
            doc.fontSize(9).fillColor(gris).font(FONT_BOLD).text(label, 50, y)
            doc.fontSize(11).fillColor("#000000").font(FONT_NORMAL).text(valor || "—", 50, doc.y + 1, { width: 495 })
            y = doc.y + 12
        }

        doc.fontSize(13).fillColor(azul).font(FONT_BOLD).text("Vehículo", 50, y)
        y = doc.y + 8
        campo("Marca y modelo", `${reporte.vehiculo?.marca || "—"} ${reporte.vehiculo?.modelo || ""}`.trim())
        campo("Año", reporte.vehiculo?.anio?.toString())
        campo("Tipo", reporte.vehiculo?.tipo)
        campo("Combustible", reporte.vehiculo?.combustible)

        y += 6
        doc.fontSize(13).fillColor(azul).font(FONT_BOLD).text("Falla reportada", 50, y)
        y = doc.y + 8
        campo("Tipo de falla", reporte.falla?.nombre)
        campo("Gravedad", reporte.gravedad?.toUpperCase())
        campo("Descripción", reporte.descripcion)

        y += 6
        doc.fontSize(13).fillColor(azul).font(FONT_BOLD).text("Datos del reporte", 50, y)
        y = doc.y + 8
        campo("Reportado por", nombreCompleto(reporte.usuario))
        campo("Región / Provincia", [reporte.usuario?.provincia, reporte.usuario?.region].filter(Boolean).join(", ") || "—")
        campo("Fecha de reporte", fechaLarga(reporte.createdAt))
        if (reporte.validado) {
            campo("Validado por", reporte.validadoPor ? nombreCompleto(reporte.validadoPor) : "—")
            campo("Fecha de validación", fechaLarga(reporte.validadoEn))
        }

        // ── EVIDENCIAS FOTOGRÁFICAS ──────────────────────────────
        const fotos = (reporte.imagenes || []).filter(f => f?.url)
        if (fotos.length > 0) {
            y = doc.y + 16
            if (y > 650) { doc.addPage(); y = 50 }

            doc.fontSize(13).fillColor(azul).font(FONT_BOLD).text("Evidencias fotográficas", 50, y)
            doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).stroke("#E2E8F0")
            y = doc.y + 14

            const IMG_W = 155, IMG_H = 110, GAP = 10
            let col = 0

            for (const foto of fotos.slice(0, 6)) {
                if (y + IMG_H > 750) { doc.addPage(); y = 50 }
                try {
                    const buffer = await descargarBuffer(foto.url)
                    if (buffer) {
                        const x = 50 + col * (IMG_W + GAP)
                        doc.roundedRect(x, y, IMG_W, IMG_H, 4).stroke("#E2E8F0")
                        doc.image(buffer, x + 2, y + 2, { width: IMG_W - 4, height: IMG_H - 4, fit: [IMG_W - 4, IMG_H - 4], align: "center", valign: "center" })
                        col++
                        if (col >= 3) { col = 0; y += IMG_H + GAP }
                    }
                } catch { /* imagen no disponible */ }
            }
            if (col > 0) y += IMG_H + GAP
        }

        dibujarPiePagina(
            doc,
            "Este documento fue generado automáticamente por AutoReporta EC a partir de información aportada por la comunidad de usuarios. No constituye una certificación de un organismo oficial de protección al consumidor."
        )

        doc.end()
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al generar el PDF del reporte" })
    }
}
// =============================================================
//  FICHA DE VEHÍCULO — estilo Consumer Reports
//  Disponible para cualquier usuario logueado.
//  Incluye: datos del vehículo, rating por aspectos (valoraciones),
//  fallas más comunes, distribución por gravedad y comentarios.
// =============================================================
export const exportarFichaVehiculo = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id)
        if (!vehiculo) return res.status(404).json({ msg: "Vehículo no encontrado" })

        // Reportes verificados de este vehículo
        const reportes = await Reporte.find({
            vehiculo: vehiculo._id,
            activo: true,
            validado: true
        }).populate("falla", "nombre")

        // Valoraciones activas de este vehículo
        const valoraciones = await Valoracion.find({
            vehiculo: vehiculo._id,
            activo: { $ne: false }
        })

        // Calcular promedios por aspecto
        const aspectos = ["confiabilidad", "seguridad", "consumo", "precio", "comodidad", "mantenimiento", "repuestos"]
        const promedios = {}
        if (valoraciones.length > 0) {
            aspectos.forEach(a => {
                const suma = valoraciones.reduce((acc, v) => acc + (v.aspectos?.[a] || 0), 0)
                promedios[a] = Math.round((suma / valoraciones.length) * 10) / 10
            })
        }
        const promedioGeneral = valoraciones.length > 0
            ? Math.round((Object.values(promedios).reduce((a, b) => a + b, 0) / aspectos.length) * 10) / 10
            : null

        // Fallas más comunes
        const fallaMap = {}
        const gravedadMap = { baja: 0, media: 0, alta: 0 }
        reportes.forEach(r => {
            const f = r.falla?.nombre || "N/D"
            fallaMap[f] = (fallaMap[f] || 0) + 1
            if (r.gravedad) gravedadMap[r.gravedad] = (gravedadMap[r.gravedad] || 0) + 1
        })
        const topFallas = Object.entries(fallaMap).sort((a, b) => b[1] - a[1]).slice(0, 8)

        // PDF
        const doc = new PDFDocument({ size: "A4", margin: 0 })
        res.setHeader("Content-Type", "application/pdf")
        res.setHeader("Content-Disposition",
            `attachment; filename="ficha-${vehiculo.marca}-${vehiculo.modelo}-${vehiculo.anio}.pdf"`)
        doc.pipe(res)

        const AZUL = "#1E3A8A"
        const AZUL_CLARO = "#EFF6FF"
        const ROJO = "#DC2626"
        const VERDE = "#16A34A"
        const AMARILLO = "#D97706"
        const GRIS = "#475569"
        const GRIS_CLARO = "#F8FAFC"
        const W = 595
        const M = 40

        // ── ENCABEZADO ──────────────────────────────────────────
        doc.rect(0, 0, W, 110).fill(AZUL)

        // Logo de la marca del vehículo (logo.dev) — fondo blanco cuadrado redondeado
        const logoMarcaUrl = getLogoMarcaUrl(vehiculo.marca)
        let tieneLogoMarca = false
        if (logoMarcaUrl) {
            try {
                const bufferLogo = await descargarBuffer(logoMarcaUrl)
                if (bufferLogo) {
                    doc.roundedRect(M, 14, 36, 36, 6).fill("#FFFFFF")
                    doc.image(bufferLogo, M + 4, 18, { width: 28, height: 28, fit: [28, 28], align: "center", valign: "center" })
                    tieneLogoMarca = true
                }
            } catch { /* sin logo de marca si falla */ }
        }
        if (!tieneLogoMarca) {
            // Fallback: círculo con inicial de la marca
            doc.circle(M + 18, 32, 18).fill("#FFFFFF")
            doc.fillColor(AZUL).fontSize(16).font(FONT_BOLD)
                .text((vehiculo.marca || "?").charAt(0).toUpperCase(), M + 2, 22, { width: 32, align: "center" })
        }

        // Nombre del vehículo
        doc.fillColor("#FFFFFF").fontSize(22).font(FONT_BOLD)
            .text(`${vehiculo.marca} ${vehiculo.modelo}`, M + 48, 14)
        doc.fontSize(12).font(FONT_NORMAL)
            .text(`${vehiculo.anio} · ${vehiculo.tipo || "Vehículo"} · ${vehiculo.combustible || ""}`, M, 50)
        doc.fontSize(9).fillColor("#93C5FD")
            .text("AutoReporta EC — Ficha de Confiabilidad Vehicular", M, 72)
        doc.fontSize(8).fillColor("#BFDBFE")
            .text(`Generado el ${fechaLarga(new Date())}`, M, 86)

        // Score general (círculo derecho)
        if (promedioGeneral !== null) {
            const cx = W - 65, cy = 55, r = 42
            const color = promedioGeneral >= 4 ? VERDE : promedioGeneral >= 3 ? AMARILLO : ROJO
            doc.circle(cx, cy, r).fillAndStroke("#1E40AF", "#3B82F6")
            doc.fillColor("#FFFFFF").fontSize(26).font(FONT_BOLD)
                .text(promedioGeneral.toFixed(1), cx - 22, cy - 16, { width: 44, align: "center" })
            doc.fontSize(8).font(FONT_NORMAL)
                .text("/ 5.0", cx - 16, cy + 12, { width: 32, align: "center" })
            doc.fontSize(7).fillColor("#BFDBFE")
                .text("PUNTUACIÓN", cx - 28, cy + 25, { width: 56, align: "center" })
        }

        let y = 128

        // ── RESUMEN DE DATOS ────────────────────────────────────
        const boxes = [
            { label: "Reportes de falla", valor: reportes.length, color: ROJO },
            { label: "Valoraciones", valor: valoraciones.length, color: AZUL },
            { label: "Gravedad alta", valor: gravedadMap.alta, color: ROJO },
            { label: "Gravedad media", valor: gravedadMap.media, color: AMARILLO },
        ]
        const bw = (W - M * 2 - 12) / 4
        boxes.forEach((b, i) => {
            const x = M + i * (bw + 4)
            doc.roundedRect(x, y, bw, 54, 6).fill(GRIS_CLARO)
            doc.rect(x, y, 4, 54).fill(b.color)
            doc.fillColor(b.color).fontSize(22).font(FONT_BOLD)
                .text(String(b.valor), x + 12, y + 8, { width: bw - 16 })
            doc.fillColor(GRIS).fontSize(8).font(FONT_NORMAL)
                .text(b.label, x + 12, y + 34, { width: bw - 16 })
        })
        y += 68

        // ── VALORACIÓN POR ASPECTO ──────────────────────────────
        doc.fillColor(AZUL).fontSize(12).font(FONT_BOLD).text("Valoración por aspecto", M, y)
        doc.moveTo(M, y + 18).lineTo(M + 515, y + 18).stroke("#E2E8F0")
        y += 26

        if (valoraciones.length === 0) {
            doc.roundedRect(M, y, 515, 36, 6).fill(AZUL_CLARO)
            doc.fillColor(AZUL).fontSize(9).font(FONT_NORMAL)
                .text("Sin valoraciones todavía.", M + 10, y + 12, { width: 495 })
            y += 46
        } else {
            const etiquetas = {
                confiabilidad: "Confiabilidad",
                seguridad:     "Seguridad",
                consumo:       "Consumo",
                precio:        "Precio / Valor",
                comodidad:     "Comodidad",
                mantenimiento: "Mantenimiento",
                repuestos:     "Repuestos"
            }
            aspectos.forEach((a) => {
                const val = promedios[a] || 0
                const pct = val / 5
                const color = val >= 4 ? VERDE : val >= 3 ? AMARILLO : ROJO
                const barW = 310

                doc.fillColor(GRIS).fontSize(9).font(FONT_NORMAL)
                    .text(etiquetas[a], M, y + 3, { width: 110 })
                doc.roundedRect(M + 115, y + 2, barW, 11, 3).fill("#E2E8F0")
                if (pct > 0) doc.roundedRect(M + 115, y + 2, barW * pct, 11, 3).fill(color)
                doc.fillColor(color).fontSize(9).font(FONT_BOLD)
                    .text(`${val.toFixed(1)}`, M + 115 + barW + 6, y + 3, { width: 24 })
                for (let c = 1; c <= 5; c++) {
                    const cx = M + 115 + barW + 32 + (c - 1) * 10
                    if (c <= Math.round(val)) {
                        doc.circle(cx, y + 7, 3.5).fill(color)
                    } else {
                        doc.circle(cx, y + 7, 3.5).fillAndStroke("#E2E8F0", "#CBD5E1")
                    }
                }
                y += 20
            })
        }

        y += 16

        // ── FALLAS MÁS REPORTADAS ─────────────────────────────────
        doc.fillColor(AZUL).fontSize(12).font(FONT_BOLD).text("Fallas más reportadas", M, y)
        doc.moveTo(M, y + 18).lineTo(M + 515, y + 18).stroke("#E2E8F0")
        y += 26

        if (topFallas.length === 0) {
            doc.roundedRect(M, y, 515, 36, 6).fill(AZUL_CLARO)
            doc.fillColor(AZUL).fontSize(9).font(FONT_NORMAL)
                .text("Sin fallas reportadas todavía.", M + 10, y + 12, { width: 495 })
            y += 46
        } else {
            const maxFalla = topFallas[0][1]
            const barWF = 330
            topFallas.forEach(([nombre, count]) => {
                const pct = count / maxFalla
                doc.fillColor(GRIS).fontSize(9).font(FONT_NORMAL)
                    .text(nombre.length > 38 ? nombre.slice(0, 37) + "." : nombre, M, y + 3, { width: 160 })
                doc.roundedRect(M + 165, y + 2, barWF, 11, 2).fill("#F1F5F9")
                if (pct > 0) doc.roundedRect(M + 165, y + 2, barWF * pct, 11, 2).fill(ROJO)
                doc.fillColor(ROJO).fontSize(9).font(FONT_BOLD)
                    .text(String(count), M + 165 + barWF + 6, y + 3, { width: 24 })
                y += 18
            })
        }

        y += 16

        // ── DISTRIBUCIÓN POR GRAVEDAD ─────────────────────────────
        if (reportes.length > 0) {
            doc.fillColor(AZUL).fontSize(12).font(FONT_BOLD).text("Distribución por gravedad", M, y)
            doc.moveTo(M, y + 18).lineTo(M + 515, y + 18).stroke("#E2E8F0")
            y += 26

            const totalR = reportes.length
            const gravedades = [
                { label: "Alta",  val: gravedadMap.alta,  color: ROJO    },
                { label: "Media", val: gravedadMap.media, color: AMARILLO },
                { label: "Baja",  val: gravedadMap.baja,  color: VERDE   },
            ]
            const barWG = 380
            gravedades.forEach(g => {
                const pct = totalR > 0 ? g.val / totalR : 0
                doc.fillColor(GRIS).fontSize(9).font(FONT_NORMAL).text(g.label, M, y + 3, { width: 50 })
                doc.roundedRect(M + 55, y, barWG, 13, 3).fill("#F1F5F9")
                if (pct > 0) doc.roundedRect(M + 55, y, barWG * pct, 13, 3).fill(g.color)
                doc.fillColor(g.color).fontSize(9).font(FONT_BOLD)
                    .text(`${(pct * 100).toFixed(0)}%  (${g.val} reporte${g.val !== 1 ? "s" : ""})`, M + 55 + barWG + 6, y + 2, { width: 80 })
                y += 20
            })
        }

        y += 20

        // ── COMENTARIOS DE USUARIOS ─────────────────────────────
        const comentarios = valoraciones.filter(v => v.comentario?.trim()).slice(0, 4)
        if (comentarios.length > 0) {
            if (y > 580) { doc.addPage(); y = 40 }
            doc.fillColor(AZUL).fontSize(12).font(FONT_BOLD)
                .text("Comentarios de la comunidad", M, y)
            doc.moveTo(M, y + 18).lineTo(W - M, y + 18).stroke("#E2E8F0")
            y += 26

            comentarios.forEach(v => {
                if (y > 720) { doc.addPage(); y = 40 }
                const rating = Math.round(promedioGeneral || 3)
                const alturaComentario = 50
                doc.roundedRect(M, y, W - M * 2, alturaComentario, 6).fill(AZUL_CLARO)
                // Círculos de rating dibujados geométricamente (sin Unicode)
                for (let c = 1; c <= 5; c++) {
                    if (c <= rating) {
                        doc.circle(M + 14 + (c - 1) * 12, y + 11, 4).fill(AZUL)
                    } else {
                        doc.circle(M + 14 + (c - 1) * 12, y + 11, 4).fillAndStroke("#CBD5E1", "#94A3B8")
                    }
                }
                doc.fillColor(GRIS).fontSize(9).font(FONT_NORMAL)
                    .text(`"${v.comentario}"`, M + 12, y + 24, { width: W - M * 2 - 24, height: 20, ellipsis: true })
                y += alturaComentario + 6
            })
        }

        // ── PIE DE PÁGINA ────────────────────────────────────────
        if (y > 760) doc.addPage()
        doc.rect(0, 808, W, 34).fill(AZUL)
        doc.fillColor("#93C5FD").fontSize(7).font(FONT_NORMAL)
            .text(
                "AutoReporta EC — Plataforma colaborativa de reportes de fallas vehiculares en Ecuador. " +
                "Esta ficha se genera a partir de datos aportados por la comunidad y no constituye una certificación oficial.",
                M, 815, { width: W - M * 2 }
            )

        doc.end()
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "Error al generar la ficha del vehículo" })
    }
}