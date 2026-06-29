import { useForm } from "react-hook-form"
import { Link } from "react-router"
import { ToastContainer } from "react-toastify"
import useFetch from "../hooks/useFetch"
import Logo from "../components/Logo"

const Forgot = () => {
    const { register, handleSubmit, formState: { errors } } = useForm()
    const { fetchDataBackend } = useFetch()

    const onSubmit = (data) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/recuperarpassword`
        fetchDataBackend(url, data, "POST")
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-100 px-4">
            <ToastContainer />
            <Logo size="lg" linkToHome />

            <div className="bg-white rounded-xl shadow-lg p-8 mt-8 max-w-md w-full">
                <h1 className="text-2xl font-bold text-slate-700 mb-2 text-center">Recuperar contraseña</h1>
                <p className="text-slate-400 mb-6 text-sm text-center">
                    Ingresa tu correo y te enviaremos un enlace para restablecerla
                </p>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</label>
                        <input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
                            {...register("email", { required: "El correo es obligatorio" })}
                        />
                        {errors.email && <p className="text-red-700 text-sm mt-1">{errors.email.message}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                    >
                        Enviar enlace
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500 flex justify-center gap-4">
                    <Link to="/login" className="text-blue-700 font-semibold hover:underline">
                        Iniciar sesión
                    </Link>
                    <Link to="/" className="text-slate-400 hover:text-slate-600 hover:underline">
                        Volver al inicio
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Forgot
