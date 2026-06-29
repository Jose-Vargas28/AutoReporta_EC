// =============================================================
//  BADGE - etiqueta de estado (validado, pendiente, gravedad)
//  Centraliza los colores de los estados en todo el sistema.
// =============================================================

const estilosBadge = {
    // Estados de validación
    validado: "bg-green-100 text-green-800",
    pendiente: "bg-amber-100 text-amber-800",
    devuelto: "bg-blue-100 text-blue-800",
    eliminado: "bg-red-100 text-red-800",

    // Niveles de gravedad
    baja: "bg-blue-100 text-blue-800",
    media: "bg-amber-100 text-amber-800",
    alta: "bg-red-100 text-red-800",

    // Genérico
    neutro: "bg-slate-100 text-slate-700",
}

const etiquetas = {
    validado: "Validado",
    pendiente: "Pendiente",
    devuelto: "Devuelto para corrección",
    eliminado: "Eliminado",
    baja: "Gravedad baja",
    media: "Gravedad media",
    alta: "Gravedad alta",
}

const Badge = ({ tipo = "neutro", texto = null }) => {
    const estilo = estilosBadge[tipo] || estilosBadge.neutro
    const label = texto || etiquetas[tipo] || tipo

    return (
        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${estilo}`}>
            {label}
        </span>
    )
}

export default Badge