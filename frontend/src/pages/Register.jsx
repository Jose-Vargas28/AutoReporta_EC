import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import { ToastContainer } from "react-toastify"
import useFetch from "../hooks/useFetch"
import Logo from "../components/Logo"
import MedidorPassword from "../components/ui/MedidorPassword"
import BotonMostrarPassword from "../components/ui/BotonMostrarPassword"
import { theme } from "../config/theme"
import { regionesEcuador, provinciasPorRegion } from "../config/ecuador"
import registerBg from "../assets/register-bg.jpg"

// ---- Modal Términos y Condiciones ----
const ModalTerminos = ({ onCerrar }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onCerrar}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800">Términos y Condiciones de Uso — AutoReporta EC</h2>
                <button type="button" onClick={onCerrar}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 text-2xl rounded-full hover:bg-slate-100 transition-colors leading-none">×</button>
            </div>
            <div className="overflow-y-auto px-6 py-5 text-sm text-slate-700 space-y-5">
                <div>
                    <p className="text-xs text-slate-400 mb-2">Última actualización: 2025</p>
                    <p>Bienvenido a <strong>AutoReporta EC</strong>, plataforma web colaborativa para el análisis y recopilación de fallas y problemas mecánicos de vehículos comercializados en el mercado ecuatoriano. Al registrarte y usar esta plataforma, aceptas los siguientes términos.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 mb-1">1. Descripción del servicio</h3>
                    <p>AutoReporta EC es un sistema web colaborativo que permite a los usuarios registrar, consultar y analizar reportes de fallas vehiculares. La información presentada tiene <strong>carácter referencial</strong> y está basada en datos colaborativos y fuentes externas disponibles públicamente. La plataforma no reemplaza inspecciones mecánicas físicas, certificaciones oficiales, ni entidades gubernamentales de control.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 mb-1">2. Alcance y limitaciones</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>El sistema no contempla la validación técnica directa de reportes mediante inspecciones físicas.</li>
                        <li>No gestiona procesos legales, reclamos formales ni sanciones a empresas o importadoras.</li>
                        <li>No incluye servicios de venta o compra de vehículos, repuestos ni servicios automotrices.</li>
                        <li>No posee integraciones con sistemas de fabricantes, importadoras o ensambladoras.</li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 mb-1">3. Obligaciones del usuario</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Hacer un uso lícito y adecuado de la plataforma.</li>
                        <li>Proporcionar información veraz al registrar reportes de fallas vehiculares.</li>
                        <li>No publicar contenido ofensivo, ilegal o que infrinja derechos de autor.</li>
                        <li>No suplantar la identidad de otras personas ni crear cuentas con fines fraudulentos.</li>
                        <li>Respetar los derechos de otros usuarios de la plataforma.</li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 mb-1">4. Política de privacidad y datos personales</h3>
                    <p>AutoReporta EC recopila datos personales (nombre, apellido, correo electrónico, región y provincia) con el único fin de gestionar tu cuenta y mejorar el servicio. Tus datos no serán vendidos ni compartidos con terceros sin tu consentimiento. Al registrarte, autorizas el uso de tu información conforme a las normativas de protección de datos vigentes en Ecuador.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 mb-1">5. Propiedad intelectual</h3>
                    <p>Todo el contenido de la plataforma (textos, logos, diseño, imágenes propias) es propiedad de AutoReporta EC o cuenta con las licencias correspondientes. Los reportes publicados por los usuarios son de su propia autoría; al publicarlos, el usuario concede a la plataforma el derecho a mostrarlos con fines estadísticos y de análisis colectivo.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 mb-1">6. Limitación de responsabilidad</h3>
                    <p>AutoReporta EC no se responsabiliza por fallos técnicos, interrupciones del servicio o daños indirectos derivados del uso de la plataforma. La información publicada tiene carácter referencial y no constituye asesoría técnica, legal ni comercial. Las decisiones que el usuario tome en base a la información disponible son de su exclusiva responsabilidad.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 mb-1">7. Modificaciones del acuerdo</h3>
                    <p>AutoReporta EC se reserva el derecho de modificar estos Términos y Condiciones cuando sea necesario. El uso continuado de la plataforma tras la publicación de actualizaciones implica la aceptación de las nuevas condiciones.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 mb-1">8. Moderación y suspensión de cuentas</h3>
                    <p>La administración se reserva el derecho de suspender o eliminar cuentas que incumplan estos términos, publiquen información falsa de manera reiterada o hagan un uso indebido de la plataforma.</p>
                </div>
                <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                    AutoReporta EC — Sistema web colaborativo de análisis de fallas vehiculares · Ecuador · 2025
                </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
                <a href="/terminos" target="_blank" rel="noreferrer"
                    className="text-xs text-slate-400 hover:text-blue-700 hover:underline transition-colors">
                    Ver página completa ↗
                </a>
                <button type="button" onClick={onCerrar}
                    className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg transition-colors text-sm">
                    Entendido
                </button>
            </div>
        </div>
    </div>
)

// Capitaliza la primera letra de cada palabra
const capitalizarPrimera = (valor) =>
    valor.replace(/(?:^|\s)\S/g, l => l.toUpperCase())

const Register = () => {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [aceptaTerminos, setAceptaTerminos] = useState(false)
    const [modalTerminos, setModalTerminos] = useState(false)
    const [registroExitoso, setRegistroExitoso] = useState(false)
    const [correoRegistrado, setCorreoRegistrado] = useState("")
    const [reenviando, setReenviando] = useState(false)
    const [msgReenvio, setMsgReenvio] = useState("")
    const [regionSeleccionada, setRegionSeleccionada] = useState("")
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm()
    const { fetchDataBackend } = useFetch()
    const passwordActual = watch("password")

    const onSubmit = async (data) => {
        if (!aceptaTerminos) return
        const payload = {
            ...data,
            ...(regionSeleccionada && { region: regionSeleccionada }),
        }
        const url = `${import.meta.env.VITE_BACKEND_URL}/registro`
        const response = await fetchDataBackend(url, payload, "POST")
        if (response) {
            setCorreoRegistrado(data.email)
            setRegistroExitoso(true)
        }
    }

    const handleReenviar = async () => {
        setReenviando(true)
        setMsgReenvio("")
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reenviar-confirmacion`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: correoRegistrado })
            })
            const data = await res.json()
            setMsgReenvio(data.msg)
        } catch {
            setMsgReenvio("Error al reenviar. Intenta más tarde.")
        }
        setReenviando(false)
    }

    const inputClass = "block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"

    return (
        <div className="flex flex-col sm:flex-row h-screen">
            <ToastContainer />
            {modalTerminos && <ModalTerminos onCerrar={() => setModalTerminos(false)} />}

            {/* Panel izquierdo - formulario o pantalla de éxito */}
            <div className="w-full sm:w-1/2 h-screen bg-white flex justify-center items-start overflow-y-auto py-8">
                <div className="md:w-4/5 sm:w-full px-8">

                {registroExitoso ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl">📧</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Revisa tu correo!</h2>
                        <p className="text-slate-500 mb-2">
                            Enviamos un enlace de confirmación a:
                        </p>
                        <p className="font-semibold text-blue-900 mb-6">{correoRegistrado}</p>
                        <p className="text-slate-400 text-sm mb-8">
                            Haz clic en el enlace del correo para activar tu cuenta. Si no lo ves, revisa la carpeta de spam.
                        </p>
                        <button type="button" onClick={handleReenviar} disabled={reenviando}
                            className="px-6 py-2 border-2 border-blue-900 text-blue-900 font-semibold rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-60 mb-3">
                            {reenviando ? "Reenviando..." : "¿No llegó? Reenviar correo"}
                        </button>
                        {msgReenvio && (
                            <p className="text-sm text-green-700 font-medium mt-1">{msgReenvio}</p>
                        )}
                        <button type="button" onClick={() => navigate("/login")}
                            className="mt-4 text-sm text-slate-400 hover:text-blue-700 transition-colors">
                            ← Ir al inicio de sesión
                        </button>
                    </div>
                ) : (
                    <>
                    <h1 className="text-3xl font-bold mb-2 text-slate-700">Crear cuenta</h1>
                    <p className="text-slate-400 mb-8 text-sm">Regístrate para reportar y consultar fallas vehiculares</p>

                    <form onSubmit={handleSubmit(onSubmit)}>

                        {/* Nombre y Apellido */}
                        <div className="mb-4 flex gap-3">
                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Nombre</label>
                                <input type="text" placeholder="Tu nombre" className={inputClass}
                                    {...register("nombre", {
                                        required: "El nombre es obligatorio",
                                        pattern: { value: /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]+$/, message: "Solo puede contener letras" },
                                        onChange: (e) => setValue("nombre", capitalizarPrimera(e.target.value))
                                    })} />
                                {errors.nombre && <p className="text-red-700 text-sm mt-1">{errors.nombre.message}</p>}
                            </div>
                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Apellido</label>
                                <input type="text" placeholder="Tu apellido" className={inputClass}
                                    {...register("apellido", {
                                        required: "El apellido es obligatorio",
                                        pattern: { value: /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]+$/, message: "Solo puede contener letras" },
                                        onChange: (e) => setValue("apellido", capitalizarPrimera(e.target.value))
                                    })} />
                                {errors.apellido && <p className="text-red-700 text-sm mt-1">{errors.apellido.message}</p>}
                            </div>
                        </div>

                        {/* Correo */}
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</label>
                            <input type="email" placeholder="correo@ejemplo.com" className={inputClass}
                                {...register("email", { required: "El correo es obligatorio" })} />
                            {errors.email && <p className="text-red-700 text-sm mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Contraseña */}
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</label>
                            <p className="text-xs text-slate-400 mb-1.5">Mínimo 8 caracteres, con mayúscula, número y carácter especial</p>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} placeholder="••••••••"
                                    className={`${inputClass} pr-10`}
                                    {...register("password", {
                                        required: "La contraseña es obligatoria",
                                        pattern: {
                                            value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                                            message: "Debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial"
                                        }
                                    })} />
                                <BotonMostrarPassword visible={showPassword} onClick={() => setShowPassword(!showPassword)} />
                            </div>
                            {errors.password && <p className="text-red-700 text-sm mt-1">{errors.password.message}</p>}
                            <MedidorPassword password={passwordActual} />
                        </div>

                        {/* Campos opcionales */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                            <p className="text-xs text-amber-800 font-semibold mb-0.5">📍 Datos opcionales</p>
                            <p className="text-xs text-amber-700">
                                Tu teléfono y ubicación nos permiten contextualizar mejor los reportes por región del Ecuador. Puedes completarlos ahora o más tarde desde tu perfil.
                            </p>
                        </div>

                        {/* Teléfono */}
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Teléfono celular <span className="text-slate-400 font-normal">(opcional)</span>
                            </label>
                            <input type="tel" placeholder="09XXXXXXXX" className={inputClass}
                                maxLength={10}
                                {...register("telefono", {
                                    pattern: {
                                        value: /^09\d{8}$/,
                                        message: "Debe tener el formato 09XXXXXXXX (10 dígitos)"
                                    }
                                })} />
                            {errors.telefono && <p className="text-red-700 text-sm mt-1">{errors.telefono.message}</p>}
                        </div>

                        {/* Región y Provincia */}
                        <div className="mb-5 flex gap-3">
                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Región <span className="text-slate-400 font-normal">(opcional)</span>
                                </label>
                                <select className={inputClass}
                                    value={regionSeleccionada}
                                    onChange={e => { setRegionSeleccionada(e.target.value); setValue("provincia", "") }}>
                                    <option value="">Seleccionar</option>
                                    {regionesEcuador.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Provincia <span className="text-slate-400 font-normal">(opcional)</span>
                                </label>
                                <select className={inputClass} disabled={!regionSeleccionada}
                                    {...register("provincia")}>
                                    <option value="">{regionSeleccionada ? "Seleccionar" : "Elige región primero"}</option>
                                    {(provinciasPorRegion[regionSeleccionada] || []).map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Aviso confirmación */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-xs text-blue-800">
                                Tras registrarte recibirás un correo para confirmar tu cuenta antes de poder iniciar sesión.
                            </p>
                        </div>

                        {/* Checkbox términos */}
                        <div className={`rounded-lg border p-3 mb-5 transition-colors ${aceptaTerminos ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
                            <label className="flex items-start gap-3 cursor-pointer select-none">
                                <input type="checkbox" checked={aceptaTerminos}
                                    onChange={e => setAceptaTerminos(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 accent-blue-900 shrink-0 cursor-pointer" />
                                <span className="text-xs text-slate-600 leading-relaxed">
                                    He leído y acepto los{" "}
                                    <button type="button" onClick={() => setModalTerminos(true)}
                                        className="text-blue-700 font-semibold underline hover:text-blue-900 transition-colors">
                                        Términos y Condiciones de Uso
                                    </button>
                                    {" "}de AutoReporta EC, incluyendo la Política de Privacidad y el uso de datos personales conforme a la normativa ecuatoriana vigente.
                                </span>
                            </label>
                        </div>

                        <button type="submit" disabled={!aceptaTerminos}
                            className={`w-full font-semibold py-2.5 px-4 rounded-lg transition-colors ${
                                aceptaTerminos
                                    ? "bg-blue-900 hover:bg-blue-800 text-white cursor-pointer"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}>
                            Registrarse
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        ¿Ya tienes cuenta?{" "}
                        <Link to="/login" className="text-blue-700 font-semibold hover:underline">Inicia sesión</Link>
                    </p>
                    <p className="mt-3 text-center text-sm">
                        <Link to="/" className="text-slate-400 hover:text-slate-600 hover:underline">← Volver al inicio</Link>
                    </p>
                    </>
                )}
                </div>
            </div>

            {/* Panel derecho - foto con overlay */}
            <div className="relative w-full sm:w-1/2 h-1/3 sm:h-screen flex flex-col justify-center items-center text-center px-8 order-first sm:order-last overflow-hidden">
                <img
                    src={registerBg}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(225deg, rgba(15,23,42,0.65) 0%, rgba(30,58,138,0.30) 55%, rgba(30,58,138,0.08) 100%)" }} />
                <div className="absolute right-0 top-0 bottom-0 w-1.5 flex flex-col">
                    <div className="flex-1 bg-yellow-400" />
                    <div className="flex-[0.5] bg-blue-700" />
                    <div className="flex-[0.5] bg-red-600" />
                </div>
                <div className="relative z-10">
                    <Logo size="lg" light linkToHome />
                    <p className="text-blue-100 mt-6 text-lg max-w-sm">{theme.descripcion}</p>
                </div>
            </div>
        </div>
    )
}

export default Register