import { BrowserRouter, Routes, Route } from "react-router"

// Páginas públicas
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Confirm from "./pages/Confirm"
import Forgot from "./pages/Forgot"
import Reset from "./pages/Reset"
import NotFound from "./pages/NotFound"
import Terminos from "./pages/Terminos"

// Layout y páginas del dashboard
import Dashboard from "./layout/Dashboard"
import DashboardHome from "./pages/DashboardHome"
import ReportarFalla from "./pages/ReportarFalla"
import VerReportes from "./pages/VerReportes"
import MisReportes from "./pages/MisReportes"
import DetalleReporte from "./pages/DetalleReporte"
import EditarReporte from "./pages/EditarReporte"
import Estadisticas from "./pages/Estadisticas"
import Contacto from "./pages/Contacto"
import Perfil from "./pages/Perfil"
import CatalogoVehiculos from "./pages/CatalogoVehiculos"
import Confiabilidad from "./pages/Confiabilidad"
import DetalleVehiculo from "./pages/DetalleVehiculo"

// Páginas admin
import AdminPendientes from "./pages/AdminPendientes"
import AdminEliminados from "./pages/AdminEliminados"
import AdminCatalogos from "./pages/AdminCatalogos"
import AdminUsuarios from "./pages/AdminUsuarios"
import AdminValoraciones from "./pages/AdminValoraciones"

// Rutas protegidas
import PublicRoute from "./routes/PublicRoute"
import ProtectedRoute from "./routes/ProtectedRoute"
import AdminRoute from "./routes/AdminRoute"

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Públicas (si está logueado, redirige al dashboard) */}
                <Route element={<PublicRoute />}>
                    <Route index element={<Home />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="confirm/:token" element={<Confirm />} />
                    <Route path="forgot" element={<Forgot />} />
                    <Route path="reset/:token" element={<Reset />} />
                </Route>

                {/* Accesible para todos (logueados o no) */}
                <Route path="terminos" element={<Terminos />} />

                {/* Dashboard (requiere login) */}
                <Route
                    path="dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<DashboardHome />} />
                    <Route path="reportar" element={<ReportarFalla />} />
                    <Route path="reportes" element={<VerReportes />} />
                    <Route path="mis-reportes" element={<MisReportes />} />
                    <Route path="reporte/:id" element={<DetalleReporte />} />
                    <Route path="editar/:id" element={<EditarReporte />} />
                    <Route path="estadisticas" element={<Estadisticas />} />
                    <Route path="contacto" element={<Contacto />} />
                    <Route path="perfil" element={<Perfil />} />
                    <Route path="vehiculos" element={<CatalogoVehiculos />} />
                    <Route path="confiabilidad" element={<Confiabilidad />} />
                    <Route path="confiabilidad/:id" element={<DetalleVehiculo />} />

                    {/* Solo admin */}
                    <Route
                        path="admin/pendientes"
                        element={
                            <AdminRoute>
                                <AdminPendientes />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="admin/eliminados"
                        element={
                            <AdminRoute>
                                <AdminEliminados />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="admin/catalogos"
                        element={
                            <AdminRoute>
                                <AdminCatalogos />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="admin/usuarios"
                        element={
                            <AdminRoute>
                                <AdminUsuarios />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="admin/valoraciones"
                        element={
                            <AdminRoute>
                                <AdminValoraciones />
                            </AdminRoute>
                        }
                    />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App