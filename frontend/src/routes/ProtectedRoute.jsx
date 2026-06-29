import { useEffect, useState } from "react"
import { Navigate } from "react-router"
import axios from "axios"
import storeAuth from "../context/storeAuth"
import storeProfile from "../context/storeProfile"

// Caché en memoria: evita verificar el token contra el backend
// en cada recarga si ya se verificó hace menos de 5 minutos.
const CACHE_MS = 5 * 60 * 1000
let ultimaVerificacion = null

// Protege rutas que requieren estar logueado.
// Al montar verifica el token contra el backend para detectar
// sesiones expiradas, cuentas baneadas o eliminadas.
const ProtectedRoute = ({ children }) => {
    const { token, clearAuth } = storeAuth()
    const { clearUser } = storeProfile()
    const [verificando, setVerificando] = useState(true)
    const [valido, setValido] = useState(false)

    useEffect(() => {
        if (!token) { setVerificando(false); return }

        // Si ya verificamos hace menos de 5 minutos, no volvemos a pedir al backend
        const ahora = Date.now()
        if (ultimaVerificacion && (ahora - ultimaVerificacion) < CACHE_MS) {
            setValido(true)
            setVerificando(false)
            return
        }

        axios.get(`${import.meta.env.VITE_BACKEND_URL}/perfil`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => {
            ultimaVerificacion = Date.now()
            setValido(true)
            setVerificando(false)
        })
        .catch(() => {
            ultimaVerificacion = null
            clearAuth()
            clearUser()
            setVerificando(false)
        })
    }, [])

    if (!token) return <Navigate to="/login" />
    if (verificando) return null
    if (!valido) return <Navigate to="/login" />
    return children
}

export default ProtectedRoute