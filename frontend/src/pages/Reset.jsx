import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useParams, useNavigate } from "react-router"
import { ToastContainer } from "react-toastify"
import useFetch from "../hooks/useFetch"
import Logo from "../components/Logo"
import MedidorPassword from "../components/ui/MedidorPassword"
import BotonMostrarPassword from "../components/ui/BotonMostrarPassword"

const Reset = () => {
    const { token } = useParams()
    const navigate = useNavigate()
    const [tokenValido, setTokenValido] = useState(false)
    const [tokenError, setTokenError] = useState("")
    const [verPassword, setVerPassword] = useState(false)
    const [verConfirmar, setVerConfirmar] = useState(false)
    const { register, handleSubmit, formState: { errors }, watch } = useForm()
    const { fetchDataBackend } = useFetch()

    useEffect(() => {
        const verify = async () => {
            const url = `${import.meta.env.VITE_BACKEND_URL}/recuperarpassword/${token}`
            const res = await fetchDataBackend(url, null, "GET")
            if (res) setTokenValido(true)
            else setTokenError("El enlace es inválido o ya expiró. Solicita uno nuevo.")
        }
        verify()
    }, [token])

    const onSubmit = async (data) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/nuevopassword/${token}`
        const res = await fetchDataBackend(url, data, "POST")
        if (res) {
            setTimeout(() => navigate("/login"), 2000)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-100 px-4">
            <ToastContainer />
            <Logo size="lg" linkToHome />

            <div className="bg-white rounded-xl shadow-lg p-8 mt-8 max-w-md w-full">
                <h1 className="text-2xl font-bold text-slate-700 mb-6 text-center">Nueva contraseña</h1>

                {tokenValido ? (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Nueva contraseña</label>
                            <p className="text-xs text-slate-400 mb-1.5">Mínimo 8 caracteres, con mayúscula, número y carácter especial</p>
                            <div className="relative">
                                <input
                                    type={verPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 pr-10 text-slate-700"
                                    {...register("password", {
                                        required: "La contraseña es obligatoria",
                                        pattern: {
                                            value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                                            message: "Debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial"
                                        }
                                    })}
                                />
                                <BotonMostrarPassword visible={verPassword} onClick={() => setVerPassword(!verPassword)} />
                            </div>
                            {errors.password && <p className="text-red-700 text-sm mt-1">{errors.password.message}</p>}
                            <MedidorPassword password={watch("password")} />
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Confirmar contraseña</label>
                            <div className="relative">
                                <input
                                    type={verConfirmar ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 pr-10 text-slate-700"
                                    {...register("confirmpassword", {
                                        required: "Confirma la contraseña",
                                        validate: (value) => value === watch("password") || "Las contraseñas no coinciden"
                                    })}
                                />
                                <BotonMostrarPassword visible={verConfirmar} onClick={() => setVerConfirmar(!verConfirmar)} />
                            </div>
                            {errors.confirmpassword && <p className="text-red-700 text-sm mt-1">{errors.confirmpassword.message}</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                        >
                            Cambiar contraseña
                        </button>
                    </form>
                ) : tokenError ? (
                    <div className="text-center">
                        <p className="text-2xl mb-3">⏱️</p>
                        <p className="text-slate-700 font-semibold mb-2">Enlace inválido o expirado</p>
                        <p className="text-slate-500 text-sm mb-5">{tokenError}</p>
                        <a href="/forgot"
                            className="inline-block bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm">
                            Solicitar nuevo enlace
                        </a>
                    </div>
                ) : (
                    <p className="text-slate-500 text-center text-sm">Verificando enlace...</p>
                )}
            </div>
        </div>
    )
}

export default Reset