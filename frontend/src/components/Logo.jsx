import { Link } from "react-router"
import { theme } from "../config/theme"
import logoImg from "../assets/logo.svg"

const Logo = ({ size = "md", showText = true, light = false, linkToHome = false }) => {
    const sizes = {
        sm: { h: "h-9",  text: "text-base" },
        md: { h: "h-16", text: "text-2xl"  },
        lg: { h: "h-20", text: "text-3xl"  },
    }

    const textColor = light ? "text-white" : "text-blue-900"

    const contenido = (
        <div className="flex items-center gap-3">
            <img
                src={logoImg}
                alt={theme.nombreSistema}
                className={`${sizes[size].h} w-auto object-contain`}
            />
            {showText && (
                <span className={`${sizes[size].text} font-black tracking-tight ${textColor}`}>
                    {theme.nombreSistema}
                </span>
            )}
        </div>
    )

    if (linkToHome) {
        return (
            <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
                {contenido}
            </Link>
        )
    }

    return contenido
}

export default Logo