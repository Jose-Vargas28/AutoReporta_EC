import storeAuth from "../context/storeAuth"
import { Navigate } from "react-router"

// Solo permite el acceso a administradores.
// Si no es admin, lo redirige al dashboard.
const AdminRoute = ({ children }) => {
    const rol = storeAuth((state) => state.rol)
    return rol === "admin" ? children : <Navigate to="/dashboard" />
}

export default AdminRoute
