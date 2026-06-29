import ExcelJS from "exceljs"
import PDFDocument from "pdfkit"
import Reporte from "../models/Reporte.js"

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
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#FFFFFF")
        headers.forEach((h, i) => {
            doc.text(h, x + 6, y + 6, { width: colWidths[i] - 10 })
            x += colWidths[i]
        })
        y += 20
    }

    dibujarEncabezado()
    doc.font("Helvetica").fontSize(9)

    rows.forEach((row, i) => {
        if (y > 740) {
            doc.addPage()
            y = 50
            dibujarEncabezado()
            doc.font("Helvetica").fontSize(9)
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
    doc.rect(0, 0, doc.page.width, 90).fill("#1E3A8A")
    doc.fillColor("#FFFFFF").fontSize(20).font("Helvetica-Bold").text("AutoReporta EC", 50, 28)
    doc.fontSize(11).font("Helvetica").text(titulo, 50, 54)
    doc.fontSize(9).text(subtitulo, 50, 70)
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
        doc.fontSize(13).fillColor(azul).font("Helvetica-Bold").text("Resumen general", 50, y)
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
            doc.fillColor(azul).fontSize(20).font("Helvetica-Bold")
                .text(String(t.valor), x, y + 8, { width: anchoTarjeta, align: "center" })
            doc.fillColor(gris).fontSize(8).font("Helvetica")
                .text(t.label, x, y + 34, { width: anchoTarjeta, align: "center" })
        })
        y += 75
        doc.fillColor("#000000")

        // ---- Marcas con más reportes ----
        doc.fontSize(13).fillColor(azul).font("Helvetica-Bold").text("Marcas con más reportes", 50, y)
        y = doc.y + 10
        if (topMarcas.length === 0) {
            doc.fontSize(10).fillColor(gris).font("Helvetica").text("Sin datos suficientes todavía.", 50, y)
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
        doc.fontSize(13).fillColor(azul).font("Helvetica-Bold").text("Fallas más reportadas", 50, y)
        y = doc.y + 10
        if (topFallas.length === 0) {
            doc.fontSize(10).fillColor(gris).font("Helvetica").text("Sin datos suficientes todavía.", 50, y)
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
        doc.fontSize(10).fillColor(reporte.validado ? "#15803D" : "#B45309").font("Helvetica-Bold")
            .text(`Estado: ${estado}`, 50, y)
        y = doc.y + 18

        const campo = (label, valor) => {
            doc.fontSize(9).fillColor(gris).font("Helvetica-Bold").text(label, 50, y)
            doc.fontSize(11).fillColor("#000000").font("Helvetica").text(valor || "—", 50, doc.y + 1, { width: 495 })
            y = doc.y + 12
        }

        doc.fontSize(13).fillColor(azul).font("Helvetica-Bold").text("Vehículo", 50, y)
        y = doc.y + 8
        campo("Marca y modelo", `${reporte.vehiculo?.marca || "—"} ${reporte.vehiculo?.modelo || ""}`.trim())
        campo("Año", reporte.vehiculo?.anio?.toString())
        campo("Tipo", reporte.vehiculo?.tipo)
        campo("Combustible", reporte.vehiculo?.combustible)

        y += 6
        doc.fontSize(13).fillColor(azul).font("Helvetica-Bold").text("Falla reportada", 50, y)
        y = doc.y + 8
        campo("Tipo de falla", reporte.falla?.nombre)
        campo("Gravedad", reporte.gravedad?.toUpperCase())
        campo("Descripción", reporte.descripcion)

        y += 6
        doc.fontSize(13).fillColor(azul).font("Helvetica-Bold").text("Datos del reporte", 50, y)
        y = doc.y + 8
        campo("Reportado por", nombreCompleto(reporte.usuario))
        campo("Región / Provincia", [reporte.usuario?.provincia, reporte.usuario?.region].filter(Boolean).join(", ") || "—")
        campo("Fecha de reporte", fechaLarga(reporte.createdAt))
        if (reporte.validado) {
            campo("Validado por", reporte.validadoPor ? nombreCompleto(reporte.validadoPor) : "—")
            campo("Fecha de validación", fechaLarga(reporte.validadoEn))
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