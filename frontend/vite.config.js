import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        // Separar librerías grandes en chunks propios para mejor caché
        rollupOptions: {
            output: {
                manualChunks: {
                    "react-vendor": ["react", "react-dom", "react-router"],
                    "charts":       ["recharts"],
                    "ui":           ["react-toastify", "react-hook-form", "react-image-crop"],
                    "http":         ["axios"],
                    "state":        ["zustand"],
                }
            }
        }
    }
})