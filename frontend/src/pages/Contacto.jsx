import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast, ToastContainer } from "react-toastify"
import storeProfile from "../context/storeProfile"
import axios from "axios"

const ASUNTOS = [
    "Duda o pregunta",
    "Sugerencia de mejora",
    "Enlace caído en un reporte",
    "Comentario ofensivo detectado",
    "Problema técnico",
    "Otro",
]

const Contacto = () => {
    const { user } = storeProfile()
    const [enviando, setEnviando] = useState(false)
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        defaultValues: {
            nombre: user ? `${user.nombre} ${user.apellido}` : "",
            correo: user?.email || "",
        }
    })

    const onSubmit = async (data) => {
        setEnviando(true)
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/contacto`, data)
            toast.success(res.data.msg)
            reset({ nombre: `${user.nombre} ${user.apellido}`, correo: user.email, asunto: "", mensaje: "" })
        } catch (err) {
            toast.error(err.response?.data?.msg || "No se pudo enviar el mensaje")
        }
        setEnviando(false)
    }

    const inputClass = "block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 text-sm"
    const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700"

    return (
        <div className="max-w-2xl mx-auto">
            <ToastContainer />
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Contacto</h1>
            <p className="text-slate-500 text-sm mb-6">Comunícate con la administración de AutoReporta EC.</p>

            {/* Recuadro informativo */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 space-y-2">
                <p className="text-sm font-semibold text-blue-800">💬 ¿En qué podemos ayudarte?</p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                    <li>Dudas o preguntas sobre el funcionamiento de la plataforma.</li>
                    <li>Sugerencias para mejorar AutoReporta EC.</li>
                    <li>Reportar un <strong>enlace caído</strong> en un reporte existente.</li>
                    <li>Informar sobre un <strong>comentario ofensivo o inapropiado</strong> que hayas detectado.</li>
                    <li>Cualquier problema técnico que hayas experimentado.</li>
                </ul>
                <p className="text-xs text-blue-600 pt-1 border-t border-blue-200">
                    Te responderemos al correo que indiques a la brevedad posible.
                </p>
            </div>

            {/* Formulario */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Nombre</label>
                            <input className={inputClass}
                                {...register("nombre", { required: "El nombre es obligatorio" })} />
                            {errors.nombre && <p className="text-red-600 text-xs mt-1">{errors.nombre.message}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>Correo electrónico</label>
                            <input type="email" className={inputClass}
                                {...register("correo", { required: "El correo es obligatorio" })} />
                            {errors.correo && <p className="text-red-600 text-xs mt-1">{errors.correo.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Asunto</label>
                        <select className={inputClass}
                            {...register("asunto", { required: "Selecciona un asunto" })}>
                            <option value="">Selecciona un asunto...</option>
                            {ASUNTOS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        {errors.asunto && <p className="text-red-600 text-xs mt-1">{errors.asunto.message}</p>}
                    </div>

                    <div>
                        <label className={labelClass}>Mensaje</label>
                        <textarea rows={5} className={`${inputClass} resize-none`}
                            placeholder="Describe tu consulta con el mayor detalle posible..."
                            maxLength={1000}
                            {...register("mensaje", {
                                required: "El mensaje es obligatorio",
                                minLength: { value: 10, message: "El mensaje debe tener al menos 10 caracteres" },
                                maxLength: { value: 1000, message: "El mensaje no puede superar los 1000 caracteres" }
                            })} />
                        <div className="flex justify-between items-center mt-1">
                            {errors.mensaje
                                ? <p className="text-red-600 text-xs">{errors.mensaje.message}</p>
                                : <span />
                            }
                            <p className="text-xs text-slate-400">
                                {watch("mensaje")?.length || 0}/500
                            </p>
                        </div>
                    </div>

                    <button type="submit" disabled={enviando}
                        className={`w-full font-semibold py-2.5 rounded-lg transition-colors ${
                            enviando ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                     : "bg-blue-900 hover:bg-blue-800 text-white"
                        }`}>
                        {enviando ? "Enviando..." : "Enviar mensaje"}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Contacto