import { toast } from "react-toastify"

// Componente reutilizable para secciones de subida de evidencias
// Acumula archivos, permite quitarlos antes de subir, muestra contador y límite

const SeccionEvidencia = ({
    titulo,
    descripcion,
    limite,
    actual = 0,
    icono,
    accept,
    archivosSeleccionados = [],
    onAgregar,      // agrega archivos al estado acumulado
    onQuitarArchivo, // quita un archivo del estado antes de subir
    onSubir,
    subiendo = false,
    textoBoton,
    children        // evidencias ya subidas
}) => {
    const totalConNuevos = actual + archivosSeleccionados.length
    const restante = limite - actual
    const lleno = actual >= limite

    const handleSeleccionar = (e) => {
        const nuevos = Array.from(e.target.files)
        if (!nuevos.length) return
        // Limitar para no superar el máximo
        const cuantosPuedo = limite - actual - archivosSeleccionados.length
        const aAgregar = nuevos.slice(0, cuantosPuedo)
        if (aAgregar.length < nuevos.length) {
            toast.warning(`Solo puedes agregar ${cuantosPuedo} archivo(s) más. Se ignoraron ${nuevos.length - aAgregar.length}.`)
        }
        if (aAgregar.length > 0) onAgregar(aAgregar)
        // Limpiar el input para permitir volver a seleccionar el mismo archivo
        e.target.value = ""
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            {/* Encabezado con contador */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        <span>{icono}</span> {titulo}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">{descripcion}</p>
                </div>
                <div className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ml-2 ${
                    totalConNuevos >= limite ? "bg-red-100 text-red-700" :
                    actual > 0 || archivosSeleccionados.length > 0 ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-500"
                }`}>
                    {totalConNuevos}/{limite}
                </div>
            </div>

            {/* Evidencias ya subidas */}
            {children}

            {/* Archivos pendientes de subir */}
            {archivosSeleccionados.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                        Pendientes de subir ({archivosSeleccionados.length})
                    </p>
                    <ul className="space-y-2">
                        {archivosSeleccionados.map((f, i) => (
                            <li key={i} className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-blue-500 shrink-0">📎</span>
                                    <span className="text-sm text-slate-700 truncate">{f.name}</span>
                                    <span className="text-xs text-slate-400 shrink-0">
                                        ({(f.size / 1024 / 1024).toFixed(1)} MB)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onQuitarArchivo(i)}
                                    className="text-red-500 hover:text-red-700 text-lg leading-none ml-2 shrink-0"
                                    title="Quitar"
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Zona de selección */}
            {!lleno && totalConNuevos < limite && (
                <label className={`
                    flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl
                    cursor-pointer transition-colors py-5 px-4
                    ${archivosSeleccionados.length > 0
                        ? "border-blue-300 bg-blue-50 hover:border-blue-500"
                        : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"}
                `}>
                    <span className="text-2xl mb-1">{icono}</span>
                    <span className="text-sm font-semibold text-slate-600">
                        Haz clic para agregar {titulo.toLowerCase()}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                        Puedes agregar hasta {restante - archivosSeleccionados.length} más
                    </span>
                    <input
                        type="file"
                        multiple
                        accept={accept}
                        className="hidden"
                        onChange={handleSeleccionar}
                    />
                </label>
            )}

            {/* Lleno */}
            {(lleno || totalConNuevos >= limite) && archivosSeleccionados.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                    Has alcanzado el límite de {limite} {titulo.toLowerCase()}.
                    Quita alguno para agregar otro.
                </div>
            )}

            {/* Botón subir */}
            {archivosSeleccionados.length > 0 && (
                <button
                    type="button"
                    onClick={onSubir}
                    disabled={subiendo}
                    className="mt-4 w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {subiendo ? (
                        <><span className="animate-spin inline-block">⏳</span> Subiendo...</>
                    ) : (
                        <>{textoBoton || `Subir ${titulo.toLowerCase()}`} ({archivosSeleccionados.length})</>
                    )}
                </button>
            )}
        </div>
    )
}

export default SeccionEvidencia