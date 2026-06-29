import axios from "axios"
import { toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import storeProfile from "../context/storeProfile"

function useFetch() {
    const fetchDataBackend = async (
        url,
        data = undefined,
        method = "GET",
        headers = {}
    ) => {
        const loadingToast = toast.loading("Procesando solicitud...")
        try {
            const options = {
                method,
                url,
                headers: { ...headers }
            }
            if (data !== undefined && data !== null) {
                options.data = data
                options.headers = {
                    "Content-Type": "application/json",
                    ...headers
                }
            }
            const response = await axios(options)
            toast.dismiss(loadingToast)
            if (response?.data?.msg) {
                toast.success(response.data.msg)
            }
            return response.data
        } catch (error) {
            toast.dismiss(loadingToast)
            console.error(error)

            const msgBackend = error.response?.data?.msg
            const responseData = error.response?.data

            // Si el backend indica baneo o eliminación, forzar logout
            if (error.response?.status === 403 && (responseData?.baneado || responseData?.eliminado)) {
                storeAuth.getState().clearAuth()
                storeProfile.getState().clearUser()
                toast.error(msgBackend || "Tu cuenta ya no está activa.")
                setTimeout(() => { window.location.href = "/login" }, 1500)
                return null
            }

            let msgFallback = "Ocurrió un error inesperado"
            if (!error.response) {
                msgFallback = "No se pudo conectar al servidor"
            } else {
                const status = error.response.status
                if (status === 401) msgFallback = "Sesión expirada, vuelve a iniciar sesión"
                else if (status === 403) msgFallback = "No tienes permiso para esta acción"
                else if (status === 404) msgFallback = "Recurso no encontrado"
                else if (status === 429) msgFallback = "Límite de solicitudes alcanzado"
                else if (status >= 500) msgFallback = "Error en el servidor, intenta más tarde"
            }

            toast.error(msgBackend || msgFallback)
            return null
        }
    }
    return { fetchDataBackend }
}

export default useFetch