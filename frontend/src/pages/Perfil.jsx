import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { ToastContainer, toast } from "react-toastify"
import storeProfile from "../context/storeProfile"
import storeAuth from "../context/storeAuth"
import { regionesEcuador, provinciasPorRegion } from "../config/ecuador"
import MedidorPassword from "../components/ui/MedidorPassword"
import BotonMostrarPassword from "../components/ui/BotonMostrarPassword"
import ModalRecortarFoto from "../components/ui/ModalRecortarFoto"
import ModalConfirmar from "../components/ui/ModalConfirmar"
import axios from "axios"

const Perfil = () => {
    const { user, profile } = storeProfile()
    const { rol, token } = storeAuth()
    const [editandoPerfil, setEditandoPerfil] = useState(false)
    const [editandoPassword, setEditandoPassword] = useState(false)
    const [regionSeleccionada, setRegionSeleccionada] = useState("")
    const [verActual, setVerActual] = useState(false)
    const [verNueva, setVerNueva] = useState(false)
    const [verConfirmar, setVerConfirmar] = useState(false)
    const [archivoFoto, setArchivoFoto] = useState(null)
    const [subiendoFoto, setSubiendoFoto] = useState(false)
    const [confirmarEliminarFoto, setConfirmarEliminarFoto] = useState(false)
    const inputFotoRef = useRef(null)

    const { register: regPerfil, handleSubmit: hsPerfil, reset: resetPerfil, setValue: setValPerfil, formState: { errors: errPerfil }, watch } = useForm()
    const { register: regPass, handleSubmit: hsPass, reset: resetPass, formState: { errors: errPass }, watch: watchPass } = useForm()

    const regionWatch = watch("region")

    useEffect(() => {
        if (user) {
            resetPerfil({
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                telefono: user.telefono || "",
                region: user.region || "",
                provincia: user.provincia || ""
            })
            setRegionSeleccionada(user.region || "")
        }
    }, [user])

    useEffect(() => {
        setRegionSeleccionada(regionWatch || "")
    }, [regionWatch])

    const authHeaders = () => ({
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    })

    const guardarPerfil = async (data) => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/perfil`, data, authHeaders())
            toast.success(res.data.msg)
            profile()
            setEditandoPerfil(false)
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al actualizar perfil")
        }
    }

    const cambiarPassword = async (data) => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/perfil/password`, data, authHeaders())
            toast.success(res.data.msg)
            resetPass()
            setVerActual(false)
            setVerNueva(false)
            setVerConfirmar(false)
            setEditandoPassword(false)
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al cambiar contraseña")
        }
    }

    const alSeleccionarArchivo = (e) => {
        const archivo = e.target.files?.[0]
        e.target.value = "" // permite volver a elegir el mismo archivo si se cancela

        if (!archivo) return
        if (!archivo.type.startsWith("image/")) {
            toast.error("El archivo debe ser una imagen")
            return
        }
        if (archivo.size > 5 * 1024 * 1024) {
            toast.error("La imagen no puede pesar más de 5MB")
            return
        }
        setArchivoFoto(archivo)
    }

    const subirFotoRecortada = async (blob) => {
        try {
            setSubiendoFoto(true)
            const formData = new FormData()
            formData.append("foto", blob, "foto-perfil.jpg")

            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/perfil/foto`, formData, {
                headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }
            })

            toast.success("Foto de perfil actualizada")
            await profile()
            setArchivoFoto(null)
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al subir la foto")
        } finally {
            setSubiendoFoto(false)
        }
    }

    const eliminarFoto = async () => {
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/perfil/foto`, authHeaders())
            toast.success("Foto de perfil eliminada")
            await profile()
        } catch (error) {
            toast.error(error?.response?.data?.msg || "Error al eliminar la foto")
        } finally {
            setConfirmarEliminarFoto(false)
        }
    }

    const inputClass = "block w-full rounded-md border border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 py-2 px-3 text-slate-700"
    const labelClass = "mb-2 block text-sm font-semibold text-slate-700"

    return (
        <>
        <div className="max-w-2xl mx-auto">
            <ToastContainer />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Mi perfil</h1>
            <p className="text-slate-500 mb-6">Gestiona tu información personal</p>

            {/* Tarjeta de perfil */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 bg-blue-900 rounded-full flex items-center justify-center overflow-hidden">
                                {user?.foto?.url ? (
                                    <img src={user.foto.url} alt="Foto de perfil" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white text-3xl font-bold">
                                        {user?.nombre?.charAt(0)?.toUpperCase() || "U"}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => inputFotoRef.current?.click()}
                                title="Cambiar foto de perfil"
                                className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-700 hover:bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                            </button>
                            <input ref={inputFotoRef} type="file" accept="image/*" hidden onChange={alSeleccionarArchivo} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-700">{user?.nombre} {user?.apellido}</h2>
                            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${rol === "admin" ? "bg-amber-500 text-white" : "bg-blue-600 text-white"}`}>
                                {rol === "admin" ? "Administrador" : "Usuario"}
                            </span>
                            {user?.foto?.url && (
                                <button type="button" onClick={() => setConfirmarEliminarFoto(true)}
                                    className="block mt-1 text-xs text-red-600 hover:underline">
                                    Eliminar foto
                                </button>
                            )}
                        </div>
                    </div>
                    {!editandoPerfil && (
                        <button type="button" onClick={() => setEditandoPerfil(true)}
                            className="text-blue-700 hover:underline text-sm font-semibold">
                            Editar
                        </button>
                    )}
                </div>

                {editandoPerfil ? (
                    <form onSubmit={hsPerfil(guardarPerfil)}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Nombre</label>
                                <input className={inputClass} {...regPerfil("nombre", {
                                    required: "El nombre es obligatorio",
                                    pattern: { value: /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]+$/, message: "El nombre solo puede contener letras" },
                                    onChange: (e) => setValPerfil("nombre", e.target.value.replace(/(?:^|\s)\S/g, l => l.toUpperCase()))
                                })} />
                                {errPerfil.nombre && <p className="text-red-700 text-sm mt-1">{errPerfil.nombre.message}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Apellido</label>
                                <input className={inputClass} {...regPerfil("apellido", {
                                    required: "El apellido es obligatorio",
                                    pattern: { value: /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]+$/, message: "El apellido solo puede contener letras" },
                                    onChange: (e) => setValPerfil("apellido", e.target.value.replace(/(?:^|\s)\S/g, l => l.toUpperCase()))
                                })} />
                                {errPerfil.apellido && <p className="text-red-700 text-sm mt-1">{errPerfil.apellido.message}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Correo electrónico</label>
                                <input type="email" className={inputClass} {...regPerfil("email", { required: "El correo es obligatorio" })} />
                                {errPerfil.email && <p className="text-red-700 text-sm mt-1">{errPerfil.email.message}</p>}
                            </div>
                            <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-xs text-amber-800 font-semibold mb-0.5">📍 Datos opcionales</p>
                                <p className="text-xs text-amber-700">
                                    Tu teléfono y ubicación nos permiten contextualizar mejor los reportes por región del Ecuador y mejorar el análisis colaborativo de fallas vehiculares.
                                </p>
                            </div>
                            <div>
                                <label className={labelClass}>Teléfono <span className="text-slate-400 font-normal">(opcional)</span></label>
                                <input type="tel" className={inputClass} placeholder="09XXXXXXXX" maxLength={10} {...regPerfil("telefono", {
                                    pattern: { value: /^09\d{8}$/, message: "Debe tener el formato 09XXXXXXXX (10 dígitos)" }
                                })} />
                                {errPerfil.telefono && <p className="text-red-700 text-sm mt-1">{errPerfil.telefono.message}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Región <span className="text-slate-400 font-normal">(opcional)</span></label>
                                <select className={inputClass} {...regPerfil("region")}>
                                    <option value="">Seleccionar región</option>
                                    {regionesEcuador.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Provincia <span className="text-slate-400 font-normal">(opcional)</span></label>
                                <select className={inputClass} {...regPerfil("provincia")} disabled={!regionSeleccionada}>
                                    <option value="">Seleccionar provincia</option>
                                    {(provinciasPorRegion[regionSeleccionada] || []).map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg transition-colors">
                                Guardar cambios
                            </button>
                            <button type="button" onClick={() => { setEditandoPerfil(false); resetPerfil({ nombre: user.nombre, apellido: user.apellido, email: user.email, telefono: user.telefono || "", region: user.region || "", provincia: user.provincia || "" }) }}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-3 border-t pt-4">
                        <div className="grid md:grid-cols-2 gap-3">
                            <div>
                                <p className="text-sm text-slate-400">Nombre</p>
                                <p className="text-slate-700 font-semibold">{user?.nombre}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Apellido</p>
                                <p className="text-slate-700 font-semibold">{user?.apellido}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Correo electrónico</p>
                                <p className="text-slate-700 font-semibold">{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Teléfono</p>
                                <p className="text-slate-700">{user?.telefono || <span className="text-slate-400 italic">No registrado</span>}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Región</p>
                                <p className="text-slate-700">{user?.region || <span className="text-slate-400 italic">No registrada</span>}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Provincia</p>
                                <p className="text-slate-700">{user?.provincia || <span className="text-slate-400 italic">No registrada</span>}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cambiar contraseña */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-700">Cambiar contraseña</h3>
                    {!editandoPassword && (
                        <button type="button" onClick={() => setEditandoPassword(true)}
                            className="text-blue-700 hover:underline text-sm font-semibold">
                            Cambiar
                        </button>
                    )}
                </div>

                {editandoPassword ? (
                    <form onSubmit={hsPass(cambiarPassword)}>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-xs text-blue-800">
                                🔒 Por seguridad, no reutilices esta contraseña en otros sitios web. Si sospechas que pudo haber sido expuesta (por ejemplo, en una filtración de datos de otro servicio donde la usaste), cámbiala de inmediato.
                            </p>
                        </div>
                        <div className="mb-4">
                            <label className={labelClass}>Contraseña actual</label>
                            <div className="relative">
                                <input type={verActual ? "text" : "password"} className={`${inputClass} pr-10`} placeholder="••••••••"
                                    {...regPass("passwordActual", { required: "La contraseña actual es obligatoria" })} />
                                <BotonMostrarPassword visible={verActual} onClick={() => setVerActual(!verActual)} />
                            </div>
                            {errPass.passwordActual && <p className="text-red-700 text-sm mt-1">{errPass.passwordActual.message}</p>}
                        </div>
                        <div className="mb-4">
                            <label className={labelClass}>Nueva contraseña</label>
                            <p className="text-xs text-slate-400 mb-1.5">Mínimo 8 caracteres, con mayúscula, número y carácter especial</p>
                            <div className="relative">
                                <input type={verNueva ? "text" : "password"} className={`${inputClass} pr-10`} placeholder="••••••••"
                                    {...regPass("passwordNuevo", {
                                        required: "La nueva contraseña es obligatoria",
                                        pattern: {
                                            value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                                            message: "Debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial"
                                        }
                                    })} />
                                <BotonMostrarPassword visible={verNueva} onClick={() => setVerNueva(!verNueva)} />
                            </div>
                            {errPass.passwordNuevo && <p className="text-red-700 text-sm mt-1">{errPass.passwordNuevo.message}</p>}
                            <MedidorPassword password={watchPass("passwordNuevo")} />
                        </div>
                        <div className="mb-4">
                            <label className={labelClass}>Confirmar nueva contraseña</label>
                            <div className="relative">
                                <input type={verConfirmar ? "text" : "password"} className={`${inputClass} pr-10`} placeholder="••••••••"
                                    {...regPass("confirmarPassword", {
                                        required: "Confirma la contraseña",
                                        validate: (value) => value === watchPass("passwordNuevo") || "Las contraseñas no coinciden"
                                    })} />
                                <BotonMostrarPassword visible={verConfirmar} onClick={() => setVerConfirmar(!verConfirmar)} />
                            </div>
                            {errPass.confirmarPassword && <p className="text-red-700 text-sm mt-1">{errPass.confirmarPassword.message}</p>}
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg transition-colors">
                                Actualizar contraseña
                            </button>
                            <button type="button" onClick={() => { setEditandoPassword(false); resetPass(); setVerActual(false); setVerNueva(false); setVerConfirmar(false) }}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </form>
                ) : (
                    <p className="text-slate-400 text-sm">Tu contraseña está protegida. Haz clic en "Cambiar" para actualizarla.</p>
                )}
            </div>
        </div>

        {archivoFoto && (
            <ModalRecortarFoto
                archivo={archivoFoto}
                onConfirmar={subirFotoRecortada}
                onCancelar={() => setArchivoFoto(null)}
                subiendo={subiendoFoto}
            />
        )}

        {confirmarEliminarFoto && (
            <ModalConfirmar
                titulo="¿Eliminar foto de perfil?"
                descripcion="Volverás a mostrar el avatar con tu inicial."
                textoConfirmar="Sí, eliminar"
                colorBoton="bg-red-600 hover:bg-red-700"
                onConfirmar={eliminarFoto}
                onCancelar={() => setConfirmarEliminarFoto(false)}
            />
        )}
        </>
    )
}

export default Perfil