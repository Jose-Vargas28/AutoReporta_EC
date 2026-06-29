import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import { ToastContainer } from "react-toastify"
import useFetch from "../hooks/useFetch"
import storeAuth from "../context/storeAuth"
import Logo from "../components/Logo"
import BotonMostrarPassword from "../components/ui/BotonMostrarPassword"
import { theme } from "../config/theme"
import loginBg from "../assets/login-bg.jpg"

const Login = () => {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const { register, handleSubmit, formState: { errors } } = useForm()
    const { fetchDataBackend } = useFetch()
    const { setToken, setRol } = storeAuth()
    const googleBtnRef = useRef(null)
    const clientIdGoogle = import.meta.env.VITE_GOOGLE_CLIENT_ID

    const onSubmit = async (data) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/login`
        const response = await fetchDataBackend(url, data, "POST")
        if (response?.token) {
            setToken(response.token)
            setRol(response.rol)
            navigate("/dashboard")
        }
    }

    const manejarRespuestaGoogle = async (respuestaGoogle) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/login-google`
        const response = await fetchDataBackend(url, { credential: respuestaGoogle.credential }, "POST")
        if (response?.token) {
            setToken(response.token)
            setRol(response.rol)
            navigate("/dashboard")
        }
    }

    // Inicializa y dibuja el botón oficial de Google dentro de googleBtnRef.
    // El script de Google se carga con `async` en index.html, así que puede no estar
    // listo todavía al montar este componente — reintentamos brevemente hasta que aparezca.
    // Si no configuraste VITE_GOOGLE_CLIENT_ID, esta sección simplemente no se ejecuta.
    useEffect(() => {
        if (!clientIdGoogle) return

        let intentos = 0
        const intervalo = setInterval(() => {
            intentos++
            if (window.google?.accounts?.id && googleBtnRef.current) {
                clearInterval(intervalo)
                window.google.accounts.id.initialize({
                    client_id: clientIdGoogle,
                    callback: manejarRespuestaGoogle
                })
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: "outline",
                    size: "large",
                    text: "continue_with",
                    locale: "es",
                    width: 320
                })
            } else if (intentos > 40) {
                clearInterval(intervalo) // ~10s, el script no cargó (ej. sin conexión)
            }
        }, 250)

        return () => clearInterval(intervalo)
    }, [clientIdGoogle])

    return (
        <div className="flex flex-col sm:flex-row h-screen">
            <ToastContainer />

            {/* Panel izquierdo - foto con overlay */}
            <div className="relative w-full sm:w-1/2 h-1/3 sm:h-screen flex flex-col justify-center items-center text-center px-8 overflow-hidden">
                <img
                    src={loginBg}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                {/* Overlay sutil: oscuro arriba/izquierda para que el texto sea legible, transparente hacia el centro */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/75 via-blue-950/45 to-blue-900/20" />
                {/* Franja bandera Ecuador (vertical, lado izquierdo) */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 flex flex-col">
                    <div className="flex-1 bg-yellow-400" />
                    <div className="flex-[0.5] bg-blue-700" />
                    <div className="flex-[0.5] bg-red-600" />
                </div>
                <div className="relative z-10">
                    <Logo size="lg" light linkToHome />
                    <p className="text-blue-100 mt-6 text-lg max-w-sm">
                        {theme.eslogan}
                    </p>
                </div>
            </div>

            {/* Panel derecho - formulario */}
            <div className="w-full sm:w-1/2 h-screen bg-white flex justify-center items-center">
                <div className="md:w-4/5 sm:w-full px-8">
                    <h1 className="text-3xl font-bold mb-2 text-slate-700">Iniciar sesión</h1>
                    <p className="text-slate-400 mb-8 text-sm">Ingresa tus credenciales para continuar</p>

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

                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700 pr-10"
                                    {...register("password", { required: "La contraseña es obligatoria" })}
                                />
                                <BotonMostrarPassword visible={showPassword} onClick={() => setShowPassword(!showPassword)} />
                            </div>
                            {errors.password && <p className="text-red-700 text-sm mt-1">{errors.password.message}</p>}
                        </div>

                        <div className="flex justify-end mb-6">
                            <Link to="/forgot" className="text-sm text-blue-700 hover:underline">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                        >
                            Iniciar sesión
                        </button>
                    </form>

                    {clientIdGoogle && (
                        <>
                            <div className="flex items-center gap-3 my-6">
                                <div className="flex-1 h-px bg-slate-200"></div>
                                <span className="text-xs text-slate-400">o continúa con</span>
                                <div className="flex-1 h-px bg-slate-200"></div>
                            </div>
                            <div className="flex justify-center">
                                <div ref={googleBtnRef}></div>
                            </div>
                        </>
                    )}

                    <p className="mt-6 text-center text-sm text-slate-500">
                        ¿No tienes cuenta?{" "}
                        <Link to="/register" className="text-blue-700 font-semibold hover:underline">
                            Regístrate aquí
                        </Link>
                    </p>
                    <p className="mt-3 text-center text-sm">
                        <Link to="/" className="text-slate-400 hover:text-slate-600 hover:underline">
                            ← Volver al inicio
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login