import { useState } from "react"

// Modal reutilizable para pedir motivo antes de una acción
const ModalMotivo = ({ titulo, descripcion, onConfirmar, onCancelar, colorBoton = "bg-red-600 hover:bg-red-700" }) => {
    const [motivo, setMotivo] = useState("")

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                <h3 className="text-xl font-bold text-slate-700 mb-2">{titulo}</h3>
                <p className="text-slate-500 text-sm mb-4">{descripcion}</p>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Motivo <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 h-28 resize-none"
                        placeholder="Describe el motivo detalladamente. El usuario recibirá esta información por correo."
                        value={motivo}
                        maxLength={500}
                        onChange={(e) => setMotivo(e.target.value)}
                    />
                    <div className="flex justify-between items-center mt-1">
                        {motivo.trim().length > 0 && motivo.trim().length < 10 ? (
                            <p className="text-amber-600 text-xs">Escribe al menos 10 caracteres para dar un motivo claro.</p>
                        ) : (
                            <span />
                        )}
                        <p className={`text-xs ${motivo.length >= 480 ? "text-amber-600" : "text-slate-400"}`}>
                            {motivo.length}/500
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => onConfirmar(motivo.trim())}
                        disabled={motivo.trim().length < 10}
                        className={`flex-1 ${colorBoton} text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Confirmar
                    </button>
                    <button
                        type="button"
                        onClick={onCancelar}
                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModalMotivo