// =============================================================
//  MEDIDOR DE FUERZA DE CONTRASEÑA
//  Usa la librería zxcvbn (estima la fuerza real de una contraseña
//  detectando patrones comunes, secuencias, repeticiones, etc.,
//  no solo si cumple reglas de longitud/mayúscula/número).
//  Requiere: npm install zxcvbn
//
//  IMPORTANTE: zxcvbn pesa ~400kB comprimido (su documentación oficial
//  recomienda no incluirlo en el bundle principal). Por eso se carga
//  con import() dinámico: Vite lo separa en un archivo aparte que el
//  navegador descarga en segundo plano solo cuando este componente se
//  monta, sin afectar el peso de carga del resto de la aplicación.
// =============================================================
import { useState, useEffect, useRef } from "react"

const ETIQUETAS = ["Muy débil", "Débil", "Regular", "Fuerte", "Muy fuerte"]
const COLORES_BARRA = ["bg-red-500", "bg-orange-500", "bg-amber-400", "bg-lime-500", "bg-green-600"]
const COLORES_TEXTO = ["text-red-600", "text-orange-600", "text-amber-600", "text-lime-700", "text-green-700"]

// password: el valor actual del campo (string)
const MedidorPassword = ({ password }) => {
    const zxcvbnRef = useRef(null)
    const [libreriaLista, setLibreriaLista] = useState(false)
    const [score, setScore] = useState(null)

    // Empieza a descargar zxcvbn en segundo plano apenas se monta el formulario
    // (no bloquea el render inicial de la página; para cuando el usuario llega
    // al campo de contraseña, normalmente ya terminó de cargar).
    useEffect(() => {
        let activo = true
        import("zxcvbn").then((mod) => {
            if (activo) {
                zxcvbnRef.current = mod.default
                setLibreriaLista(true)
            }
        })
        return () => { activo = false }
    }, [])

    useEffect(() => {
        if (password && zxcvbnRef.current) {
            setScore(zxcvbnRef.current(password).score) // 0 (pésima) a 4 (excelente)
        } else {
            setScore(null)
        }
    }, [password, libreriaLista])

    if (!password || score === null) return null

    return (
        <div className="mt-2">
            <div className="flex gap-1 h-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`flex-1 rounded-full transition-colors ${i <= score ? COLORES_BARRA[score] : "bg-slate-200"}`}
                    />
                ))}
            </div>
            <p className={`text-xs mt-1 font-semibold ${COLORES_TEXTO[score]}`}>
                Seguridad: {ETIQUETAS[score]}
            </p>
        </div>
    )
}

export default MedidorPassword