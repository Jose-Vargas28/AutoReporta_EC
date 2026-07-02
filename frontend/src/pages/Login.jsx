import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import axios from "axios"
import useFetch from "../hooks/useFetch"
import storeAuth from "../context/storeAuth"
import Logo from "../components/Logo"
import BotonMostrarPassword from "../components/ui/BotonMostrarPassword"
import { theme } from "../config/theme"
import loginBg from "../assets/login-bg.jpg"

const Login = () => {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [cargando, setCargando] = useState(false)
    const [cuentaNoConfirmada, setCuentaNoConfirmada] = useState(false)
    const [correoIngresado, setCorreoIngresado] = useState("")
    const [reenviando, setReenviando] = useState(false)
    const [msgReenvio, setMsgReenvio] = useState("")
    const { register, handleSubmit, watch, formState: { errors } } = useForm()
    const { fetchDataBackend } = useFetch()
    const { setToken, setRol } = storeAuth()
    const googleBtnRef = useRef(null)
    const clientIdGoogle = import.meta.env.VITE_GOOGLE_CLIENT_ID

    const onSubmit = async (data) => {
        setCuentaNoConfirmada(false)
        setMsgReenvio("")
        setCargando(true)
        const url = `${import.meta.env.VITE_BACKEND_URL}/login`
        try {
            const res = await axios.post(url, data)
            if (res.data?.token) {
                setToken(res.data.token)
                setRol(res.data.rol)
                navigate("/dashboard")
            }
        } catch (err) {
            const msg = err.response?.data?.msg || ""
            if (msg.toLowerCase().includes("confirmar")) {
                setCorreoIngresado(data.email)
                setCuentaNoConfirmada(true)
                toast.error(msg)
            } else {
                toast.error(msg || "No se pudo conectar al servidor")
            }
        }
        setCargando(false)
    }

    const handleReenviar = async () => {
        setReenviando(true)
        setMsgReenvio("")
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reenviar-confirmacion`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: correoIngresado })
            })
            const data = await res.json()
            setMsgReenvio(data.msg)
        } catch {
            setMsgReenvio("Error al reenviar. Intenta más tarde.")
        }
        setReenviando(false)
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
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.65) 0%, rgba(30,58,138,0.30) 55%, rgba(30,58,138,0.08) 100%)" }} />
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
                            disabled={cargando}
                            className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-70 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {cargando ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                    </svg>
                                    Ingresando...
                                </>
                            ) : "Iniciar sesión"}
                        </button>
                    </form>

                    {/* Aviso cuenta no confirmada + botón reenviar */}
                    {cuentaNoConfirmada && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                            <p className="text-amber-800 text-sm font-semibold mb-1">⚠️ Cuenta no confirmada</p>
                            <p className="text-amber-700 text-xs mb-3">
                                Revisa tu bandeja de entrada en <strong>{correoIngresado}</strong>. Si no llegó el correo puedes reenviarlo.
                            </p>
                            <button type="button" onClick={handleReenviar} disabled={reenviando}
                                className="px-4 py-1.5 border border-amber-500 text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-60">
                                {reenviando ? "Reenviando..." : "Reenviar correo de confirmación"}
                            </button>
                            {msgReenvio && <p className="text-xs text-green-700 font-medium mt-2">{msgReenvio}</p>}
                        </div>
                    )}

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