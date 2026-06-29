import { useState } from "react"
import { getLogoMarca, getInicialMarca } from "../../helpers/logoMarca"

// =============================================================
//  LogoMarca — muestra el logo de la marca del vehículo.
//  Si no hay logo o falla la carga, muestra un círculo con
//  la inicial de la marca (fallback elegante, nunca roto).
//
//  Props:
//    marca   → nombre de la marca (string)
//    size    → tamaño en px del logo (default 32)
// =============================================================

// Token público de logo.dev. Reemplaza por el tuyo (gratis en logo.dev).
// Si lo dejas vacío, igual funciona pero con límite de peticiones.
const LOGO_DEV_TOKEN = import.meta.env.VITE_LOGO_DEV_TOKEN || ""

const LogoMarca = ({ marca, size = 32 }) => {
    const [error, setError] = useState(false)
    const url = getLogoMarca(marca, LOGO_DEV_TOKEN)

    // Sin URL o con error de carga → fallback con inicial
    if (!url || error) {
        return (
            <div
                className="flex items-center justify-center rounded-full bg-slate-200 text-slate-600 font-bold shrink-0"
                style={{ width: size, height: size, fontSize: size * 0.45 }}
                title={marca}
            >
                {getInicialMarca(marca)}
            </div>
        )
    }

    return (
        <img
            src={url}
            alt={marca}
            title={marca}
            onError={() => setError(true)}
            className="rounded-full object-contain bg-white border border-slate-200 shrink-0"
            style={{ width: size, height: size }}
        />
    )
}

export default LogoMarca