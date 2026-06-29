// Modal de confirmación reutilizable
// Si onConfirmar es null, solo muestra el botón de cancelar (modo informativo)
const ModalConfirmar = ({
    titulo = "¿Estás seguro?",
    descripcion = "",
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    colorBoton = "bg-red-600 hover:bg-red-700",
    onConfirmar,
    onCancelar
}) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
                <h3 className="text-lg font-bold text-slate-700 mb-2">{titulo}</h3>
                {descripcion && <p className="text-slate-500 text-sm mb-6">{descripcion}</p>}
                <div className="flex gap-3">
                    {onConfirmar && textoConfirmar && (
                        <button type="button" onClick={onConfirmar}
                            className={`flex-1 ${colorBoton} text-white font-semibold py-2 rounded-lg transition-colors`}>
                            {textoConfirmar}
                        </button>
                    )}
                    <button type="button" onClick={onCancelar}
                        className={`${onConfirmar ? "flex-1" : "w-full"} bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg transition-colors`}>
                        {textoCancelar}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModalConfirmar
