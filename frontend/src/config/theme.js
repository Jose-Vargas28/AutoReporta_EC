// =============================================================
//  CONFIGURACIÓN CENTRAL DEL SISTEMA
//  Cambia aquí los datos de marca, colores y textos.
//  Todo el sistema lee desde este archivo.
// =============================================================

export const theme = {
    // ---- Identidad del sistema ----
    nombreSistema: "AutoReporta EC",
    eslogan: "Reportes vehiculares colaborativos del Ecuador",
    descripcion: "Plataforma colaborativa para reportar y consultar fallas de vehículos comercializados en Ecuador.",

    // ---- Colores principales (azul) ----
    // Tailwind usa estas como referencia. El color base es blue-900 (#1e3a8a)
    colores: {
        primario: "#1e3a8a",        // blue-900 - color principal
        primarioHover: "#1e40af",   // blue-800 - hover
        primarioClaro: "#3b82f6",   // blue-500 - acentos
        secundario: "#0f172a",      // slate-900 - textos oscuros
        fondo: "#f1f5f9",           // slate-100 - fondo general
        exito: "#16a34a",           // green-600
        peligro: "#dc2626",         // red-600
        advertencia: "#f59e0b",     // amber-500
    },

    // ---- Contacto (footer) ----
    contacto: {
        email: "contacto@autoreporta.ec",
        telefono: "+593 99 999 9999",

        // ---- Redes sociales (footer) ----
        // Reemplaza el "#" por tu enlace real cuando tengas las cuentas creadas.
        // WhatsApp: usa el formato https://wa.me/593XXXXXXXXX (sin espacios ni el +)
        facebook: "#",
        instagram: "#",
        twitter: "#",
        whatsapp: "#",
    },

    // ---- Textos legales ----
    derechos: `© ${new Date().getFullYear()} AutoReporta EC. Todos los derechos reservados.`,
}

// Clases de Tailwind reutilizables basadas en el tema
// Si quieres cambiar cómo se ven los botones/inputs en TODO el sistema, edita aquí.
export const estilos = {
    botonPrimario: "bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
    botonSecundario: "bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200",
    botonPeligro: "bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200",
    botonExito: "bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200",
    input: "block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700",
    label: "mb-2 block text-sm font-semibold text-slate-700",
    card: "bg-white rounded-xl shadow-lg p-6",
    error: "text-red-700 text-sm mt-1",
}

export default theme