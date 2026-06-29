import { Navigate, Outlet } from "react-router"
import storeAuth from "../context/storeAuth"

// Si ya está logueado, lo redirige al dashboard
const PublicRoute = () => {
    const token = storeAuth((state) => state.token)
    return token ? <Navigate to="/dashboard" /> : <Outlet />
}

export default PublicRoute
