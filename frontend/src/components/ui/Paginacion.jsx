// Componente de paginación reutilizable
const Paginacion = ({ paginaActual, totalPaginas, onCambiar }) => {
    if (totalPaginas <= 1) return null

    const paginas = []
    const rango = 2 // páginas a mostrar a cada lado de la actual

    for (let i = 1; i <= totalPaginas; i++) {
        if (
            i === 1 ||
            i === totalPaginas ||
            (i >= paginaActual - rango && i <= paginaActual + rango)
        ) {
            paginas.push(i)
        } else if (
            i === paginaActual - rango - 1 ||
            i === paginaActual + rango + 1
        ) {
            paginas.push("...")
        }
    }

    // Eliminar duplicados de "..."
    const paginasFiltradas = paginas.filter((p, i) => !(p === "..." && paginas[i - 1] === "..."))

    return (
        <div className="flex items-center justify-center gap-1 mt-4">
            <button
                type="button"
                onClick={() => onCambiar(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                ← Anterior
            </button>

            {paginasFiltradas.map((p, i) => (
                p === "..." ? (
                    <span key={`dots-${i}`} className="px-2 text-slate-400">...</span>
                ) : (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onCambiar(p)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            p === paginaActual
                                ? "bg-blue-900 text-white font-bold"
                                : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                        }`}
                    >
                        {p}
                    </button>
                )
            ))}

            <button
                type="button"
                onClick={() => onCambiar(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                Siguiente →
            </button>
        </div>
    )
}

export default Paginacion
