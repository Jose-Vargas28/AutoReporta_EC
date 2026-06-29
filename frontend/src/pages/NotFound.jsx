import { Link } from "react-router"
import Logo from "../components/Logo"

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-100 px-4">
            <Logo size="lg" />
            <h1 className="text-6xl font-black text-slate-800 mt-8">404</h1>
            <p className="text-xl text-slate-500 mt-4">Página no encontrada</p>
            <Link
                to="/"
                className="mt-8 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors"
            >
                Volver al inicio
            </Link>
        </div>
    )
}

export default NotFound
